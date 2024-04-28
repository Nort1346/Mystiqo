import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = 'http://192.168.1.17:3000';//process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

export const socket = io(URL);