import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Board, Puzzle } from '../types';
import { PUZZLES } from '../puzzles';
import { BoardView } from '../components/Board';
import { cloneBoard, createEmptyBoard, computeConflicts, countQueens, hasWon, generateRegions, calculateForbiddenPositions } from '../logic';

// Get daily puzzle based on current date
function getDailyPuzzle(): Puzzle {
    try {
        // Simple approach using local date
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();
        
        // Create a simple seed based on date
        const seed = year * 10000 + month * 100 + day;
        
        // Generate random puzzle size from 5x5 to 9x9
        const minSize = 5;
        const maxSize = 9;
        const sizeRange = maxSize - minSize + 1; // 5 sizes total (5,6,7,8,9)
        
        // Use seed to determine puzzle size consistently
        const sizeIndex = Math.abs(seed) % sizeRange;
        const puzzleSize = minSize + sizeIndex;
        
        return {
            id: `daily-${year}-${month}-${day}`,
            name: `Daily ${month + 1}/${day}/${year} - ${puzzleSize}x${puzzleSize}`,
            size: puzzleSize,
            regions: generateRegions(puzzleSize, seed)
        };
    } catch (error) {
        console.error('Error generating daily puzzle:', error);
        // Ultimate fallback - use 6x6 as safe middle size
        return {
            id: 'error-fallback',
            name: 'Daily Puzzle - 6x6',
            size: 6,
            regions: generateRegions(6, 12345)
        };
    }
}

// Get next midnight local time (simplified)
function getNextMidnightCentral(): Date {
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    } catch (error) {
        console.error('Error calculating next midnight:', error);
        // Fallback: 24 hours from now
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
}

