import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';
import { generateAuditReportPDF } from '../../../utils/pdfGenerator';

export default function CommitteeReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { committeeId, committeeDetails } = useCommittee();
  const [loading, setLoading] = useState(true);

  const [report, setReport] = useState({
    totalDonations: 0,
    totalExpenses: 0,
    netBalance: 0,
    donationsCount: 0,
    expensesCount: 0,
    categories: [
      { category: 'DECORATION', amount: 0 },
      { category: 'FOOD & ANNADANAM', amount: 0 },
      { category: 'LIGHTING & SOUND', amount: 0 },
      { category: 'PRIEST & RITUALS', amount: 0 },
    ],
  });

  const fetchReport = async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      const res: any = await CommitteeManagementService.getDashboard(committeeId);
      if (res?.data) {
        const d = res.data;
        setReport({
          totalDonations: d.total?.donations || 0,
          totalExpenses: d.total?.expenses || 0,
          netBalance: d.total?.balance || 0,
          donationsCount: d.total?.donationCount || 0,
          expensesCount: d.total?.expenseCount || 0,
          categories: d.expenseCategories?.length > 0 
            ? d.expenseCategories.map((c: any) => ({ category: c.category, amount: c.amount }))
            : [
                { category: 'NO EXPENSES', amount: 0 },
              ],
        });
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [committeeId]);

  const handleExportPDF = async () => {
    if (!committeeId || !committeeDetails || !report) return;
    try {
      setLoading(true);
      await generateAuditReportPDF(committeeDetails, report);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not generate PDF report.');
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Financial Audit Statement</Text>
            <Text style={styles.subtitle}>Transparent village audit & expense category breakdown</Text>
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
            <LinearGradient colors={GRADIENTS.gold} style={styles.summaryCard}>
              <Text style={styles.cardLabel}>REMAINING FESTIVAL FUND</Text>
              <Text style={styles.cardAmount}>₹{report.netBalance.toLocaleString('en-IN')}</Text>
              <View style={styles.row}>
                <Text style={styles.subText}>Donations ({report.donationsCount}): ₹{report.totalDonations.toLocaleString('en-IN')}</Text>
                <Text style={styles.subText}>Spent ({report.expensesCount}): ₹{report.totalExpenses.toLocaleString('en-IN')}</Text>
              </View>
            </LinearGradient>

            {/* Export PDF Report Button */}
            <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF} activeOpacity={0.85}>
              <Ionicons name="document-text-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.pdfBtnText}>Export Audited PDF Statement</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Expenditure Breakdown</Text>
            {report.categories.map((c) => (
              <BlurView key={c.category} intensity={20} tint="dark" style={styles.catCard}>
                <Text style={styles.catName}>{c.category}</Text>
                <Text style={styles.catAmount}>₹{c.amount.toLocaleString('en-IN')}</Text>
              </BlurView>
            ))}
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
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1 },
  cardAmount: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  subText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  pdfBtn: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryOrange, marginBottom: 24 },
  pdfBtnText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  catCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 10 },
  catName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  catAmount: { fontSize: 14, fontWeight: '800', color: COLORS.error },
});
