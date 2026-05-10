import React, { useState } from 'react';
import { useGameStore } from '../store.js';
import socket from '../socket.js';

export default function Lobby() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null);
  const [format, setFormat] = useState('duo');
  const { setPlayerName, errorMessage, setError } = useGameStore();

  const handleCreate = () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    setError(null);
    socket.emit('create_room', { playerName: name.trim(), format });
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    setPlayerName(name.trim());
    setError(null);
    socket.emit('join_room', { roomCode: joinCode.trim(), playerName: name.trim() });
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={{ color: '#3b82f6' }}>B</span>
          <span style={{ color: '#eab308' }}>L</span>
          <span style={{ color: '#ef4444' }}>O</span>
          <span style={{ color: '#22c55e' }}>K</span>
          <span style={{ color: '#3b82f6' }}>U</span>
          <span style={{ color: '#eab308' }}>S</span>
        </div>
        <p style={styles.sub}>Play with friends, anywhere</p>

        <input
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => mode === 'create' && e.key === 'Enter' && handleCreate()}
          autoFocus
        />

        {!mode && (
          <div style={styles.btnRow}>
            <button style={{ ...styles.btn, background: '#3b82f6' }} onClick={() => setMode('create')}>
              New Game
            </button>
            <button style={{ ...styles.btn, background: '#22c55e' }} onClick={() => setMode('join')}>
              Join
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={styles.section}>
            <div style={styles.formatRow}>
              <button
                onClick={() => setFormat('duo')}
                style={{
                  ...styles.formatBtn,
                  borderColor: format === 'duo' ? '#3b82f6' : '#334155',
                  background: format === 'duo' ? '#1e3a8a44' : '#0f172a',
                }}
              >
                <div style={styles.formatTitle}>Duo</div>
                <div style={styles.formatSub}>2 players · 14×14</div>
                <div style={styles.formatRec}>recommended for mobile</div>
              </button>
              <button
                onClick={() => setFormat('classic')}
                style={{
                  ...styles.formatBtn,
                  borderColor: format === 'classic' ? '#3b82f6' : '#334155',
                  background: format === 'classic' ? '#1e3a8a44' : '#0f172a',
                }}
              >
                <div style={styles.formatTitle}>Classic</div>
                <div style={styles.formatSub}>up to 4 · 20×20</div>
                <div style={{ ...styles.formatRec, color: '#475569' }}>full game</div>
              </button>
            </div>
            <button style={{ ...styles.btn, background: '#3b82f6', width: '100%' }} onClick={handleCreate}>
              Create &amp; Enter
            </button>
            <button style={styles.back} onClick={() => setMode(null)}>← Back</button>
          </div>
        )}

        {mode === 'join' && (
          <div style={styles.section}>
            <input
              style={{ ...styles.input, letterSpacing: 6, textAlign: 'center', textTransform: 'uppercase' }}
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={4}
            />
            <button style={{ ...styles.btn, background: '#22c55e', width: '100%' }} onClick={handleJoin}>
              Join Game
            </button>
            <button style={styles.back} onClick={() => setMode(null)}>← Back</button>
          </div>
        )}

        {errorMessage && (
          <p style={styles.error} onClick={() => setError(null)}>{errorMessage} ✕</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', background: '#0f172a', padding: 16,
  },
  card: {
    background: '#1e293b', borderRadius: 16, padding: '32px 24px',
    display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
    width: '100%', maxWidth: 360, boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  logo: { fontSize: 48, fontWeight: 900, letterSpacing: 4, lineHeight: 1 },
  sub: { color: '#64748b', fontSize: 13, textAlign: 'center', margin: 0 },
  input: {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#f1f5f9', padding: '12px 14px', fontSize: 16, outline: 'none',
    boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: 10, width: '100%' },
  btn: {
    flex: 1, border: 'none', borderRadius: 8, color: '#fff',
    padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' },
  formatRow: { display: 'flex', gap: 8, width: '100%' },
  formatBtn: {
    flex: 1, border: '2px solid', borderRadius: 10, color: '#f1f5f9',
    padding: '12px 8px', cursor: 'pointer', textAlign: 'left',
    transition: 'border-color 0.15s, background 0.15s',
  },
  formatTitle: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  formatSub: { fontSize: 12, color: '#94a3b8' },
  formatRec: { fontSize: 10, color: '#3b82f6', marginTop: 4 },
  back: {
    background: 'none', border: 'none', color: '#64748b', fontSize: 13,
    cursor: 'pointer', padding: 4,
  },
  error: { color: '#ef4444', fontSize: 13, cursor: 'pointer', margin: 0 },
};
