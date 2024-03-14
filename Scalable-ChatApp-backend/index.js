const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*'
}));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    }
});

const users = {}; 

io.on('connection', (socket) => {
    console.log('New user connected ->', socket.id);
    users[socket.id] = socket;

    socket.on('message', (data) => {
        const message = {
            senderId: socket.id,
            content: data.content
        };
        io.emit('message', message);
    });

    socket.on('privateMessage', (data) => {
        const { receiverId, content, senderId } = data;
        const receiverSocket = users[receiverId];
        if (receiverSocket) {
          const result = {
            senderId: senderId,
            content: content
          };
          receiverSocket.emit('privateMessage', result);
        } else {
            console.log('Receiver is not online or invalid.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete users[socket.id]; 
    });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
