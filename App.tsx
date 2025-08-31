import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto hiding - this is key for Release builds
SplashScreen.preventAutoHideAsync();

// Import navigation components safely for production builds
let NavigationContainer, createNativeStackNavigator;
let HomeScreen, GameSelectionScreen;
let KweensGame, RummyGame;
let ErrorBoundary;

try {
  const nav = require('@react-navigation/native');
  const stack = require('@react-navigation/native-stack');
  NavigationContainer = nav.NavigationContainer;
  createNativeStackNavigator = stack.createNativeStackNavigator;

  HomeScreen = require('./src/screens/HomeScreen').default;
  GameSelectionScreen = require('./src/screens/GameSelectionScreen').default;
  KweensGame = require('./src/games/kweens/App').default;
  RummyGame = require('./src/games/rummy/App').default;
  ErrorBoundary = require('./src/components/ErrorBoundary').default;
} catch (error) {
  console.error('Failed to load navigation components:', error);
}

const Stack = createNativeStackNavigator ? createNativeStackNavigator() : null;

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Daily Arcade: Preparing app...');
        
        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Daily Arcade: App prepared, components loaded:', {
          hasNavigation: !!NavigationContainer,
          hasHomeScreen: !!HomeScreen,
          hasStack: !!Stack
        });
        
      } catch (e) {
        console.warn('Daily Arcade: Error during app preparation:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (isReady) {
      try {
        console.log('Daily Arcade: Hiding splash screen');
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Daily Arcade: Error hiding splash screen:', error);
      }
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  // Fallback UI if navigation components couldn't be loaded
  if (!NavigationContainer || !HomeScreen) {
    console.warn('Daily Arcade: Navigation components not loaded, showing fallback');
    return (
      <SafeAreaView style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar style="light" backgroundColor="#1a1a2e" />
        <View style={styles.content}>
          <Text style={styles.title}>Daily Arcade</Text>
          <Text style={styles.subtitle}>Welcome to Daily Arcade</Text>
          <Text style={styles.message}>Loading games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main app with navigation
  const AppContent = () => (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#1a1a2e" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GameSelection" 
          component={GameSelectionScreen}
          options={{ 
            title: 'Select Game',
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
          }}
        />
        {KweensGame && (
          <Stack.Screen 
            name="Kweens" 
            component={KweensGame}
            options={{ 
              title: 'Kweens Puzzle',
              headerShown: false 
            }}
          />
        )}
        {RummyGame && (
          <Stack.Screen 
            name="Rummy" 
            component={RummyGame}
            options={{ 
              title: 'Indian Rummy',
              headerShown: false 
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );

  // Wrap in error boundary if available
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {ErrorBoundary ? (
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      ) : (
        <AppContent />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
  },
});