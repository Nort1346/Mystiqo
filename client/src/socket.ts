import { io } from 'socket.io-client';

const URL: string = process.env.REACT_APP_SOCKET_URL ?? "http://192.168.1.17:3001"//process.env.REACT_APP_SOCKET_URL;// 'http://192.168.1.17:3000';//process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

export const socket = io(URL);