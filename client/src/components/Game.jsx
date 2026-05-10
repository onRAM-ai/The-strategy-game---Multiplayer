import React, { useEffect } from 'react';
import { useGameStore } from '../store.js';
import { COLOR_HEX } from '../colors.js';
import socket from '../socket.js';
import HUD from './HUD.jsx';
import Board2D from './Board2D.jsx';
import Tray from './Tray.jsx';
import DragOverlay from './DragOverlay.jsx';

export default function Game() {
  const {
    gameState, playerName, roomCode, color,
    rotate, flip, setSelectedPiece,
    isMyTurn, dragState, endDrag,
  } = useGameStore();

  // Keyboard shortcuts: R rotate, F flip, Esc deselect/cancel-drag
  useEffect(() => {
    function onKey(e) {
      if (!isMyTurn()) return;
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'r' || e.key === 'R') rotate();
      else if (e.key === 'f' || e.key === 'F') flip();
      else if (e.key === 'Escape') { setSelectedPiece(null); endDrag(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotate, flip, setSelectedPiece, isMyTurn, endDrag]);

  // Global pointerup — finalizes a drag. Pointer capture on the tray piece
  // means pointerup fires on that element, but it bubbles to window.
  useEffect(() => {
    function onUp() {
      if (!dragState.active) return;
      if (dragState.targetCell && dragState.valid) {
        const [row, col] = dragState.targetCell;
        socket.emit('place_piece', {
          pieceId: dragState.pieceId,
          rotation: dragState.rotation,
          flipped: dragState.flipped,
          row, col,
        });
        setSelectedPiece(null);
      }
      endDrag();
    }
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragState, endDrag, setSelectedPiece]);

  const isWaiting = gameState.status === 'waiting';
  const isFinished = gameState.status === 'finished';
  const isHost = gameState.players[0]?.name === playerName;

  return (
    <div style={styles.root}>
      <HUD />
      <Board2D />
      <Tray />
      <DragOverlay />

      {isWaiting && (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <h2 style={styles.title}>Waiting for players</h2>
            <p style={styles.sub}>Share this code with a friend:</p>
            <div style={styles.bigCode}>{roomCode}</div>

            <div style={styles.list}>
              {gameState.players.map(p => (
                <div key={p.color} style={styles.row}>
                  <div style={{ ...styles.dot, background: COLOR_HEX[p.color] }} />
                  <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                  {p.name === gameState.players[0].name && (
                    <span style={styles.hostBadge}>host</span>
                  )}
                </div>
              ))}
              {Array.from({ length: gameState.maxPlayers - gameState.players.length }, (_, i) => (
                <div key={`e-${i}`} style={{ ...styles.row, opacity: 0.3 }}>
                  <div style={{ ...styles.dot, background: '#475569' }} />
                  <span style={{ color: '#475569' }}>waiting…</span>
                </div>
              ))}
            </div>

            <p style={styles.formatLabel}>
              {gameState.format === 'duo' ? 'Blokus Duo · 14×14' : 'Classic Blokus · 20×20'}
            </p>

            {isHost && gameState.players.length >= 2 && (
              <button style={styles.startBtn} onClick={() => socket.emit('start_game')}>
                Start Game ({gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''})
              </button>
            )}
            {isHost && gameState.players.length < 2 && (
              <p style={styles.dim}>Need at least 2 players to start</p>
            )}
            {!isHost && (
              <p style={styles.dim}>Waiting for host to start…</p>
            )}
          </div>
        </div>
      )}

      {isFinished && (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <h2 style={styles.title}>Game Over!</h2>
            <div style={styles.list}>
              {[...gameState.players]
                .sort((a, b) => (gameState.scores[b.color] ?? 0) - (gameState.scores[a.color] ?? 0))
                .map((p, i) => (
                  <div key={p.color} style={styles.row}>
                    <span style={{ color: '#64748b', fontSize: 18, width: 24 }}>{i + 1}.</span>
                    <div style={{ ...styles.dot, background: COLOR_HEX[p.color] }} />
                    <span style={{ color: '#f1f5f9', flex: 1 }}>{p.name}</span>
                    <span style={{
                      fontWeight: 700, fontSize: 16,
                      color: gameState.scores[p.color] >= 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {gameState.scores[p.color] > 0 ? '+' : ''}{gameState.scores[p.color]}
                    </span>
                  </div>
                ))}
            </div>
            <button style={styles.startBtn} onClick={() => window.location.reload()}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',  /* excludes browser URL bar + nav on mobile */
    width: '100dvw',
    background: '#0d1929',
    overflow: 'hidden',
    position: 'relative',
    touchAction: 'none',
  },
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 16,
  },
  card: {
    background: '#1e293b', borderRadius: 16, padding: '28px 28px',
    display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
    width: '100%', maxWidth: 360, boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
  },
  title: { color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: '#94a3b8', fontSize: 13, margin: 0 },
  bigCode: {
    fontSize: 38, fontWeight: 900, letterSpacing: 8,
    color: '#f1f5f9', background: '#0f172a',
    padding: '12px 22px', borderRadius: 10,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%' },
  row: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 },
  hostBadge: {
    background: '#334155', color: '#94a3b8', fontSize: 10,
    padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
  },
  formatLabel: { color: '#475569', fontSize: 12, margin: 0 },
  startBtn: {
    background: '#3b82f6', border: 'none', borderRadius: 10,
    color: '#fff', padding: '12px 24px', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', width: '100%',
  },
  dim: { color: '#475569', fontSize: 13, margin: 0, textAlign: 'center' },
};
