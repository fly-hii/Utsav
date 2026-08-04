import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/api';
import { GRADIENTS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      await AuthService.sendOtp(phone, 'FORGOT_PASSWORD');
      Alert.alert('OTP Sent', 'Please check your SMS for the 6-digit OTP.');
      setStep(2);
      startCountdown();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.resetPasswordWithOtp(phone, otp, newPassword);
      Alert.alert('Success ✅', 'Your password has been reset successfully. You can now login.', [
        { text: 'Login', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.glassCard }]} onPress={() => step === 2 ? setStep(1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Reset Password 🔐</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 1 ? 'Enter your registered phone number to receive an OTP' : 'Enter the OTP and your new password to secure your account'}
            </Text>
          </View>

          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.formContainer, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
            {step === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Number *</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.glassBorder }]}>
                    <Text style={[styles.prefix, { color: colors.textPrimary }]}>+91</Text>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                  onPress={handleSendOtp} 
                  disabled={loading}
                >
                  <LinearGradient colors={GRADIENTS.gold} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Get OTP</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit OTP *</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput, { borderColor: colors.glassBorder, color: colors.textPrimary }]}
                    placeholder="• • • • • •"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    textAlign="center"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>New Password *</Text>
                  <View style={[styles.passwordWrapper, { borderColor: colors.glassBorder }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.textPrimary }]}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                  onPress={handleResetPassword} 
                  disabled={loading}
                >
                  <LinearGradient colors={GRADIENTS.festival} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.resendBtn} 
                  onPress={handleSendOtp} 
                  disabled={countdown > 0 || loading}
                >
                  <Text style={[styles.resendText, { color: colors.primaryOrange }, countdown > 0 && { color: colors.textSecondary }]}>
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 30, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  formContainer: { borderRadius: 24, padding: 24, borderWidth: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  prefix: { fontSize: 16, fontWeight: '600', marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16 },
  otpInput: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, height: 56, fontSize: 24, letterSpacing: 8, fontWeight: '700' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  passwordInput: { flex: 1, height: 50, fontSize: 16 },
  eyeBtn: { padding: 10 },
  primaryButton: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  resendBtn: { marginTop: 20, alignItems: 'center' },
  resendText: { fontSize: 14, fontWeight: '700' },
});
