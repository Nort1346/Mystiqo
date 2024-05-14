import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { QueueItem, User } from './types/interfaces';
import { Events, Gender } from './types/enums';
import { env } from 'node:process';
import helmet from 'helmet';
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const io = new Server(server, {
    cors: {
        origin: env.CORS_ORIGIN
    }
});

app.use(express.static(path.join(__dirname, '..', '..', 'client', 'build')));
app.use(cors());
app.use(helmet());

const users: { [key: string]: User } = {};
const queue: Record<string, QueueItem> = {};

io.on(Events.Connection, (socket: Socket) => {
    if (!users[socket.id])
        users[socket.id] = { id: uuidv4(), roomId: null };
    io.emit(Events.OnlineCount, Object.keys(users).length);

    socket.on(Events.JoinQueue, (filter: QueueItem) => {
        if (queue[socket.id]) return;
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            socket.broadcast.to(user.roomId).emit(Events.StrangerLeftRoom);
            users[socket.id].roomId = null;
        }

        const match = Object.values(queue).find(item =>
            (item.gender === filter.preferGender || filter.preferGender === Gender.PreferNotSay) &&
            (item.preferGender === filter.gender || item.preferGender === Gender.PreferNotSay) &&
            item.language === filter.language
        );

        if (match) {
            const roomId = `room-${uuidv4()}`;
            const matchedUserId = Object.keys(queue).find(id => queue[id] === match)!;

            const socket1 = io.sockets.sockets.get(matchedUserId);
            const socket2 = io.sockets.sockets.get(socket.id);

            socket1?.join(roomId);
            socket2?.join(roomId);

            users[matchedUserId].roomId = roomId;
            users[socket.id].roomId = roomId;

            delete queue[matchedUserId];
            delete queue[socket.id];

            io.to(roomId).emit(Events.JoinedRoom);
        } else {
            queue[socket.id] = filter;
        }
    });

    socket.on(Events.CancelQueue, () => {
        if (!queue[socket.id]) return;
        delete queue[socket.id];
    });

    socket.on(Events.SendMessage, (message: string) => {
        const user = users[socket.id];
        if (user && user.roomId) {
            io.to(user.roomId).emit('message', user.id, message.trim());
        }
    });

    socket.on(Events.LeaveRoom, () => {
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            const roomId = user.roomId;
            user.roomId = null;
            socket.broadcast.to(roomId).emit(Events.StrangerLeftRoom);
        }
    });

    socket.on(Events.Disconnect, () => {
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.broadcast.to(user.roomId).emit(Events.StrangerLeftRoom);
        }
        delete users[socket.id];
        if (queue[socket.id]) {
            delete queue[socket.id];
        }
        io.emit(Events.OnlineCount, Object.keys(users).length);
    });

    socket.on(Events.GetOnlineCount, () => {
        socket.emit(Events.OnlineCount, Object.keys(users).length);
    });

    socket.on(Events.GetUserId, () => {
        socket.emit(Events.UserId, users[socket.id].id);
    });

    socket.on(Events.Typing, () => {
        const user = users[socket.id];
        if (user && user.roomId)
            socket.broadcast.to(user.roomId).emit(Events.Typing, user.id);
    });

    socket.on(Events.Error, (err: Error) => {
        console.error('Client Error', err.message);
    });
});

io.on(Events.Error, (err: Error) => {
    console.error('Socket.io server error:', err.message);
});

server.on(Events.Error, (err: Error) => {
    console.error('Express error:', err.message);
});

app.get('/', (req, res) => {
    res.send('Mystiqo Server Works');
});

server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});