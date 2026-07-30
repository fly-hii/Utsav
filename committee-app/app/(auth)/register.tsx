import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { CommitteeAuthService } from '../../services/api';
import * as Location from 'expo-location';

export default function CommitteeRegisterScreen() {
  const router = useRouter();
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
          if (p.city || p.subregion) setVillage(p.city || p.subregion || '');
          if (p.district) setDistrict(p.district);
          if (p.region) setState(p.region);
        }
      } catch (err) {
        setGpsStatus('Default GPS Coordinates');
        setCoords({ latitude: 16.98, longitude: 81.72 });
      }
    }
    captureTempleGps();
  }, []);

  const handleRegisterSubmit = async () => {
    if (!name || !templeName || !village || !presidentName || !phone || !password) {
      Alert.alert('Validation Error', 'Please fill in all required fields marked with *.');
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
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Register Village Committee 🛕</Text>
          <Text style={styles.subtitle}>Automatic GPS location detection & document verification</Text>
        </View>

        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          {/* GPS Location Tag */}
          <View style={styles.gpsBanner}>
            <Text style={styles.gpsText}>📍 {gpsStatus}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Committee Name *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Sri Rama Youth Committee" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Temple Name *</Text>
            <TextInput value={templeName} onChangeText={setTempleName} placeholder="e.g. Sri Seetha Ramachandra Swamy Temple" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Festival Name</Text>
            <TextInput value={festivalName} onChangeText={setFestivalName} placeholder="e.g. Sri Rama Navami Utsavam" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Village *</Text>
              <TextInput value={village} onChangeText={setVillage} placeholder="Kovvur" placeholderTextColor={COLORS.textMuted} style={styles.input} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Mandal</Text>
              <TextInput value={mandal} onChangeText={setMandal} placeholder="Kovvur" placeholderTextColor={COLORS.textMuted} style={styles.input} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>District</Text>
              <TextInput value={district} onChangeText={setDistrict} placeholder="West Godavari" placeholderTextColor={COLORS.textMuted} style={styles.input} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput value={state} onChangeText={setState} placeholder="Andhra Pradesh" placeholderTextColor={COLORS.textMuted} style={styles.input} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>President Name *</Text>
            <TextInput value={presidentName} onChangeText={setPresidentName} placeholder="e.g. M. Subba Rao" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Secretary Name</Text>
            <TextInput value={secretaryName} onChangeText={setSecretaryName} placeholder="e.g. K. Srinivasa Varma" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number (Admin Login) *</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Password *</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="Create secure password" placeholderTextColor={COLORS.textMuted} secureTextEntry style={styles.input} />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Submit GPS Registration Request 🚀</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 80 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  gpsBanner: { backgroundColor: 'rgba(6, 214, 160, 0.15)', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(6, 214, 160, 0.3)' },
  gpsText: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  inputGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 12, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  submitBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 },
});
