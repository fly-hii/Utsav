import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image, KeyboardAvoidingView, Platform, LayoutChangeEvent, LayoutAnimation, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';
import { generateDonationReceiptPDF } from '../../../utils/pdfGenerator';
import { useAppTheme } from '../../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AddDonationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { committeeId, committeeDetails } = useCommittee();
  const scrollRef = useRef<ScrollView>(null);
  const donationsListY = useRef<number>(0);

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CHEQUE'>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  const sortedAndFilteredDonations = useMemo(() => {
    let list = donations;
    if (filterStatus !== 'ALL') {
      list = list.filter(d => d.status === filterStatus);
    }
    return [...list].sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [donations, filterStatus]);

  const handleExportReceipt = async (donation: any) => {
    if (!committeeDetails) return;
    try {
      setDownloadingReceipt(donation.id);
      await generateDonationReceiptPDF(committeeDetails, donation);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate receipt PDF');
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const fetchDonations = async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      const res: any = await CommitteeManagementService.getDonations(committeeId);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setDonations(list);
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [committeeId]);

  const handleSubmit = async () => {
    if (!committeeId) {
      Alert.alert('Error', 'Committee data not loaded yet. Please wait and try again.');
      return;
    }
    if (!donorName || !amount) {
      Alert.alert('Validation Error', 'Please enter donor name and donation amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        donorName,
        donorPhone: donorPhone || undefined,
        amount: parseFloat(amount),
        purpose: purpose || 'Annadanam / Festival Contribution',
        paymentMethod,
      };

      const res: any = await CommitteeManagementService.addDonation(committeeId, payload);
      Alert.alert(
        'Donation Saved! 💐',
        `₹${amount} recorded for ${donorName}. Digital receipt ${res?.data?.receiptNo || 'generated'} successfully.`,
        [{ text: 'OK', onPress: () => { setDonorName(''); setDonorPhone(''); setAmount(''); setPurpose(''); setFormExpanded(false); fetchDonations(); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not save donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedDonation) return;
    try {
      setVerifying(true);
      await CommitteeManagementService.verifyDonation(selectedDonation.id, status);
      Alert.alert('Success', `Donation has been ${status.toLowerCase()}.`);
      setSelectedDonation(null);
      fetchDonations();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not verify donation.');
    } finally {
      setVerifying(false);
    }
  };

  const handleFilterPress = (status: 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED') => {
    setFilterStatus(status);
    // Auto-scroll to the donations list section
    if (donationsListY.current > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: donationsListY.current - 10, animated: true });
      }, 100);
    }
  };

  const onDonationsListLayout = (event: LayoutChangeEvent) => {
    donationsListY.current = event.nativeEvent.layout.y;
  };

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Header with Back Button */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Record Manual Donation</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter villager donation details & generate digital receipt</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 20, paddingTop: 10 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Collapsible Form Header */}
          <TouchableOpacity
            style={[styles.formToggle, { backgroundColor: `${colors.primaryOrange}1A`, borderColor: `${colors.primaryOrange}4D` }]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setFormExpanded(!formExpanded);
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primaryOrange} style={{ marginRight: 8 }} />
              <Text style={[styles.formToggleText, { color: colors.primaryOrange }]}>
                {formExpanded ? 'Collapse Form' : 'Add New Donation'}
              </Text>
            </View>
            <Ionicons
              name={formExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Collapsible Form */}
          {formExpanded && (
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Donor Full Name *</Text>
                <TextInput value={donorName} onChangeText={setDonorName} placeholder="e.g. Ramesh Varma" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Donor Phone Number</Text>
                <TextInput value={donorPhone} onChangeText={setDonorPhone} placeholder="10-digit phone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Donation Amount (₹) *</Text>
                <TextInput value={amount} onChangeText={setAmount} placeholder="e.g. 5000" placeholderTextColor={colors.textMuted} keyboardType="numeric" style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.gold, borderColor: colors.glassBorder, fontSize: 18, fontWeight: '700' }]} />
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Purpose / Festival Offering</Text>
                <TextInput value={purpose} onChangeText={setPurpose} placeholder="e.g. Annadanam / Prasadam" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', color: colors.textPrimary, borderColor: colors.glassBorder }]} />
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Method</Text>
              <View style={styles.methodRow}>
                {(['CASH', 'UPI', 'CHEQUE'] as const).map((method) => (
                  <TouchableOpacity key={method} style={[styles.methodChip, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }, paymentMethod === method && [styles.methodActive, { backgroundColor: `${colors.primaryOrange}40`, borderColor: colors.primaryOrange }]]} onPress={() => setPaymentMethod(method)}>
                    <Text style={[styles.methodText, { color: colors.textSecondary }, paymentMethod === method && [styles.methodTextActive, { color: colors.primaryOrange }]]}>{method}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.submitText, { color: '#FFF' }]}>Save & Print Digital Receipt</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          )}

          {/* Live Database Donations List */}
          <View onLayout={onDonationsListLayout}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recorded Donations ({sortedAndFilteredDonations.length})</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(status => (
                <TouchableOpacity 
                  key={status} 
                  style={[styles.filterChip, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }, filterStatus === status && [styles.filterChipActive, { backgroundColor: `${colors.primaryOrange}33`, borderColor: colors.primaryOrange }]]}
                  onPress={() => handleFilterPress(status)}
                >
                  <Text style={[styles.filterChipText, { color: colors.textSecondary }, filterStatus === status && [styles.filterChipTextActive, { color: colors.primaryOrange }]]}>
                    {status === 'ALL' ? 'All' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 14 }} />
            ) : sortedAndFilteredDonations.length === 0 ? (
              <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.emptyCard, { borderColor: colors.glassBorder }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No donations found.</Text>
              </BlurView>
            ) : (
              sortedAndFilteredDonations.map((item: any) => (
                <TouchableOpacity key={item.id} onPress={() => { if (item.status === 'PENDING') setSelectedDonation(item); }} activeOpacity={0.8}>
                  <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.itemCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }, item.status === 'PENDING' && { borderColor: colors.gold, backgroundColor: `${colors.gold}1A` }]}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.donorTitle, { color: colors.textPrimary }]}>{item.donorName}</Text>
                      <Text style={[styles.itemAmount, { color: colors.success }, item.status === 'PENDING' && { color: colors.gold }]}>+₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{item.purpose || 'General Donation'} • {item.paymentMethod || 'CASH'}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.receiptNo && <Text style={[styles.receiptTag, { color: colors.gold }]}>Receipt #{item.receiptNo}</Text>}
                        {item.status === 'VERIFIED' && (
                          <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${colors.success}33`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}
                            onPress={() => handleExportReceipt(item)}
                          >
                            {downloadingReceipt === item.id ? (
                              <ActivityIndicator size="small" color={colors.success} />
                            ) : (
                              <>
                                <Ionicons name="download-outline" size={14} color={colors.success} />
                                <Text style={{ fontSize: 10, color: colors.success, fontWeight: '700' }}>Download</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                      {item.status === 'PENDING' && (
                        <View style={[styles.pendingBadge, { backgroundColor: `${colors.gold}33` }]}>
                          <Text style={[styles.pendingText, { color: colors.gold }]}>Verification Pending</Text>
                        </View>
                      )}
                      {item.status === 'REJECTED' && (
                        <Text style={[styles.receiptTag, { color: colors.error }]}>REJECTED</Text>
                      )}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verification Modal */}
      <Modal visible={!!selectedDonation} animationType="slide" transparent={true} onRequestClose={() => setSelectedDonation(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(10, 10, 15, 0.98)' : 'rgba(255, 255, 255, 0.95)' }]}>
          <View style={[styles.modalContent, { maxHeight: '90%', backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Verify Online Donation</Text>
              <TouchableOpacity onPress={() => setSelectedDonation(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
              {selectedDonation?.donorName} sent ₹{selectedDonation?.amount}
            </Text>

            <ScrollView style={{ flexShrink: 1, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {selectedDonation?.screenshotS3Url ? (
                <Image source={{ uri: selectedDonation.screenshotS3Url }} style={{ width: '100%', height: 400, borderRadius: 12, backgroundColor: isDark ? '#000' : '#E2E8F0' }} resizeMode="contain" />
              ) : (
                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted }}>No screenshot provided</Text>
                </View>
              )}
            </ScrollView>

            {verifying ? (
              <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: `${colors.error}33`, borderColor: colors.error }]} onPress={() => handleVerify('REJECTED')}>
                  <Text style={[styles.modalBtnText, { color: colors.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: `${colors.success}33`, borderColor: colors.success }]} onPress={() => handleVerify('VERIFIED')}>
                  <Text style={[styles.modalBtnText, { color: colors.success }]}>Verify & Accept</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  formToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  formToggleText: { fontSize: 14, fontWeight: '700' },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, borderWidth: 1 },
  methodRow: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  methodChip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  methodActive: { },
  methodText: { fontSize: 12, fontWeight: '700' },
  methodTextActive: { },
  submitBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  emptyCard: { padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  emptyText: { fontSize: 12 },
  itemCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  donorTitle: { fontSize: 14, fontWeight: '700' },
  itemAmount: { fontSize: 15, fontWeight: '800' },
  itemSub: { fontSize: 11, marginTop: 4 },
  receiptTag: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingText: { fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 20, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalBtnText: { fontSize: 14, fontWeight: '800' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterChipActive: { },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { },
});
