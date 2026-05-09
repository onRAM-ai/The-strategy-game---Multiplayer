import React, { useEffect } from 'react';
import { useGameStore } from './store.js';
import socket from './socket.js';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';

export default function App() {
  const { setGameState, setColor, setRoomCode, setError } = useGameStore();

  useEffect(() => {
    socket.connect();

    socket.on('room_created', ({ gameState, color, roomCode }) => {
      setGameState(gameState);
      setColor(color);
      setRoomCode(roomCode);
    });

    socket.on('joined', ({ gameState, color }) => {
      setGameState(gameState);
      setColor(color);
    });

    socket.on('player_joined', ({ gameState }) => setGameState(gameState));
    socket.on('game_started', ({ gameState }) => setGameState(gameState));
    socket.on('game_updated', ({ gameState }) => setGameState(gameState));
    socket.on('game_over', ({ gameState }) => setGameState(gameState));
    socket.on('player_disconnected', ({ gameState }) => setGameState(gameState));
    socket.on('error', ({ message }) => setError(message));

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  const { gameState } = useGameStore();
  return gameState ? <Game /> : <Lobby />;
}
