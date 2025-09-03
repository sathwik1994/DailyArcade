import type { Puzzle } from './types';
import { UniquePuzzleGenerator } from './puzzleGenerator';

export interface HybridConfig {
  // What percentage of puzzles should be truly unique vs safe variations
  uniquePercentage: number; // 0-100
  
  // Fallback behavior when unique generation fails
  fallbackToSafe: boolean;
  
  // Maximum attempts before giving up on unique generation
  maxGenerationAttempts: number;
  
  // Enable for special events or user preferences
  enableInfiniteMode: boolean;
}

export class HybridPuzzleGenerator {
  private config: HybridConfig;
  private uniqueGenerator: UniquePuzzleGenerator;
  private safePuzzleCache: Map<string, Puzzle[]> = new Map();

  constructor(config: Partial<HybridConfig> = {}) {
    this.config = {
      uniquePercentage: 30, // 30% unique, 70% safe variations
      fallbackToSafe: true,
      maxGenerationAttempts: 100,
      enableInfiniteMode: false,
      ...config
    };
    
    this.uniqueGenerator = new UniquePuzzleGenerator();
    this.initializeSafePuzzleCache();
  }

  // Pre-generate safe puzzle variations for fast access
  private initializeSafePuzzleCache(): void {
    const safeVariations = this.generateSafeVariations();
    
    // Group by size for efficient lookup
    for (const puzzle of safeVariations) {
      const sizeKey = `${puzzle.size}x${puzzle.size}`;
      if (!this.safePuzzleCache.has(sizeKey)) {
        this.safePuzzleCache.set(sizeKey, []);
      }
      this.safePuzzleCache.get(sizeKey)!.push(puzzle);
    }
  }

  // Generate the full hybrid puzzle set
  generateHybridPuzzleSet(): Puzzle[] {
    const puzzles: Puzzle[] = [];
    const puzzlesPerSize = 40; // 40 puzzles per size (5x5 to 9x9)
    
    for (const size of [5, 6, 7, 8, 9]) {
      const uniqueCount = Math.floor(puzzlesPerSize * (this.config.uniquePercentage / 100));
      const safeCount = puzzlesPerSize - uniqueCount;
      
      console.log(`📊 Size ${size}x${size}: ${uniqueCount} unique + ${safeCount} safe puzzles`);
      
      // Generate unique puzzles first
      const uniquePuzzles = this.generateUniquePuzzlesForSize(size, uniqueCount);
      puzzles.push(...uniquePuzzles);
      
      // Fill remainder with safe variations
      const safePuzzles = this.getSafePuzzlesForSize(size, safeCount);
      puzzles.push(...safePuzzles);
    }
    
    // Shuffle to distribute unique/safe puzzles throughout the year
    return this.shuffleDeterministically(puzzles);
  }

  // Generate unique puzzles for a specific size
  private generateUniquePuzzlesForSize(size: number, count: number): Puzzle[] {
    const puzzles: Puzzle[] = [];
    let puzzleId = this.getNextPuzzleId();
    
    for (let i = 0; i < count; i++) {
      const seed = size * 10000 + i * 7 + Date.now() % 1000;
      
      let puzzle: Puzzle | null = null;
      
      if (this.config.enableInfiniteMode) {
        // Try to generate truly unique puzzle
        puzzle = this.uniqueGenerator.generateUniquePuzzle(size, seed);
      }
      
      if (!puzzle && this.config.fallbackToSafe) {
        // Fallback to safe variation
        puzzle = this.createAdvancedSafeVariation(size, seed);
      }
      
      if (puzzle) {
        puzzle.id = `puzzle-${String(puzzleId).padStart(3, '0')}`;
        puzzle.name = `Daily Puzzle #${puzzleId} - ${size}x${size}`;
        puzzles.push(puzzle);
        puzzleId++;
      }
    }
    
    return puzzles;
  }

  // Get safe puzzle variations for a size
  private getSafePuzzlesForSize(size: number, count: number): Puzzle[] {
    const sizeKey = `${size}x${size}`;
    const availableSafe = this.safePuzzleCache.get(sizeKey) || [];
    const puzzles: Puzzle[] = [];
    let puzzleId = this.getNextPuzzleId();
    
    for (let i = 0; i < count; i++) {
      const basePuzzle = availableSafe[i % availableSafe.length];
      const variation = this.createDeepVariation(basePuzzle, i);
      
      variation.id = `puzzle-${String(puzzleId).padStart(3, '0')}`;
      variation.name = `Daily Puzzle #${puzzleId} - ${size}x${size}`;
      puzzles.push(variation);
      puzzleId++;
    }
    
    return puzzles;
  }

