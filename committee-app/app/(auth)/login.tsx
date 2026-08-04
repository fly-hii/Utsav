import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GRADIENTS } from '../../constants/theme';
import { CommitteeAuthService } from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';

export default function CommitteeLoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow state
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    try {
      setLoading(true);
      await CommitteeAuthService.sendOtp(phone, 'LOGIN');
      setOtpSent(true);
      startCountdown();
      Alert.alert('OTP Sent', 'Please check your SMS for the 6-digit OTP.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone) {
      Alert.alert('Validation Error', 'Please enter your phone number.');
      return;
    }

    if (loginMethod === 'PASSWORD' && !password) {
      Alert.alert('Validation Error', 'Please enter your password.');
      return;
    }

    if (loginMethod === 'OTP' && otp.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = loginMethod === 'PASSWORD' 
        ? await CommitteeAuthService.login(phone, password)
        : await CommitteeAuthService.loginWithOtp(phone, otp);

      if (res?.success || res?.data?.accessToken) {
        router.replace('/(main)/dashboard');
      } else {
        Alert.alert('Login Failed ❌', res?.message || 'Invalid committee officer credentials.');
      }
    } catch (err: any) {
      Alert.alert(
        'Login Failed ❌',
        err?.response?.data?.message || err?.message || 'Invalid credentials. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Committee Officer Login</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter mobile phone & password registered for your committee</Text>
          </View>

          <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)' }]}>
            <TouchableOpacity 
              style={[styles.tab, loginMethod === 'PASSWORD' && [styles.activeTab, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]]} 
              onPress={() => setLoginMethod('PASSWORD')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, loginMethod === 'PASSWORD' && [styles.activeTabText, { color: colors.primaryOrange }]]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, loginMethod === 'OTP' && [styles.activeTab, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]]} 
              onPress={() => setLoginMethod('OTP')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, loginMethod === 'OTP' && [styles.activeTabText, { color: colors.primaryOrange }]]}>OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Glassmorphic Form Card */}
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Phone Number *</Text>
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setOtpSent(false);
                }}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', borderColor: colors.glassBorder, color: colors.textPrimary }]}
              />
            </View>

            {loginMethod === 'PASSWORD' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Password *</Text>
                  <View style={[styles.passwordContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', borderColor: colors.glassBorder }]}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      style={[styles.passwordInput, { color: colors.textPrimary }]}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={[styles.forgotText, { color: colors.primaryOrange }]}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {otpSent && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit OTP *</Text>
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="• • • • • •"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                      style={[styles.input, styles.otpInputStyle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', borderColor: colors.glassBorder, color: colors.textPrimary }]}
                    />
                  </View>
                )}
                
                {!otpSent ? (
                  <TouchableOpacity 
                    style={[styles.btnSec, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderColor: colors.glassBorder }, loading && styles.disabled]} 
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={[styles.btnSecText, { color: colors.textPrimary }]}>Get OTP</Text>}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.resendBtn} 
                    onPress={handleSendOtp}
                    disabled={countdown > 0 || loading}
                  >
                    <Text style={[styles.resendText, { color: colors.primaryOrange }, countdown > 0 && { color: colors.textSecondary }]}>
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {(loginMethod === 'PASSWORD' || otpSent) && (
              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.btn}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.btnText, { color: '#FFF' }]}>Login to Portal</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </BlurView>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerLink}
          >
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              New Committee? <Text style={{ color: colors.saffron, fontWeight: '700' }}>Register Village Committee</Text>
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
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  glassCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
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
  btnText: { fontWeight: '700', fontSize: 14 },
  registerLink: { marginTop: 24, alignItems: 'center' },
  registerText: { fontSize: 13 },
  tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { borderWidth: 1 },
  tabText: { fontSize: 14, fontWeight: '600' },
  activeTabText: { fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  btnSec: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, marginBottom: 15 },
  btnSecText: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  otpInputStyle: { fontSize: 22, letterSpacing: 6, fontWeight: '800' },
  resendBtn: { alignItems: 'center', marginBottom: 15 },
  resendText: { fontSize: 13, fontWeight: '700' },
});
