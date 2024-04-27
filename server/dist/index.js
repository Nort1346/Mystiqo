"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
        origin: "http://192.168.1.17:3000"
    }
});
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'client', 'build')));
app.use((0, cors_1.default)());
io.on('connection', (socket) => {
    console.log('connected');
});
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});
