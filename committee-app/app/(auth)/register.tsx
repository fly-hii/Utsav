import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GRADIENTS } from '../../constants/theme';
import { CommitteeAuthService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAppTheme } from '../../context/ThemeContext';

export default function CommitteeRegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [name, setName] = useState('');
  const [templeName, setTempleName] = useState('');
  const [festivalName, setFestivalName] = useState('');
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [presidentName, setPresidentName] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState('Detecting GPS location...');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

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
      setSendingOtp(true);
      await CommitteeAuthService.sendOtp(phone, 'REGISTER');
      setOtpSent(true);
      startCountdown();
      Alert.alert('OTP Sent', 'Please check your SMS for the 6-digit OTP.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    async function captureTempleGps() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsStatus('GPS Permission Denied (Manual fallback)');
          setCoords({ latitude: 16.98, longitude: 81.72 });
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setGpsStatus(`GPS Active: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);

        // Reverse geocode to pre-fill village & district
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const p = reverse[0];
          
          // As requested, do NOT auto-fill Village, Mandal, or District from GPS.
          // The user must fill these manually.
          
          const locState = p.region || 'Andhra Pradesh';
          setState(locState);
        }
      } catch (err) {
        setGpsStatus('Default GPS Coordinates');
        setCoords({ latitude: 16.98, longitude: 81.72 });
      }
    }
    captureTempleGps();
  }, []);

  const handleRegisterSubmit = async () => {
    if (!name || !templeName || !village || !presidentName || !phone || !password || !otp) {
      Alert.alert('Validation Error', 'Please fill in all required fields marked with *, and verify your phone number with OTP.');
      return;
    }

    try {
      setLoading(true);
      await CommitteeAuthService.registerCommittee({
        name,
        templeName,
        festivalName: festivalName || `${templeName} Utsavam`,
        village,
        mandal: mandal || village,
        district: district || 'Godavari',
        state: state || 'Andhra Pradesh',
        address: `${village}, ${mandal}, ${district}`,
        latitude: coords?.latitude || 16.98,
        longitude: coords?.longitude || 81.72,
        presidentName,
        secretaryName: secretaryName || 'Committee Secretary',
        phone,
        password,
        otp,
      });

      Alert.alert(
        'Registration Submitted! 🎪',
        'Your committee registration request with exact temple GPS coordinates has been submitted to Super Admin for approval.',
        [{ text: 'Back to Login', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Alert.alert(
        'Registration Failed ❌',
        err?.response?.data?.message || err?.message || 'Could not submit registration. Please check network connection and try again.'
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Register Village Committee 🛕</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Automatic GPS location detection & document verification</Text>
        </View>

        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
          {/* GPS Location Tag */}
          <View style={[styles.gpsBanner, { backgroundColor: `${colors.success}26`, borderColor: `${colors.success}4D` }]}>
            <Text style={[styles.gpsText, { color: colors.success }]}>📍 {gpsStatus}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Committee Name *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Sri Rama Youth Committee" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Temple Name *</Text>
            <TextInput value={templeName} onChangeText={setTempleName} placeholder="e.g. Sri Seetha Ramachandra Swamy Temple" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Festival Name</Text>
            <TextInput value={festivalName} onChangeText={setFestivalName} placeholder="e.g. Sri Rama Navami Utsavam" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Village *</Text>
              <TextInput value={village} onChangeText={setVillage} placeholder="Kovvur" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mandal</Text>
              <TextInput value={mandal} onChangeText={setMandal} placeholder="Kovvur" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>District</Text>
              <TextInput value={district} onChangeText={setDistrict} placeholder="West Godavari" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>State</Text>
              <TextInput value={state} onChangeText={setState} placeholder="Andhra Pradesh" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>President Name *</Text>
            <TextInput value={presidentName} onChangeText={setPresidentName} placeholder="e.g. M. Subba Rao" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Secretary Name</Text>
            <TextInput value={secretaryName} onChangeText={setSecretaryName} placeholder="e.g. K. Srinivasa Varma" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number (Admin Login) *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                value={phone} 
                onChangeText={(val) => { setPhone(val); setOtpSent(false); setOtp(''); }} 
                placeholder="10-digit mobile number" 
                placeholderTextColor={colors.textMuted} 
                keyboardType="phone-pad" 
                maxLength={10}
                style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} 
              />
              <TouchableOpacity 
                style={[styles.verifyBtn, { backgroundColor: colors.primaryOrange }, (sendingOtp || countdown > 0) && [styles.disabledBtn, { backgroundColor: colors.textMuted }]]} 
                onPress={handleSendOtp}
                disabled={sendingOtp || countdown > 0}
              >
                {sendingOtp ? <ActivityIndicator color={colors.textPrimary} size="small" /> : (
                  <Text style={[styles.verifyBtnText, { color: colors.cream }]}>{countdown > 0 ? `${countdown}s` : (otpSent ? 'Resend' : 'Verify')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {otpSent && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit OTP *</Text>
              <TextInput 
                value={otp} 
                onChangeText={setOtp} 
                placeholder="Enter 6-digit OTP" 
                placeholderTextColor={colors.textMuted} 
                keyboardType="number-pad"
                maxLength={6} 
                style={[styles.input, styles.otpInputStyle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary, borderColor: colors.glassBorder }]} 
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Account Password *</Text>
            <View style={[styles.passwordContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.glassBorder }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create secure password"
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

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.submitText, { color: '#FFF' }]}>Submit GPS Registration Request</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 80 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4 },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  gpsBanner: { borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1 },
  gpsText: { fontSize: 11, fontWeight: '700' },
  inputGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  input: { borderRadius: 12, padding: 12, borderWidth: 1 },
  submitBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { fontWeight: '800', fontSize: 14 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 13,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  verifyBtnText: { fontWeight: '700', fontSize: 13 },
  otpInputStyle: { fontSize: 18, letterSpacing: 4, fontWeight: '700', textAlign: 'center' },
});
