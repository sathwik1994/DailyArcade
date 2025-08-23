import type { Puzzle } from './types';

// Fixed puzzles with exactly N regions for size N
// Each puzzle now has exactly 6 regions (0-5) for the 6x6 board
export const PUZZLES: Puzzle[] = [
  {
    id: 'q6a',
    name: 'Starter 6x6 A',
    size: 6,
    regions: [
      [0, 0, 1, 1, 2, 2],
      [0, 0, 1, 1, 2, 2],
      [3, 3, 1, 1, 2, 2],
      [3, 3, 4, 4, 5, 5],
      [3, 3, 4, 4, 5, 5],
      [3, 3, 4, 4, 5, 5],
    ],
  },
  {
    id: 'q6b',
    name: 'Starter 6x6 B',
    size: 6,
    regions: [
      [0, 0, 0, 1, 1, 1],
      [0, 0, 2, 2, 1, 1],
      [3, 3, 2, 2, 4, 4],
      [3, 3, 2, 2, 4, 4],
      [3, 3, 5, 5, 4, 4],
      [3, 3, 5, 5, 5, 5],
    ],
  },
  // Adding a 4x4 puzzle for variety
  {
    id: 'q4a',
    name: 'Mini 4x4',
    size: 4,
    regions: [
      [0, 0, 1, 1],
      [0, 2, 2, 1],
      [3, 2, 2, 3],
      [3, 3, 3, 3],
    ],
  },
];