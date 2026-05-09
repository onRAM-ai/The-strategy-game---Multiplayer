const CORNERS = {
  blue:   [0,  0],
  yellow: [0,  19],
  red:    [19, 19],
  green:  [19, 0],
};

export function isValidPlacement(board, absoluteSquares, color, isFirstMove) {
  for (const [r, c] of absoluteSquares) {
    if (r < 0 || r >= 20 || c < 0 || c >= 20) return false;
    if (board[r][c] !== null) return false;
  }

  if (isFirstMove) {
    const [cr, cc] = CORNERS[color];
    return absoluteSquares.some(([r, c]) => r === cr && c === cc);
  }

  let touchesOwnCorner = false;

  for (const [r, c] of absoluteSquares) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 20 && nc >= 0 && nc < 20 && board[nr][nc] === color) return false;
    }
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 20 && nc >= 0 && nc < 20 && board[nr][nc] === color) {
        touchesOwnCorner = true;
      }
    }
  }

  return touchesOwnCorner;
}
