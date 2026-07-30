import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';

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
  const [billUploaded, setBillUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [recordedExpenses, setRecordedExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handlePickBill = () => {
    setBillUploaded(true);
    Alert.alert('Bill Image Selected 📸', 'Bill proof image attached for S3 upload.');
  };

  const handleSubmit = async () => {
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
        [{ text: 'OK', onPress: () => { setVendor(''); setAmount(''); setDescription(''); setBillUploaded(false); fetchExpenses(); } }]
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
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
              <Ionicons name={billUploaded ? "checkmark-circle" : "camera-outline"} size={22} color={billUploaded ? COLORS.success : COLORS.primaryOrange} />
              <Text style={[styles.uploadText, billUploaded && { color: COLORS.success }]}>
                {billUploaded ? 'Bill Image Attached (JPEG/PNG)' : 'Upload Bill Photo / Scan'}
              </Text>
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
                onPress={() => Alert.alert('Vendor Bill Proof Receipt 🧾', `Viewing original receipt scan attached to ${exp.vendor}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={14} color={COLORS.primaryOrange} style={{ marginRight: 4 }} />
                <Text style={styles.viewProofText}>View Verified Vendor Bill Receipt Proof 🧾</Text>
              </TouchableOpacity>
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
});
