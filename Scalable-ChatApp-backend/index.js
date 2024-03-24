const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const GroupChatMessage = require("./dbSchema/GroupChatMessage");
const OneOnOneChatMessage  = require("./dbSchema/OneOnOneChatMessage");

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

mongoose.connect('mongodb://0.0.0.0:27017/scalablechat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

app.get('/api/chat/:username', async (req, res) => {
  try {
      const username = req.params.username;
      const groupChatMessages = await GroupChatMessage.find().sort({ createdAt: 1 }).exec();
      const oneOnOneChatMessages = await OneOnOneChatMessage.find({
          $or: [{ senderId: username }, { receiverId: username }]
      }).sort({ createdAt: 1 }).exec();
      const result = {
          'group-chat': groupChatMessages,
      };

      oneOnOneChatMessages.forEach(message => {
          const key = message.senderId === username ? message.receiverId : message.senderId;
          if (!result[key]) {
              result[key] = [];
          }
          result[key].push(message);
      });

      res.json(result);
  } catch (error) {
      console.error('Error fetching chat details:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

const users = {}; 
io.on('connection', (socket) => {
  console.log('New user connected ->', socket.id);
    socket.on('setUsername', (username) => {
    users[username] =socket; 
    console.log(`Username set for ${socket.id}: ${username}`);
  });

  socket.on('message', async (data) => {
    const message = new GroupChatMessage({
      senderId: data.senderId,
      content: data.content,
    });
    setTimeout(async ()   => {
      await message.save();
      io.emit('message', message);
    }, 2000);
  });

  socket.on('privateMessage', async (data) => {
    const { username, content, senderId } = data;
    const message = new OneOnOneChatMessage({
      senderId: senderId,
      receiverId: username,
      content: content
    });
    await message.save();
    const receiverSocket = users[username];
   
    if (receiverSocket) {
      receiverSocket.emit('privateMessage', message);
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
