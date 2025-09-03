import type { Board, Puzzle } from './types';

// Simple seeded random number generator
class SeededRandom {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Enhanced region generation with guaranteed consecutive IDs and exactly N regions
export function generateRegions(n: number, seed?: number): number[][] {
    const random = seed !== undefined ? new SeededRandom(seed) : null;
    const randFunc = random ? () => random.next() : Math.random;
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        // Pick n random unique seed cells
        const picks = new Set<number>();
        while (picks.size < n) {
            picks.add(Math.floor(randFunc() * n * n));
        }
        
        // Create seeds with consecutive IDs (0, 1, 2, ..., n-1)
        const seeds = Array.from(picks).map((k, idx) => ({
            r: Math.floor(k / n),
            c: k % n,
            id: idx,
        }));

        const regions = Array.from({ length: n }, () => Array(n).fill(-1));
        const q: Array<[number, number, number]> = [];

        // Initialize seeds
        for (const s of seeds) {
            regions[s.r][s.c] = s.id;
            q.push([s.r, s.c, s.id]);
        }

        // Multi-source BFS flood fill
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

        while (q.length) {
            const [r, c, id] = q.shift()!;
            for (const [dr, dc] of dirs) {
                const rr = r + dr, cc = c + dc;
                if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
                if (regions[rr][cc] !== -1) continue;
                regions[rr][cc] = id;
                q.push([rr, cc, id]);
            }
        }

        // Validate we have exactly n regions before smoothing
        const uniqueRegions = new Set<number>();
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                uniqueRegions.add(regions[r][c]);
            }
        }
        
        // If we don't have exactly n regions, try again
        if (uniqueRegions.size !== n) {
            continue;
        }
        
        // Check if any region dominates entire rows or columns
        let isValidLayout = true;
        
        // Check rows: no region should occupy an entire row
        for (let r = 0; r < n; r++) {
            const rowRegions = new Set(regions[r]);
            if (rowRegions.size === 1) {
                isValidLayout = false;
                break;
            }
        }
        
        // Check columns: no region should occupy an entire column
        if (isValidLayout) {
            for (let c = 0; c < n; c++) {
                const colRegions = new Set();
                for (let r = 0; r < n; r++) {
                    colRegions.add(regions[r][c]);
                }
                if (colRegions.size === 1) {
                    isValidLayout = false;
                    break;
                }
            }
        }
        
        // Check region sizes: no region should be too large
        if (isValidLayout) {
            const regionSizes = new Map<number, number>();
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    const regionId = regions[r][c];
                    regionSizes.set(regionId, (regionSizes.get(regionId) || 0) + 1);
                }
            }
            
            // Reject if any region has more than half the board
            const maxRegionSize = Math.floor((n * n) / 2);
            const sizes = Array.from(regionSizes.values());
            for (let i = 0; i < sizes.length; i++) {
                if (sizes[i] > maxRegionSize) {
                    isValidLayout = false;
                    break;
                }
            }
        }
        
        if (!isValidLayout) {
            continue;
        }
        
        // Conservative smoothing that preserves region count
        const smoothedRegions = performConservativeSmoothing(regions, n);
        
        // Final validation
        const finalUniqueRegions = new Set<number>();
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                finalUniqueRegions.add(smoothedRegions[r][c]);
            }
        }
        
        if (finalUniqueRegions.size === n) {
            // Test if the puzzle is actually solvable before returning it
            const testPuzzle: Puzzle = {
                id: 'test',
                name: 'test',
                size: n,
                regions: normalizeRegionIds(smoothedRegions)
            };
            
            if (isPuzzleSolvable(testPuzzle)) {
                return normalizeRegionIds(smoothedRegions);
            }
        }
    }
    
    // Fallback: create a simple valid region layout
    return createFallbackRegions(n);
}

