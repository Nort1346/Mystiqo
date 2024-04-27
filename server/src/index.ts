import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

const io = new Server(server, {
    cors: {
        origin: "http://192.168.1.17:3000"
    }
});

app.use(express.static(path.join(__dirname, '..', '..', 'client', 'build')));
app.use(cors());

io.on('connection', (socket) => {
    console.log('connected');
});

server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});