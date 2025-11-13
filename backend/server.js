const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initSocket } = require('./socketHandler');
const { initBinlogListener } = require('./binlogListener');
const db = require('./db');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

initSocket(io);
initBinlogListener(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

process.on('SIGINT', async () => {
  console.log('🛑 Gracefully shutting down...');
  if (db) await db.destroy();
  process.exit(0);
});
