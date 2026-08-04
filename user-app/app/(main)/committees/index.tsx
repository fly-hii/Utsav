import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { CommitteeService } from '../../../services/api';
import { GRADIENTS } from '../../../constants/theme';
import { useAppTheme } from '../../../context/ThemeContext';

export default function CommitteesDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  
  const [search, setSearch] = useState('');
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch (e) {}
      }
    })();
  }, []);

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const res: any = await CommitteeService.getAll({ search: search || undefined });
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setCommittees(list);
    } catch (err) {
      console.error('Failed to fetch committees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, [search]);

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Village Festival Committees 🛕</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Discover & support verified local temple committees</Text>
          </View>
          <View style={{ justifyContent: 'center', marginLeft: 10 }}>
            <Image source={require('../../../assets/icon.png')} style={{ width: 40, height: 40, borderRadius: 10, resizeMode: 'cover' }} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
      >

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by village, mandal, or committee name..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {/* Committee List */}
        {loading ? (
          <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 30 }} />
        ) : committees.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No verified committees found in database.</Text>
          </View>
        ) : (
          committees.map((item) => {
            const distance = userLoc && item.latitude && item.longitude 
              ? getDistanceKm(userLoc.lat, userLoc.lng, parseFloat(item.latitude), parseFloat(item.longitude)).toFixed(1)
              : null;

            return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
              onPress={() => router.push(`/(main)/committees/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.cardTemple, { color: colors.textSecondary }]}>{item.templeName}</Text>
                  <Text style={[styles.cardLocation, { color: colors.textMuted }]}>📍 {item.village}, {item.district}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.verifiedBadge, { backgroundColor: `${colors.success}26`, borderColor: `${colors.success}4D` }]}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.success} style={{ marginRight: 4 }} />
                    <Text style={[styles.verifiedText, { color: colors.success }]}>{item.status || 'VERIFIED'}</Text>
                  </View>
                  {distance && (
                    <View style={{ backgroundColor: `${colors.gold}33`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.gold }}>{distance} km</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.glassBorder }]}>
                <Text style={[styles.festivalText, { color: colors.gold }]}>🚩 {item.festivalName || 'Village Festival'}</Text>
                <View style={styles.actionBtn}>
                  <Text style={[styles.actionText, { color: colors.primaryOrange }]}>View & Donate</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primaryOrange} />
                </View>
              </View>
            </TouchableOpacity>
          )})
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 13 },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: '700' },
  cardTemple: { fontSize: 12, marginTop: 2 },
  cardLocation: { fontSize: 11, marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginLeft: 8 },
  verifiedText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  festivalText: { fontSize: 11, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700' },
});
