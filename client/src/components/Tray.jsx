import React, { useRef } from 'react';
import { useGameStore } from '../store.js';
import { PIECES, getTransformedSquares } from '../pieces.js';
import { COLOR_HEX } from '../colors.js';
import socket from '../socket.js';

const TRAY_CELL = 16;
const PREVIEW_CELL = 30;
const DRAG_THRESHOLD_PX = 6;

const SIZES = [5, 4, 3, 2, 1];

function PieceGrid({ squares, cellSize, color, opacity = 1 }) {
  const maxR = Math.max(...squares.map(s => s[0])) + 1;
  const maxC = Math.max(...squares.map(s => s[1])) + 1;
  const set = new Set(squares.map(([r, c]) => `${r},${c}`));
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(${maxR}, ${cellSize}px)`,
      gridTemplateColumns: `repeat(${maxC}, ${cellSize}px)`,
      gap: 1,
      opacity,
      pointerEvents: 'none',
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
  );
}

export default function Tray() {
  const {
    gameState, color,
    selectedPieceId, rotation, flipped,
    selectedTabSize, setSelectedTabSize,
    setSelectedPiece, rotate, flip,
    isMyTurn, myRemainingPieces, beginDrag, endDrag, dragState,
  } = useGameStore();

  const downRef = useRef(null);

  if (!gameState || gameState.status !== 'playing') return null;

  const remaining = myRemainingPieces();
  const myTurn = isMyTurn();
  const accent = COLOR_HEX[color] ?? '#3b82f6';

  const remainingBySize = {};
  for (const sz of SIZES) {
    remainingBySize[sz] = PIECES.filter(p => p.squares.length === sz && remaining.includes(p.id));
  }

  const visiblePieces = remainingBySize[selectedTabSize] ?? [];

  function onPieceDown(e, piece) {
    if (!myTurn) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    downRef.current = {
      pieceId: piece.id,
      startX: e.clientX,
      startY: e.clientY,
      startedAt: Date.now(),
      startRotation: selectedPieceId === piece.id ? rotation : 0,
      startFlipped: selectedPieceId === piece.id ? flipped : false,
      dragging: false,
    };
  }

  function onPieceMove(e) {
    const d = downRef.current;
    if (!d) return;
    if (d.dragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      d.dragging = true;
      beginDrag(d.pieceId, d.startRotation, d.startFlipped, { x: e.clientX, y: e.clientY });
    }
  }

  function onPieceUp(e, piece) {
    const d = downRef.current;
    if (!d) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    const wasDragging = d.dragging;
    downRef.current = null;
    if (wasDragging) {
      // Drag finalization is handled at Game.jsx root pointerup
      return;
    }
    // Tap: toggle armed selection
    if (selectedPieceId === piece.id) {
      setSelectedPiece(null);
    } else {
      setSelectedPiece(piece.id);
    }
  }

  function onPieceCancel() {
    const d = downRef.current;
    if (d?.dragging) endDrag();
    downRef.current = null;
  }

  return (
    <div style={styles.tray}>
      {/* Tabs */}
      <div style={styles.tabRow}>
        {SIZES.map(sz => {
          const count = remainingBySize[sz].length;
          const active = selectedTabSize === sz;
          return (
            <button
              key={sz}
              onClick={() => setSelectedTabSize(sz)}
              style={{
                ...styles.tab,
                color: active ? accent : '#64748b',
                borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
                opacity: count === 0 ? 0.35 : 1,
              }}
            >
              {sz}<span style={styles.tabCount}>·{count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {myTurn && (
          <button style={styles.passBtn} onClick={() => { setSelectedPiece(null); socket.emit('pass_turn'); }}>
            Pass
          </button>
        )}
      </div>

      {/* Armed preview */}
      {selectedPieceId && myTurn && !dragState.active && (
        <div style={styles.previewRow}>
          <div style={styles.previewPiece}>
            <PieceGrid
              squares={getTransformedSquares(selectedPieceId, rotation, flipped)}
              cellSize={PREVIEW_CELL}
              color={color}
            />
          </div>
          <button style={styles.ctrlBtn} onClick={rotate} aria-label="Rotate">↻</button>
          <button style={styles.ctrlBtn} onClick={flip} aria-label="Flip">⇔</button>
          <button style={{ ...styles.ctrlBtn, color: '#ef4444' }} onClick={() => setSelectedPiece(null)} aria-label="Cancel">✕</button>
          <span style={styles.dragHint}>Drag piece below to place →</span>
        </div>
      )}

      {!selectedPieceId && myTurn && (
        <div style={styles.hintRow}>
          <span style={styles.hint}>Tap a piece to inspect · drag onto the board to play</span>
        </div>
      )}

      {!myTurn && (
        <div style={styles.hintRow}>
          <span style={{ ...styles.hint, color: '#475569' }}>Waiting for your turn…</span>
        </div>
      )}

      {/* Piece scroll */}
      <div style={styles.scroll}>
        {visiblePieces.length === 0 && (
          <span style={styles.emptyMsg}>
            {remaining.length === 0 ? 'All pieces placed!' : `No ${selectedTabSize}-square pieces left`}
          </span>
        )}
        {visiblePieces.map(piece => {
          const isSelected = selectedPieceId === piece.id;
          const isDragging = dragState.active && dragState.pieceId === piece.id;
          const previewSquares = isSelected
            ? getTransformedSquares(piece.id, rotation, flipped)
            : piece.squares;
          return (
            <div
              key={piece.id}
              onPointerDown={(e) => onPieceDown(e, piece)}
              onPointerMove={onPieceMove}
              onPointerUp={(e) => onPieceUp(e, piece)}
              onPointerCancel={onPieceCancel}
              style={{
                ...styles.pieceBtn,
                borderColor: isSelected ? accent : '#1e293b',
                background: isSelected ? `${accent}22` : '#0f172a',
                boxShadow: isSelected ? `0 0 0 2px ${accent}55` : 'none',
                opacity: isDragging ? 0.25 : (myTurn ? 1 : 0.45),
                cursor: myTurn ? 'grab' : 'not-allowed',
                touchAction: 'none',
              }}
              title={piece.name}
            >
              <PieceGrid squares={previewSquares} cellSize={TRAY_CELL} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  tray: {
    flexShrink: 0,
    background: '#0a1628',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tabRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    padding: '0 8px',
    borderBottom: '1px solid #1e293b',
    minHeight: 36,
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
    minWidth: 44,
  },
  tabCount: { fontSize: 10, color: '#475569', marginLeft: 3, fontWeight: 500 },
  passBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
    margin: '4px 4px 4px 8px',
  },

  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderBottom: '1px solid #1e293b',
    overflowX: 'auto',
  },
  previewPiece: {
    minWidth: 60,
    minHeight: 40,
    display: 'flex', alignItems: 'center',
  },
  ctrlBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    padding: '6px 10px',
    fontSize: 16,
    cursor: 'pointer',
    minWidth: 36,
  },
  dragHint: {
    color: '#22c55e',
    fontSize: 11,
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
  },

  hintRow: { padding: '6px 12px', borderBottom: '1px solid #1e293b' },
  hint: { color: '#64748b', fontSize: 12 },

  scroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '10px',
    minHeight: 80,
    touchAction: 'pan-x',
  },
  pieceBtn: {
    flexShrink: 0,
    padding: 6,
    border: '2px solid',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s, opacity 0.15s',
    minHeight: 70,
  },
  emptyMsg: {
    color: '#475569', fontSize: 12,
    alignSelf: 'center', padding: '0 12px',
  },
};
