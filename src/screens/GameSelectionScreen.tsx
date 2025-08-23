import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { RootStackParamList } from '../types/navigation';
import GameCard from '../components/GameCard';

type GameSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GameSelection'>;

interface Props {
  navigation: GameSelectionNavigationProp;
}

const { width } = Dimensions.get('window');

const games = [
  {
    id: 'kweens',
    title: 'Kweens',
    subtitle: 'Logic Puzzle',
    description: 'Place queens on the board without conflicts. One queen per row, column, and region.',
    icon: '👑',
    gradient: ['#7c3aed', '#a855f7', '#c084fc'],
    difficulty: 'Medium',
    estimatedTime: '5-15 min',
    screenName: 'Kweens' as keyof RootStackParamList,
  },
  {
    id: 'rummy',
    title: 'Indian Rummy',
    subtitle: 'Card Game',
    description: 'Classic rummy with sequences and sets. Play against AI opponent.',
    icon: '🃏',
    gradient: ['#0f4c2c', '#1a5f3f', '#22c55e'],
    difficulty: 'Easy',
    estimatedTime: '10-20 min',
    screenName: 'Rummy' as keyof RootStackParamList,
  },
];

export default function GameSelectionScreen({ navigation }: Props) {
  // Force portrait orientation when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let isScreenFocused = true;
      
      const lockOrientation = async () => {
        // Add a small delay to ensure we're actually on this screen
        setTimeout(async () => {
          if (isScreenFocused) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          }
        }, 100);
      };
      
      lockOrientation();
      
      // Cleanup function when screen loses focus
      return () => {
        isScreenFocused = false;
        // Don't unlock here - let the next screen handle its own orientation
      };
    }, [])
  );

  const handleGameSelect = (screenName: keyof RootStackParamList) => {
    navigation.navigate(screenName);
  };

  const handleBackToHome = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackToHome}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Choose Your Game</Text>
            <Text style={styles.subtitle}>Select from our collection of premium games</Text>
          </View>

          {/* Games Grid */}
          <View style={styles.gamesContainer}>
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => handleGameSelect(game.screenName)}
                style={[
                  styles.gameCard,
                  { marginTop: index === 0 ? 0 : 20 }
                ]}
              />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>More games coming soon!</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  gamesContainer: {
    flex: 1,
  },
  gameCard: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});