export type CellState = 'empty' | 'queen' | 'dot' | 'forbidden' | 'x';

export type Puzzle = {
    id: string;
    size: number; // NxN
    regions: number[][]; // region id per cell, same size
    name?: string;
};

export type Board = CellState[][]; // same dims as puzzle
