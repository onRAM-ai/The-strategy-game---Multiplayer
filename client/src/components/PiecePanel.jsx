import React from 'react';
import { useGameStore } from '../store.js';
import { PIECES, getTransformedSquares } from '../pieces.js';
import { COLOR_HEX } from '../colors.js';
import socket from '../socket.js';

const CELL = 20;
const PREVIEW_CELL = 36;

const SIZE_GROUPS = [
  { size: 1, label: '1' },
  { size: 2, label: '2' },
  { size: 3, label: '3' },
  { size: 4, label: '4' },
  { size: 5, label: '5' },
];

function PieceGrid({ squares, cellSize, color }) {
  const maxR = Math.max(...squares.map(s => s[0])) + 1;
  const maxC = Math.max(...squares.map(s => s[1])) + 1;
  const squareSet = new Set(squares.map(([r, c]) => `${r},${c}`));
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(${maxR}, ${cellSize}px)`,
      gridTemplateColumns: `repeat(${maxC}, ${cellSize}px)`,
      gap: 2,
    }}>
      {Array.from({ length: maxR }, (_, r) =>
        Array.from({ length: maxC }, (_, c) => (
          <div key={`${r}-${c}`} style={{
            width: cellSize, height: cellSize,
            background: squareSet.has(`${r},${c}`) ? COLOR_HEX[color] : 'transparent',
            borderRadius: 2,
          }} />
        ))
      )}
    </div>
  );
}

export default function PiecePanel() {
  const {
    gameState, color,
    selectedPieceId, rotation, flipped,
    setSelectedPiece, rotate, flip, isMyTurn, myRemainingPieces,
  } = useGameStore();

  if (!gameState || gameState.status !== 'playing') return null;

  const remaining = myRemainingPieces();
  const myTurn = isMyTurn();
  const accentColor = COLOR_HEX[color] ?? '#3b82f6';

  return (
    <div style={styles.tray}>
      {/* Left: controls / preview */}
      <div style={styles.controls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor }} />
          <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            {remaining.length} left
          </span>
        </div>

        {!myTurn && (
          <p style={styles.waitingText}>Waiting…</p>
        )}

        {myTurn && !selectedPieceId && (
          <div style={styles.hint}>
            <span style={styles.hintLine}>1. Pick a piece →</span>
            <span style={styles.hintLine}>2. Hover board</span>
            <span style={styles.hintLine}>3. Click to place</span>
          </div>
        )}

        {myTurn && selectedPieceId && (
          <>
            <div style={styles.preview}>
              <PieceGrid
                squares={getTransformedSquares(selectedPieceId, rotation, flipped)}
                cellSize={PREVIEW_CELL}
                color={color}
              />
            </div>
            <div style={styles.btnRow}>
              <button style={styles.ctrlBtn} onClick={rotate} title="[R]">↻</button>
              <button style={styles.ctrlBtn} onClick={flip} title="[F]">⇔</button>
              <button style={{ ...styles.ctrlBtn, color: '#ef4444' }} onClick={() => setSelectedPiece(null)} title="[Esc]">✕</button>
            </div>
            <p style={styles.placeHint}>Click board →</p>
          </>
        )}

        {myTurn && (
          <button style={styles.passBtn} onClick={() => socket.emit('pass_turn')}>Pass</button>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Right: scrollable piece list grouped by size */}
      <div style={styles.pieceScroll}>
        {SIZE_GROUPS.map(({ size, label }) => {
          const group = PIECES.filter(p => p.squares.length === size && remaining.includes(p.id));
          if (group.length === 0) return null;
          return (
            <div key={size} style={styles.sizeGroup}>
              <span style={styles.sizeLabel}>{label}sq</span>
              <div style={styles.sizeRow}>
                {group.map(piece => {
                  const isSelected = selectedPieceId === piece.id;
                  return (
                    <button
                      key={piece.id}
                      title={piece.name}
                      disabled={!myTurn}
                      onClick={() => myTurn && setSelectedPiece(isSelected ? null : piece.id)}
                      style={{
                        ...styles.pieceBtn,
                        borderColor: isSelected ? accentColor : '#1e293b',
                        background: isSelected ? `${accentColor}22` : '#0f172a',
                        boxShadow: isSelected ? `0 0 8px ${accentColor}88` : 'none',
                        cursor: myTurn ? 'pointer' : 'not-allowed',
                        opacity: myTurn ? 1 : 0.4,
                      }}
                    >
                      <PieceGrid squares={piece.squares} cellSize={CELL} color={color} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {remaining.length === 0 && (
          <span style={{ color: '#22c55e', fontSize: 13, alignSelf: 'center', padding: '0 16px' }}>
            All placed!
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  tray: {
    height: 180,
    background: '#0a1628',
    borderTop: '2px solid #1e293b',
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    overflow: 'hidden',
  },

  controls: {
    width: 130,
    flexShrink: 0,
    padding: '10px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderRight: '1px solid #1e293b',
  },

  waitingText: { color: '#475569', fontSize: 12, margin: 0 },

  hint: { display: 'flex', flexDirection: 'column', gap: 2 },
  hintLine: { color: '#64748b', fontSize: 11 },

  preview: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flex: 1, minHeight: 0,
  },
  btnRow: { display: 'flex', gap: 3 },
  ctrlBtn: {
    flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 5,
    color: '#94a3b8', padding: '4px 2px', fontSize: 14, cursor: 'pointer',
  },
  placeHint: { color: '#22c55e', fontSize: 10, margin: 0, textAlign: 'center' },

  passBtn: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 5,
    color: '#64748b', padding: '4px 6px', fontSize: 11, cursor: 'pointer',
    marginTop: 'auto',
  },

  divider: { width: 1, background: '#1e293b', flexShrink: 0 },

  pieceScroll: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '10px 8px',
  },

  sizeGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
    paddingRight: 10,
    borderRight: '1px solid #1e293b',
    marginRight: 10,
  },
  sizeLabel: {
    color: '#334155', fontSize: 9, textTransform: 'uppercase',
    letterSpacing: 0.5, fontWeight: 700,
  },
  sizeRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: 300,
    alignContent: 'flex-start',
  },

  pieceBtn: {
    padding: 5, border: '2px solid', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
    flexShrink: 0,
  },
};
