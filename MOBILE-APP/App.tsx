import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { apiService } from './src/services/apiService';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-url-polyfill/auto';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Navigation
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';

// Hooks
import { useAuth } from './src/contexts/AuthContext';

// Theme
import { theme } from './src/theme/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Stack = createStackNavigator();

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null; // Splash screen is still visible
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  // In development, override baseURL to point to local backend for emulators/devices
  if (__DEV__) {
    try {
      if (Platform.OS === 'android') {
        apiService.setBaseURL('http://10.0.2.2:8080/api');
      } else {
        apiService.setBaseURL('http://localhost:8080/api');
      }
    } catch (e) {
      console.debug('Failed to set dev baseURL', e);
    }
  }
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
            <StatusBar style="auto" />
          </NotificationProvider>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}