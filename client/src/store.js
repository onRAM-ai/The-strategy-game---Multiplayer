import { create } from 'zustand';

const EMPTY_DRAG = {
  active: false,
  pieceId: null,
  rotation: 0,
  flipped: false,
  pointerPos: { x: 0, y: 0 },
  targetCell: null,
  valid: false,
};

export const useGameStore = create((set, get) => ({
  playerName: '',
  color: null,
  roomCode: null,
  gameState: null,

  selectedPieceId: null,
  rotation: 0,
  flipped: false,
  errorMessage: null,

  selectedTabSize: 5,
  dragState: { ...EMPTY_DRAG },

  setPlayerName: (name) => set({ playerName: name }),
  setColor: (color) => set({ color }),
  setRoomCode: (code) => set({ roomCode: code }),
  setGameState: (gameState) => set({ gameState }),
  setSelectedPiece: (id) => set({ selectedPieceId: id, rotation: 0, flipped: false }),
  setRotation: (r) => set({ rotation: r }),
  setFlipped: (f) => set({ flipped: f }),
  setError: (msg) => set({ errorMessage: msg }),
  setSelectedTabSize: (n) => set({ selectedTabSize: n }),

  rotate: () => set(s => ({
    rotation: (s.rotation + 1) % 4,
    dragState: s.dragState.active
      ? { ...s.dragState, rotation: (s.dragState.rotation + 1) % 4 }
      : s.dragState,
  })),
  flip: () => set(s => ({
    flipped: !s.flipped,
    dragState: s.dragState.active
      ? { ...s.dragState, flipped: !s.dragState.flipped }
      : s.dragState,
  })),

  beginDrag: (pieceId, rotation, flipped, pointerPos) => set({
    dragState: { active: true, pieceId, rotation, flipped, pointerPos, targetCell: null, valid: false },
    selectedPieceId: pieceId,
    rotation,
    flipped,
  }),
  updateDrag: (patch) => set(s => ({
    dragState: s.dragState.active ? { ...s.dragState, ...patch } : s.dragState,
  })),
  endDrag: () => set({ dragState: { ...EMPTY_DRAG } }),

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
