import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { CommitteeService } from '../../../services/api';
import { COLORS, GRADIENTS } from '../../../constants/theme';

export default function CommitteesDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Village Festival Committees 🛕</Text>
            <Text style={styles.subtitle}>Discover & support verified local temple committees</Text>
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
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by village, mandal, or committee name..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* Committee List */}
        {loading ? (
          <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 30 }} />
        ) : committees.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>No verified committees found in database.</Text>
          </View>
        ) : (
          committees.map((item) => {
            const distance = userLoc && item.latitude && item.longitude 
              ? getDistanceKm(userLoc.lat, userLoc.lng, parseFloat(item.latitude), parseFloat(item.longitude)).toFixed(1)
              : null;

            return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/(main)/committees/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardTemple}>{item.templeName}</Text>
                  <Text style={styles.cardLocation}>📍 {item.village}, {item.district}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={COLORS.success} style={{ marginRight: 4 }} />
                    <Text style={styles.verifiedText}>{item.status || 'VERIFIED'}</Text>
                  </View>
                  {distance && (
                    <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.gold }}>{distance} km</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.festivalText}>🚩 {item.festivalName || 'Village Festival'}</Text>
                <View style={styles.actionBtn}>
                  <Text style={styles.actionText}>View & Donate</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.primaryOrange} />
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 20 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 13 },
  card: { backgroundColor: COLORS.glassCard, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardTemple: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cardLocation: { fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', marginLeft: 8 },
  verifiedText: { fontSize: 10, fontWeight: '800', color: COLORS.success, letterSpacing: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingTop: 10 },
  festivalText: { fontSize: 11, color: COLORS.gold, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryOrange },
});
