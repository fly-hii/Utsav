import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, Image, TextInput, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { CommitteeService } from '../../services/api';
import { GRADIENTS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function UserHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState('Fetching GPS Location...');
  const [nearbyCommittees, setNearbyCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Devotee');

  const filteredCommittees = nearbyCommittees.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.village || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.templeName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchCommitteesFallback = async () => {
    try {
      const res: any = await CommitteeService.getAll();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setNearbyCommittees(list);
    } catch {
      setNearbyCommittees([]);
    }
  };

  const requestGpsLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required 📍', 'Please grant location permission to discover nearby village festivals & temple committees.');
        setLocationName('GPS Location Disabled');
        fetchCommitteesFallback();
        return;
      }

      const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(currentLoc);

      const reverse = await Location.reverseGeocodeAsync({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });

      if (reverse && reverse.length > 0) {
        const place = reverse[0];
        setLocationName(`📍 ${place.city || place.subregion || place.district || 'Near You'}, ${place.region || 'AP'}`);
      } else {
        setLocationName(`📍 Lat: ${currentLoc.coords.latitude.toFixed(2)}, Lng: ${currentLoc.coords.longitude.toFixed(2)}`);
      }

      const res: any = await CommitteeService.getNearby(currentLoc.coords.latitude, currentLoc.coords.longitude);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (list.length > 0) {
        setNearbyCommittees(list);
      } else {
        fetchCommitteesFallback();
      }
    } catch (err) {
      console.error('GPS Location error:', err);
      setLocationName('📍 Near Kovvur, Andhra Pradesh');
      fetchCommitteesFallback();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestGpsLocation();
  }, []);

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Committee-Style Header */}
      <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.headerBlur, { paddingTop: insets.top + 10, borderBottomColor: colors.glassBorder }]}>
        <View style={styles.headerRow}>
          <View style={{ marginRight: 12, justifyContent: 'center' }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.committeeTitle, { color: colors.textPrimary }]} numberOfLines={1}>Welcome, {userName}</Text>
              <View style={[styles.badgeApproved, { backgroundColor: `${colors.success}26`, borderColor: `${colors.success}4D` }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>Villager</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => requestGpsLocation()} activeOpacity={0.8} style={{ marginTop: 2 }}>
              <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{locationName}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/(main)/notifications')} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40, paddingTop: 10 },
        ]}
      >
        {/* Premium Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search villages, temples or committees..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={colors.primaryOrange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>


        {/* Quick Navigation Action Grid */}
        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/(main)/events')}>
            <Ionicons name="calendar-outline" size={22} color={colors.primaryOrange} />
            <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/(main)/donate')}>
            <Ionicons name="cash-outline" size={22} color={colors.success} />
            <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>Donate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/(main)/reels')}>
            <Ionicons name="videocam-outline" size={22} color={colors.gold} />
            <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>Reels</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/(main)/committees')}>
            <Ionicons name="people-outline" size={22} color={colors.cream} />
            <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>Committees</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby GPS Festival Committees */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>GPS Nearby Festival Committees</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/committees')}>
            <Text style={[styles.seeAllText, { color: colors.gold }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 20 }} />
        ) : filteredCommittees.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
              {searchQuery ? 'No committees found matching your search.' : 'No nearby festival committees found in database.'}
            </Text>
          </View>
        ) : (
          filteredCommittees.map((committee) => (
            <TouchableOpacity
              key={committee.id}
              style={[styles.committeeCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
              onPress={() => router.push(`/(main)/committees/${committee.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.committeeName, { color: colors.textPrimary }]}>{committee.name}</Text>
                  <Text style={[styles.templeName, { color: colors.textSecondary }]}>{committee.templeName}</Text>
                  <Text style={[styles.villageLocation, { color: colors.textMuted }]}>📍 {committee.village}, {committee.district}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {committee.distance && (
                    <View style={[styles.distanceBadge, { backgroundColor: `${colors.gold}33` }]}>
                      <Text style={[styles.distanceText, { color: colors.gold }]}>{parseFloat(committee.distance).toFixed(1)} km</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ marginLeft: 8 }}
                    onPress={() => {
                      const query = committee.latitude && committee.longitude
                        ? `${committee.latitude},${committee.longitude}`
                        : `${committee.templeName || committee.name}, ${committee.village}, ${committee.district}`;
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
                    }}
                  >
                    <Ionicons name="navigate-circle" size={26} color={colors.gold} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.cardFooter, { borderTopColor: colors.glassBorder }]}>
                <Text style={[styles.festivalTag, { color: colors.gold }]}>🚩 {committee.festivalName || 'Village Festival'}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.cardBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}
                    onPress={() => router.push(`/(main)/committees/${committee.id}`)}
                  >
                    <Text style={[styles.cardBtnText, { color: colors.textPrimary }]}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardBtn, { backgroundColor: `${colors.success}26`, borderColor: `${colors.success}4D` }]}
                    onPress={() => router.push(`/(main)/donate?committeeId=${committee.id}`)}
                  >
                    <Text style={[styles.cardBtnText, { color: colors.success }]}>Donate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerBlur: { paddingBottom: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  committeeTitle: { fontSize: 16, fontWeight: '800', maxWidth: '75%' },
  badgeApproved: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  locationText: { fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  // Search Bar
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  heroCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  heroBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  heroSub: { fontSize: 12, marginBottom: 16 },
  heroBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', elevation: 2 },
  heroBtnText: { fontWeight: '800', fontSize: 13 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  navBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  navBtnText: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  seeAllText: { fontSize: 12, fontWeight: '700' },
  committeeCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  committeeName: { fontSize: 15, fontWeight: '700' },
  templeName: { fontSize: 12, marginTop: 2 },
  villageLocation: { fontSize: 11, marginTop: 4 },
  distanceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  distanceText: { fontSize: 10, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  festivalTag: { fontSize: 11, fontWeight: '600' },
  cardBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  cardBtnText: { fontSize: 11, fontWeight: '700' },
});
