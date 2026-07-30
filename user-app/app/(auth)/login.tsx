import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/api';
import { COLORS, GRADIENTS } from '../../constants/theme';

export default function UserLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Validation Error', 'Please enter your mobile phone number and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await AuthService.login(phone, password);
      if (res?.success || res?.data?.accessToken) {
        router.replace('/(main)/home');
      } else {
        Alert.alert('Login Failed ❌', res?.message || 'Invalid credentials. Please check your phone and password.');
      }
    } catch (err: any) {
      Alert.alert(
        'Login Failed ❌',
        err?.response?.data?.message || err?.message || 'Invalid phone number or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 },
        ]}
      >
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={{ width: 150, height: 150, resizeMode: 'contain', alignSelf: 'center', marginBottom: 15 }} />
          <Text style={styles.title}>Welcome to Utsav</Text>
          <Text style={styles.subtitle}>Enter mobile credentials to log in and explore village festivals</Text>
        </View>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.group}>
            <Text style={styles.label}>Mobile Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity onPress={handleUserLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.festival} style={styles.btn}>
              {loading ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <Text style={styles.btnText}>Sign In & Explore Festivals</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.regLink}>
            <Text style={styles.regText}>New to Utsav? <Text style={{ color: COLORS.primaryOrange, fontWeight: '800' }}>Create Account</Text></Text>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 50, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.gold, marginBottom: 8 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  card: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  group: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  btnText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  regLink: { marginTop: 24, alignItems: 'center' },
  regText: { color: COLORS.textSecondary, fontSize: 13 },
});
