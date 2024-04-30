import { v4 as uuidv4 } from 'uuid';
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
        origin: "*"
    }
});

app.use(express.static(path.join(__dirname, '..', '..', 'client', 'build')));
app.use(cors());

interface User {
    id: string,
    roomId: string | null
}

enum Language {
    English = 'en',
    Polish = 'pl'
};

enum Gender {
    Male = 'male',
    Female = 'female',
    Croissant = 'croissant',
    PreferNotSay = 'preferNotSay'
};

interface QueueItem {
    gender: Gender;
    language: Language;
    preferGender: Gender;
};

const users: { [key: string]: User } = {};
const queue: Record<string, QueueItem> = {};

io.on('connection', (socket) => {
    if (!users[socket.id])
        users[socket.id] = { id: uuidv4(), roomId: null };
    io.emit('onlineCount', Object.keys(users).length);
    console.log(Object.keys(users).length);

    socket.on('joinQueue', (filter: { gender: Gender, language: Language, preferGender: Gender }) => {
        if (queue[socket.id]) return;
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            io.to(user.roomId).emit('strangerLeftRoom');
            console.log('LEFT')
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

            io.to(roomId).emit('joinedRoom');
            console.log(`Room ${roomId} created and users ${matchedUserId} and ${socket.id} joined`);
        } else {
            queue[socket.id] = filter;
            console.log(`User ${socket.id} joined the queue`);
        }
    });

    socket.on('cancelQueue', () => {
        if (!queue[socket.id]) return;
        delete queue[socket.id];
        console.log(`User ${socket.id} cancel queue`);
        console.log(queue);
    });

    socket.on('sendMessage', (message: string) => {
        const user = users[socket.id];
        if (user && user.roomId) {
            console.log('sended', message)
            io.to(user.roomId).emit('message', user.id, message);
        }
    });

    socket.on('leaveRoom', () => {
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            const roomId = user.roomId;
            user.roomId = null;
            io.to(roomId).emit('strangerLeftRoom');
            console.log(`User ${socket.id} left the room`);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        const user = users[socket.id];
        if (user && user.roomId) {
            io.to(user.roomId).emit('strangerLeftRoom');
        }
        delete users[socket.id];
        if (queue[socket.id]) {
            delete queue[socket.id];
            console.log(`User ${socket.id} removed from queue`);
        }
        console.log(Object.keys(users).length);
        io.emit('onlineCount', Object.keys(users).length);
    });

    socket.on('getOnlineCount', () => {
        socket.emit('onlineCount', Object.keys(users).length);
    });

    socket.on('getUserId', () => {
        socket.emit('userId', users[socket.id].id);
    });

    socket.on('typing', () => {
        console.log('TYPING')
        const user = users[socket.id];
        if (user && user.roomId)
            socket.broadcast.to(user.roomId).emit('typing', user.id);
    });
});


server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});