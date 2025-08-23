import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Board, Puzzle } from '../types';
import { PUZZLES } from '../puzzles';
import { BoardView } from '../components/Board';
import { cloneBoard, createEmptyBoard, computeConflicts, countQueens, hasWon, generateRegions } from '../logic';

export default function GameScreen() {
    const navigation = useNavigation();

    // start from the first puzzle just for size/name; we'll overwrite regions
    const base = PUZZLES[0]; // or keep your daily index logic if you prefer
    const [puzzle, setPuzzle] = React.useState<Puzzle>({
        ...base,
        regions: generateRegions(base.size),
    });

    const [board, setBoard] = React.useState<Board>(() => createEmptyBoard(puzzle.size));
    
    // Timer state
    const [startTime, setStartTime] = React.useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = React.useState<number>(0);
    const [isGameWon, setIsGameWon] = React.useState<boolean>(false);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const conflicts = React.useMemo(() => computeConflicts(board, puzzle), [board, puzzle]);
    const queens = countQueens(board);
    const target = puzzle.size;

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Start timer when first queen is placed
    const startTimer = React.useCallback(() => {
        if (!startTime && !isGameWon) {
            const now = new Date();
            setStartTime(now);
            
            intervalRef.current = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - now.getTime()) / 1000));
            }, 1000);
        }
    }, [startTime, isGameWon]);

    // Stop timer
    const stopTimer = React.useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Reset timer
    const resetTimer = React.useCallback(() => {
        stopTimer();
        setStartTime(null);
        setElapsedTime(0);
        setIsGameWon(false);
    }, [stopTimer]);

    // Back button handler with confirmation if game is in progress
    const handleBackPress = () => {
        if (queens > 0 && !isGameWon) {
            Alert.alert(
                'Exit Game?',
                'You have a game in progress. Are you sure you want to exit?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Exit', 
                        style: 'destructive',
                        onPress: () => {
                            stopTimer();
                            navigation.goBack();
                        }
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    // whenever puzzle changes, reset board and timer
    React.useEffect(() => {
        setBoard(createEmptyBoard(puzzle.size));
        resetTimer();
    }, [puzzle, resetTimer]);

    // Check for win condition
    React.useEffect(() => {
        const gameWon = hasWon(board, puzzle);
        
        if (gameWon && !isGameWon) {
            setIsGameWon(true);
            stopTimer();
            const finalTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : elapsedTime;
            setTimeout(() => 
                Alert.alert(
                    'You win! 🎉', 
                    `Puzzle: ${puzzle.name ?? puzzle.id}\nTime: ${formatTime(finalTime)}`
                ), 50);
        }
    }, [board, puzzle, isGameWon, startTime, elapsedTime, stopTimer]);

    // Cleanup interval on unmount
    React.useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    function tap(r: number, c: number) {
        // Start timer on first move
        if (queens === 0 && board[r][c] !== 'queen') {
            startTimer();
        }
        
        setBoard(prev => {
            const next = cloneBoard(prev);
            next[r][c] = prev[r][c] === 'queen' ? 'empty' : 'queen';
            return next;
        });
    }

    function long(r: number, c: number) {
        // Start timer on first move
        if (queens === 0 && board[r][c] === 'empty') {
            startTimer();
        }
        
        setBoard(prev => {
            const next = cloneBoard(prev);
            if (prev[r][c] === 'dot') next[r][c] = 'empty';
            else if (prev[r][c] === 'empty') next[r][c] = 'dot';
            return next;
        });
    }

    // NEW: make an entirely new region layout (same size)
    function newRegions() {
        setPuzzle(p => ({ ...p, regions: generateRegions(p.size) }));
    }

    // Reset board and timer
    function resetGame() {
        setBoard(createEmptyBoard(puzzle.size));
        resetTimer();
    }

    return (
        <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={handleBackPress}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Kweens</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            <Text style={styles.subtitle}>One 👑 per row, column, and region. No diagonal touches.</Text>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
                <Text style={styles.timerText}>⏱️ {formatTime(elapsedTime)}</Text>
            </View>

            <View style={styles.statusRow}>
                <Text style={styles.badge}>👑 {queens}/{target}</Text>
                <Text style={[styles.badge, { backgroundColor: '#fee2e2', color: '#991b1b' }]}>
                    Conflicts {conflicts.flat().filter(Boolean).length}
                </Text>
            </View>

            <BoardView puzzle={puzzle} board={board} conflicts={conflicts} onTapCell={tap} onLongCell={long} />

            <View style={styles.buttons}>
                <Pressable style={styles.button} onPress={resetGame}>
                    <Text style={styles.buttonText}>Reset</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.primary]} onPress={newRegions}>
                    <Text style={[styles.buttonText, styles.primaryText]}>New Regions</Text>
                </Pressable>
            </View>

            <Text style={styles.hint}>Tip: Tap = place/remove 👑, Long-press = toggle dot.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f7f7fb', 
        paddingTop: 56, 
        paddingHorizontal: 16 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    backButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 80,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        width: 80, // Same width as back button for centering
    },
    title: { 
        fontSize: 28, 
        fontWeight: '800', 
        textAlign: 'center',
        color: '#1f2937',
    },
    subtitle: { 
        textAlign: 'center', 
        color: '#555', 
        marginTop: 6, 
        marginBottom: 14 
    },
    timerContainer: { 
        alignItems: 'center', 
        marginBottom: 12 
    },
    timerText: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: '#374151',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 80,
        textAlign: 'center'
    },
    statusRow: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        gap: 12, 
        marginBottom: 12 
    },
    badge: { 
        backgroundColor: '#e0e7ff', 
        color: '#3730a3', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 999, 
        fontWeight: '700' 
    },
    buttons: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        gap: 12, 
        marginTop: 16 
    },
    button: { 
        backgroundColor: '#e5e7eb', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 12 
    },
    buttonText: { 
        fontWeight: '700' 
    },
    primary: { 
        backgroundColor: '#7c3aed' 
    },
    primaryText: { 
        color: '#fff' 
    },
    hint: { 
        textAlign: 'center', 
        color: '#666', 
        marginTop: 12 
    },
});