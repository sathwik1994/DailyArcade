import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import GameSelectionScreen from './src/screens/GameSelectionScreen';

// Games
import KweensGame from './src/games/kweens/App';
import RummyGame from './src/games/rummy/App';

// Types
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
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
        <Stack.Screen 
          name="Kweens" 
          component={KweensGame}
          options={{ 
            title: 'Kweens Puzzle',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="Rummy" 
          component={RummyGame}
          options={{ 
            title: 'Indian Rummy',
            headerShown: false 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}