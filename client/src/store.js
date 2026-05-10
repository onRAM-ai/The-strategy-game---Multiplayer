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
  trayExpanded: false,
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
  setTrayExpanded: (expanded) => set({ trayExpanded: expanded }),
  toggleTrayExpanded: () => set(s => ({ trayExpanded: !s.trayExpanded })),

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
    trayExpanded: false,
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

  // Returns the CW board rotation in degrees (0/90/180/270) so the player's
  // start cell appears in the bottom-left quadrant of the screen.
  boardRotation() {
    const { gameState, color } = get();
    if (!gameState || !color) return 0;
    const start = gameState.startCells?.[color];
    if (!start) return 0;
    const N = gameState.boardSize;
    const [r, c] = start;
    const half = N / 2;
    const top = r < half;
    const left = c < half;
    if (top && left) return 270;
    if (top && !left) return 180;
    if (!top && !left) return 90;
    return 0;
  },
}));
