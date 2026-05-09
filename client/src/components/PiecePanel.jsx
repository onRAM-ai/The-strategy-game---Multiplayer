import React from 'react';
import { useGameStore } from '../store.js';
import { PIECES, getTransformedSquares } from '../pieces.js';
import { COLOR_HEX } from '../colors.js';

const CELL = 14;
const PREVIEW_CELL = 28;

// Blokus piece sizes for grouping
const SIZE_GROUPS = [
  { size: 1, label: '1 Square' },
  { size: 2, label: '2 Squares' },
  { size: 3, label: '3 Squares' },
  { size: 4, label: '4 Squares' },
  { size: 5, label: '5 Squares' },
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
      gap: 1.5,
    }}>
      {Array.from({ length: maxR }, (_, r) =>
        Array.from({ length: maxC }, (_, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: cellSize,
              height: cellSize,
              background: squareSet.has(`${r},${c}`) ? COLOR_HEX[color] : 'transparent',
              borderRadius: 2,
            }}
          />
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

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>Your Pieces</span>
        <span style={{ ...styles.count, color: COLOR_HEX[color] }}>
          {remaining.length} left
        </span>
      </div>

      {/* Instructions — always visible */}
      {myTurn && !selectedPieceId && (
        <div style={styles.instructBox}>
          <div style={styles.instructStep}><span style={styles.stepNum}>1</span> Click a piece below</div>
          <div style={styles.instructStep}><span style={styles.stepNum}>2</span> Hover the board to preview</div>
          <div style={styles.instructStep}><span style={styles.stepNum}>3</span> Click the board to place</div>
        </div>
      )}

      {/* Selected piece preview + controls */}
      {myTurn && selectedPieceId && (
        <div style={styles.selectedBox}>
          <div style={styles.previewWrap}>
            <PieceGrid
              squares={getTransformedSquares(selectedPieceId, rotation, flipped)}
              cellSize={PREVIEW_CELL}
              color={color}
            />
          </div>
          <div style={styles.controls}>
            <button style={styles.ctrlBtn} onClick={rotate} title="Rotate 90° [R]">
              ↻ Rotate <kbd style={styles.kbd}>R</kbd>
            </button>
            <button style={styles.ctrlBtn} onClick={flip} title="Flip [F]">
              ⇔ Flip <kbd style={styles.kbd}>F</kbd>
            </button>
            <button style={{ ...styles.ctrlBtn, color: '#ef4444' }} onClick={() => setSelectedPiece(null)} title="Cancel [Esc]">
              ✕ <kbd style={styles.kbd}>Esc</kbd>
            </button>
          </div>
          <p style={styles.placeHint}>→ Click the board to place</p>
        </div>
      )}

      {!myTurn && (
        <p style={styles.waitingText}>Waiting for your turn…</p>
      )}

      {/* Pieces grouped by size */}
      <div style={styles.groups}>
        {SIZE_GROUPS.map(({ size, label }) => {
          const piecesInGroup = PIECES.filter(
            p => p.squares.length === size && remaining.includes(p.id)
          );
          if (piecesInGroup.length === 0) return null;

          return (
            <div key={size} style={styles.group}>
              <div style={styles.groupHeader}>
                <span style={styles.groupLabel}>{label}</span>
                <span style={styles.groupCount}>{piecesInGroup.length}</span>
              </div>
              <div style={styles.pieceRow}>
                {piecesInGroup.map(piece => {
                  const isSelected = selectedPieceId === piece.id;
                  return (
                    <button
                      key={piece.id}
                      title={piece.name}
                      disabled={!myTurn}
                      onClick={() => myTurn && setSelectedPiece(isSelected ? null : piece.id)}
                      style={{
                        ...styles.pieceBtn,
                        borderColor: isSelected ? COLOR_HEX[color] : '#1e293b',
                        background: isSelected ? `${COLOR_HEX[color]}22` : '#0f172a',
                        boxShadow: isSelected ? `0 0 8px ${COLOR_HEX[color]}88` : 'none',
                        cursor: myTurn ? 'pointer' : 'not-allowed',
                        opacity: myTurn ? 1 : 0.45,
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
      </div>

      {remaining.length === 0 && (
        <p style={{ color: '#22c55e', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
          All pieces placed!
        </p>
      )}
    </div>
  );
}

const styles = {
  panel: {
    width: 260,
    background: '#0a1628',
    borderLeft: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px 10px',
    overflowY: 'auto',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottom: '1px solid #1e293b',
  },
  headerLabel: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  count: { fontSize: 12, fontWeight: 700 },

  instructBox: {
    background: '#1e293b',
    borderRadius: 8,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  instructStep: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 12 },
  stepNum: {
    background: '#334155', color: '#f1f5f9', borderRadius: '50%',
    width: 18, height: 18, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0,
  },

  selectedBox: {
    background: '#1e293b',
    borderRadius: 8,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  previewWrap: {
    minHeight: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { display: 'flex', gap: 4, width: '100%' },
  ctrlBtn: {
    flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
    color: '#94a3b8', padding: '5px 4px', fontSize: 11, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  kbd: {
    background: '#334155', color: '#64748b', borderRadius: 3,
    padding: '1px 4px', fontSize: 9, fontFamily: 'monospace',
  },
  placeHint: { color: '#22c55e', fontSize: 11, textAlign: 'center' },

  waitingText: { color: '#475569', fontSize: 12, textAlign: 'center', padding: '4px 0' },

  groups: { display: 'flex', flexDirection: 'column', gap: 10 },
  group: { display: 'flex', flexDirection: 'column', gap: 5 },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 2,
  },
  groupLabel: { color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupCount: {
    background: '#1e293b', color: '#64748b',
    borderRadius: 8, padding: '1px 6px', fontSize: 10,
  },
  pieceRow: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  pieceBtn: {
    padding: 5, border: '2px solid', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
  },
};
