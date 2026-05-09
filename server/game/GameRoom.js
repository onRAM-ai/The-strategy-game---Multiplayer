import { PIECES, PIECE_MAP, getAbsoluteSquares } from './pieces.js';
import { isValidPlacement } from './validate.js';

const COLORS = ['blue', 'yellow', 'red', 'green'];

export class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.board = Array(20).fill(null).map(() => Array(20).fill(null));
    this.currentTurn = 0;
    this.remainingPieces = {};
    this.pieceCount = {}; // how many pieces each color has placed
    this.status = 'waiting';
    this.passCount = 0;
    this.scores = {};
    this.lastWasMonomino = {};
    this.createdAt = Date.now();
  }

  addPlayer(socketId, name) {
    const existing = this.players.find(p => p.name === name);
    if (existing) {
      existing.socketId = socketId;
      existing.connected = true;
      return { player: existing, isNew: false };
    }
    if (this.players.length >= 4) return { error: 'Room is full' };
    if (this.status !== 'waiting') return { error: 'Game already started' };

    const color = COLORS[this.players.length];
    const player = { id: name, name, color, connected: true, socketId };
    this.players.push(player);
    return { player, isNew: true };
  }

  startGame() {
    if (this.players.length < 2) return { error: 'Need at least 2 players to start' };

    for (const player of this.players) {
      this.remainingPieces[player.color] = PIECES.map(p => p.id);
      this.pieceCount[player.color] = 0;
      this.scores[player.color] = 0;
      this.lastWasMonomino[player.color] = false;
    }

    this.status = 'playing';
    this.currentTurn = 0;
    return { ok: true };
  }

  placePiece(playerName, pieceId, rotation, flipped, row, col) {
    if (this.status !== 'playing') return { error: 'Game not in progress' };

    const playerIndex = this.players.findIndex(p => p.name === playerName);
    if (playerIndex === -1) return { error: 'Player not found' };
    if (playerIndex !== this.currentTurn) return { error: 'Not your turn' };

    const player = this.players[playerIndex];
    const { color } = player;

    if (!this.remainingPieces[color].includes(pieceId)) return { error: 'Piece not available' };

    const absoluteSquares = getAbsoluteSquares(pieceId, rotation, flipped, row, col);
    const isFirstMove = this.pieceCount[color] === 0;

    if (!isValidPlacement(this.board, absoluteSquares, color, isFirstMove)) {
      return { error: 'Invalid placement' };
    }

    for (const [r, c] of absoluteSquares) {
      this.board[r][c] = color;
    }

    this.remainingPieces[color] = this.remainingPieces[color].filter(id => id !== pieceId);
    this.pieceCount[color]++;
    this.lastWasMonomino[color] = pieceId === 'I1';
    this.passCount = 0;

    this._advanceTurn();
    return { ok: true };
  }

  passTurn(playerName) {
    if (this.status !== 'playing') return { error: 'Game not in progress' };

    const playerIndex = this.players.findIndex(p => p.name === playerName);
    if (playerIndex === -1) return { error: 'Player not found' };
    if (playerIndex !== this.currentTurn) return { error: 'Not your turn' };

    this.passCount++;
    if (this.passCount >= this.players.length) {
      this._endGame();
      return { ok: true };
    }

    this._advanceTurn();
    return { ok: true };
  }

  _advanceTurn() {
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
  }

  _endGame() {
    this.status = 'finished';
    for (const player of this.players) {
      const { color } = player;
      const remaining = this.remainingPieces[color];
      let score = 0;
      for (const pieceId of remaining) {
        score -= PIECE_MAP[pieceId].squares.length;
      }
      if (remaining.length === 0) {
        score += 15;
        if (this.lastWasMonomino[color]) score += 5;
      }
      this.scores[color] = score;
    }
  }

  disconnectPlayer(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    if (player) player.connected = false;
  }

  getState() {
    return {
      id: this.id,
      players: this.players.map(p => ({ name: p.name, color: p.color, connected: p.connected })),
      board: this.board,
      currentTurn: this.currentTurn,
      currentColor: this.players[this.currentTurn]?.color ?? null,
      remainingPieces: this.remainingPieces,
      pieceCount: this.pieceCount,
      status: this.status,
      scores: this.scores,
    };
  }
}