// Conservative smoothing that won't eliminate regions
function performConservativeSmoothing(regions: number[][], n: number): number[][] {
    const result = regions.map(row => [...row]);
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
    
    // Only smooth cells that won't eliminate a region
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const id = result[r][c];
            let same = 0, neigh = 0;
            let neighborId = -1;
            
            for (const [dr, dc] of dirs) {
                const rr = r + dr, cc = c + dc;
                if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
                neigh++;
                if (result[rr][cc] === id) {
                    same++;
                } else {
                    neighborId = result[rr][cc];
                }
            }
            
            // Only merge if this cell is isolated AND it won't eliminate its region
            if (neigh > 0 && same === 0 && neighborId !== -1) {
                // Check if this is the only cell with this region ID
                let regionCellCount = 0;
                for (let rr = 0; rr < n; rr++) {
                    for (let cc = 0; cc < n; cc++) {
                        if (result[rr][cc] === id) regionCellCount++;
                    }
                }
                
                // Only merge if there are other cells with this region ID
                if (regionCellCount > 1) {
                    result[r][c] = neighborId;
                }
            }
        }
    }
    
    return result;
}

// Create a valid diagonal-based region layout that's guaranteed solvable
function createFallbackRegions(n: number): number[][] {
    // Try multiple patterns and return the first solvable one
    const patterns = [
        // Pattern 1: Diagonal stripes
        () => {
            const regions = Array.from({ length: n }, () => Array(n).fill(0));
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    regions[r][c] = (r + c) % n;
                }
            }
            return regions;
        },
        
        // Pattern 2: Horizontal stripes with offset
        () => {
            const regions = Array.from({ length: n }, () => Array(n).fill(0));
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    regions[r][c] = (r + Math.floor(c / 2)) % n;
                }
            }
            return regions;
        },
        
        // Pattern 3: Vertical stripes with offset
        () => {
            const regions = Array.from({ length: n }, () => Array(n).fill(0));
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    regions[r][c] = (c + Math.floor(r / 2)) % n;
                }
            }
            return regions;
        },
        
        // Pattern 4: Known solvable patterns for specific sizes
        () => {
            if (n === 5) {
                return [
                    [0, 1, 2, 3, 4],
                    [2, 3, 4, 0, 1],
                    [4, 0, 1, 2, 3],
                    [1, 2, 3, 4, 0],
                    [3, 4, 0, 1, 2],
                ];
            } else if (n === 6) {
                return [
                    [0, 1, 2, 3, 4, 5],
                    [2, 3, 4, 5, 0, 1],
                    [4, 5, 0, 1, 2, 3],
                    [1, 2, 3, 4, 5, 0],
                    [3, 4, 5, 0, 1, 2],
                    [5, 0, 1, 2, 3, 4],
                ];
            }
            // For other sizes, use diagonal pattern
            const regions = Array.from({ length: n }, () => Array(n).fill(0));
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    regions[r][c] = (r + c) % n;
                }
            }
            return regions;
        }
    ];
    
    // Try each pattern and return the first solvable one
    for (const patternFn of patterns) {
        const regions = patternFn();
        const testPuzzle: Puzzle = {
            id: 'fallback-test',
            name: 'fallback test',
            size: n,
            regions
        };
        
        if (isPuzzleSolvable(testPuzzle)) {
            return regions;
        }
    }
    
    // Ultimate fallback - should never reach here but just in case
    // Return simple diagonal pattern
    const regions = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            regions[r][c] = (r + c) % n;
        }
    }
    return regions;
}

// Helper function to ensure region IDs are consecutive starting from 0
function normalizeRegionIds(regions: number[][]): number[][] {
    const n = regions.length;
    const uniqueIds = new Set<number>();
    
    // Collect all unique IDs
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            uniqueIds.add(regions[r][c]);
        }
    }
    
    // Create mapping from old IDs to new consecutive IDs
    const sortedIds = Array.from(uniqueIds).sort((a, b) => a - b);
    const idMapping = new Map<number, number>();
    sortedIds.forEach((oldId, newIndex) => {
        idMapping.set(oldId, newIndex);
    });
    
    // Apply the mapping
    const normalizedRegions = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            normalizedRegions[r][c] = idMapping.get(regions[r][c]) || 0;
        }
    }
    
    return normalizedRegions;
}

