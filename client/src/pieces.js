export const PIECES = [
  { id: 'I1', name: '1',  squares: [[0, 0]] },
  { id: 'I2', name: '2',  squares: [[0, 0], [0, 1]] },
  { id: 'I3', name: 'I3', squares: [[0, 0], [0, 1], [0, 2]] },
  { id: 'V3', name: 'V3', squares: [[0, 0], [1, 0], [1, 1]] },
  { id: 'I4', name: 'I4', squares: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'L4', name: 'L4', squares: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: 'T4', name: 'T4', squares: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 'S4', name: 'S4', squares: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: 'O4', name: 'O4', squares: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 'F5', name: 'F',  squares: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
  { id: 'I5', name: 'I',  squares: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: 'L5', name: 'L',  squares: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
  { id: 'N5', name: 'N',  squares: [[0, 1], [1, 0], [1, 1], [2, 0], [3, 0]] },
  { id: 'P5', name: 'P',  squares: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { id: 'T5', name: 'T',  squares: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
  { id: 'U5', name: 'U',  squares: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
  { id: 'V5', name: 'V',  squares: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { id: 'W5', name: 'W',  squares: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
  { id: 'X5', name: 'X',  squares: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
  { id: 'Y5', name: 'Y',  squares: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]] },
  { id: 'Z5', name: 'Z',  squares: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },
];

export const PIECE_MAP = Object.fromEntries(PIECES.map(p => [p.id, p]));

function normalize(squares) {
  const minR = Math.min(...squares.map(s => s[0]));
  const minC = Math.min(...squares.map(s => s[1]));
  return squares.map(([r, c]) => [r - minR, c - minC]);
}

function rotate90CW(squares) {
  return normalize(squares.map(([r, c]) => [c, -r]));
}

function flipH(squares) {
  return normalize(squares.map(([r, c]) => [r, -c]));
}

export function getTransformedSquares(pieceId, rotation, flipped) {
  const piece = PIECE_MAP[pieceId];
  if (!piece) return [];
  let squares = piece.squares.map(s => [...s]);
  if (flipped) squares = flipH(squares);
  for (let i = 0; i < (rotation % 4); i++) squares = rotate90CW(squares);
  return squares;
}

export function getAbsoluteSquares(pieceId, rotation, flipped, row, col) {
  return getTransformedSquares(pieceId, rotation, flipped).map(([r, c]) => [r + row, c + col]);
}
