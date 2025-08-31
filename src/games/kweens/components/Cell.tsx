import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import type { CellState } from '../types';

export type CellProps = {
  size: number; // pixel side length
  state: CellState;
  regionColor: string;
  conflicted?: boolean;
  onTap: () => void;
  onLongPress: () => void;
};

export const Cell: React.FC<CellProps> = ({ size, state, regionColor, conflicted, onTap, onLongPress }) => {
  return (
    <Pressable onPress={onTap} onLongPress={onLongPress} style={[styles.cell, { width: size, height: size, backgroundColor: regionColor, borderColor: conflicted ? '#ef4444' : '#666666' }]}>
      {state === 'queen' && (
        <Text style={[styles.queen, conflicted && { color: '#ef4444' }]}>👑</Text>
      )}
      {state === 'dot' && <View style={styles.dot} />}
      {state === 'forbidden' && (
        <Text style={styles.forbidden}>✕</Text>
      )}
      {state === 'x' && (
        <Text style={styles.userX}>✕</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queen: { 
    fontSize: 22, 
    fontWeight: 'normal',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#111' },
  forbidden: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
  userX: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
});