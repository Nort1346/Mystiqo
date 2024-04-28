"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = 3000;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*"
    }
});
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'client', 'build')));
app.use((0, cors_1.default)());
const users = {};
const queue = [];
io.on('connection', (socket) => {
    if (!users[socket.id])
        users[socket.id] = { id: (0, uuid_1.v4)(), roomId: null };
    io.emit('onlineCount', Object.keys(users).length);
    console.log(Object.keys(users).length);
    socket.on('joinQueue', () => {
        if (queue.includes(socket.id))
            return;
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            io.to(user.roomId).emit('strangerLeftRoom');
            users[socket.id].roomId = null;
        }
        queue.push(socket.id);
        console.log(`User ${socket.id} joined the queue`);
        if (queue.length >= 2) {
            const user1Id = queue.shift();
            const user2Id = queue.shift();
            const roomId = `room-${(0, uuid_1.v4)()}`;
            const socket1 = io.sockets.sockets.get(user1Id);
            const socket2 = io.sockets.sockets.get(user2Id);
            socket1 === null || socket1 === void 0 ? void 0 : socket1.join(roomId);
            socket2 === null || socket2 === void 0 ? void 0 : socket2.join(roomId);
            users[user1Id].roomId = roomId;
            users[user2Id].roomId = roomId;
            io.to(roomId).emit('joinedRoom');
            console.log(`Room ${roomId} created and users ${user1Id} and ${user2Id} joined`);
        }
    });
    socket.on('cancelQueue', () => {
        if (!queue.includes(socket.id))
            return;
        queue.splice(queue.findIndex(e => e == socket.id), 1);
        console.log(`User ${socket.id} cancel queue`);
        console.log(queue);
    });
    socket.on('sendMessage', (message) => {
        const user = users[socket.id];
        if (user && user.roomId) {
            console.log('sended', message);
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
        const index = queue.indexOf(socket.id);
        if (index !== -1) {
            queue.splice(index, 1);
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
});
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});
