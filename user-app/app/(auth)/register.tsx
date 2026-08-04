import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/api';
import { GRADIENTS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function UserRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.register({ name, phone, password, email: email || undefined });
      Alert.alert('Welcome to Utsav! 🎉', 'Your account has been created successfully.', [
        { text: 'Continue', onPress: () => router.replace('/(main)/home') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.message || 'Could not create account. Please try again.');
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
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={{ width: 100, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 15 }} />
          <Text style={[styles.title, { color: colors.gold }]}>Join Utsav</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Discover nearby village festivals & support local temple committees</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ramesh Varma"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address (Optional)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password *</Text>
            <View style={[styles.passwordContainer, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a secure password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1, borderWidth: 0, padding: 0, backgroundColor: 'transparent', color: colors.textPrimary }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                <Text style={{ color: colors.textSecondary }}>{showPassword ? 'Hide' : 'View'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
              <Text style={[styles.submitText, { color: '#FFF' }]}>{loading ? 'Creating Account...' : 'Create Account & Explore'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? <Text style={{ color: colors.primaryOrange, fontWeight: '800' }}>Log In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, minHeight: '100%' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, lineHeight: 20 },
  formCard: { padding: 24, borderRadius: 24, borderWidth: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1 },
  submitBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { fontSize: 13 },
});
