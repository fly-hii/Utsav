import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/api';
import { GRADIENTS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function UserLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
      await AuthService.sendOtp(phone, 'LOGIN');
      setOtpSent(true);
      startCountdown();
      Alert.alert('OTP Sent', 'Please check your SMS for the 6-digit OTP.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async () => {
    if (!phone) {
      Alert.alert('Validation Error', 'Please enter your mobile phone number.');
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
        ? await AuthService.login(phone, password)
        : await AuthService.loginWithOtp(phone, otp);

      if (res?.success || res?.data?.accessToken) {
        router.replace('/(main)/home');
      } else {
        Alert.alert('Login Failed ❌', res?.message || 'Invalid credentials.');
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 },
        ]}
      >
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={{ width: 150, height: 150, resizeMode: 'contain', alignSelf: 'center', marginBottom: 15 }} />
          <Text style={[styles.title, { color: colors.gold }]}>Welcome to Utsav</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter mobile credentials to log in and explore village festivals</Text>
        </View>

        <View style={styles.tabContainer}>
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

          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Phone Number *</Text>
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setOtpSent(false); // Reset OTP if phone changes
                }}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
              />
            </View>

            {loginMethod === 'PASSWORD' ? (
              <>
                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Password *</Text>
                  <View style={[styles.passwordContainer, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      style={[styles.input, { flex: 1, borderWidth: 0, padding: 0, backgroundColor: 'transparent', color: colors.textPrimary }]}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                      <Text style={{ color: colors.textSecondary }}>{showPassword ? 'Hide' : 'View'}</Text>
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
                  <View style={styles.group}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit OTP *</Text>
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="• • • • • •"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                      style={[styles.input, styles.otpInputStyle, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                    />
                  </View>
                )}
                
                {!otpSent ? (
                  <TouchableOpacity 
                    style={[styles.btnSec, { borderColor: colors.glassBorder }, loading && styles.disabled]} 
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
              <TouchableOpacity onPress={handleUserLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.btn}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.btnText, { color: '#FFF' }]}>Sign In & Explore Festivals</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.regLink}>
              <Text style={[styles.regText, { color: colors.textSecondary }]}>New to Utsav? <Text style={{ color: colors.primaryOrange, fontWeight: '800' }}>Create Account</Text></Text>
            </TouchableOpacity>
          </BlurView>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 50, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  card: { borderRadius: 20, padding: 24, borderWidth: 1 },
  group: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, borderWidth: 1 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1 },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  btnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  regLink: { marginTop: 24, alignItems: 'center' },
  regText: { fontSize: 13 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { borderWidth: 1 },
  tabText: { fontSize: 14, fontWeight: '600' },
  activeTabText: { fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  btnSec: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, marginBottom: 15 },
  btnSecText: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  otpInputStyle: { fontSize: 22, letterSpacing: 6, fontWeight: '800' },
  resendBtn: { alignItems: 'center', marginBottom: 15 },
  resendText: { fontSize: 13, fontWeight: '700' },
});
