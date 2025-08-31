import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Board, Puzzle } from '../types';
import { Cell } from './Cell';

// Custom color palette
const COLORS = [
  '#C1A4D2', // Light Purple
  '#F9C785', // Light Orange
  '#F26A5E', // Coral Red
  '#B0DB8D', // Light Green
  '#F2F29B', // Light Yellow
  '#D9D9D9', // Light Gray
  '#E7A2C4', // Light Pink
  '#C2B09F', // Light Brown
  '#A5C8F0', // Light Blue
];

export const BoardView: React.FC<{
  puzzle: Puzzle;
  board: Board;
  conflicts: boolean[][];
  onTapCell: (r: number, c: number) => void;
  onLongCell: (r: number, c: number) => void;
}> = ({ puzzle, board, conflicts, onTapCell, onLongCell }) => {
  const n = puzzle.size;
  const cellSide = Math.floor(Math.min(360, 320) / n) + 6;

  // Create a normalized region mapping to ensure consistent coloring
  const regionColorMap = React.useMemo(() => {
    const uniqueRegions = new Set<number>();
    
    // Collect all unique region IDs
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        uniqueRegions.add(puzzle.regions[r][c]);
      }
    }
    
    // Sort regions and map them to consecutive indices
    const sortedRegions = Array.from(uniqueRegions).sort((a, b) => a - b);
    const colorMap = new Map<number, string>();
    
    // Ensure we have exactly n unique colors for n regions
    if (sortedRegions.length !== n) {
      console.warn(`Expected ${n} regions but found ${sortedRegions.length}:`, sortedRegions);
    }
    
    sortedRegions.forEach((regionId, index) => {
      // Ensure we always have a color by using modulo with extended color array
      const colorIndex = index % COLORS.length;
      colorMap.set(regionId, COLORS[colorIndex]);
      
      // Debug logging to track color assignments
      if (__DEV__) {
        console.log(`Region ${regionId} -> Color[${colorIndex}] = ${COLORS[colorIndex]}`);
      }
    });
    
    // Ensure we have exactly n colors mapped
    console.log(`Color mapping created: ${colorMap.size} regions mapped to colors`);
    
    return colorMap;
  }, [puzzle.regions, n]);

  const getRegionColor = (regionId: number): string => {
    return regionColorMap.get(regionId) || COLORS[0]; // Fallback to first color
  };

  return (
    <View style={styles.wrap}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((_, c) => (
            <Cell
              key={`${r}-${c}`}
              size={cellSide}
              state={board[r][c]}
              conflicted={conflicts[r][c]}
              regionColor={getRegionColor(puzzle.regions[r][c])}
              onTap={() => onTapCell(r, c)}
              onLongPress={() => onLongCell(r, c)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { 
    alignSelf: 'center', 
    padding: 8, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 6 } 
  },
  row: { flexDirection: 'row' },
});