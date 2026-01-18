import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DemoModeProvider } from './src/context/DemoModeContext';
import { LocationProvider } from './src/context/LocationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LocationProvider>
        <DemoModeProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </DemoModeProvider>
      </LocationProvider>
    </SafeAreaProvider>
  );
}