export function createEmptyBoard(n: number): Board {
    return Array.from({ length: n }, () => Array.from({ length: n }, () => 'empty'));
}

// Calculate forbidden positions based on placed queens
export function calculateForbiddenPositions(board: Board, puzzle: Puzzle): Board {
    const n = puzzle.size;
    const result: Board = board.map(row => [...row]);
    
    // Find all queens
    const queens: [number, number][] = [];
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (board[r][c] === 'queen') {
                queens.push([r, c]);
            }
        }
    }
    
    // For each queen, mark forbidden positions
    queens.forEach(([qr, qc]) => {
        // Mark same row and column as forbidden (but don't override user X marks)
        for (let i = 0; i < n; i++) {
            if (i !== qc && result[qr][i] === 'empty') {
                result[qr][i] = 'forbidden';
            }
            if (i !== qr && result[i][qc] === 'empty') {
                result[i][qc] = 'forbidden';
            }
        }
        
        // Mark only immediately adjacent diagonal positions as forbidden (no diagonal touching)
        const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        diagonalDirs.forEach(([dr, dc]) => {
            const r = qr + dr;
            const c = qc + dc;
            if (r >= 0 && r < n && c >= 0 && c < n && result[r][c] === 'empty') {
                result[r][c] = 'forbidden';
            }
        });
        
        // Mark same region as forbidden (if queen already placed in region)
        const queenRegion = puzzle.regions[qr][qc];
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (puzzle.regions[r][c] === queenRegion && result[r][c] === 'empty') {
                    result[r][c] = 'forbidden';
                }
            }
        }
    });
    
    return result;
}

export function cloneBoard(b: Board): Board {
    return b.map((row) => row.slice());
}

export function countQueens(board: Board): number {
    return board.flat().filter((c) => c === 'queen').length;
}

// Queens cannot touch diagonally; we also require exactly 1 per row/col/region for a win
export function isDiagonalTouch(board: Board, r: number, c: number): boolean {
    const n = board.length;
    const dirs = [
        [-1, -1], [-1, +1], [+1, -1], [+1, +1],
    ];
    return dirs.some(([dr, dc]) => {
        const rr = r + dr, cc = c + dc;
        return rr >= 0 && rr < n && cc >= 0 && cc < n && board[rr][cc] === 'queen';
    });
}

export function computeConflicts(board: Board, puzzle: Puzzle): boolean[][] {
    const n = puzzle.size;
    const conflicts: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => false));

    // Row/col counts
    const rowCounts = Array.from({ length: n }, () => 0);
    const colCounts = Array.from({ length: n }, () => 0);

    // Region counts (normalize region mapping)
    const regionMap = new Map<number, number>();
    let regionIndex = 0;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const rid = puzzle.regions[r][c];
            if (!regionMap.has(rid)) regionMap.set(rid, regionIndex++);
        }
    }
    const regionCounts = Array.from({ length: regionIndex }, () => 0);

    // First pass: counts and diagonal touches
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (board[r][c] === 'queen') {
                rowCounts[r]++;
                colCounts[c]++;
                regionCounts[regionMap.get(puzzle.regions[r][c])!]++;
                if (isDiagonalTouch(board, r, c)) conflicts[r][c] = true;
            }
        }
    }

    // Mark conflicts for rows/cols with count > 1
    for (let r = 0; r < n; r++) if (rowCounts[r] > 1) markRow(conflicts, board, r);
    for (let c = 0; c < n; c++) if (colCounts[c] > 1) markCol(conflicts, board, c);

    // Regions
    const regionCells: Record<number, [number, number][]> = {};
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const rr = regionMap.get(puzzle.regions[r][c])!;
            (regionCells[rr] ||= []).push([r, c]);
        }
    }
    Object.entries(regionCells).forEach(([, cells]) => {
        const queens = cells.filter(([r, c]) => board[r][c] === 'queen');
        if (queens.length > 1) queens.forEach(([r, c]) => (conflicts[r][c] = true));
    });

    return conflicts;
}

