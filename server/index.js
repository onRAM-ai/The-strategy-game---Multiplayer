import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { GameRoom } from './game/GameRoom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('connect', socket.id);

  socket.on('create_room', ({ playerName, format }) => {
    const code = generateRoomCode();
    const room = new GameRoom(code, format);
    rooms.set(code, room);

    const result = room.addPlayer(socket.id, playerName);
    if (result.error) { socket.emit('error', { message: result.error }); return; }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;

    socket.emit('room_created', { roomCode: code, gameState: room.getState(), color: result.player.color });
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    if (!room) { socket.emit('error', { message: 'Room not found' }); return; }

    const result = room.addPlayer(socket.id, playerName);
    if (result.error) { socket.emit('error', { message: result.error }); return; }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;

    socket.emit('joined', { gameState: room.getState(), color: result.player.color });
    socket.to(code).emit('player_joined', { gameState: room.getState() });
  });

  socket.on('start_game', () => {
    const { roomCode, playerName } = socket.data;
    const room = rooms.get(roomCode);
    if (!room) return;

    if (room.players[0]?.name !== playerName) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    const result = room.startGame();
    if (result.error) { socket.emit('error', { message: result.error }); return; }

    io.to(roomCode).emit('game_started', { gameState: room.getState() });
  });

  socket.on('place_piece', ({ pieceId, rotation, flipped, row, col }) => {
    const { roomCode, playerName } = socket.data;
    const room = rooms.get(roomCode);
    if (!room) return;

    const result = room.placePiece(playerName, pieceId, rotation, flipped, row, col);
    if (result.error) { socket.emit('error', { message: result.error }); return; }

    io.to(roomCode).emit('game_updated', { gameState: room.getState() });
    if (room.status === 'finished') {
      io.to(roomCode).emit('game_over', { gameState: room.getState() });
    }
  });

  socket.on('pass_turn', () => {
    const { roomCode, playerName } = socket.data;
    const room = rooms.get(roomCode);
    if (!room) return;

    const result = room.passTurn(playerName);
    if (result.error) { socket.emit('error', { message: result.error }); return; }

    io.to(roomCode).emit('game_updated', { gameState: room.getState() });
    if (room.status === 'finished') {
      io.to(roomCode).emit('game_over', { gameState: room.getState() });
    }
  });

  socket.on('disconnect', () => {
    const { roomCode } = socket.data ?? {};
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.disconnectPlayer(socket.id);
        socket.to(roomCode).emit('player_disconnected', { gameState: room.getState() });
      }
    }
    console.log('disconnect', socket.id);
  });
});

// Serve built React client — must be registered AFTER all API/socket routes
const clientDist = join(__dirname, '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Blokus server on :${PORT}`));
