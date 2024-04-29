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
var Language;
(function (Language) {
    Language["English"] = "en";
    Language["Polish"] = "pl";
})(Language || (Language = {}));
;
var Gender;
(function (Gender) {
    Gender["Male"] = "male";
    Gender["Female"] = "female";
    Gender["Croissant"] = "croissant";
    Gender["PreferNotSay"] = "preferNotSay";
})(Gender || (Gender = {}));
;
;
const users = {};
const queue = {};
io.on('connection', (socket) => {
    if (!users[socket.id])
        users[socket.id] = { id: (0, uuid_1.v4)(), roomId: null };
    io.emit('onlineCount', Object.keys(users).length);
    console.log(Object.keys(users).length);
    socket.on('joinQueue', (filter) => {
        if (queue[socket.id])
            return;
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            io.to(user.roomId).emit('strangerLeftRoom');
            users[socket.id].roomId = null;
        }
        const match = Object.values(queue).find(item => (item.gender === filter.preferGender || filter.preferGender === Gender.PreferNotSay) &&
            (item.preferGender === filter.gender || item.preferGender === Gender.PreferNotSay) &&
            item.language === filter.language);
        if (match) {
            const roomId = `room-${(0, uuid_1.v4)()}`;
            const matchedUserId = Object.keys(queue).find(id => queue[id] === match);
            const socket1 = io.sockets.sockets.get(matchedUserId);
            const socket2 = io.sockets.sockets.get(socket.id);
            socket1 === null || socket1 === void 0 ? void 0 : socket1.join(roomId);
            socket2 === null || socket2 === void 0 ? void 0 : socket2.join(roomId);
            users[matchedUserId].roomId = roomId;
            users[socket.id].roomId = roomId;
            delete queue[matchedUserId];
            delete queue[socket.id];
            io.to(roomId).emit('joinedRoom');
            console.log(`Room ${roomId} created and users ${matchedUserId} and ${socket.id} joined`);
        }
        else {
            queue[socket.id] = filter;
            console.log(`User ${socket.id} joined the queue`);
        }
    });
    socket.on('cancelQueue', () => {
        if (!queue[socket.id])
            return;
        delete queue[socket.id];
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
        console.log('TYPING');
        const user = users[socket.id];
        if (user && user.roomId)
            socket.broadcast.to(user.roomId).emit('typing', user.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});
