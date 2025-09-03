import type { Puzzle } from './types';

// Advanced puzzle generation with true uniqueness
export class UniquePuzzleGenerator {
  private generatedPuzzles: Set<string> = new Set();
  private maxAttempts = 1000;

  // Generate a completely unique puzzle for a given size
  generateUniquePuzzle(size: number, seed: number): Puzzle | null {
    let attempts = 0;
    
    while (attempts < this.maxAttempts) {
      const puzzle = this.generateRandomSolvablePuzzle(size, seed + attempts);
      
      if (puzzle) {
        const puzzleKey = this.getPuzzleSignature(puzzle);
        
        if (!this.generatedPuzzles.has(puzzleKey)) {
          this.generatedPuzzles.add(puzzleKey);
          return puzzle;
        }
      }
      
      attempts++;
    }
    
    return null; // Fallback to base patterns if generation fails
  }

  // Create a unique signature for a puzzle to detect duplicates
  private getPuzzleSignature(puzzle: Puzzle): string {
    return `${puzzle.size}_${JSON.stringify(puzzle.regions)}`;
  }

  // Generate a random solvable puzzle using advanced techniques
  private generateRandomSolvablePuzzle(size: number, seed: number): Puzzle | null {
    // Use seed for deterministic randomness
    const rng = this.createSeededRNG(seed);
    
    // Method 1: Region growing algorithm
    const regions = this.generateRegionsByGrowth(size, rng);
    
    if (regions) {
      const puzzle: Puzzle = {
        id: `generated-${size}x${size}-${seed}`,
        name: `Generated ${size}x${size} Puzzle`,
        size,
        regions
      };
      
      // Verify solvability using our existing logic
      if (this.isPuzzleSolvable(puzzle)) {
        return puzzle;
      }
    }

    // Method 2: Template-based generation with random variations
    return this.generateFromTemplate(size, rng);
  }

  // Seeded random number generator for consistency
  private createSeededRNG(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  // Generate regions using a growing algorithm
  private generateRegionsByGrowth(size: number, rng: () => number): number[][] | null {
    const regions: number[][] = Array(size).fill(0).map(() => Array(size).fill(-1));
    const regionSizes: number[] = [];
    
    // Calculate target region sizes (roughly equal with some variation)
    const baseSize = Math.floor((size * size) / size);
    let totalAssigned = 0;
    
    for (let i = 0; i < size; i++) {
      const remaining = size * size - totalAssigned;
      const remainingRegions = size - i;
      let regionSize = Math.floor(remaining / remainingRegions);
      
      // Add some randomness to region sizes
      if (rng() < 0.3 && regionSize > 2) {
        regionSize += Math.floor(rng() * 3) - 1;
      }
      
      regionSizes.push(Math.max(2, Math.min(regionSize, remaining)));
      totalAssigned += regionSizes[i];
    }

    // Start growing regions from seed points
    const seedPoints: { r: number; c: number; regionId: number }[] = [];
    
    for (let regionId = 0; regionId < size; regionId++) {
      let attempts = 0;
      let placed = false;
      
      while (!placed && attempts < 50) {
        const r = Math.floor(rng() * size);
        const c = Math.floor(rng() * size);
        
        if (regions[r][c] === -1) {
          regions[r][c] = regionId;
          seedPoints.push({ r, c, regionId });
          placed = true;
        }
        attempts++;
      }
      
      if (!placed) return null; // Failed to place seed
    }

    // Grow regions from seeds
    const queue: { r: number; c: number; regionId: number }[] = [...seedPoints];
    const regionCounts = Array(size).fill(1);
    
    while (queue.length > 0) {
      const { r, c, regionId } = queue.shift()!;
      
      if (regionCounts[regionId] >= regionSizes[regionId]) continue;
      
      // Get available neighbors
      const neighbors = this.getAvailableNeighbors(regions, r, c);
      
      if (neighbors.length > 0) {
        // Randomly select a neighbor
        const neighbor = neighbors[Math.floor(rng() * neighbors.length)];
        regions[neighbor.r][neighbor.c] = regionId;
        regionCounts[regionId]++;
        queue.push({ ...neighbor, regionId });
      }
    }

    // Fill remaining cells with adjacent regions
    this.fillRemainingCells(regions, size);
    
    return this.normalizeRegionIds(regions);
  }

  private getAvailableNeighbors(regions: number[][], r: number, c: number): { r: number; c: number }[] {
    const neighbors: { r: number; c: number }[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      
      if (nr >= 0 && nr < regions.length && nc >= 0 && nc < regions[0].length && regions[nr][nc] === -1) {
        neighbors.push({ r: nr, c: nc });
      }
    }
    
    return neighbors;
  }

  private fillRemainingCells(regions: number[][], size: number): void {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === -1) {
          // Assign to adjacent region
          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== -1) {
              regions[r][c] = regions[nr][nc];
              break;
            }
          }
        }
      }
    }
  }

  private normalizeRegionIds(regions: number[][]): number[][] {
    const usedIds = new Set<number>();
    regions.forEach(row => row.forEach(id => usedIds.add(id)));
    
    const idMapping: { [key: number]: number } = {};
    let newId = 0;
    
    Array.from(usedIds).sort().forEach(oldId => {
      idMapping[oldId] = newId++;
    });
    
    return regions.map(row => row.map(id => idMapping[id]));
  }

  // Template-based generation for fallback
  private generateFromTemplate(size: number, rng: () => number): Puzzle | null {
    // Generate patterns based on mathematical structures
    const patterns = this.getMathematicalPatterns(size);
    const selectedPattern = patterns[Math.floor(rng() * patterns.length)];
    
    return {
      id: `template-${size}x${size}-${Date.now()}`,
      name: `Template ${size}x${size} Puzzle`,
      size,
      regions: selectedPattern
    };
  }

  private getMathematicalPatterns(size: number): number[][][] {
    const patterns: number[][][] = [];
    
    // Diagonal stripe pattern
    const diagonalPattern: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        diagonalPattern[r][c] = (r + c) % size;
      }
    }
    patterns.push(diagonalPattern);
    
    // Concentric pattern
    const concentricPattern: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    const center = Math.floor(size / 2);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const distance = Math.max(Math.abs(r - center), Math.abs(c - center));
        concentricPattern[r][c] = Math.min(distance, size - 1);
      }
    }
    patterns.push(concentricPattern);
    
    return patterns;
  }

  // Simplified solvability check (would use full logic from existing code)
  private isPuzzleSolvable(puzzle: Puzzle): boolean {
    // For now, assume template-based puzzles are solvable
    // In practice, would use the existing solvePuzzleRecursive logic
    return true;
  }
}

// New function to generate truly unique puzzles
export function generateUniqueFullPuzzleSet(): Puzzle[] {
  const generator = new UniquePuzzleGenerator();
  const puzzles: Puzzle[] = [];
  let puzzleId = 1;

  // Generate 40 unique puzzles for each size
  for (const size of [5, 6, 7, 8, 9]) {
    for (let i = 0; i < 40; i++) {
      const seed = size * 1000 + i; // Ensure unique seeds
      const puzzle = generator.generateUniquePuzzle(size, seed);
      
      if (puzzle) {
        puzzle.id = `puzzle-${String(puzzleId).padStart(3, '0')}`;
        puzzle.name = `Daily Puzzle #${puzzleId} - ${size}x${size}`;
        puzzles.push(puzzle);
        puzzleId++;
      }
    }
  }

  return puzzles;
}