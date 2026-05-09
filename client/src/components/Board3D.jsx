import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store.js';
import { getAbsoluteSquares } from '../pieces.js';
import { isValidPlacement } from '../validate.js';
import { COLOR_HEX } from '../colors.js';
import socket from '../socket.js';

const BOARD = 20;
const PH = 0.28;

const COLOR_CORNER = { blue: [0, 0], yellow: [0, 19], red: [19, 19], green: [19, 0] };

function BoardSurface() {
  return (
    <mesh position={[9.5, -0.06, 9.5]} receiveShadow>
      <boxGeometry args={[20.6, 0.12, 20.6]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

function GridLines() {
  const lines = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= BOARD; i++) {
      pts.push(new THREE.Vector3(i, 0, 0), new THREE.Vector3(i, 0, BOARD));
      pts.push(new THREE.Vector3(0, 0, i), new THREE.Vector3(BOARD, 0, i));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#2d3f55" />
    </lineSegments>
  );
}

function CornerMarkers({ players }) {
  return (
    <>
      {players.map(p => {
        const [r, c] = COLOR_CORNER[p.color];
        return (
          <mesh key={p.color} position={[c + 0.5, 0.01, r + 0.5]}>
            <boxGeometry args={[0.85, 0.06, 0.85]} />
            <meshStandardMaterial color={COLOR_HEX[p.color]} opacity={0.65} transparent />
          </mesh>
        );
      })}
    </>
  );
}

function PlacedPieces({ board }) {
  const cells = useMemo(() => {
    const result = [];
    for (let r = 0; r < BOARD; r++) {
      for (let c = 0; c < BOARD; c++) {
        if (board[r][c]) result.push({ r, c, color: board[r][c] });
      }
    }
    return result;
  }, [board]);

  return (
    <>
      {cells.map(({ r, c, color }) => (
        <mesh key={`${r}-${c}`} position={[c + 0.5, PH / 2, r + 0.5]} castShadow>
          <boxGeometry args={[0.9, PH, 0.9]} />
          <meshStandardMaterial color={COLOR_HEX[color]} />
        </mesh>
      ))}
    </>
  );
}

function GhostPiece({ hoveredCell, pieceId, rotation, flipped, color, board, isFirstMove }) {
  if (!hoveredCell || !pieceId) return null;
  const [row, col] = hoveredCell;
  const absSquares = getAbsoluteSquares(pieceId, rotation, flipped, row, col);
  const valid = isValidPlacement(board, absSquares, color, isFirstMove);
  const ghostColor = valid ? COLOR_HEX[color] : '#ef4444';

  return (
    <>
      {absSquares.map(([r, c]) => {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return null;
        return (
          <mesh key={`g${r}-${c}`} position={[c + 0.5, PH / 2 + 0.02, r + 0.5]}>
            <boxGeometry args={[0.88, PH, 0.88]} />
            <meshStandardMaterial color={ghostColor} opacity={0.6} transparent />
          </mesh>
        );
      })}
    </>
  );
}

// Always-present interaction plane — emits events only when handleClick allows it
function InteractionPlane({ onHover, onLeave, onClick }) {
  return (
    <mesh
      position={[9.5, 0.001, 9.5]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={e => {
        e.stopPropagation();
        const col = Math.floor(e.point.x);
        const row = Math.floor(e.point.z);
        if (col >= 0 && col < BOARD && row >= 0 && row < BOARD) onHover([row, col]);
        else onLeave();
      }}
      onPointerLeave={() => onLeave()}
      onClick={e => {
        e.stopPropagation();
        const col = Math.floor(e.point.x);
        const row = Math.floor(e.point.z);
        if (col >= 0 && col < BOARD && row >= 0 && row < BOARD) onClick([row, col]);
      }}
    >
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Scene() {
  const {
    gameState, color, selectedPieceId, rotation, flipped,
    hoveredCell, setHoveredCell, isMyTurn,
    cameraSnapTo, clearCameraSnap,
  } = useGameStore();

  const { camera } = useThree();
  const orbitRef = useRef();

  useEffect(() => {
    if (!cameraSnapTo) return;
    camera.position.set(...cameraSnapTo);
    if (orbitRef.current) {
      orbitRef.current.target.set(9.5, 0, 9.5);
      orbitRef.current.update();
    }
    clearCameraSnap();
  }, [cameraSnapTo]);

  const handleClick = useCallback(([row, col]) => {
    if (!isMyTurn() || !selectedPieceId) return;
    socket.emit('place_piece', { pieceId: selectedPieceId, rotation, flipped, row, col });
  }, [selectedPieceId, rotation, flipped, isMyTurn]);

  if (!gameState) return null;

  const myTurn = isMyTurn();
  const placingMode = myTurn && !!selectedPieceId;
  const isFirstMove = (gameState.remainingPieces?.[color]?.length ?? 0) === 21;

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[12, 20, 12]} intensity={0.65} castShadow />

      <BoardSurface />
      <GridLines />
      <CornerMarkers players={gameState.players} />
      <PlacedPieces board={gameState.board} />

      {placingMode && hoveredCell && (
        <GhostPiece
          hoveredCell={hoveredCell}
          pieceId={selectedPieceId}
          rotation={rotation}
          flipped={flipped}
          color={color}
          board={gameState.board}
          isFirstMove={isFirstMove}
        />
      )}

      {/* Always present so hover works; handleClick guards actual placement */}
      <InteractionPlane
        onHover={setHoveredCell}
        onLeave={() => setHoveredCell(null)}
        onClick={handleClick}
      />

      {/* Disable orbit while placing so clicks reach the InteractionPlane */}
      <OrbitControls
        ref={orbitRef}
        enabled={!placingMode}
        target={[9.5, 0, 9.5]}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={6}
        maxDistance={50}
        enablePan
      />
    </>
  );
}

export default function Board3D() {
  const { isMyTurn, selectedPieceId } = useGameStore();
  const placingMode = isMyTurn() && !!selectedPieceId;

  return (
    <Canvas
      camera={{ position: [9.5, 30, 22], fov: 40 }}
      shadows
      style={{
        background: '#0d1929',
        width: '100%',
        height: '100%',
        cursor: placingMode ? 'crosshair' : 'grab',
      }}
    >
      <Scene />
    </Canvas>
  );
}
