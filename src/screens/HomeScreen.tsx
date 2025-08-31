import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const handlePlayGames = () => {
    navigation.navigate('GameSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Daily Arcade</Text>
            <Text style={styles.subtitle}>Premium Mobile Gaming Experience</Text>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.arcadeBox}>
              <Text style={styles.arcadeText}>🎮</Text>
              <Text style={styles.arcadeTitle}>Your Gaming Hub</Text>
              <Text style={styles.arcadeDescription}>
                Two carefully crafted games in one beautiful package
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.playButton} 
              onPress={handlePlayGames}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ee5a52', '#ff4757']}
                style={styles.playButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.playButtonText}>Start Playing</Text>
                <Text style={styles.playButtonIcon}>▶</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Choose your adventure</Text>
            <View style={styles.gameIndicators}>
              <View style={[styles.indicator, { backgroundColor: '#7c3aed' }]} />
              <View style={[styles.indicator, { backgroundColor: '#0f4c2c' }]} />
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '300',
    letterSpacing: 1,
  },
  mainContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  arcadeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  arcadeText: {
    fontSize: 60,
    marginBottom: 20,
  },
  arcadeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  arcadeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  playButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 25,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  playButtonIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 15,
  },
  gameIndicators: {
    flexDirection: 'row',
    gap: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});