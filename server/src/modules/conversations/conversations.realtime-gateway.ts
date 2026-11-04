import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { UserStatus } from '../../database/enums/domain.enums';
import { JwtPayload } from '../auth/auth.types';
import {
  ConversationActor,
  ConversationsService,
  SentMessageResult,
} from './conversations.service';

type ChatSocket = Socket & { data: { chatUser?: ConversationActor } };
type SocketAck = (response: { ok: boolean; message?: unknown }) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveId(value: unknown): number | null {
  const parsed =
    typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseJoinPayload(payload: unknown): number | null {
  return isRecord(payload) ? positiveId(payload.conversationId) : null;
}

function parseMessagePayload(
  payload: unknown,
): { conversationId: number; content: string } | null {
  if (!isRecord(payload)) return null;
  const conversationId = positiveId(payload.conversationId);
  if (typeof payload.content !== 'string') return null;

  const content = payload.content.trim();
  if (!conversationId || content.length < 1 || content.length > 2000) {
    return null;
  }
  return { conversationId, content };
}

/**
 * Socket.IO is attached to Nest's existing HTTP server, preserving the
 * browser protocol used by the current chat screen without a second port.
 */
@Injectable()
export class ConversationsRealtimeGateway
  implements OnModuleInit, OnModuleDestroy
{
  private io?: Server;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly conversationsService: ConversationsService,
  ) {}

  onModuleInit(): void {
    if (this.io) return;

    const clientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:5173';
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer() as HttpServer;
    this.io = new Server(httpServer, {
      cors: { origin: clientUrl, methods: ['GET', 'POST'] },
    });
    this.io.use((socket, next) => {
      void this.authenticateSocket(socket as ChatSocket, next);
    });
    this.io.on('connection', (socket) => {
      this.registerSocket(socket as ChatSocket);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.io?.close();
  }

  /** Called only after the message transaction has committed successfully. */
  publishMessage(result: SentMessageResult): void {
    if (!this.io) return;

    this.io
      .to(`conversation:${result.conversationId}`)
      .emit('message:new', result.message);
    for (const recipientId of result.recipientIds) {
      this.io
        .to(`user:${recipientId}`)
        .emit('conversation:updated', { conversationId: result.conversationId });
    }
  }

  /**
   * A group member can be removed by another active tab while their current
   * socket is already joined to the chat room.  Database authorization stops
   * subsequent REST/socket writes, but it cannot by itself stop broadcasts
   * already targeted at that socket room.  Revoke every socket for this user
   * after the membership transaction commits.
   */
  revokeConversationMembership(userId: number, conversationId: number): void {
    if (!this.io) return;

    const userRoom = `user:${userId}`;
    const conversationRoom = `conversation:${conversationId}`;
    this.io.in(userRoom).socketsLeave(conversationRoom);
    this.io.to(userRoom).emit('conversation:updated', { conversationId });
    this.io.to(conversationRoom).emit('conversation:updated', { conversationId });
  }

  private async authenticateSocket(
    socket: ChatSocket,
    next: (error?: Error) => void,
  ): Promise<void> {
    try {
      const auth = socket.handshake.auth;
      const token =
        isRecord(auth) && typeof auth.token === 'string' ? auth.token.trim() : '';
      if (!token) throw new Error('Unauthorized');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
      const userId = positiveId(payload.sub);
      if (!userId) throw new Error('Unauthorized');

      const user = await this.users.findOneBy({ id: userId });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('Unauthorized');
      }

      socket.data.chatUser = {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
      };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  }

  private registerSocket(socket: ChatSocket): void {
    const actor = socket.data.chatUser;
    if (!actor) {
      socket.disconnect(true);
      return;
    }

    void socket.join(`user:${actor.id}`);
    socket.on('conversation:join', (payload: unknown, callback?: SocketAck) => {
      void this.joinConversation(socket, payload, callback);
    });
    socket.on('message:send', (payload: unknown, callback?: SocketAck) => {
      void this.sendMessage(socket, payload, callback);
    });
  }

  private async joinConversation(
    socket: ChatSocket,
    payload: unknown,
    callback?: SocketAck,
  ): Promise<void> {
    const conversationId = parseJoinPayload(payload);
    if (!conversationId) {
      callback?.({ ok: false, message: 'Dữ liệu không hợp lệ' });
      return;
    }

    try {
      const actor = socket.data.chatUser;
      if (!actor || !(await this.conversationsService.isActiveMember(actor.id, conversationId))) {
        callback?.({ ok: false, message: 'Bạn không thuộc cuộc trò chuyện này' });
        return;
      }

      await socket.join(`conversation:${conversationId}`);
      callback?.({ ok: true });
    } catch {
      callback?.({ ok: false, message: 'Không thể tham gia cuộc trò chuyện' });
    }
  }

  private async sendMessage(
    socket: ChatSocket,
    payload: unknown,
    callback?: SocketAck,
  ): Promise<void> {
    const input = parseMessagePayload(payload);
    if (!input) {
      callback?.({ ok: false, message: 'Tin nhắn không hợp lệ' });
      return;
    }

    try {
      const actor = socket.data.chatUser;
      if (!actor) throw new Error('Unauthorized');

      const result = await this.conversationsService.send(actor, input.conversationId, {
        content: input.content,
      });
      this.publishMessage(result);
      callback?.({ ok: true, message: result.message });
    } catch {
      // Do not reveal whether the room ID exists or which membership check
      // failed to a connected but unauthorized socket.
      callback?.({ ok: false, message: 'Không thể gửi tin nhắn' });
    }
  }
}
