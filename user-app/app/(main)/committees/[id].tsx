import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeService, EventService, DonationService } from '../../../services/api';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { generateDonationReceiptPDF } from '../../../utils/pdfGenerator';

export default function CommitteeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

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
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{committee?.name || 'Sri Rama Youth Committee 🛕'}</Text>
            <Text style={styles.subtitle}>📍 {committee?.village || 'Kovvur'}, {committee?.district || 'West Godavari'}</Text>
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
            <Text style={styles.sectionTitle}>My Donated Receipts 🧾</Text>
            {myDonations.length === 0 ? (
              <BlurView intensity={20} tint="dark" style={styles.emptyReceiptCard}>
                <Ionicons name="receipt-outline" size={32} color="rgba(255,255,255,0.4)" />
                <Text style={styles.emptyText}>No personal donation receipts found in database.</Text>
              </BlurView>
            ) : (
              myDonations.map((rec) => (
                <BlurView key={rec.id} intensity={25} tint="dark" style={styles.receiptCard}>
                  <View style={styles.receiptHeader}>
                    <Text style={styles.receiptNo}>Receipt #{rec.receiptNo || 'UTS-2026-REC'}</Text>
                    <Text style={styles.receiptAmount}>₹{(rec.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.donorName}>Donor: {rec.donorName || 'Villager'}</Text>
                  <Text style={styles.receiptMeta}>{rec.purpose || 'General Offering'} • {rec.paymentMethod || 'UPI'} • {rec.date ? new Date(rec.date).toLocaleDateString() : 'Recent'}</Text>

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleExportReceipt(rec)}
                    activeOpacity={0.8}
                    disabled={downloadingReceipt === rec.id}
                  >
                    {downloadingReceipt === rec.id ? (
                      <ActivityIndicator size="small" color={COLORS.success} style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons name="download-outline" size={14} color={COLORS.success} style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.downloadText}>Download Official Receipt PDF</Text>
                  </TouchableOpacity>
                </BlurView>
              ))
            )}

            {/* Upcoming Festival Schedule */}
            <Text style={styles.sectionTitle}>Upcoming Festival Schedule 📅</Text>
            {events.length === 0 ? (
              <BlurView intensity={20} tint="dark" style={styles.eventCard}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', fontSize: 12 }}>No upcoming festival events scheduled in database.</Text>
              </BlurView>
            ) : (
              events.map((ev) => (
                <BlurView key={ev.id} intensity={20} tint="dark" style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <Ionicons name="calendar-outline" size={24} color={COLORS.primaryOrange} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventName}>{ev.name}</Text>
                      <Text style={styles.eventVenue}>{ev.venue || 'Temple Premises'} • {ev.time || '09:00 AM'}</Text>
                      <Text style={styles.eventDate}>📆 {ev.date ? new Date(ev.date).toLocaleDateString() : 'Upcoming'}</Text>
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
                <Ionicons name="heart" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
                <Text style={styles.donateText}>Donate to Festival Committee</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  heroCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  heroBadge: { fontSize: 10, fontWeight: '800', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  heroFestival: { fontSize: 13, fontWeight: '700', color: COLORS.gold, marginBottom: 12 },
  contactRow: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', paddingTop: 10, gap: 4 },
  contactText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.85)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12, marginTop: 4 },
  emptyReceiptCard: { padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  emptyText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  receiptCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.08)', marginBottom: 24 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  receiptNo: { fontSize: 12, fontWeight: '800', color: COLORS.success, letterSpacing: 0.5 },
  receiptAmount: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  donorName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  receiptMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  downloadBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' },
  downloadText: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  eventCard: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  eventVenue: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  eventDate: { fontSize: 10, color: COLORS.gold, marginTop: 4, fontWeight: '600' },
  donateBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  donateGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  donateText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 },
});
