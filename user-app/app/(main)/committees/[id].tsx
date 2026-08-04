import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeService, EventService, DonationService } from '../../../services/api';
import { GRADIENTS } from '../../../constants/theme';
import { useAppTheme } from '../../../context/ThemeContext';
import { generateDonationReceiptPDF } from '../../../utils/pdfGenerator';

export default function CommitteeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const committeeId = typeof id === 'string' ? id : 'c1';

  const [committee, setCommittee] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  const handleExportReceipt = async (donation: any) => {
    try {
      setDownloadingReceipt(donation.id);
      await generateDonationReceiptPDF(committee || { name: donation.committeeName }, donation);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate receipt PDF');
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const fetchCommitteeData = async () => {
    try {
      setLoading(true);
      const [commRes, evRes, donRes]: any[] = await Promise.all([
        CommitteeService.getById(committeeId).catch(() => null),
        EventService.getAll().catch(() => []),
        DonationService.getMyDonations().catch(() => []),
      ]);

      if (commRes?.data) {
        setCommittee(commRes.data);
      } else if (commRes && !commRes.data) {
        setCommittee(commRes);
      }

      const evList = Array.isArray(evRes) ? evRes : (Array.isArray(evRes?.data) ? evRes.data : []);
      setEvents(evList);

      const donList = Array.isArray(donRes) ? donRes : (Array.isArray(donRes?.data) ? donRes.data : []);
      setMyDonations(donList);
    } catch (err) {
      console.error('Failed to fetch committee details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitteeData();
  }, [committeeId]);

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{committee?.name || 'Sri Rama Youth Committee 🛕'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>📍 {committee?.village || 'Kovvur'}, {committee?.district || 'West Godavari'}</Text>
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
        ) : (
          <>
            {/* Committee Hero Card */}
            <LinearGradient colors={GRADIENTS.festival} style={styles.heroCard}>
              <Text style={styles.heroBadge}>{committee?.status || 'VERIFIED FESTIVAL COMMITTEE'}</Text>
              <Text style={styles.heroTitle}>{committee?.templeName || 'Sri Seetha Ramachandra Swamy Temple'}</Text>
              <Text style={styles.heroFestival}>🚩 {committee?.festivalName || 'Sri Rama Navami Annual Utsavam 2026'}</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>President: {committee?.presidentName || committee?.president || 'M. Subba Rao'}</Text>
                <Text style={styles.contactText}>Secretary: {committee?.secretaryName || committee?.secretary || 'K. Srinivasa Varma'}</Text>
              </View>
            </LinearGradient>

            {/* User's Personal Donation Receipts Section */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Donated Receipts 🧾</Text>
            {myDonations.length === 0 ? (
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.emptyReceiptCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No personal donation receipts found in database.</Text>
              </BlurView>
            ) : (
              myDonations.map((rec) => (
                <BlurView key={rec.id} intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.receiptCard, { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}4D` }]}>
                  <View style={styles.receiptHeader}>
                    <Text style={[styles.receiptNo, { color: colors.success }]}>Receipt #{rec.receiptNo || 'UTS-2026-REC'}</Text>
                    <Text style={[styles.receiptAmount, { color: colors.textPrimary }]}>₹{(rec.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={[styles.donorName, { color: colors.textPrimary }]}>Donor: {rec.donorName || 'Villager'}</Text>
                  <Text style={[styles.receiptMeta, { color: colors.textSecondary }]}>{rec.purpose || 'General Offering'} • {rec.paymentMethod || 'UPI'} • {rec.date ? new Date(rec.date).toLocaleDateString() : 'Recent'}</Text>

                  <TouchableOpacity
                    style={[styles.downloadBtn, { backgroundColor: `${colors.success}26`, borderColor: `${colors.success}66` }]}
                    onPress={() => handleExportReceipt(rec)}
                    activeOpacity={0.8}
                    disabled={downloadingReceipt === rec.id}
                  >
                    {downloadingReceipt === rec.id ? (
                      <ActivityIndicator size="small" color={colors.success} style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons name="download-outline" size={14} color={colors.success} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.downloadText, { color: colors.success }]}>Download Official Receipt PDF</Text>
                  </TouchableOpacity>
                </BlurView>
              ))
            )}

            {/* Upcoming Festival Schedule */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Festival Schedule 📅</Text>
            {events.length === 0 ? (
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.eventCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 12 }}>No upcoming festival events scheduled in database.</Text>
              </BlurView>
            ) : (
              events.map((ev) => (
                <BlurView key={ev.id} intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.eventCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                  <View style={styles.eventRow}>
                    <Ionicons name="calendar-outline" size={24} color={colors.primaryOrange} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventName, { color: colors.textPrimary }]}>{ev.name}</Text>
                      <Text style={[styles.eventVenue, { color: colors.textSecondary }]}>{ev.venue || 'Temple Premises'} • {ev.time || '09:00 AM'}</Text>
                      <Text style={[styles.eventDate, { color: colors.gold }]}>📆 {ev.date ? new Date(ev.date).toLocaleDateString() : 'Upcoming'}</Text>
                    </View>
                  </View>
                </BlurView>
              ))
            )}

            {/* Support / Donate Button */}
            <TouchableOpacity
              style={styles.donateBtn}
              onPress={() => router.push('/(main)/donate')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={GRADIENTS.festival} style={styles.donateGradient}>
                <Ionicons name="heart" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={[styles.donateText, { color: '#FFF' }]}>Donate to Festival Committee</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
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
  heroCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  heroBadge: { fontSize: 10, fontWeight: '800', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  heroFestival: { fontSize: 13, fontWeight: '700', color: '#FCD34D', marginBottom: 12 },
  contactRow: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', paddingTop: 10, gap: 4 },
  contactText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.85)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  emptyReceiptCard: { padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, marginBottom: 24 },
  emptyText: { fontSize: 12, marginTop: 8 },
  receiptCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 24 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  receiptNo: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  receiptAmount: { fontSize: 18, fontWeight: '900' },
  donorName: { fontSize: 13, fontWeight: '700' },
  receiptMeta: { fontSize: 11, marginTop: 4 },
  downloadBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1 },
  downloadText: { fontSize: 11, fontWeight: '800' },
  eventCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventName: { fontSize: 14, fontWeight: '700' },
  eventVenue: { fontSize: 11, marginTop: 2 },
  eventDate: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  donateBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  donateGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  donateText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
