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
const dotenv_1 = __importDefault(require("dotenv"));
const enums_1 = require("./types/enums");
const node_process_1 = require("node:process");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: node_process_1.env.CORS_ORIGIN
    }
});
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'client', 'build')));
app.use((0, cors_1.default)());
const users = {};
const queue = {};
io.on(enums_1.Events.Connection, (socket) => {
    if (!users[socket.id])
        users[socket.id] = { id: (0, uuid_1.v4)(), roomId: null };
    io.emit(enums_1.Events.OnlineCount, Object.keys(users).length);
    socket.on(enums_1.Events.JoinQueue, (filter) => {
        if (queue[socket.id])
            return;
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            socket.broadcast.to(user.roomId).emit(enums_1.Events.StrangerLeftRoom);
            users[socket.id].roomId = null;
        }
        const match = Object.values(queue).find(item => (item.gender === filter.preferGender || filter.preferGender === enums_1.Gender.PreferNotSay) &&
            (item.preferGender === filter.gender || item.preferGender === enums_1.Gender.PreferNotSay) &&
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
            io.to(roomId).emit(enums_1.Events.JoinedRoom);
        }
        else {
            queue[socket.id] = filter;
        }
    });
    socket.on(enums_1.Events.CancelQueue, () => {
        if (!queue[socket.id])
            return;
        delete queue[socket.id];
    });
    socket.on(enums_1.Events.SendMessage, (message) => {
        const user = users[socket.id];
        if (user && user.roomId) {
            io.to(user.roomId).emit('message', user.id, message.trim());
        }
    });
    socket.on(enums_1.Events.LeaveRoom, () => {
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.leave(user.roomId);
            const roomId = user.roomId;
            user.roomId = null;
            socket.broadcast.to(roomId).emit(enums_1.Events.StrangerLeftRoom);
        }
    });
    socket.on(enums_1.Events.Disconnect, () => {
        const user = users[socket.id];
        if (user && user.roomId) {
            socket.broadcast.to(user.roomId).emit(enums_1.Events.StrangerLeftRoom);
        }
        delete users[socket.id];
        if (queue[socket.id]) {
            delete queue[socket.id];
        }
        io.emit(enums_1.Events.OnlineCount, Object.keys(users).length);
    });
    socket.on(enums_1.Events.GetOnlineCount, () => {
        socket.emit(enums_1.Events.OnlineCount, Object.keys(users).length);
    });
    socket.on(enums_1.Events.GetUserId, () => {
        socket.emit(enums_1.Events.UserId, users[socket.id].id);
    });
    socket.on(enums_1.Events.Typing, () => {
        const user = users[socket.id];
        if (user && user.roomId)
            socket.broadcast.to(user.roomId).emit(enums_1.Events.Typing, user.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});
