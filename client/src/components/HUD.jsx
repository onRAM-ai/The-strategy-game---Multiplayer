import React from 'react';
import { useGameStore } from '../store.js';
import { COLOR_HEX } from '../colors.js';
import socket from '../socket.js';

const VIEW_PRESETS = [
  { label: '⬛ Top', title: 'Top-down view', pos: [9.5, 45, 9.5] },
  { label: '◆ Angle', title: 'Angled view (default)', pos: [9.5, 30, 22] },
  { label: '◻ Low', title: 'Low angle view', pos: [9.5, 12, 30] },
];

export default function HUD() {
  const { gameState, color, roomCode, errorMessage, setError, isMyTurn, setCameraSnapTo } = useGameStore();
  if (!gameState) return null;

  const myTurn = isMyTurn();
  const { players, status, scores, remainingPieces, currentColor } = gameState;

  return (
    <div style={styles.bar}>
      <span style={styles.roomCode}>
        <span style={{ color: '#475569' }}>ROOM </span>
        <strong style={{ letterSpacing: 3 }}>{roomCode}</strong>
      </span>

      <div style={styles.players}>
        {players.map(p => {
          const isActive = status === 'playing' && currentColor === p.color;
          const remaining = remainingPieces?.[p.color]?.length ?? 0;
          return (
            <div
              key={p.color}
              style={{
                ...styles.playerChip,
                borderColor: isActive ? COLOR_HEX[p.color] : 'transparent',
                background: isActive ? `${COLOR_HEX[p.color]}22` : 'transparent',
                opacity: p.connected ? 1 : 0.45,
              }}
            >
              <div style={{ ...styles.dot, background: COLOR_HEX[p.color] }} />
              <span style={styles.pname}>{p.name}</span>
              {status === 'playing' && (
                <span style={styles.pieces}>{remaining}p</span>
              )}
              {status === 'finished' && (
                <span style={{ ...styles.pieces, color: scores[p.color] >= 0 ? '#22c55e' : '#ef4444' }}>
                  {scores[p.color] > 0 ? '+' : ''}{scores[p.color]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.right}>
        {/* Camera view buttons */}
        {status === 'playing' && (
          <div style={styles.viewBtns}>
            {VIEW_PRESETS.map(v => (
              <button
                key={v.label}
                title={v.title}
                style={styles.viewBtn}
                onClick={() => setCameraSnapTo(v.pos)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {status === 'finished' && (
          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>Game Over!</span>
        )}

        {myTurn && status === 'playing' && (
          <>
            <span style={{ ...styles.turnBadge, color: COLOR_HEX[color], borderColor: COLOR_HEX[color], background: `${COLOR_HEX[color]}18` }}>
              YOUR TURN
            </span>
            <button style={styles.passBtn} onClick={() => socket.emit('pass_turn')}>Pass</button>
          </>
        )}
        {!myTurn && status === 'playing' && (
          <span style={{ color: '#475569', fontSize: 13 }}>
            {players.find(p => p.color === currentColor)?.name}'s turn
          </span>
        )}
        {errorMessage && (
          <span style={styles.err} onClick={() => setError(null)}>{errorMessage} ✕</span>
        )}
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '6px 14px', background: '#0f172a',
    borderBottom: '1px solid #1e293b', minHeight: 44, flexShrink: 0,
    flexWrap: 'wrap',
  },
  roomCode: { color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' },
  players: { display: 'flex', gap: 6, flex: 1, justifyContent: 'center', flexWrap: 'wrap', minWidth: 0 },
  playerChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 20, border: '1.5px solid transparent',
    transition: 'all 0.2s',
  },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  pname: { color: '#f1f5f9', fontSize: 13 },
  pieces: { color: '#64748b', fontSize: 11 },
  right: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' },
  viewBtns: { display: 'flex', gap: 3 },
  viewBtn: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 5,
    color: '#94a3b8', padding: '2px 7px', fontSize: 10, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  turnBadge: {
    fontWeight: 800, fontSize: 12, letterSpacing: 1,
    padding: '3px 10px', borderRadius: 20, border: '1.5px solid',
    whiteSpace: 'nowrap',
  },
  passBtn: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
    color: '#94a3b8', padding: '3px 10px', fontSize: 12, cursor: 'pointer',
  },
  err: { color: '#ef4444', fontSize: 12, cursor: 'pointer', maxWidth: 180 },
};
