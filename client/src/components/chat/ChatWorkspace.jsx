import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { conversationApi } from '../../api/resources';
import { getAccessToken } from '../../api/client';
import { EmptyState, ErrorState, LoadingState } from '../common/AsyncState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { connectSocket } from '../../services/socket';
import { asArray, collectionFrom } from '../../utils/data';
import { cleanText, recordTitle } from '../../utils/records';

const MAX_MESSAGE_LENGTH = 2_000;

function membersOf(conversation) {
  return asArray(conversation?.members || conversation?.conversationMembers || conversation?.participants);
}

function participantFor(conversation, currentUserId) {
  return membersOf(conversation)
    .map((member) => member.user || member)
    .find((member) => String(member?.id) !== String(currentUserId)) || null;
}

function conversationName(conversation, currentUserId) {
  if (conversation?.name || conversation?.title) return conversation.name || conversation.title;
  if (conversation?.rentalGroup?.name) return conversation.rentalGroup.name;
  return recordTitle(participantFor(conversation, currentUserId), 'Cuộc trò chuyện');
}

function messageAuthorId(message) {
  return message?.senderId ?? message?.sender?.id ?? message?.user?.id;
}

function messageTimestamp(message) {
  return message?.sentAt ?? message?.createdAt ?? null;
}

function conversationTimestamp(conversation) {
  return messageTimestamp(conversation?.lastMessage) ?? conversation?.lastMessageAt ?? conversation?.updatedAt ?? null;
}

function validDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isSameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatMessageTime(value) {
  const date = validDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatMessageDay(value) {
  const date = validDate(value);
  if (!date) return 'Tin nhắn mới';
  const today = new Date();
  if (isSameDay(date, today)) return 'Hôm nay';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Hôm qua';
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }).format(date);
}

function formatConversationTime(value) {
  const date = validDate(value);
  if (!date) return '';
  const today = new Date();
  if (isSameDay(date, today)) return formatMessageTime(date);
  const daysAgo = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86_400_000);
  if (daysAgo >= 0 && daysAgo < 7) return new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

function messagePreview(conversation) {
  return cleanText(conversation?.lastMessage?.content || conversation?.lastMessagePreview, 84) || 'Chưa có tin nhắn';
}