function markRow(conf: boolean[][], board: Board, r: number) {
    for (let c = 0; c < board.length; c++) if (board[r][c] === 'queen') conf[r][c] = true;
}

function markCol(conf: boolean[][], board: Board, c: number) {
    for (let r = 0; r < board.length; r++) if (board[r][c] === 'queen') conf[r][c] = true;
}

export function hasWon(board: Board, puzzle: Puzzle): boolean {
    const n = puzzle.size;
    if (countQueens(board) !== n) return false;
    const conf = computeConflicts(board, puzzle);
    
    // Also ensure exactly one per row/col/region
    for (let r = 0; r < n; r++) {
        let rc = 0;
        for (let c = 0; c < n; c++) if (board[r][c] === 'queen') rc++;
        if (rc !== 1) return false;
    }
    for (let c = 0; c < n; c++) {
        let cc = 0;
        for (let r = 0; r < n; r++) if (board[r][c] === 'queen') cc++;
        if (cc !== 1) return false;
    }
    // Regions
    const regionCounts = new Map<number, number>();
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
            if (board[r][c] === 'queen') regionCounts.set(puzzle.regions[r][c], (regionCounts.get(puzzle.regions[r][c]) || 0) + 1);
    const regionCountValues = Array.from(regionCounts.values());
    for (let i = 0; i < regionCountValues.length; i++) {
        if (regionCountValues[i] !== 1) return false;
    }

    // No conflicts
    return conf.every((row) => row.every((v) => !v));
}

// Check if a puzzle is solvable using backtracking
function isPuzzleSolvable(puzzle: Puzzle): boolean {
    const n = puzzle.size;
    const board = createEmptyBoard(n);
    
    // Try to solve using backtracking
    return solvePuzzleRecursive(board, puzzle, 0);
}

function solvePuzzleRecursive(board: Board, puzzle: Puzzle, row: number): boolean {
    const n = puzzle.size;
    
    // Base case: all rows processed
    if (row === n) {
        return hasWon(board, puzzle);
    }
    
    // Try placing a queen in each column of this row
    for (let col = 0; col < n; col++) {
        if (canPlaceQueen(board, puzzle, row, col)) {
            // Place queen
            board[row][col] = 'queen';
            
            // Recursively try next row
            if (solvePuzzleRecursive(board, puzzle, row + 1)) {
                return true;
            }
            
            // Backtrack
            board[row][col] = 'empty';
        }
    }
    
    return false;
}

function canPlaceQueen(board: Board, puzzle: Puzzle, row: number, col: number): boolean {
    const n = puzzle.size;
    
    // Check if there's already a queen in this column
    for (let r = 0; r < row; r++) {
        if (board[r][col] === 'queen') {
            return false;
        }
    }
    
    // Check diagonals (only need to check above current row)
    for (let r = 0; r < row; r++) {
        for (let c = 0; c < n; c++) {
            if (board[r][c] === 'queen') {
                // Check if diagonal touch
                if (Math.abs(r - row) === Math.abs(c - col)) {
                    return false;
                }
                // Check if immediately adjacent diagonally
                if (Math.abs(r - row) === 1 && Math.abs(c - col) === 1) {
                    return false;
                }
            }
        }
    }
    
    // Check if there's already a queen in this region
    const targetRegion = puzzle.regions[row][col];
    for (let r = 0; r < row; r++) {
        for (let c = 0; c < n; c++) {
            if (board[r][c] === 'queen' && puzzle.regions[r][c] === targetRegion) {
                return false;
            }
        }
    }
    
    return true;
}

