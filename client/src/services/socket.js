import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  socket = io(socketUrl, {
    autoConnect: true,
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