function initials(value) {
  const letters = String(value || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
  return letters.toLocaleUpperCase('vi-VN') || '?';
}

function PersonAvatar({ person, label, group = false, className = '' }) {
  return <span className={`chat-avatar ${group ? 'is-group' : ''} ${className}`.trim()} aria-hidden="true">{group ? <i className="bi bi-people-fill" /> : initials(person?.fullName || person?.username || label)}</span>;
}

function ConversationAvatar({ conversation, currentUserId, className = '' }) {
  const group = conversation?.type === 'GROUP' || Boolean(conversation?.rentalGroup);
  return <PersonAvatar person={participantFor(conversation, currentUserId)} label={conversationName(conversation, currentUserId)} group={group} className={className} />;
}

function ConversationRow({ conversation, currentUserId, selected, onSelect }) {
  const label = conversationName(conversation, currentUserId);
  const preview = messagePreview(conversation);
  const unreadCount = Number(conversation?.unreadCount);
  const timestamp = conversationTimestamp(conversation);
  return <button type="button" className={`chat-conversation${selected ? ' is-active' : ''}`} aria-current={selected ? 'true' : undefined} aria-pressed={selected} onClick={() => onSelect(conversation.id)}><ConversationAvatar conversation={conversation} currentUserId={currentUserId} /><span className="chat-conversation__content"><span className="chat-conversation__topline"><strong>{label}</strong><time dateTime={timestamp || undefined}>{formatConversationTime(timestamp)}</time></span><span className="chat-conversation__bottomline"><small>{preview}</small>{unreadCount > 0 ? <span className="unread-dot" aria-label={`${unreadCount} tin chưa đọc`}>{unreadCount > 9 ? '9+' : unreadCount}</span> : null}</span></span></button>;
}

function MessageItem({ message, previousMessage, currentUserId, isGroupConversation }) {
  const mine = String(messageAuthorId(message)) === String(currentUserId);
  const stamp = messageTimestamp(message);
  const previousStamp = messageTimestamp(previousMessage);
  const date = validDate(stamp);
  const previousDate = validDate(previousStamp);
  const showDay = Boolean(date && (!previousDate || !isSameDay(date, previousDate)));
  const sender = message?.sender || message?.user || null;
  const senderName = recordTitle(sender, 'Thành viên');
  return <Fragment>{showDay ? <div className="chat-day-divider"><span>{formatMessageDay(stamp)}</span></div> : null}<article className={`chat-message${mine ? ' is-mine' : ''}`}><>{!mine ? <PersonAvatar person={sender} label={senderName} className="chat-message__avatar" /> : null}</><div className="chat-message__content">{!mine && isGroupConversation ? <span className="chat-message__sender">{senderName}</span> : null}<div className="chat-bubble"><p>{message?.content || ''}</p></div><div className="chat-bubble__meta"><time dateTime={stamp || undefined}>{formatMessageTime(stamp)}</time>{mine && message?.editedAt ? <span>Đã chỉnh sửa</span> : null}</div></div></article></Fragment>;
}

export function ChatWorkspace({ initialRecipientId, initialConversationId }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const conversationsRequest = useAsyncData(useCallback((signal) => conversationApi.list({ limit: 50 }, signal), []));
  const conversations = collectionFrom(conversationsRequest.data).items;
  const [selectedId, setSelectedId] = useState(null);
  const hasAppliedInitialConversation = useRef(false);
  const messagesEndRef = useRef(null);
  const [content, setContent] = useState('');
  const [conversationQuery, setConversationQuery] = useState('');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialConversationId));
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const selectedConversation = useMemo(() => conversations.find((item) => String(item.id) === String(selectedId)) || null, [conversations, selectedId]);
  const messagesRequest = useAsyncData(useCallback((signal) => selectedId ? conversationApi.messages(selectedId, { limit: 50 }, signal) : Promise.resolve([]), [selectedId]));
  const messages = collectionFrom(messagesRequest.data).items;
  const filteredConversations = useMemo(() => {
    const query = cleanText(conversationQuery, 100).toLocaleLowerCase('vi-VN');
    if (!query) return conversations;
    return conversations.filter((conversation) => `${conversationName(conversation, user?.id)} ${messagePreview(conversation)}`.toLocaleLowerCase('vi-VN').includes(query));
  }, [conversationQuery, conversations, user?.id]);

  useEffect(() => {
    hasAppliedInitialConversation.current = false;
    setMobileThreadOpen(Boolean(initialConversationId));
  }, [initialConversationId]);

  useEffect(() => {
    const requestedConversation = initialConversationId && conversations.find((item) => String(item.id) === String(initialConversationId));
    if (requestedConversation && !hasAppliedInitialConversation.current) {
      hasAppliedInitialConversation.current = true;
      setSelectedId(requestedConversation.id);
      setMobileThreadOpen(true);
      return;
    }
    if (!selectedId && conversations[0]?.id) setSelectedId(conversations[0].id);
    if (selectedId && !conversations.some((item) => String(item.id) === String(selectedId))) setSelectedId(conversations[0]?.id || null);
  }, [conversations, initialConversationId, selectedId]);

  useEffect(() => {
    if (!selectedId || messagesRequest.loading) return undefined;
    const frame = window.requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ block: 'end' }));
    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, messagesRequest.loading, selectedId]);

  useEffect(() => {
    const socket = connectSocket(getAccessToken());
    const joinSelectedConversation = () => {
      if (selectedId) socket.emit('conversation:join', { conversationId: selectedId });
    };
    const onIncomingMessage = (message) => {
      const conversationId = message?.conversationId ?? message?.conversation?.id;
      conversationsRequest.reload();
      if (String(conversationId) === String(selectedId)) messagesRequest.reload();
    };
    socket.on('connect', joinSelectedConversation);
    socket.on('message:new', onIncomingMessage);
    socket.on('new-message', onIncomingMessage);
    socket.on('conversation:updated', onIncomingMessage);
    if (socket.connected) joinSelectedConversation();
    return () => {
      socket.off('connect', joinSelectedConversation);
      socket.off('message:new', onIncomingMessage);
      socket.off('new-message', onIncomingMessage);
      socket.off('conversation:updated', onIncomingMessage);
    };
  }, [conversationsRequest.reload, messagesRequest.reload, selectedId]);

  const chooseConversation = (conversationId) => {
    setSelectedId(conversationId);
    setMobileThreadOpen(true);
  };

  const createConversation = async () => {
    if (!initialRecipientId || creating) return;
    setCreating(true);
    try {
      const payload = await conversationApi.createDirect(initialRecipientId);
      const conversation = payload?.conversation || payload;
      await conversationsRequest.reload();
      if (conversation?.id) {
        setSelectedId(conversation.id);
        setMobileThreadOpen(true);
      }
      showToast({ variant: 'success', title: 'Đã mở cuộc trò chuyện', message: 'Bạn có thể bắt đầu nhắn tin.' });
    } catch {
      showToast({ variant: 'danger', title: 'Không thể mở cuộc trò chuyện', message: 'Vui lòng thử lại sau.' });
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = cleanText(content, MAX_MESSAGE_LENGTH);
    if (!message || !selectedId || sending) return;
    setSending(true);
    try {
      await conversationApi.sendMessage(selectedId, { content: message });
      setContent('');
      await Promise.all([messagesRequest.reload(), conversationsRequest.reload()]);
    } catch {
      showToast({ variant: 'danger', title: 'Không thể gửi tin nhắn', message: 'Tin nhắn chưa được gửi. Vui lòng thử lại.' });
    } finally {
      setSending(false);
    }
  };

  const submitOnEnter = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  if (conversationsRequest.error) return <ErrorState message={conversationsRequest.error} onRetry={conversationsRequest.reload} />;
  if (conversationsRequest.loading) return <LoadingState label="Đang tải cuộc trò chuyện…" />;

  return (
    <div className={`chat-workspace${mobileThreadOpen ? ' is-thread-open' : ''}`}>
      <aside className="chat-sidebar" aria-label="Danh sách cuộc trò chuyện">
        <header className="chat-sidebar__header">
          <div className="chat-sidebar__title-row"><div><p>Hộp thư</p><h2>Tin nhắn</h2></div>{initialRecipientId ? <button type="button" className="chat-new-button" aria-label="Mở cuộc trò chuyện" title="Mở cuộc trò chuyện" disabled={creating} onClick={createConversation}>{creating ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-pencil-square" aria-hidden="true" />}</button> : null}</div>
          <label className="chat-search"><span className="visually-hidden">Tìm cuộc trò chuyện</span><i className="bi bi-search" aria-hidden="true" /><input type="search" value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} placeholder="Tìm trong tin nhắn" /></label>
        </header>
        {conversations.length ? <div className="chat-conversation-list">{filteredConversations.length ? filteredConversations.map((conversation) => <ConversationRow conversation={conversation} currentUserId={user?.id} key={conversation.id} selected={String(conversation.id) === String(selectedId)} onSelect={chooseConversation} />) : <div className="chat-list-empty"><i className="bi bi-search" aria-hidden="true" /><p>Không tìm thấy cuộc trò chuyện phù hợp.</p></div>}</div> : <div className="chat-sidebar__empty"><EmptyState icon="bi-chat-square-text" title="Chưa có cuộc trò chuyện" description="Bắt đầu trao đổi khi bạn cần thêm thông tin." /></div>}
      </aside>
      <section className={`chat-main${selectedConversation ? '' : ' is-empty'}`} aria-label="Nội dung cuộc trò chuyện">
        {selectedConversation ? <><header className="chat-header"><button type="button" className="chat-header__back" aria-label="Quay lại danh sách cuộc trò chuyện" onClick={() => setMobileThreadOpen(false)}><i className="bi bi-arrow-left" aria-hidden="true" /></button><ConversationAvatar conversation={selectedConversation} currentUserId={user?.id} className="chat-header__avatar" /><div className="chat-header__identity"><h2>{conversationName(selectedConversation, user?.id)}</h2><span>Trao đổi riêng tư trong hệ thống</span></div></header>{messagesRequest.error ? <ErrorState message={messagesRequest.error} onRetry={messagesRequest.reload} /> : messagesRequest.loading ? <LoadingState label="Đang tải tin nhắn…" /> : <div className="chat-messages" aria-live="polite">{messages.length ? messages.map((message, index) => <MessageItem message={message} previousMessage={messages[index - 1]} currentUserId={user?.id} isGroupConversation={selectedConversation.type === 'GROUP'} key={message.id || `${messageTimestamp(message)}-${message.content}`} />) : <div className="chat-messages__empty"><EmptyState icon="bi-chat" title="Chưa có tin nhắn" description="Hãy mở đầu cuộc trò chuyện một cách lịch sự." /></div>}<div ref={messagesEndRef} /></div>}<form className="chat-compose" onSubmit={sendMessage}><label className="visually-hidden" htmlFor="chat-content">Nội dung tin nhắn</label><div className="chat-compose__field"><textarea id="chat-content" rows="1" maxLength={MAX_MESSAGE_LENGTH} value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={submitOnEnter} placeholder="Nhập tin nhắn…" /><span>Enter để gửi · Shift + Enter xuống dòng</span></div><button type="submit" className="chat-compose__send" disabled={sending || !cleanText(content, MAX_MESSAGE_LENGTH)} aria-label="Gửi tin nhắn" title="Gửi tin nhắn">{sending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-send-fill" aria-hidden="true" />}</button></form></> : <div className="chat-main__empty"><EmptyState icon="bi-chat-square" title="Chọn một cuộc trò chuyện" description="Nội dung tin nhắn sẽ hiển thị tại đây." /></div>}
      </section>
    </div>
  );
}
