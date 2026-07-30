import { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { initializeAuth } from '../services/api';
import { COLORS, GRADIENTS } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const isLoggedIn = await initializeAuth();
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace('/(main)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }, 2000);
    };
    init();
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <Image 
        source={require('../assets/icon.png')} 
        style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 20 }} 
      />

      <Text style={styles.subtitle}>
        Discover Village Festivals & Connect
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.glassCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 36, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1.5 },
  subtitle: { fontSize: 14, color: COLORS.gold, marginTop: 8, fontWeight: '500' },
});