  // Create advanced variations that feel more unique
  private createAdvancedSafeVariation(size: number, seed: number): Puzzle | null {
    const basePuzzles = this.getBasePuzzlesForSize(size);
    if (basePuzzles.length === 0) return null;
    
    const rng = this.createSeededRNG(seed);
    const basePuzzle = basePuzzles[Math.floor(rng() * basePuzzles.length)];
    
    // Apply multiple transformations for more variation
    let regions = basePuzzle.regions.map(row => [...row]);
    
    // Random combination of transformations
    const transformations = Math.floor(rng() * 8) + 1;
    
    for (let i = 0; i < transformations; i++) {
      const transform = Math.floor(rng() * 6);
      
      switch (transform) {
        case 0: // Horizontal flip
          regions = regions.map(row => row.slice().reverse());
          break;
        case 1: // Vertical flip
          regions = regions.slice().reverse();
          break;
        case 2: // Rotate 90 degrees (for smaller sizes)
          if (size <= 7) {
            const newRegions = Array(size).fill(0).map(() => Array(size).fill(0));
            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                newRegions[c][size - 1 - r] = regions[r][c];
              }
            }
            regions = newRegions;
          }
          break;
        case 3: // Transpose
          if (size <= 6) {
            const newRegions = Array(size).fill(0).map(() => Array(size).fill(0));
            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                newRegions[c][r] = regions[r][c];
              }
            }
            regions = newRegions;
          }
          break;
        case 4: // Region ID shuffling
          regions = this.shuffleRegionIds(regions, rng);
          break;
        case 5: // Shift pattern
          regions = this.shiftPattern(regions, Math.floor(rng() * size));
          break;
      }
    }
    
    return {
      id: `advanced-${size}x${size}-${seed}`,
      name: `Advanced ${size}x${size} Puzzle`,
      size,
      regions
    };
  }

  // More sophisticated variation creation
  private createDeepVariation(basePuzzle: Puzzle, variationIndex: number): Puzzle {
    const regions = JSON.parse(JSON.stringify(basePuzzle.regions));
    
    // Apply variation based on index for deterministic but varied results
    const variationType = variationIndex % 12;
    
    switch (variationType) {
      case 0: return { ...basePuzzle, regions }; // Original
      case 1: return { ...basePuzzle, regions: regions.map((row: number[]) => row.slice().reverse()) };
      case 2: return { ...basePuzzle, regions: regions.slice().reverse() };
      case 3: return { ...basePuzzle, regions: this.rotateRegions(regions, 90) };
      case 4: return { ...basePuzzle, regions: this.rotateRegions(regions, 180) };
      case 5: return { ...basePuzzle, regions: this.rotateRegions(regions, 270) };
      case 6: return { ...basePuzzle, regions: this.transposeRegions(regions) };
      case 7: return { ...basePuzzle, regions: this.shuffleRegionIds(regions, this.createSeededRNG(variationIndex)) };
      case 8: return { ...basePuzzle, regions: this.shiftPattern(regions, 1) };
      case 9: return { ...basePuzzle, regions: this.shiftPattern(regions, 2) };
      case 10: return { ...basePuzzle, regions: this.combineTransforms(regions, [1, 2]) }; // H+V flip
      case 11: return { ...basePuzzle, regions: this.combineTransforms(regions, [1, 6]) }; // H flip + transpose
      default: return { ...basePuzzle, regions };
    }
  }

  // Utility functions for transformations
  private rotateRegions(regions: number[][], degrees: number): number[][] {
    const size = regions.length;
    if (size > 7 || degrees % 90 !== 0) return regions; // Safety check
    
    let result = regions;
    const times = (degrees / 90) % 4;
    
    for (let i = 0; i < times; i++) {
      const newRegions = Array(size).fill(0).map(() => Array(size).fill(0));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          newRegions[c][size - 1 - r] = result[r][c];
        }
      }
      result = newRegions;
    }
    
    return result;
  }

  private transposeRegions(regions: number[][]): number[][] {
    const size = regions.length;
    const result = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[c][r] = regions[r][c];
      }
    }
    
    return result;
  }

  private shuffleRegionIds(regions: number[][], rng: () => number): number[][] {
    const uniqueIds = Array.from(new Set(regions.flat()));
    const shuffledIds = [...uniqueIds];
    
    // Fisher-Yates shuffle with seeded RNG
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }
    
    const idMapping: { [key: number]: number } = {};
    uniqueIds.forEach((oldId, index) => {
      idMapping[oldId] = shuffledIds[index];
    });
    
    return regions.map(row => row.map(id => idMapping[id]));
  }

  private shiftPattern(regions: number[][], shift: number): number[][] {
    return regions.map(row => {
      const shiftedRow = [...row];
      for (let i = 0; i < shift; i++) {
        shiftedRow.unshift(shiftedRow.pop()!);
      }
      return shiftedRow;
    });
  }

  private combineTransforms(regions: number[][], transforms: number[]): number[][] {
    let result = regions;
    
    for (const transform of transforms) {
      switch (transform) {
        case 1: // Horizontal flip
          result = result.map(row => row.slice().reverse());
          break;
        case 2: // Vertical flip
          result = result.slice().reverse();
          break;
        case 6: // Transpose
          result = this.transposeRegions(result);
          break;
      }
    }
    
    return result;
  }

  // Generate safe variations (fallback puzzles)
  private generateSafeVariations(): Puzzle[] {
    const variations: Puzzle[] = [];
    const allBasePuzzles = this.getAllBasePuzzles();
    
    for (const basePuzzle of allBasePuzzles) {
      // Create 8 variations per base puzzle
      for (let i = 0; i < 8; i++) {
        const variation = this.createDeepVariation(basePuzzle, i);
        variations.push(variation);
      }
    }
    
    return variations;
  }

  // Get base puzzles for a specific size (avoiding circular dependency)
  private getBasePuzzlesForSize(size: number): Puzzle[] {
    return this.getAllBasePuzzles().filter(p => p.size === size);
  }

  // Define base puzzles directly to avoid circular imports
  private getAllBasePuzzles(): Puzzle[] {
    return [
      // Simplified set of base puzzles to avoid circular dependency
      {
        id: 'base-5x5-1',
        name: 'Base 5x5 Pattern 1',
        size: 5,
        regions: [
          [0, 1, 1, 2, 2],
          [0, 0, 1, 2, 3],
          [4, 0, 1, 3, 3],
          [4, 4, 1, 3, 3],
          [4, 4, 4, 3, 3],
        ]
      },
      {
        id: 'base-6x6-1',
        name: 'Base 6x6 Pattern 1',
        size: 6,
        regions: [
          [0, 1, 1, 2, 2, 3],
          [0, 0, 1, 2, 4, 3],
          [5, 0, 4, 4, 4, 3],
          [5, 5, 5, 4, 2, 2],
          [5, 1, 1, 1, 2, 3],
          [0, 0, 4, 4, 3, 3],
        ]
      },
      {
        id: 'base-7x7-1',
        name: 'Base 7x7 Pattern 1',
        size: 7,
        regions: [
          [0, 1, 2, 3, 4, 5, 6],
          [2, 3, 4, 5, 6, 0, 1],
          [4, 5, 6, 0, 1, 2, 3],
          [6, 0, 1, 2, 3, 4, 5],
          [1, 2, 3, 4, 5, 6, 0],
          [3, 4, 5, 6, 0, 1, 2],
          [5, 6, 0, 1, 2, 3, 4],
        ]
      },
      {
        id: 'base-8x8-1',
        name: 'Base 8x8 Pattern 1',
        size: 8,
        regions: [
          [0, 1, 2, 3, 4, 5, 6, 7],
          [2, 3, 4, 5, 6, 7, 0, 1],
          [4, 5, 6, 7, 0, 1, 2, 3],
          [6, 7, 0, 1, 2, 3, 4, 5],
          [1, 2, 3, 4, 5, 6, 7, 0],
          [3, 4, 5, 6, 7, 0, 1, 2],
          [5, 6, 7, 0, 1, 2, 3, 4],
          [7, 0, 1, 2, 3, 4, 5, 6],
        ]
      },
      {
        id: 'base-9x9-1',
        name: 'Base 9x9 Pattern 1',
        size: 9,
        regions: [
          [0, 1, 2, 3, 4, 5, 6, 7, 8],
          [2, 3, 4, 5, 6, 7, 8, 0, 1],
          [4, 5, 6, 7, 8, 0, 1, 2, 3],
          [6, 7, 8, 0, 1, 2, 3, 4, 5],
          [8, 0, 1, 2, 3, 4, 5, 6, 7],
          [1, 2, 3, 4, 5, 6, 7, 8, 0],
          [3, 4, 5, 6, 7, 8, 0, 1, 2],
          [5, 6, 7, 8, 0, 1, 2, 3, 4],
          [7, 8, 0, 1, 2, 3, 4, 5, 6],
        ]
      }
    ];
  }

  private shuffleDeterministically(puzzles: Puzzle[]): Puzzle[] {
    const shuffled = [...puzzles];
    const rng = this.createSeededRNG(12345); // Fixed seed for consistent shuffling
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  private createSeededRNG(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }

  private getNextPuzzleId(): number {
    // Simple counter - in real implementation might be more sophisticated
    return Math.floor(Math.random() * 1000) + 1;
  }

  // Public method to change configuration
  updateConfig(newConfig: Partial<HybridConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): HybridConfig {
    return { ...this.config };
  }
}

// Export convenience functions
export function createHybridPuzzleGenerator(mode: 'conservative' | 'balanced' | 'innovative' = 'balanced'): HybridPuzzleGenerator {
  const configs = {
    conservative: {
      uniquePercentage: 10,   // 10% unique, 90% safe
      fallbackToSafe: true,
      maxGenerationAttempts: 50,
      enableInfiniteMode: false
    },
    balanced: {
      uniquePercentage: 30,   // 30% unique, 70% safe  
      fallbackToSafe: true,
      maxGenerationAttempts: 100,
      enableInfiniteMode: false
    },
    innovative: {
      uniquePercentage: 60,   // 60% unique, 40% safe
      fallbackToSafe: true,
      maxGenerationAttempts: 200,
      enableInfiniteMode: true
    }
  };
  
  return new HybridPuzzleGenerator(configs[mode]);
}