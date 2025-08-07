import { io } from 'socket.io-client';

const URL: string = import.meta.env.VITE_SOCKET_URL;

export const socket = io(URL);