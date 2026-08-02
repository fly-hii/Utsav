import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../../services/api';
import { COLORS, GRADIENTS } from '../../constants/theme';

export default function UserRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={{ width: 100, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 15 }} />
          <Text style={styles.title}>Join Utsav</Text>
          <Text style={styles.subtitle}>Discover nearby village festivals & support local temple committees</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ramesh Varma"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a secure password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
              <Text style={styles.submitText}>{loading ? 'Creating Account...' : 'Create Account & Explore'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={{ color: COLORS.primaryOrange, fontWeight: '800' }}>Log In</Text></Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.gold, marginBottom: 8 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  formCard: { backgroundColor: COLORS.glassCard, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.glassCard, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12, padding: 14, color: COLORS.textPrimary, fontSize: 14 },
  submitBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { color: COLORS.textSecondary, fontSize: 13 },
});
