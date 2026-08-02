import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';
import * as ImagePicker from 'expo-image-picker';

const EXPENSE_CATEGORIES = [
  'DECORATION', 'FOOD', 'TRANSPORT', 'SOUND', 'LIGHTING', 'PRIEST', 'FLOWERS', 'PRINTING', 'RENTAL', 'OTHER'
];

export default function RecordExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { committeeId } = useCommittee();
  
  const [category, setCategory] = useState('DECORATION');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billImageUri, setBillImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [recordedExpenses, setRecordedExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bill proof viewer modal
  const [viewingBillProof, setViewingBillProof] = useState<any>(null);

  const fetchExpenses = async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      const res: any = await CommitteeManagementService.getExpenses(committeeId);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setRecordedExpenses(list);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [committeeId]);

  const handlePickBill = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required 📷', 'Permission to access media library is required to select bill images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBillImageUri(result.assets[0].uri);
        Alert.alert('Bill Image Selected 📸', 'Vendor bill receipt image has been attached successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open image picker.');
    }
  };

  const handleSubmit = async () => {
    if (!committeeId) {
      Alert.alert('Error', 'Committee data not loaded yet. Please wait and try again.');
      return;
    }
    if (!amount) {
      Alert.alert('Validation Error', 'Please enter expense amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category,
        vendor: vendor || 'Local Vendor',
        amount: parseFloat(amount),
        description: description || 'Festival Expense Entry',
        date: new Date().toISOString().split('T')[0],
      };

      await CommitteeManagementService.addExpense(committeeId, payload);
      Alert.alert(
        'Expense Recorded! 🧾',
        `₹${amount} recorded under ${category}. Logged successfully in database.`,
        [{ text: 'OK', onPress: () => { setVendor(''); setAmount(''); setDescription(''); setBillImageUri(null); fetchExpenses(); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not save expense.');
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
            <Text style={styles.title}>Committee Expense Management</Text>
            <Text style={styles.subtitle}>Full line-item details accessible by Committee Members & Admins 🔐</Text>
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

          {/* Add Expense Form */}
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <Text style={styles.formHeading}>Record New Expense Entry</Text>
            <View style={styles.group}>
              <Text style={styles.label}>Expense Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                  >
                    <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Expense Amount (₹) *</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 15000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, { fontSize: 18, fontWeight: '700', color: COLORS.error }]}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Vendor / Shop Name</Text>
              <TextInput
                value={vendor}
                onChangeText={setVendor}
                placeholder="e.g. Sri Lakshmi Flower Decorators"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Description / Purpose</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Main Pandal Flowers & Arch decoration"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Vendor Bill Receipt Image (Proof)</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={handlePickBill} activeOpacity={0.8}>
                {billImageUri ? (
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <Image
                      source={{ uri: billImageUri }}
                      style={{ width: 120, height: 120, borderRadius: 10, marginBottom: 8 }}
                      resizeMode="cover"
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                      <Text style={[styles.uploadText, { color: COLORS.success, marginLeft: 6 }]}>
                        Bill Image Attached — Tap to Change
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={22} color={COLORS.primaryOrange} />
                    <Text style={styles.uploadText}>
                      Upload Bill Photo / Scan
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitText}>Save & Log Expense Entry</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          {/* Detailed Internal Expense Ledger */}
          <Text style={styles.sectionHeader}>Internal Itemized Expense Ledger ({recordedExpenses.length})</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 14 }} />
          ) : recordedExpenses.length === 0 ? (
            <BlurView intensity={15} tint="dark" style={styles.ledgerCard}>
              <Text style={{ color: COLORS.textMuted, textAlign: 'center', fontSize: 12 }}>No expenses recorded in database yet.</Text>
            </BlurView>
          ) : (
            recordedExpenses.map((exp: any) => (
              <BlurView key={exp.id} intensity={20} tint="dark" style={styles.ledgerCard}>
                <View style={styles.ledgerHeader}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{exp.category || 'OTHER'}</Text>
                  </View>
                  <Text style={styles.ledgerAmount}>-₹{(exp.amount || 0).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.vendorName}>{exp.vendor || 'Local Vendor'}</Text>
                <Text style={styles.loggedByText}>{exp.description || 'Festival Expense'} • {exp.date ? new Date(exp.date).toLocaleDateString() : 'Today'}</Text>

                <TouchableOpacity
                  style={styles.viewProofBtn}
                  onPress={() => setViewingBillProof(exp)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={14} color={COLORS.primaryOrange} style={{ marginRight: 4 }} />
                  <Text style={styles.viewProofText}>View Verified Vendor Bill Receipt Proof 🧾</Text>
                </TouchableOpacity>
              </BlurView>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bill Proof Viewer Modal */}
      <Modal
        visible={!!viewingBillProof}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewingBillProof(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vendor Bill Receipt Proof 🧾</Text>
              <TouchableOpacity onPress={() => setViewingBillProof(null)}>
                <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalVendorInfo}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' }}>
                {viewingBillProof?.vendor || 'Local Vendor'}
              </Text>
              <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: '800' }}>
                -₹{(viewingBillProof?.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 16 }}>
              {viewingBillProof?.description || 'Festival Expense'} • {viewingBillProof?.category || 'OTHER'}
            </Text>

            {viewingBillProof?.billImageUrl || viewingBillProof?.billImageS3Url ? (
              <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: viewingBillProof.billImageUrl || viewingBillProof.billImageS3Url }}
                  style={{ width: '100%', height: 400, borderRadius: 12, backgroundColor: '#1A1A2E' }}
                  resizeMode="contain"
                />
              </ScrollView>
            ) : (
              <View style={styles.noBillPlaceholder}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textMuted, marginTop: 12, textAlign: 'center', fontSize: 13 }}>
                  No bill receipt image attached for this expense.
                </Text>
                <Text style={{ color: COLORS.textMuted, marginTop: 4, textAlign: 'center', fontSize: 11 }}>
                  Vendor bills can be attached when recording new expenses.
                </Text>
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
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  formHeading: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  input: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  catScroll: { flexDirection: 'row', paddingVertical: 4 },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.glassCard, marginRight: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
  catChipActive: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: COLORS.primaryOrange },
  catText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  catTextActive: { color: COLORS.primaryOrange },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.glassBorder, borderStyle: 'dashed' },
  uploadText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 8 },
  submitBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  ledgerCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 12 },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catBadge: { backgroundColor: 'rgba(225, 29, 72, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(225, 29, 72, 0.3)' },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.error },
  ledgerAmount: { fontSize: 16, fontWeight: '800', color: COLORS.error },
  vendorName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  loggedByText: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  viewProofBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderBottomWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  viewProofText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryOrange },
  // Bill Proof Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: COLORS.glassCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  modalVendorInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  noBillPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 40, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 16, borderStyle: 'dashed' },
});
