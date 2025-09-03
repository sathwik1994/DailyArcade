import type { Puzzle } from './types';

export class ConnectivityValidator {
  
  // Check if all regions in a puzzle are properly connected
  static validateConnectivity(puzzle: Puzzle): boolean {
    const { size, regions } = puzzle;
    
    // Get all unique region IDs
    const regionIds = new Set<number>();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        regionIds.add(regions[r][c]);
      }
    }
    
    // Check connectivity for each region
    for (const regionId of regionIds) {
      if (!this.isRegionConnected(regions, regionId, size)) {
        console.warn(`❌ Region ${regionId} is not connected in puzzle ${puzzle.id}`);
        return false;
      }
    }
    
    return true;
  }
  
  // Check if a specific region is connected using flood fill
  private static isRegionConnected(regions: number[][], regionId: number, size: number): boolean {
    // Find all cells belonging to this region
    const regionCells: { r: number; c: number }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === regionId) {
          regionCells.push({ r, c });
        }
      }
    }
    
    if (regionCells.length === 0) return true; // Empty region is technically connected
    if (regionCells.length === 1) return true; // Single cell is connected
    
    // Use flood fill from first cell to see if we can reach all cells
    const visited = Array(size).fill(0).map(() => Array(size).fill(false));
    const queue: { r: number; c: number }[] = [regionCells[0]];
    visited[regionCells[0].r][regionCells[0].c] = true;
    
    let visitedCount = 1;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
      const { r, c } = queue.shift()!;
      
      for (const [dr, dc] of directions) {
        const newR = r + dr;
        const newC = c + dc;
        
        if (newR >= 0 && newR < size && 
            newC >= 0 && newC < size && 
            !visited[newR][newC] && 
            regions[newR][newC] === regionId) {
          
          visited[newR][newC] = true;
          queue.push({ r: newR, c: newC });
          visitedCount++;
        }
      }
    }
    
    return visitedCount === regionCells.length;
  }
  
  // Fix disconnected regions by connecting them
  static fixConnectivity(puzzle: Puzzle): Puzzle {
    const { size, regions } = puzzle;
    const fixedRegions = regions.map(row => [...row]);
    
    // Get all unique region IDs
    const regionIds = new Set<number>();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        regionIds.add(fixedRegions[r][c]);
      }
    }
    
    for (const regionId of regionIds) {
      if (!this.isRegionConnected(fixedRegions, regionId, size)) {
        console.log(`🔧 Fixing disconnected region ${regionId}`);
        this.connectRegion(fixedRegions, regionId, size);
      }
    }
    
    return {
      ...puzzle,
      regions: fixedRegions
    };
  }
  
  // Connect a disconnected region by finding shortest paths between components
  private static connectRegion(regions: number[][], regionId: number, size: number): void {
    // Find all cells belonging to this region
    const regionCells: { r: number; c: number }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === regionId) {
          regionCells.push({ r, c });
        }
      }
    }
    
    if (regionCells.length <= 1) return;
    
    // Find connected components
    const visited = Array(size).fill(0).map(() => Array(size).fill(false));
    const components: { r: number; c: number }[][] = [];
    
    for (const cell of regionCells) {
      if (!visited[cell.r][cell.c]) {
        const component = this.getConnectedComponent(regions, cell, regionId, size, visited);
        components.push(component);
      }
    }
    
    // If we have multiple components, connect them
    if (components.length > 1) {
      for (let i = 1; i < components.length; i++) {
        this.connectComponents(regions, components[0], components[i], regionId, size);
      }
    }
  }
  
  private static getConnectedComponent(
    regions: number[][], 
    start: { r: number; c: number }, 
    regionId: number, 
    size: number,
    visited: boolean[][]
  ): { r: number; c: number }[] {
    const component: { r: number; c: number }[] = [];
    const queue = [start];
    visited[start.r][start.c] = true;
    
    while (queue.length > 0) {
      const { r, c } = queue.shift()!;
      component.push({ r, c });
      
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        const newR = r + dr;
        const newC = c + dc;
        
        if (newR >= 0 && newR < size && 
            newC >= 0 && newC < size && 
            !visited[newR][newC] && 
            regions[newR][newC] === regionId) {
          
          visited[newR][newC] = true;
          queue.push({ r: newR, c: newC });
        }
      }
    }
    
    return component;
  }
  
  private static connectComponents(
    regions: number[][],
    component1: { r: number; c: number }[],
    component2: { r: number; c: number }[],
    regionId: number,
    size: number
  ): void {
    // Find the closest pair of cells between components
    let minDistance = Infinity;
    let bestPath: { r: number; c: number }[] = [];
    
    for (const cell1 of component1) {
      for (const cell2 of component2) {
        const path = this.findShortestPath(regions, cell1, cell2, size);
        if (path.length < minDistance) {
          minDistance = path.length;
          bestPath = path;
        }
      }
    }
    
    // Connect along the shortest path
    for (const cell of bestPath) {
      regions[cell.r][cell.c] = regionId;
    }
  }
  
  private static findShortestPath(
    regions: number[][],
    start: { r: number; c: number },
    end: { r: number; c: number },
    size: number
  ): { r: number; c: number }[] {
    // Simple Manhattan distance path (could be improved with A*)
    const path: { r: number; c: number }[] = [];
    let current = { ...start };
    
    // Move horizontally first
    while (current.c !== end.c) {
      current.c += current.c < end.c ? 1 : -1;
      path.push({ ...current });
    }
    
    // Then move vertically
    while (current.r !== end.r) {
      current.r += current.r < end.r ? 1 : -1;
      path.push({ ...current });
    }
    
    return path;
  }
  
  // Generate a report of connectivity issues in a puzzle set
  static validatePuzzleSet(puzzles: Puzzle[]): {
    totalPuzzles: number;
    connectedPuzzles: number;
    disconnectedPuzzles: number;
    issues: Array<{ puzzleId: string; disconnectedRegions: number[] }>;
  } {
    const issues: Array<{ puzzleId: string; disconnectedRegions: number[] }> = [];
    let connectedCount = 0;
    
    for (const puzzle of puzzles) {
      const disconnectedRegions: number[] = [];
      const regionIds = new Set<number>();
      
      // Get all region IDs
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          regionIds.add(puzzle.regions[r][c]);
        }
      }
      
      // Check each region
      for (const regionId of regionIds) {
        if (!this.isRegionConnected(puzzle.regions, regionId, puzzle.size)) {
          disconnectedRegions.push(regionId);
        }
      }
      
      if (disconnectedRegions.length === 0) {
        connectedCount++;
      } else {
        issues.push({
          puzzleId: puzzle.id,
          disconnectedRegions
        });
      }
    }
    
    return {
      totalPuzzles: puzzles.length,
      connectedPuzzles: connectedCount,
      disconnectedPuzzles: puzzles.length - connectedCount,
      issues
    };
  }
}