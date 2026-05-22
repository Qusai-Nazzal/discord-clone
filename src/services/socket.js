import { io } from 'socket.io-client';
import { BACKEND_URL } from './api';

let socket = null;

export const initSocket = (user) => {
  if (socket) {
    socket.connect();
    socket.emit('user-connected', user);
    return socket;
  }

  socket = io(BACKEND_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500
  });

  socket.emit('user-connected', user);

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
