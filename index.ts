import { registerRootComponent } from 'expo';

import App from './App';

console.log('Daily Arcade: Registering root component...');

// Add global error handlers
global.ErrorUtils = global.ErrorUtils || {
  setGlobalHandler: () => {},
  getGlobalHandler: () => () => {},
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

console.log('Daily Arcade: Root component registered successfully');
