# Blokus Online — Multiplayer MVP

Async turn-based multiplayer Blokus. Create a room, share the code, take turns whenever you're online.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run server + client in parallel
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## How to Play

1. Open the app and enter your name
2. **Create a room** → share the 4-letter code with friends
3. Friends **Join** with the code → host clicks **Start Game**
4. **Select** a piece from the right panel → **Rotate / Flip** it → **click** a board cell to place
5. If you can't move, click **Pass**
6. Game ends when all players pass consecutively

## Rules (Blokus)

- **First move**: your piece must cover your corner (colored squares at each board corner)
- **All other moves**: new piece must touch one of your own pieces **corner-to-corner**, never edge-to-edge
- **Scoring**: −1 per square in unplaced pieces; +15 for placing all 21; +5 if your last piece was the 1-square piece
- 2–4 players on a 20×20 board, 21 polyomino pieces each

## Stack

- **Server**: Node.js + Express + Socket.io
- **Client**: React + Vite + react-three-fiber (3D board) + Zustand
