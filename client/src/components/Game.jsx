import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store.js';
import { COLOR_HEX } from '../colors.js';
import socket from '../socket.js';
import HUD from './HUD.jsx';
import Board3D from './Board3D.jsx';
import PiecePanel from './PiecePanel.jsx';

export default function Game() {
  const { gameState, playerName, roomCode, color, rotate, flip, setSelectedPiece, isMyTurn } = useGameStore();

  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const prevTurnRef = useRef(null);

  // Flash "YOUR TURN" when the turn changes to this player
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    const cur = gameState.currentColor;
    if (cur === color && cur !== prevTurnRef.current) {
      setShowTurnBanner(true);
      const t = setTimeout(() => setShowTurnBanner(false), 2500);
      prevTurnRef.current = cur;
      return () => clearTimeout(t);
    }
    prevTurnRef.current = cur;
  }, [gameState?.currentColor, gameState?.status, color]);

  // Keyboard shortcuts: R = rotate, F = flip, Escape = deselect
  useEffect(() => {
    function onKey(e) {
      if (!isMyTurn()) return;
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'r' || e.key === 'R') rotate();
      if (e.key === 'f' || e.key === 'F') flip();
      if (e.key === 'Escape') setSelectedPiece(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotate, flip, setSelectedPiece, isMyTurn]);

  const isWaiting = gameState.status === 'waiting';
  const isFinished = gameState.status === 'finished';
  const isHost = gameState.players[0]?.name === playerName;
  const accentColor = COLOR_HEX[color] ?? '#22c55e';

  return (
    <div style={styles.root}>
      <HUD />
      <div style={styles.body}>
        <div style={styles.canvas}>
          <Board3D />
        </div>
        <PiecePanel />
      </div>

      {/* YOUR TURN flash banner */}
      {showTurnBanner && (
        <div style={styles.turnBannerWrap} onClick={() => setShowTurnBanner(false)}>
          <div style={{ ...styles.turnBanner, color: accentColor, borderColor: accentColor }}>
            YOUR TURN
          </div>
        </div>
      )}

      {isWaiting && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <h2 style={styles.overlayTitle}>Waiting for players</h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Share this room code:</p>
            <div style={styles.roomCodeBig}>{roomCode}</div>

            <div style={styles.playerList}>
              {gameState.players.map(p => (
                <div key={p.color} style={styles.playerRow}>
                  <div style={{ ...styles.dot, background: COLOR_HEX[p.color] }} />
                  <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                  {p.name === gameState.players[0].name && (
                    <span style={styles.hostBadge}>host</span>
                  )}
                </div>
              ))}
              {Array.from({ length: 4 - gameState.players.length }, (_, i) => (
                <div key={`empty-${i}`} style={{ ...styles.playerRow, opacity: 0.3 }}>
                  <div style={{ ...styles.dot, background: '#475569' }} />
                  <span style={{ color: '#475569' }}>waiting…</span>
                </div>
              ))}
            </div>

            {isHost && gameState.players.length >= 2 && (
              <button style={styles.startBtn} onClick={() => socket.emit('start_game')}>
                Start Game ({gameState.players.length} players)
              </button>
            )}
            {isHost && gameState.players.length < 2 && (
              <p style={{ color: '#475569', fontSize: 13 }}>Need at least 2 players to start</p>
            )}
            {!isHost && (
              <p style={{ color: '#64748b', fontSize: 13 }}>Waiting for host to start…</p>
            )}
          </div>
        </div>
      )}

      {isFinished && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <h2 style={styles.overlayTitle}>Game Over!</h2>
            <div style={styles.playerList}>
              {[...gameState.players]
                .sort((a, b) => (gameState.scores[b.color] ?? 0) - (gameState.scores[a.color] ?? 0))
                .map((p, i) => (
                  <div key={p.color} style={styles.playerRow}>
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
            <p style={{ color: '#475569', fontSize: 12 }}>
              Scoring: −1 per remaining square · +15 for placing all · +5 if last was the 1-square piece
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  canvas: { flex: 1 },

  turnBannerWrap: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, pointerEvents: 'none',
  },
  turnBanner: {
    fontSize: 42, fontWeight: 900, letterSpacing: 6,
    padding: '16px 36px', borderRadius: 16, border: '3px solid',
    background: 'rgba(0,0,0,0.7)',
    animation: 'fadeInOut 2.5s ease forwards',
  },

  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  overlayCard: {
    background: '#1e293b', borderRadius: 16, padding: '32px 36px',
    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
    width: 360, maxWidth: '90vw', boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
  },
  overlayTitle: { color: '#f1f5f9', fontSize: 24, fontWeight: 800 },
  roomCodeBig: {
    fontSize: 38, fontWeight: 900, letterSpacing: 10,
    color: '#f1f5f9', background: '#0f172a', padding: '12px 24px', borderRadius: 10,
  },
  playerList: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%' },
  playerRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 },
  hostBadge: {
    background: '#334155', color: '#94a3b8', fontSize: 10,
    padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
  },
  startBtn: {
    background: '#3b82f6', border: 'none', borderRadius: 10,
    color: '#fff', padding: '12px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    width: '100%',
  },
};
