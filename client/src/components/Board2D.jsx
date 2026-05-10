import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store.js';
import { COLOR_HEX } from '../colors.js';
import { getAbsoluteSquares } from '../pieces.js';
import { isValidPlacement } from '../validate.js';

// Vertical offset (in CSS pixels) so the ghost piece appears above the finger
// rather than under it. This is the difference between the touch point and
// the piece's anchor cell.
const POINTER_OFFSET_Y = 60;

function pointerToCell(boardEl, clientX, clientY, N) {
  if (!boardEl) return null;
  const rect = boardEl.getBoundingClientRect();
  const cellSize = rect.width / N;
  const adjY = clientY - POINTER_OFFSET_Y;
  const col = Math.floor((clientX - rect.left) / cellSize);
  const row = Math.floor((adjY - rect.top) / cellSize);
  if (row < -2 || col < -2 || row > N + 2 || col > N + 2) return null;
  return [row, col];
}

export default function Board2D() {
  const { gameState, color, dragState, updateDrag } = useGameStore();
  const boardRef = useRef(null);

  const N = gameState?.boardSize ?? 14;
  const startCell = gameState?.startCells?.[color];
  const isFirstMove = (gameState?.pieceCount?.[color] ?? 0) === 0;

  // While dragging, recompute the ghost target as the pointer moves anywhere
  // on the page. We listen at window level because pointer capture is set on
  // the tray piece, not the board.
  useEffect(() => {
    if (!dragState.active) return;
    const handler = (e) => {
      const cell = pointerToCell(boardRef.current, e.clientX, e.clientY, N);
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
  }, [dragState.active, dragState.pieceId, dragState.rotation, dragState.flipped, gameState, color, N, startCell, isFirstMove, updateDrag]);

  if (!gameState) return null;

  // Build ghost cell set for overlay rendering
  let ghostSet = null;
  let ghostValid = false;
  if (dragState.active && dragState.targetCell) {
    const [row, col] = dragState.targetCell;
    const abs = getAbsoluteSquares(dragState.pieceId, dragState.rotation, dragState.flipped, row, col);
    ghostSet = new Set(abs.map(([r, c]) => `${r},${c}`));
    ghostValid = dragState.valid;
  }

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
        {Array.from({ length: N }, (_, r) =>
          Array.from({ length: N }, (_, c) => {
            const cellColor = gameState.board[r][c];
            const isStart = startCell && startCell[0] === r && startCell[1] === c && !cellColor;
            const inGhost = ghostSet?.has(`${r},${c}`);
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  background: cellColor ? COLOR_HEX[cellColor] : '#0d1929',
                  position: 'relative',
                }}
              >
                {isStart && (
                  <div style={{
                    position: 'absolute', inset: '30%',
                    background: COLOR_HEX[color],
                    borderRadius: '50%', opacity: 0.5,
                  }} />
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
};
