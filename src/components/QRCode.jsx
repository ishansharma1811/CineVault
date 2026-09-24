import React, { useMemo } from 'react';

// Lightweight deterministic visual code generator (not a scannable QR, a ticket glyph).
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export default function QRCode({ value, size = 120 }) {
  const cells = useMemo(() => {
    const N = 21;
    const grid = Array.from({ length: N }, () => Array(N).fill(false));
    let seed = hashStr(value || 'CINEVAULT');
    const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed; };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = (rnd() & 1) === 1;
    // finder patterns
    const finder = (or, oc) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[or + r][oc + c] = edge || center;
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 0; i < 8; i++) { grid[7][i] = false; grid[i][7] = false; grid[7][N - 1 - i] = false; grid[N - 1 - i][7] = false; }
    return grid;
  }, [value]);
  const N = cells.length;
  const cell = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white p-1">
      {cells.map((row, r) => row.map((on, c) => on ? (
        <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#000" />
      ) : null))}
    </svg>
  );
}