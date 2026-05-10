import React, { useState } from 'react';
import { useGameStore } from '../store.js';
import { COLOR_HEX } from '../colors.js';

export default function HUD() {
  const { gameState, color, roomCode, errorMessage, setError } = useGameStore();
  const [copied, setCopied] = useState(false);
  if (!gameState) return null;

  const { players, status, scores, remainingPieces, currentColor } = gameState;

  const copyRoom = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div style={styles.bar}>
      <button style={styles.roomCode} onClick={copyRoom} title="Tap to copy">
        <span style={styles.roomLabel}>ROOM</span>
        <strong style={styles.roomVal}>{roomCode}</strong>
        {copied && <span style={styles.copied}>✓</span>}
      </button>

      <div style={styles.players}>
        {players.map(p => {
          const isActive = status === 'playing' && currentColor === p.color;
          const isMe = p.color === color;
          const remaining = remainingPieces?.[p.color]?.length ?? 0;
          return (
            <div
              key={p.color}
              style={{
                ...styles.chip,
                borderColor: isActive ? COLOR_HEX[p.color] : 'transparent',
                background: isActive ? `${COLOR_HEX[p.color]}22` : 'transparent',
                boxShadow: isActive ? `0 0 12px ${COLOR_HEX[p.color]}66` : 'none',
                opacity: p.connected ? 1 : 0.45,
              }}
            >
              <div style={{ ...styles.dot, background: COLOR_HEX[p.color] }} />
              <span style={{ ...styles.pname, fontWeight: isMe ? 700 : 500 }}>
                {p.name}{isMe && ' (you)'}
              </span>
              {status === 'playing' && (
                <span style={styles.pieces}>{remaining}</span>
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

      {errorMessage && (
        <span style={styles.err} onClick={() => setError(null)}>{errorMessage} ✕</span>
      )}
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', background: '#0f172a',
    borderBottom: '1px solid #1e293b',
    minHeight: 44, flexShrink: 0,
    paddingTop: 'calc(6px + env(safe-area-inset-top))',
  },
  roomCode: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '4px 6px',
  },
  roomLabel: { color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1 },
  roomVal: { color: '#94a3b8', fontSize: 13, letterSpacing: 2 },
  copied: { color: '#22c55e', fontSize: 12 },
  players: {
    display: 'flex', gap: 4,
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  chip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 9px', borderRadius: 16,
    border: '1.5px solid transparent',
    transition: 'all 0.2s',
    fontSize: 13,
  },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  pname: { color: '#f1f5f9', fontSize: 12, whiteSpace: 'nowrap' },
  pieces: { color: '#64748b', fontSize: 11 },
  err: {
    color: '#ef4444', fontSize: 11, cursor: 'pointer',
    maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
};
