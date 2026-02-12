import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Enable CORS: Essential for allowing the Vercel frontend to connect to this backend
const io = new Server(server, {
  cors: {
    origin: "*", // Allows connection from any domain (Vercel, localhost, etc.)
    methods: ["GET", "POST"]
  }
});

// Middleware for security headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'display-capture=(self)');
  next();
});

// Path to frontend build (if running locally/monorepo)
const distPath = path.join(__dirname, '../dist');

// Check if frontend build exists to serve it, otherwise act as API-only
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA Fallback
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('LabCast Signaling Server is running (Frontend build not found).');
    }
  });
} else {
  // Standalone Server Mode (e.g., hosted on Render/Railway)
  app.get('/', (req, res) => {
    res.send('LabCast Signaling Server is active. Set VITE_SERVER_URL in your frontend app to connect to this URL.');
  });
}

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signal Server running on port ${PORT}`);
  console.log(`CORS enabled for external connections.`);
});