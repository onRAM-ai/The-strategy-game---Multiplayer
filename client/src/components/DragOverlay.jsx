import React from 'react';
import { useGameStore } from '../store.js';
import { getTransformedSquares } from '../pieces.js';
import { COLOR_HEX } from '../colors.js';

const FLOAT_CELL = 18;
const POINTER_OFFSET_Y = 60;

// Renders a fixed, free-floating piece preview pinned above the user's
// pointer/finger while a drag is in progress. The Board2D ghost (snapped
// to the grid) takes over visual primacy when the pointer enters the
// board, but this floating preview always stays visible so the user has
// continuous feedback even during transitions.
function FloatingGhost() {
  const { dragState, color } = useGameStore();
  if (!dragState.active) return null;
  const squares = getTransformedSquares(dragState.pieceId, dragState.rotation, dragState.flipped);
  const maxR = Math.max(...squares.map(s => s[0])) + 1;
  const maxC = Math.max(...squares.map(s => s[1])) + 1;
  const set = new Set(squares.map(([r, c]) => `${r},${c}`));
  const width = maxC * FLOAT_CELL + (maxC - 1);
  const height = maxR * FLOAT_CELL + (maxR - 1);
  return (
    <div
      style={{
        position: 'fixed',
        left: dragState.pointerPos.x - width / 2,
        top: dragState.pointerPos.y - POINTER_OFFSET_Y - height / 2,
        pointerEvents: 'none',
        zIndex: 50,
        opacity: dragState.targetCell ? 0.35 : 0.85,
        transition: 'opacity 0.1s',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateRows: `repeat(${maxR}, ${FLOAT_CELL}px)`,
        gridTemplateColumns: `repeat(${maxC}, ${FLOAT_CELL}px)`,
        gap: 1,
      }}>
        {Array.from({ length: maxR }, (_, r) =>
          Array.from({ length: maxC }, (_, c) => (
            <div key={`${r}-${c}`} style={{
              background: set.has(`${r},${c}`) ? COLOR_HEX[color] : 'transparent',
              borderRadius: 2,
            }} />
          ))
        )}
      </div>
    </div>
  );
}

// Floating rotate / flip buttons pinned to bottom corners during drag.
// On touch devices the user can tap these with a second finger while
// holding the piece with the first. On desktop, keyboard R/F is faster.
function DragControls() {
  const { dragState, rotate, flip } = useGameStore();
  if (!dragState.active) return null;
  return (
    <>
      <button
        style={{ ...styles.fab, left: 16 }}
        onPointerDown={(e) => { e.stopPropagation(); rotate(); }}
        aria-label="Rotate"
      >↻</button>
      <button
        style={{ ...styles.fab, right: 16 }}
        onPointerDown={(e) => { e.stopPropagation(); flip(); }}
        aria-label="Flip"
      >⇔</button>
    </>
  );
}

export default function DragOverlay() {
  return (
    <>
      <FloatingGhost />
      <DragControls />
    </>
  );
}

const styles = {
  fab: {
    position: 'fixed',
    bottom: 'calc(220px + env(safe-area-inset-bottom))',
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: 'none',
    background: '#1e293b',
    color: '#f1f5f9',
    fontSize: 24,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    zIndex: 60,
    touchAction: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
