import { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';
import { generateDonationReceiptPDF } from '../../../utils/pdfGenerator';

export default function AddDonationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { committeeId, committeeDetails } = useCommittee();

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CHEQUE'>('CASH');
  const [submitting, setSubmitting] = useState(false);

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
        [{ text: 'OK', onPress: () => { setDonorName(''); setDonorPhone(''); setAmount(''); setPurpose(''); fetchDonations(); } }]
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

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Header with Back Button */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Record Manual Donation</Text>
            <Text style={styles.subtitle}>Enter villager donation details & generate digital receipt</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
      >


        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          <View style={styles.group}>
            <Text style={styles.label}>Donor Full Name *</Text>
            <TextInput value={donorName} onChangeText={setDonorName} placeholder="e.g. Ramesh Varma" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Donor Phone Number</Text>
            <TextInput value={donorPhone} onChangeText={setDonorPhone} placeholder="10-digit phone" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" style={styles.input} />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Donation Amount (₹) *</Text>
            <TextInput value={amount} onChangeText={setAmount} placeholder="e.g. 5000" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" style={[styles.input, { fontSize: 18, fontWeight: '700', color: COLORS.gold }]} />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Purpose / Festival Offering</Text>
            <TextInput value={purpose} onChangeText={setPurpose} placeholder="e.g. Annadanam / Prasadam" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodRow}>
            {(['CASH', 'UPI', 'CHEQUE'] as const).map((method) => (
              <TouchableOpacity key={method} style={[styles.methodChip, paymentMethod === method && styles.methodActive]} onPress={() => setPaymentMethod(method)}>
                <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>{method}</Text>
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
                  <Text style={styles.submitText}>Save & Print Digital Receipt</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        {/* Live Database Donations List */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Recorded Donations ({sortedAndFilteredDonations.length})</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(status => (
            <TouchableOpacity 
              key={status} 
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'ALL' ? 'All' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 14 }} />
        ) : sortedAndFilteredDonations.length === 0 ? (
          <BlurView intensity={15} tint="dark" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No donations found.</Text>
          </BlurView>
        ) : (
          sortedAndFilteredDonations.map((item: any) => (
            <TouchableOpacity key={item.id} onPress={() => { if (item.status === 'PENDING') setSelectedDonation(item); }} activeOpacity={0.8}>
              <BlurView intensity={20} tint="dark" style={[styles.itemCard, item.status === 'PENDING' && { borderColor: COLORS.gold, backgroundColor: 'rgba(255, 204, 0, 0.1)' }]}>
                <View style={styles.itemHeader}>
                  <Text style={styles.donorTitle}>{item.donorName}</Text>
                  <Text style={[styles.itemAmount, item.status === 'PENDING' && { color: COLORS.gold }]}>+₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.itemSub}>{item.purpose || 'General Donation'} • {item.paymentMethod || 'CASH'}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item.receiptNo && <Text style={styles.receiptTag}>Receipt #{item.receiptNo}</Text>}
                    {item.status === 'VERIFIED' && (
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(6, 214, 160, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}
                        onPress={() => handleExportReceipt(item)}
                      >
                        {downloadingReceipt === item.id ? (
                          <ActivityIndicator size="small" color={COLORS.success} />
                        ) : (
                          <>
                            <Ionicons name="download-outline" size={14} color={COLORS.success} />
                            <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '700' }}>Download</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.status === 'PENDING' && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Verification Pending</Text>
                    </View>
                  )}
                  {item.status === 'REJECTED' && (
                    <Text style={[styles.receiptTag, { color: COLORS.error }]}>REJECTED</Text>
                  )}
                </View>
              </BlurView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Verification Modal */}
      <Modal visible={!!selectedDonation} animationType="slide" transparent={true} onRequestClose={() => setSelectedDonation(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(10, 10, 15, 0.98)' }]}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Verify Online Donation</Text>
              <TouchableOpacity onPress={() => setSelectedDonation(null)}>
                <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
              {selectedDonation?.donorName} sent ₹{selectedDonation?.amount}
            </Text>

            <ScrollView style={{ flexShrink: 1, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {selectedDonation?.screenshotS3Url ? (
                <Image source={{ uri: selectedDonation.screenshotS3Url }} style={{ width: '100%', height: 400, borderRadius: 12, backgroundColor: '#000' }} resizeMode="contain" />
              ) : (
                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textMuted }}>No screenshot provided</Text>
                </View>
              )}
            </ScrollView>

            {verifying ? (
              <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'rgba(239, 71, 111, 0.2)', borderColor: COLORS.error }]} onPress={() => handleVerify('REJECTED')}>
                  <Text style={[styles.modalBtnText, { color: COLORS.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'rgba(6, 214, 160, 0.2)', borderColor: COLORS.success }]} onPress={() => handleVerify('VERIFIED')}>
                  <Text style={[styles.modalBtnText, { color: COLORS.success }]}>Verify & Accept</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  input: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  methodRow: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  methodChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.glassCard, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  methodActive: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: COLORS.primaryOrange },
  methodText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  methodTextActive: { color: COLORS.primaryOrange },
  submitBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  emptyCard: { padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  emptyText: { fontSize: 12, color: COLORS.textMuted },
  itemCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  donorTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  itemAmount: { fontSize: 15, fontWeight: '800', color: COLORS.success },
  itemSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  receiptTag: { fontSize: 10, fontWeight: '700', color: COLORS.gold, marginTop: 4 },
  pendingBadge: { backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingText: { fontSize: 10, fontWeight: '800', color: COLORS.gold },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: COLORS.glassCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalBtnText: { fontSize: 14, fontWeight: '800' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.glassCard, borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: 8 },
  filterChipActive: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: COLORS.primaryOrange },
  filterChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.primaryOrange },
});
