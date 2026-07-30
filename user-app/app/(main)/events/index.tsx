import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventService } from '../../../services/api';
import { COLORS, GRADIENTS } from '../../../constants/theme';

export default function UserEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Festival Events Calendar 📅</Text>
            <Text style={styles.subtitle}>Scheduled temple rituals, annadanams & programs</Text>
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
          <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 30 }} />
        ) : events.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>No scheduled festival programs found in database.</Text>
          </View>
        ) : (
          events.map((e) => (
            <BlurView key={e.id} intensity={20} tint="dark" style={styles.eventCard}>
              <View style={styles.cardTop}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{e.date ? new Date(e.date).getDate() : '15'}</Text>
                  <Text style={styles.monthText}>{e.date ? new Date(e.date).toLocaleString('default', { month: 'short' }).toUpperCase() : 'APR'}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{e.name}</Text>
                  <Text style={styles.commText}>🛕 {e.committee?.name || e.committeeName || 'Village Festival Committee'}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.gold} />
                    <Text style={styles.metaText}>{e.time || '09:00 AM'}</Text>
                    <Ionicons name="location-outline" size={14} color={COLORS.primaryOrange} style={{ marginLeft: 10 }} />
                    <Text style={styles.metaText}>{e.venue || 'Temple Premises'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.reminderBtn}
                  onPress={() => Alert.alert('Event Reminder Set! 🔔', `We will notify you before ${e.name} begins.`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications-outline" size={14} color={COLORS.primaryOrange} style={{ marginRight: 4 }} />
                  <Text style={styles.reminderText}>Set Reminder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.donateBtn}
                  onPress={() => router.push('/(main)/donate')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.donateText}>Sponsor Event 💐</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  eventCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 14 },
  cardTop: { flexDirection: 'row', gap: 12 },
  dateBadge: { backgroundColor: 'rgba(245, 158, 11, 0.2)', width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  dateText: { fontSize: 18, fontWeight: '900', color: COLORS.primaryOrange },
  monthText: { fontSize: 9, fontWeight: '800', color: COLORS.gold },
  eventName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  commText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 11, color: COLORS.textPrimary, marginLeft: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.glassBorder, marginTop: 14, paddingTop: 10 },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.glassCard },
  reminderText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryOrange },
  donateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.25)', borderWidth: 1, borderColor: COLORS.primaryOrange },
  donateText: { fontSize: 11, fontWeight: '800', color: COLORS.textPrimary },
});