export default function GameScreen() {
    const navigation = useNavigation();

    const [puzzle] = React.useState<Puzzle>(() => getDailyPuzzle());
    const [board, setBoard] = React.useState<Board>(() => createEmptyBoard(puzzle.size));
    
    // Timer state for game play
    const [startTime, setStartTime] = React.useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = React.useState<number>(0);
    const [isGameWon, setIsGameWon] = React.useState<boolean>(false);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
    
    // Daily countdown timer state
    const [timeUntilNext, setTimeUntilNext] = React.useState<string>('');
    const dailyTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const conflicts = React.useMemo(() => computeConflicts(board, puzzle), [board, puzzle]);
    const boardWithForbidden = React.useMemo(() => calculateForbiddenPositions(board, puzzle), [board, puzzle]);
    const queens = countQueens(board);
    const target = puzzle.size;

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Format countdown time as HH:MM:SS
    const formatCountdown = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Update countdown timer
    const updateCountdown = React.useCallback(() => {
        try {
            const nextMidnight = getNextMidnightCentral();
            const now = new Date();
            const timeLeft = nextMidnight.getTime() - now.getTime();
            
            if (timeLeft <= 0) {
                setTimeUntilNext('00:00:00');
            } else {
                setTimeUntilNext(formatCountdown(timeLeft));
            }
        } catch (error) {
            console.error('Error updating countdown:', error);
            setTimeUntilNext('--:--:--');
        }
    }, []);

    // Start daily countdown timer
    React.useEffect(() => {
        updateCountdown(); // Initial update
        
        dailyTimerRef.current = setInterval(() => {
            updateCountdown();
        }, 1000);

        return () => {
            if (dailyTimerRef.current) {
                clearInterval(dailyTimerRef.current);
            }
        };
    }, [updateCountdown]);

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

    // Initialize board only when component mounts (puzzle won't change now)
    React.useEffect(() => {
        setBoard(createEmptyBoard(puzzle.size));
        // Don't reset timer here - let it continue from previous state
    }, []); // Removed puzzle dependency since it's now static daily puzzle

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

    // Cleanup intervals on unmount
    React.useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (dailyTimerRef.current) {
                clearInterval(dailyTimerRef.current);
            }
        };
    }, []);

    function tap(r: number, c: number) {
        // Don't allow tapping on auto-generated forbidden cells, but allow tapping on user X marks
        const currentState = boardWithForbidden[r][c];
        if (currentState === 'forbidden') {
            return; // Do nothing for auto-generated forbidden cells
        }
        
        // Start timer on first move
        if (queens === 0 && board[r][c] === 'empty') {
            startTimer();
        }
        
        setBoard(prev => {
            const next = cloneBoard(prev);
            const currentCell = prev[r][c];
            
            // Cycle through states: empty → x → queen → empty
            if (currentCell === 'empty') {
                next[r][c] = 'x';
            } else if (currentCell === 'x') {
                next[r][c] = 'queen';
            } else if (currentCell === 'queen') {
                next[r][c] = 'empty';
            } else {
                // For any other state, go to empty
                next[r][c] = 'empty';
            }
            
            return next;
        });
    }

    function long(r: number, c: number) {
        // Don't allow long press on forbidden cells
        const currentState = boardWithForbidden[r][c];
        if (currentState === 'forbidden') {
            return; // Do nothing for forbidden cells
        }
        
        // Start timer on first move
        if (queens === 0 && board[r][c] === 'empty') {
            startTimer();
        }
        
        setBoard(prev => {
            const next = cloneBoard(prev);
            // Long press toggles dot (for backward compatibility)
            if (prev[r][c] === 'dot') {
                next[r][c] = 'empty';
            } else if (prev[r][c] === 'empty') {
                next[r][c] = 'dot';
            }
            return next;
        });
    }

    // Reset only the game board, keep both timers running
    function resetGame() {
        setBoard(createEmptyBoard(puzzle.size));
        // Don't reset any timers - let the game play timer continue
        // This way users can see total time spent across multiple attempts
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
            
            {/* Daily Puzzle Info */}
            <View style={styles.dailyInfo}>
                <Text style={styles.dailyTitle}>🗓️ {puzzle.name}</Text>
                <Text style={styles.nextGameText}>Next game: {timeUntilNext}</Text>
            </View>

            {/* Game Timer Display */}
            <View style={styles.timerContainer}>
                <Text style={styles.timerText}>⏱️ {formatTime(elapsedTime)}</Text>
            </View>

            <View style={styles.statusRow}>
                <Text style={styles.badge}>👑 {queens}/{target}</Text>
                <Text style={[styles.badge, { backgroundColor: '#fee2e2', color: '#991b1b' }]}>
                    Conflicts {conflicts.flat().filter(Boolean).length}
                </Text>
            </View>

            <BoardView puzzle={puzzle} board={boardWithForbidden} conflicts={conflicts} onTapCell={tap} onLongCell={long} />

            {/* How to Play Section */}
            <View style={styles.howToPlayContainer}>
                <Text style={styles.howToPlayTitle}>How to play</Text>
                <Text style={styles.howToPlayText}>
                    Your goal is to have exactly one 👑 in each row, column, and color region.
                </Text>
                <Text style={styles.howToPlayText}>
                    Tap once to place X and tap twice for 👑.
                </Text>
                <Text style={styles.howToPlayText}>
                    Use X to mark where 👑 cannot be placed.
                </Text>
                <Text style={styles.howToPlayText}>
                    Two 👑 cannot touch each other, not even diagonally.
                </Text>
            </View>

            <View style={styles.buttons}>
                <Pressable style={styles.button} onPress={resetGame}>
                    <Text style={styles.buttonText}>Reset</Text>
                </Pressable>
            </View>

            <Text style={styles.hint}>Tip: Tap = cycle through ✕ → 👑 → empty, Long-press = toggle dot.</Text>
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
    dailyInfo: {
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    dailyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#7c3aed',
        marginBottom: 4,
        textAlign: 'center',
    },
    nextGameText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
        textAlign: 'center',
    },
    howToPlayContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignSelf: 'center',
        width: '100%',
        maxWidth: 380,
    },
    howToPlayTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    howToPlayText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 8,
        textAlign: 'left',
    },
});