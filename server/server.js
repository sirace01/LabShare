const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to set Permissions-Policy header for screen sharing security requirements
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'display-capture=(self)');
  next();
});

// Serve static files from the build directory (assuming React build output is in ../dist or ../build)
// For development, this server is typically run separately or via proxy, but for the final artifact:
app.use(express.static(path.join(__dirname, '../dist')));

let broadcaster;

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
    console.log(`Broadcaster set: ${broadcaster}`);
  });

  socket.on('watcher', () => {
    console.log(`Watcher ${socket.id} joined`);
    if (broadcaster) {
      socket.to(broadcaster).emit('watcher', socket.id);
    }
  });

  socket.on('offer', (id, message) => {
    socket.to(id).emit('offer', socket.id, message);
  });

  socket.on('answer', (id, message) => {
    socket.to(id).emit('answer', socket.id, message);
  });

  socket.on('candidate', (id, message) => {
    socket.to(id).emit('candidate', socket.id, message);
  });

  socket.on('disconnect', () => {
    socket.to(broadcaster).emit('disconnectPeer', socket.id);
  });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access locally via http://localhost:${PORT}`);
  console.log(`Access on LAN via https://<YOUR_IP>:${PORT} (Requires HTTPS for getDisplayMedia in some browsers)`);
});