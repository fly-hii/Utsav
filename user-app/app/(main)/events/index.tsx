import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventService } from '../../../services/api';
import { GRADIENTS } from '../../../constants/theme';
import { useAppTheme } from '../../../context/ThemeContext';

export default function UserEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res: any = await EventService.getAll();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setEvents(list);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Festival Events Calendar 📅</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Scheduled temple rituals, annadanams & programs</Text>
          </View>
          <View style={{ justifyContent: 'center', marginLeft: 10 }}>
            <Image source={require('../../../assets/icon.png')} style={{ width: 40, height: 40, borderRadius: 10, resizeMode: 'cover' }} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
      >


        {loading ? (
          <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 30 }} />
        ) : events.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No scheduled festival programs found in database.</Text>
          </View>
        ) : (
          events.map((e) => (
            <BlurView key={e.id} intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.eventCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
              <View style={styles.cardTop}>
                <View style={[styles.dateBadge, { backgroundColor: `${colors.primaryOrange}33`, borderColor: `${colors.primaryOrange}66` }]}>
                  <Text style={[styles.dateText, { color: colors.primaryOrange }]}>{e.date ? new Date(e.date).getDate() : '15'}</Text>
                  <Text style={[styles.monthText, { color: colors.gold }]}>{e.date ? new Date(e.date).toLocaleString('default', { month: 'short' }).toUpperCase() : 'APR'}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventName, { color: colors.textPrimary }]}>{e.name}</Text>
                  <Text style={[styles.commText, { color: colors.textSecondary }]}>🛕 {e.committee?.name || e.committeeName || 'Village Festival Committee'}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={colors.gold} />
                    <Text style={[styles.metaText, { color: colors.textPrimary }]}>{e.time || '09:00 AM'}</Text>
                    <Ionicons name="location-outline" size={14} color={colors.primaryOrange} style={{ marginLeft: 10 }} />
                    <Text style={[styles.metaText, { color: colors.textPrimary }]}>{e.venue || 'Temple Premises'}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.glassBorder }]}>
                <TouchableOpacity
                  style={[styles.reminderBtn, { backgroundColor: colors.glassCard }]}
                  onPress={() => Alert.alert('Event Reminder Set! 🔔', `We will notify you before ${e.name} begins.`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications-outline" size={14} color={colors.primaryOrange} style={{ marginRight: 4 }} />
                  <Text style={[styles.reminderText, { color: colors.primaryOrange }]}>Set Reminder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.donateBtn, { backgroundColor: `${colors.primaryOrange}40`, borderColor: colors.primaryOrange }]}
                  onPress={() => router.push('/(main)/donate')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.donateText, { color: colors.textPrimary }]}>Sponsor Event 💐</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ))
        )}
      </ScrollView>
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
  eventCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14 },
  cardTop: { flexDirection: 'row', gap: 12 },
  dateBadge: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dateText: { fontSize: 18, fontWeight: '900' },
  monthText: { fontSize: 9, fontWeight: '800' },
  eventName: { fontSize: 15, fontWeight: '700' },
  commText: { fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 11, marginLeft: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, marginTop: 14, paddingTop: 10 },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reminderText: { fontSize: 11, fontWeight: '700' },
  donateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  donateText: { fontSize: 11, fontWeight: '800' },
});
