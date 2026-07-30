import { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/theme';

import { initializeAuth } from '../services/api';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const isLoggedIn = await initializeAuth();
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace('/(main)/dashboard');
        } else {
          router.replace('/(auth)/login');
        }
      }, 2000);
    };
    init();
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/icon.png')} 
          style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 20 }} 
        />

        <Text style={styles.subtitle}>
          Village Festival Management App
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primaryOrange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
});
