import React, { useState } from 'react';
import { useGameStore } from '../store.js';
import socket from '../socket.js';

export default function Lobby() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null);
  const { setPlayerName, errorMessage, setError } = useGameStore();

  const handleCreate = () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    setError(null);
    socket.emit('create_room', { playerName: name.trim() });
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
        <p style={styles.sub}>Async multiplayer — play with friends throughout the day</p>

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
              Create Room
            </button>
            <button style={{ ...styles.btn, background: '#22c55e' }} onClick={() => setMode('join')}>
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={styles.section}>
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

        <p style={styles.hint}>2–4 players · share the room code so friends can join</p>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0f172a',
  },
  card: {
    background: '#1e293b', borderRadius: 16, padding: '40px 36px',
    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
    width: 340, boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  logo: {
    fontSize: 52, fontWeight: 900, letterSpacing: 4, lineHeight: 1,
  },
  sub: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  input: {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#f1f5f9', padding: '10px 14px', fontSize: 15, outline: 'none',
  },
  btnRow: { display: 'flex', gap: 10, width: '100%' },
  btn: {
    flex: 1, border: 'none', borderRadius: 8, color: '#fff',
    padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' },
  back: {
    background: 'none', border: 'none', color: '#64748b', fontSize: 13,
    cursor: 'pointer', padding: 4,
  },
  error: { color: '#ef4444', fontSize: 13, cursor: 'pointer' },
  hint: { color: '#334155', fontSize: 12, textAlign: 'center' },
};
