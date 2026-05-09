import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  playerName: '',
  color: null,
  roomCode: null,
  gameState: null,

  selectedPieceId: null,
  rotation: 0,
  flipped: false,
  hoveredCell: null,
  errorMessage: null,

  setPlayerName: (name) => set({ playerName: name }),
  setColor: (color) => set({ color }),
  setRoomCode: (code) => set({ roomCode: code }),
  setGameState: (gameState) => set({ gameState }),
  setSelectedPiece: (id) => set({ selectedPieceId: id, rotation: 0, flipped: false }),
  setRotation: (r) => set({ rotation: r }),
  setFlipped: (f) => set({ flipped: f }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  setError: (msg) => set({ errorMessage: msg }),

  rotate: () => set(s => ({ rotation: (s.rotation + 1) % 4 })),
  flip: () => set(s => ({ flipped: !s.flipped })),

  isMyTurn() {
    const { gameState, color } = get();
    return gameState?.status === 'playing' && gameState.currentColor === color;
  },

  myRemainingPieces() {
    const { gameState, color } = get();
    if (!gameState || !color) return [];
    return gameState.remainingPieces?.[color] ?? [];
  },
}));
