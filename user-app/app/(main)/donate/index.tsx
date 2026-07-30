import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DonationService, CommitteeService } from '../../../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { generateDonationReceiptPDF } from '../../../utils/pdfGenerator';

export default function UserDonateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialCommId = typeof params?.committeeId === 'string' ? params.committeeId : null;

  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(initialCommId ? 2 : 1);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('1116');
  const [submitting, setSubmitting] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);

  const [committees, setCommittees] = useState<any[]>([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(initialCommId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingComm, setIsFetchingComm] = useState(false);

  const [myReceipts, setMyReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  const handleExportReceipt = async (donation: any) => {
    try {
      setDownloadingReceipt(donation.id);
      await generateDonationReceiptPDF({ name: donation.committeeName }, donation);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate receipt PDF');
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const presetAmounts = ['501', '1116', '2500', '5000', '10000'];

  const fetchReceipts = async () => {
    try {
      setLoadingReceipts(true);
      const donRes: any = await DonationService.getMyDonations().catch(() => []);
      const donList = Array.isArray(donRes) ? donRes : (Array.isArray(donRes?.data) ? donRes.data : []);
      setMyReceipts(donList);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const fetchCommittees = async (query = '') => {
    try {
      setIsFetchingComm(true);
      const commRes: any = await CommitteeService.getAll({ search: query }).catch(() => []);
      const commList = Array.isArray(commRes) ? commRes : (Array.isArray(commRes?.data) ? commRes.data : []);
      setCommittees(commList);
    } catch (err) {
      console.error('Failed to fetch committees:', err);
    } finally {
      setIsFetchingComm(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    if (step === 1) {
      fetchCommittees();
    } else if (initialCommId && committees.length === 0) {
      fetchCommittees();
    }
  }, [step]);

  useEffect(() => {
    if (step === 1) {
      const delay = setTimeout(() => {
        fetchCommittees(searchQuery);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [searchQuery]);

  const handleGetNearby = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions to find nearby committees.');
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const commRes: any = await CommitteeService.getNearby(location.coords.latitude, location.coords.longitude, 50).catch(() => []);
      const commList = Array.isArray(commRes) ? commRes : (Array.isArray(commRes?.data) ? commRes.data : []);
      setCommittees(commList);
    } catch (err) {
      Alert.alert('Error', 'Failed to get location or fetch nearby committees.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleDonateSubmit = async () => {
    if (!donorName || !amount) {
      Alert.alert('Validation Error', 'Please enter your name and donation amount.');
      return;
    }

    const selectedComm = committees.find(c => c.id === selectedCommitteeId);
    if (selectedComm?.qrCodeS3Url && !screenshotUri) {
      Alert.alert('Validation Error', 'Please upload a screenshot of your successful UPI payment.');
      return;
    }

    try {
      setSubmitting(true);
      const res: any = await DonationService.create({
        committeeId: selectedCommitteeId || 'comm-kovvur-101',
        donorName,
        donorPhone: donorPhone || undefined,
        amount: amount,
        purpose: description.trim() ? description : 'Public Festival Contribution',
        paymentMethod: 'UPI',
      }, screenshotUri || undefined);

      if (screenshotUri) {
        Alert.alert(
          'Payment Under Review ⏳',
          `Your payment is under review. It will be verified within 24 hours and your donation receipt will generate after payment confirmation.`,
          [{ text: 'OK', onPress: () => { setDonorName(''); setDonorPhone(''); setDescription(''); setAmount('1116'); setScreenshotUri(null); setStep(1); fetchReceipts(); } }]
        );
      } else {
        Alert.alert(
          'Donation Successful! 💐',
          `Thank you ${donorName}! Your contribution of ₹${amount} has been received. Digital Receipt #${res?.data?.receiptNo || 'UTS-2026-REC'} issued to your account.`,
          [{ text: 'OK', onPress: () => { setDonorName(''); setDonorPhone(''); setDescription(''); setAmount('1116'); setScreenshotUri(null); setStep(1); fetchReceipts(); } }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not process donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectUpiPay = async () => {
    const selectedComm = committees.find(c => c.id === selectedCommitteeId);
    if (!selectedComm?.upiId) return;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid amount.');
      return;
    }

    const upiUrl = `upi://pay?pa=${selectedComm.upiId}&pn=${encodeURIComponent(selectedComm.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Donation for Festival')}`;

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
        Alert.alert(
          'Complete Payment',
          'After successful payment in your UPI app, please return here and upload the screenshot to get your digital receipt!'
        );
      } else {
        Alert.alert('No UPI App', 'Could not detect a UPI app. Please scan the QR code to pay.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open UPI app.');
    }
  };

  const handlePickScreenshot = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshotUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const selectedComm = committees.find(c => c.id === selectedCommitteeId);

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (step === 2) setStep(1);
            else router.back();
          }} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Festival Annadanam 🪔</Text>
            <Text style={styles.subtitle}>Your contribution helps conduct the festival grandly</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
      >


        {step === 1 && (
          <View>
            <BlurView intensity={20} tint="dark" style={[styles.glassCard, { marginBottom: 16 }]}>
              <Text style={styles.sectionTitle}>Select a Committee</Text>

              <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or village..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    style={styles.searchInput}
                  />
                </View>
                <TouchableOpacity style={styles.locationBtn} onPress={handleGetNearby} disabled={isLocating}>
                  {isLocating ? <ActivityIndicator size="small" color="#FF6B35" /> : <Ionicons name="location" size={22} color="#FF6B35" />}
                </TouchableOpacity>
              </View>

              {isFetchingComm ? (
                <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 20 }} />
              ) : committees.length === 0 ? (
                <Text style={styles.emptyText}>No committees found.</Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {committees.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.committeeCard}
                      onPress={() => {
                        setSelectedCommitteeId(c.id);
                        setStep(2);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.committeeName}>🛕 {c.name}</Text>
                        <Text style={styles.committeeLocation}>{c.village} • {c.district}</Text>
                      </View>
                      <View style={styles.donateBtnSmall}>
                        <Text style={styles.donateBtnSmallText}>Donate</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </BlurView>
          </View>
        )}

        {step === 2 && selectedComm && (
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>

            {/* Payment Verification Note */}
            <View style={styles.verificationNoteCard}>
              <Ionicons name="time-outline" size={24} color={COLORS.warning} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.verificationNoteTitle}>Payment Verification Process ⏳</Text>
                <Text style={styles.verificationNoteText}>
                  Your uploaded payment screenshot will be manually verified by the committee. An official digital receipt will be issued within 24-48 hours of successful verification.
                </Text>
              </View>
            </View>

            <View style={styles.selectedCommHeader}>
              <Text style={styles.label}>Selected Committee</Text>
              <Text style={styles.presetTextActive}>🛕 {selectedComm.name} ({selectedComm.village})</Text>
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Select Contribution Amount (₹)</Text>
              <View style={styles.presetRow}>
                {presetAmounts.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => setAmount(amt)}
                    style={[styles.presetChip, amount === amt && styles.presetChipActive]}
                  >
                    <Text style={[styles.presetText, amount === amt && styles.presetTextActive]}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Custom Amount"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                style={styles.inputHighlight}
              />
            </View>

            {selectedComm.upiId && (
              <View style={styles.group}>
                <TouchableOpacity style={styles.upiIntentBtn} onPress={handleDirectUpiPay} activeOpacity={0.85}>
                  <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
                    <Ionicons name="scan-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>Pay with UPI App</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 12 }}>OR</Text>
              </View>
            )}

            {selectedComm.qrCodeS3Url && (
              <View style={styles.group}>
                <Text style={styles.label}>Scan to Pay via UPI *</Text>

                <View style={styles.qrContainer}>
                  <LinearGradient colors={['rgba(255,107,53,0.1)', 'rgba(214,40,40,0.05)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.qrWrapper}>
                    <Image source={{ uri: selectedComm.qrCodeS3Url }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.qrHelperText}>Scan using PhonePe, GPay, or Paytm</Text>
                </View>

                <TouchableOpacity style={[styles.uploadBtn, screenshotUri && styles.uploadBtnSuccess]} onPress={handlePickScreenshot} activeOpacity={0.8}>
                  <Ionicons name={screenshotUri ? "checkmark-circle" : "cloud-upload-outline"} size={22} color={screenshotUri ? '#06D6A0' : "#FFF"} style={{ marginRight: 8 }} />
                  <Text style={[styles.uploadText, screenshotUri && { color: '#06D6A0' }]}>
                    {screenshotUri ? 'Payment Screenshot Attached' : 'Upload Payment Screenshot'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.group}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={donorName}
                onChangeText={setDonorName}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                value={donorPhone}
                onChangeText={setDonorPhone}
                placeholder="10-digit number"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Message / Description (Optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Any specific purpose or message?"
                placeholderTextColor={COLORS.textSecondary}
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleDonateSubmit} disabled={submitting} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.gold} style={styles.submitGradient}>
                {submitting ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>Submit Payment Proof</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        )}

        {/* User's Personal Donation Receipts Section */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>My Donation Receipts</Text>
            {loadingReceipts ? (
              <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 20 }} />
            ) : myReceipts.length === 0 ? (
              <BlurView intensity={15} tint="dark" style={styles.emptyReceiptCard}>
                <Ionicons name="receipt-outline" size={32} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.emptyText}>You have no recorded donation receipts yet.</Text>
              </BlurView>
            ) : (
              myReceipts.map((rec) => (
                <BlurView key={rec.id} intensity={25} tint="dark" style={styles.receiptCard}>
                  <View style={styles.receiptHeader}>
                    <Text style={styles.receiptNo}>Receipt #{rec.receiptNo || 'UTS-2026-REC'}</Text>
                    <Text style={styles.receiptAmount}>+₹{(rec.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.donorTitle}>Donor: {rec.donorName || 'You'}</Text>
                  <Text style={styles.receiptMeta}>
                    🛕 {rec.committeeName || 'Sri Rama Youth Committee'} • {rec.purpose || 'Festival Contribution'} • {rec.paymentMethod || 'UPI'}
                  </Text>
                  {rec.status === 'PENDING' && (
                    <Text style={{ fontSize: 11, color: '#FCBF49', marginTop: 4, fontWeight: '700' }}>Verification Pending ⏳</Text>
                  )}
                  {rec.status === 'REJECTED' && (
                    <Text style={{ fontSize: 11, color: '#EF476F', marginTop: 4, fontWeight: '700' }}>Payment Rejected ❌</Text>
                  )}
                  <Text style={styles.receiptDate}>📅 {rec.date ? new Date(rec.date).toLocaleDateString() : 'Recent'}</Text>

                  {rec.status === 'VERIFIED' && (
                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={() => handleExportReceipt(rec)}
                      activeOpacity={0.8}
                      disabled={downloadingReceipt === rec.id}
                    >
                      {downloadingReceipt === rec.id ? (
                        <ActivityIndicator size="small" color="#06D6A0" style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="download-outline" size={14} color="#06D6A0" style={{ marginRight: 4 }} />
                      )}
                      <Text style={styles.downloadText}>Download Official Digital Receipt PDF</Text>
                    </TouchableOpacity>
                  )}
                </BlurView>
              ))
            )}
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
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },

  // Search & Committee List Styles
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchInput: { flex: 1, color: COLORS.textPrimary, paddingVertical: 12, fontSize: 14 },
  locationBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  committeeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  committeeName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  committeeLocation: { fontSize: 12, color: COLORS.textSecondary },
  donateBtnSmall: { backgroundColor: COLORS.primaryOrange, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  donateBtnSmallText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 },

  // Donation Form Styles
  verificationNoteCard: { flexDirection: 'row', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', marginBottom: 20, alignItems: 'center' },
  verificationNoteTitle: { fontSize: 14, fontWeight: '800', color: COLORS.warning, marginBottom: 4 },
  verificationNoteText: { fontSize: 12, color: COLORS.textPrimary, lineHeight: 18 },
  selectedCommHeader: { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },

  group: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: COLORS.glassCard, borderWidth: 1, borderColor: COLORS.glassBorder },
  presetChipActive: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: COLORS.primaryOrange },
  presetText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.primaryOrange },
  inputHighlight: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, color: COLORS.gold, fontSize: 18, fontWeight: '800', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)' },
  input: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  submitBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 },
  upiIntentBtn: { height: 52, borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  emptyReceiptCard: { padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  emptyText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  receiptCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.08)', marginBottom: 12 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  receiptNo: { fontSize: 12, fontWeight: '800', color: COLORS.success, letterSpacing: 0.5 },
  receiptAmount: { fontSize: 18, fontWeight: '900', color: COLORS.success },
  donorTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  receiptMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  receiptDate: { fontSize: 10, color: COLORS.gold, marginTop: 4, fontWeight: '600' },
  downloadBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' },
  downloadText: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.glassCard, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderStyle: 'dashed' },
  uploadBtnSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)', borderStyle: 'solid' },
  uploadText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  qrContainer: { overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  qrWrapper: { padding: 12, backgroundColor: '#FFF', borderRadius: 16, shadowColor: COLORS.primaryOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, marginBottom: 16 },
  qrImage: { width: 180, height: 180 },
  qrHelperText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
});
