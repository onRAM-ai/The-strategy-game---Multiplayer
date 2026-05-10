export function isValidPlacement(board, absoluteSquares, color, isFirstMove, boardSize, startCell) {
  for (const [r, c] of absoluteSquares) {
    if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return false;
    if (board[r][c] !== null) return false;
  }

  if (isFirstMove) {
    const [sr, sc] = startCell;
    return absoluteSquares.some(([r, c]) => r === sr && c === sc);
  }

  let touchesOwnCorner = false;
  for (const [r, c] of absoluteSquares) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === color) return false;
    }
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === color) {
        touchesOwnCorner = true;
      }
    }
  }
  return touchesOwnCorner;
}
