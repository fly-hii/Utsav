import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, LayoutAnimation, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useAppTheme } from '../../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ManageEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { committeeId } = useCommittee();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFormExpanded(!formExpanded);
  };

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
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Festival Events Management</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create & publish festival event schedules for villagers</Text>
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

          {/* Collapsible Form Header */}
          <TouchableOpacity
            style={[styles.formToggle, { backgroundColor: `${colors.primaryOrange}1A`, borderColor: `${colors.primaryOrange}4D`, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 }]}
            onPress={toggleForm}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color={colors.primaryOrange} style={{ marginRight: 8 }} />
              <Text style={[{ fontSize: 13, fontWeight: '700' }, { color: colors.primaryOrange }]}>
                {formExpanded ? 'Collapse Form' : 'Add New Event'}
              </Text>
            </View>
            <Ionicons
              name={formExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primaryOrange}
            />
          </TouchableOpacity>

          {/* Add Event Form */}
          {formExpanded && (
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
            <Text style={[styles.formHeading, { color: colors.textPrimary }]}>Add New Festival Program</Text>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Event Title / Ritual Name *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Sitarama Kalyana Utsavam" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
            </View>

            <View style={styles.row}>
              <View style={[styles.group, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Date * 📅</Text>
                <TouchableOpacity
                  style={[styles.datePickerBtn, { backgroundColor: colors.glassCard, borderColor: colors.primaryOrange }]}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primaryOrange} style={{ marginRight: 8 }} />
                  <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>{formatDisplayDate(selectedDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.group, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Time</Text>
                <TextInput value={time} onChangeText={setTime} placeholder="09:00 AM" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
              </View>
            </View>

            {/* Calendar Date Picker */}
            {showDatePicker && (
              <View style={[styles.calendarContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.glassBorder }]}>
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
                    style={[styles.doneDateBtn, { backgroundColor: colors.primaryOrange }]}
                    onPress={() => setShowDatePicker(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneDateText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Venue / Stage Location</Text>
              <TextInput value={venue} onChangeText={setVenue} placeholder="e.g. Temple Grounds Main Pandal" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
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
          )}

          {/* Existing Scheduled Events */}
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Scheduled Programs ({events.length})</Text>
          {loading ? (
            <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 14 }} />
          ) : events.length === 0 ? (
            <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.eventItem, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard, alignItems: 'center', padding: 30 }]}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14, fontWeight: '600' }}>No Events Scheduled</Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 4 }}>Add an event above to broadcast to villagers.</Text>
            </BlurView>
          ) : (
            events.map((ev: any) => (
              <BlurView key={ev.id} intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.eventItem, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
                <View style={styles.eventLeft}>
                  <Ionicons name="calendar-outline" size={24} color={colors.primaryOrange} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.eventName, { color: colors.textPrimary }]}>{ev.name}</Text>
                    <Text style={[styles.eventSub, { color: colors.textSecondary }]}>{ev.venue || 'Temple Premises'} • {ev.time || '09:00 AM'}</Text>
                    <Text style={[styles.eventDate, { color: colors.gold }]}>📆 {ev.date ? new Date(ev.date).toLocaleDateString() : 'Upcoming'}</Text>
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
  formToggle: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
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
