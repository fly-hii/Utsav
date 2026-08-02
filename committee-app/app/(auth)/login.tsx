import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { CommitteeAuthService } from '../../services/api';

export default function CommitteeLoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Validation Error', 'Please enter your phone number and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await CommitteeAuthService.login(phone, password);
      if (res?.success || res?.data?.accessToken) {
        router.replace('/(main)/dashboard');
      } else {
        Alert.alert('Login Failed ❌', res?.message || 'Invalid committee officer credentials.');
      }
    } catch (err: any) {
      Alert.alert(
        'Login Failed ❌',
        err?.response?.data?.message || err?.message || 'Invalid phone number or password. Please check your committee credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={{ width: 150, height: 150, resizeMode: 'contain', alignSelf: 'center', marginBottom: 15 }} />
            <Text style={styles.title}>Committee Officer Login</Text>
            <Text style={styles.subtitle}>Enter mobile phone & password registered for your committee</Text>
          </View>

          {/* Glassmorphic Form Card */}
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Phone Number *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.festival} style={styles.btn}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Sign In to Committee Dashboard</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              New Committee? <Text style={{ color: COLORS.saffron, fontWeight: '700' }}>Register Village Committee</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  glassCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassCard,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  registerLink: { marginTop: 24, alignItems: 'center' },
  registerText: { color: COLORS.textSecondary, fontSize: 13 },
});
