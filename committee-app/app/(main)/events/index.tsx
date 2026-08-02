import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

export default function ManageEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { committeeId } = useCommittee();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  const fetchEvents = async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      const res: any = await CommitteeManagementService.getEvents(committeeId);
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
  }, [committeeId]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddEvent = async () => {
    if (!name) {
      Alert.alert('Validation Error', 'Please enter event title.');
      return;
    }
    if (!committeeId) {
      Alert.alert('Error', 'Committee data not loaded yet. Please wait and try again.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        festival: 'Village Utsavam',
        venue: venue || 'Temple Premises',
        date: formatDate(selectedDate),
        time: time || '09:00 AM',
      };

      await CommitteeManagementService.createEvent(committeeId, payload);
      setName(''); setSelectedDate(new Date()); setTime(''); setVenue('');
      Alert.alert('Event Created! 🎪', 'New festival event scheduled and broadcasted to villagers.');
      fetchEvents();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Festival Events Management</Text>
            <Text style={styles.subtitle}>Create & publish festival event schedules for villagers</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 20, paddingTop: 10 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Add Event Form */}
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <Text style={styles.formHeading}>Add New Festival Program</Text>

            <View style={styles.group}>
              <Text style={styles.label}>Event Title / Ritual Name *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Sitarama Kalyana Utsavam" placeholderTextColor={COLORS.textMuted} style={styles.input} />
            </View>

            <View style={styles.row}>
              <View style={[styles.group, { flex: 1 }]}>
                <Text style={styles.label}>Date * 📅</Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primaryOrange} style={{ marginRight: 8 }} />
                  <Text style={styles.datePickerText}>{formatDisplayDate(selectedDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.group, { flex: 1 }]}>
                <Text style={styles.label}>Time</Text>
                <TextInput value={time} onChangeText={setTime} placeholder="09:00 AM" placeholderTextColor={COLORS.textMuted} style={styles.input} />
              </View>
            </View>

            {/* Calendar Date Picker */}
            {showDatePicker && (
              <View style={styles.calendarContainer}>
                <DateTimePicker
                  mode="date"
                  value={selectedDate}
                  onChange={(_event: any, date?: Date) => {
                    if (date) setSelectedDate(date);
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.doneDateBtn}
                    onPress={() => setShowDatePicker(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneDateText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.group}>
              <Text style={styles.label}>Venue / Stage Location</Text>
              <TextInput value={venue} onChangeText={setVenue} placeholder="e.g. Temple Grounds Main Pandal" placeholderTextColor={COLORS.textMuted} style={styles.input} />
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={handleAddEvent} disabled={submitting} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.festival} style={styles.addGradient}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.addText}>Publish Festival Event</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          {/* Existing Scheduled Events */}
          <Text style={styles.sectionHeader}>Scheduled Programs ({events.length})</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 14 }} />
          ) : events.length === 0 ? (
            <BlurView intensity={15} tint="dark" style={styles.eventItem}>
              <Text style={{ color: COLORS.textMuted, textAlign: 'center', fontSize: 12 }}>No festival programs scheduled in database yet.</Text>
            </BlurView>
          ) : (
            events.map((ev: any) => (
              <BlurView key={ev.id} intensity={20} tint="dark" style={styles.eventItem}>
                <View style={styles.eventLeft}>
                  <Ionicons name="calendar-outline" size={24} color={COLORS.primaryOrange} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.eventName}>{ev.name}</Text>
                    <Text style={styles.eventSub}>{ev.venue || 'Temple Premises'} • {ev.time || '09:00 AM'}</Text>
                    <Text style={styles.eventDate}>📆 {ev.date ? new Date(ev.date).toLocaleDateString() : 'Upcoming'}</Text>
                  </View>
                </View>
              </BlurView>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  formHeading: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  group: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  input: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 12, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryOrange,
  },
  datePickerText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  doneDateBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primaryOrange,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneDateText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  addBtn: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
  addGradient: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  addText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 13 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  eventItem: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 10 },
  eventLeft: { flexDirection: 'row', alignItems: 'center' },
  eventName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  eventSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  eventDate: { fontSize: 10, color: COLORS.gold, marginTop: 4, fontWeight: '700' },
});
