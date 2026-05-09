import React from 'react';
import { useGameStore } from '../store.js';
import { PIECES, getTransformedSquares } from '../pieces.js';
import { COLOR_HEX } from '../colors.js';

const CELL = 10;
const PREVIEW_CELL = 20;

function PieceGrid({ squares, cellSize, color, dimmed }) {
  const maxR = Math.max(...squares.map(s => s[0])) + 1;
  const maxC = Math.max(...squares.map(s => s[1])) + 1;
  const squareSet = new Set(squares.map(([r, c]) => `${r},${c}`));

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(${maxR}, ${cellSize}px)`,
      gridTemplateColumns: `repeat(${maxC}, ${cellSize}px)`,
      gap: 1,
    }}>
      {Array.from({ length: maxR }, (_, r) =>
        Array.from({ length: maxC }, (_, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: cellSize, height: cellSize,
              background: squareSet.has(`${r},${c}`) ? (dimmed ? '#475569' : COLOR_HEX[color]) : 'transparent',
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
      <div style={styles.header}>
        <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          Your Pieces
        </span>
        <span style={{ color: COLOR_HEX[color], fontSize: 11, fontWeight: 700 }}>
          {remaining.length} left
        </span>
      </div>

      {myTurn && selectedPieceId && (
        <>
          <div style={styles.previewBox}>
            <PieceGrid
              squares={getTransformedSquares(selectedPieceId, rotation, flipped)}
              cellSize={PREVIEW_CELL}
              color={color}
            />
            <span style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>{selectedPieceId}</span>
          </div>
          <div style={styles.controls}>
            <button style={styles.ctrlBtn} onClick={rotate} title="Rotate 90°">↻ Rotate</button>
            <button style={styles.ctrlBtn} onClick={flip} title="Flip">⇔ Flip</button>
            <button style={{ ...styles.ctrlBtn, color: '#ef4444' }} onClick={() => setSelectedPiece(null)}>✕</button>
          </div>
          <p style={styles.hint}>Click a cell on the board to place</p>
        </>
      )}

      {!myTurn && (
        <p style={{ color: '#475569', fontSize: 12, padding: '4px 0' }}>Waiting for your turn…</p>
      )}

      <div style={styles.grid}>
        {PIECES.filter(p => remaining.includes(p.id)).map(piece => (
          <button
            key={piece.id}
            onClick={() => myTurn && setSelectedPiece(selectedPieceId === piece.id ? null : piece.id)}
            title={piece.name}
            disabled={!myTurn}
            style={{
              ...styles.pieceBtn,
              borderColor: selectedPieceId === piece.id ? COLOR_HEX[color] : '#1e293b',
              background: selectedPieceId === piece.id ? `${COLOR_HEX[color]}18` : '#0f172a',
              cursor: myTurn ? 'pointer' : 'not-allowed',
              opacity: myTurn ? 1 : 0.5,
            }}
          >
            <PieceGrid squares={piece.squares} cellSize={CELL} color={color} />
          </button>
        ))}
      </div>

      {remaining.length === 0 && (
        <p style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>All pieces placed!</p>
      )}
    </div>
  );
}

const styles = {
  panel: {
    width: 220, background: '#0f172a', borderLeft: '1px solid #1e293b',
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: 12, overflowY: 'auto', flexShrink: 0,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  previewBox: {
    background: '#1e293b', borderRadius: 8, padding: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minHeight: 80,
    justifyContent: 'center',
  },
  controls: { display: 'flex', gap: 4 },
  ctrlBtn: {
    flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
    color: '#94a3b8', padding: '5px 4px', fontSize: 11, cursor: 'pointer',
  },
  hint: { color: '#475569', fontSize: 11, textAlign: 'center' },
  grid: { display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 4 },
  pieceBtn: {
    padding: 5, border: '2px solid', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.15s, background 0.15s',
  },
};
