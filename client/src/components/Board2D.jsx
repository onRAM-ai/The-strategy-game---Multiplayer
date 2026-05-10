import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store.js';
import { COLOR_HEX } from '../colors.js';
import { getAbsoluteSquares } from '../pieces.js';
import { isValidPlacement } from '../validate.js';

const POINTER_OFFSET_Y = 60;

// Map a display (visual) cell to its underlying server cell, given the board's
// CW rotation. The board is rotated so each player's start cell appears at the
// bottom-left visually; the SERVER game state stays in canonical coordinates.
function visualToServer(vr, vc, N, rotation) {
  switch (rotation) {
    case 90:  return [N - 1 - vc, vr];
    case 180: return [N - 1 - vr, N - 1 - vc];
    case 270: return [vc, N - 1 - vr];
    default:  return [vr, vc];
  }
}

function serverToVisual(sr, sc, N, rotation) {
  switch (rotation) {
    case 90:  return [sc, N - 1 - sr];
    case 180: return [N - 1 - sr, N - 1 - sc];
    case 270: return [N - 1 - sc, sr];
    default:  return [sr, sc];
  }
}

function pointerToServerCell(boardEl, clientX, clientY, N, rotation) {
  if (!boardEl) return null;
  const rect = boardEl.getBoundingClientRect();
  const cellSize = rect.width / N;
  const adjY = clientY - POINTER_OFFSET_Y;
  const px = clientX - rect.left;
  const py = adjY - rect.top;
  const vc = Math.floor(px / cellSize);
  const vr = Math.floor(py / cellSize);
  if (vr < -2 || vc < -2 || vr > N + 2 || vc > N + 2) return null;
  if (vr < 0 || vc < 0 || vr >= N || vc >= N) {
    // Out of bounds: still convert so caller knows the invalid cell
    return visualToServer(vr, vc, N, rotation);
  }
  return visualToServer(vr, vc, N, rotation);
}

export default function Board2D() {
  const { gameState, color, dragState, updateDrag, boardRotation } = useGameStore();
  const boardRef = useRef(null);

  const N = gameState?.boardSize ?? 14;
  const startCell = gameState?.startCells?.[color];
  const isFirstMove = (gameState?.pieceCount?.[color] ?? 0) === 0;
  const rotation = boardRotation();

  useEffect(() => {
    if (!dragState.active) return;
    const handler = (e) => {
      const cell = pointerToServerCell(boardRef.current, e.clientX, e.clientY, N, rotation);
      if (!cell) {
        updateDrag({ targetCell: null, valid: false, pointerPos: { x: e.clientX, y: e.clientY } });
        return;
      }
      const [row, col] = cell;
      const abs = getAbsoluteSquares(dragState.pieceId, dragState.rotation, dragState.flipped, row, col);
      const inBounds = abs.every(([r, c]) => r >= 0 && r < N && c >= 0 && c < N);
      const valid = inBounds && isValidPlacement(gameState.board, abs, color, isFirstMove, N, startCell);
      updateDrag({ targetCell: cell, valid, pointerPos: { x: e.clientX, y: e.clientY } });
    };
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, [dragState.active, dragState.pieceId, dragState.rotation, dragState.flipped, gameState, color, N, startCell, isFirstMove, rotation, updateDrag]);

  if (!gameState) return null;

  // Build set of server-coord cells that are part of the ghost
  let ghostSet = null;
  let ghostValid = false;
  if (dragState.active && dragState.targetCell) {
    const [row, col] = dragState.targetCell;
    const abs = getAbsoluteSquares(dragState.pieceId, dragState.rotation, dragState.flipped, row, col);
    ghostSet = new Set(abs.map(([r, c]) => `${r},${c}`));
    ghostValid = dragState.valid;
  }

  const startVisual = startCell ? serverToVisual(startCell[0], startCell[1], N, rotation) : null;
  const showStartLabel = isFirstMove && gameState.status === 'playing' && startCell;

  return (
    <div style={styles.wrap}>
      <div
        ref={boardRef}
        style={{
          ...styles.board,
          gridTemplateColumns: `repeat(${N}, 1fr)`,
          gridTemplateRows: `repeat(${N}, 1fr)`,
        }}
      >
        {Array.from({ length: N }, (_, vr) =>
          Array.from({ length: N }, (_, vc) => {
            const [sr, sc] = visualToServer(vr, vc, N, rotation);
            const cellColor = gameState.board[sr][sc];
            const isStart = startVisual && startVisual[0] === vr && startVisual[1] === vc && !cellColor;
            const inGhost = ghostSet?.has(`${sr},${sc}`);
            return (
              <div
                key={`${vr}-${vc}`}
                style={{
                  background: cellColor ? COLOR_HEX[cellColor] : '#0d1929',
                  position: 'relative',
                }}
              >
                {isStart && showStartLabel && (
                  <>
                    <div style={{
                      position: 'absolute', inset: '20%',
                      background: COLOR_HEX[color],
                      borderRadius: '50%',
                      opacity: 0.5,
                      animation: 'startPulse 1.6s ease-in-out infinite',
                    }} />
                    <div style={styles.startLabel}>START</div>
                  </>
                )}
                {inGhost && (
                  <div style={{
                    position: 'absolute', inset: 1,
                    background: ghostValid ? COLOR_HEX[color] : '#ef4444',
                    opacity: 0.7,
                    border: ghostValid ? '1.5px solid #22c55e' : '1.5px dashed #ef4444',
                    boxSizing: 'border-box',
                    borderRadius: 1,
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
      <style>{`
        @keyframes startPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.92); }
          50%      { opacity: 0.85; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  board: {
    display: 'grid',
    aspectRatio: '1 / 1',
    width: '100%',
    maxHeight: '100%',
    background: '#1e293b',
    gap: 1,
    padding: 1,
    borderRadius: 4,
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  startLabel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(7px, 1.6vmin, 11px)',
    fontWeight: 800,
    letterSpacing: 0.5,
    color: '#0f172a',
    textShadow: '0 0 2px rgba(255,255,255,0.5)',
    pointerEvents: 'none',
    zIndex: 1,
  },
};
