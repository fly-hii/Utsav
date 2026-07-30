import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../services/api';
import { useCommittee } from './_layout';

export default function CommitteeDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { committeeId, committeeDetails } = useCommittee();

  const [stats, setStats] = useState({
    todayDonations: 0,
    todayExpenses: 0,
    totalDonations: 0,
    totalExpenses: 0,
    netBalance: 0,
    membersCount: 0,
  });

  const fetchDashboardData = async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      const res: any = await CommitteeManagementService.getDashboard(committeeId);
      const d = res?.data || res;
      if (d && d.total) {
        setStats({
          todayDonations: d.today?.donations || 0,
          todayExpenses: d.today?.expenses || 0,
          totalDonations: d.total?.donations || 0,
          totalExpenses: d.total?.expenses || 0,
          netBalance: d.total?.balance || 0,
          membersCount: d.memberCount || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch committee dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [committeeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Top Header */}
      <BlurView intensity={30} tint="dark" style={[styles.headerBlur, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <View style={{ marginRight: 12, justifyContent: 'center' }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.committeeTitle} numberOfLines={1}>{committeeDetails?.name || 'Loading...'}</Text>
              <View style={styles.badgeApproved}>
                <Text style={styles.badgeText}>{committeeDetails?.status || 'Active'}</Text>
              </View>
            </View>
            <Text style={styles.locationText}>📍 {committeeDetails?.village}, {committeeDetails?.district}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(main)/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryOrange} />}
      >

        {/* Net Balance Card */}
        <LinearGradient colors={GRADIENTS.festival} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>NET FESTIVAL BALANCE</Text>
          {loading ? (
            <ActivityIndicator color="#FFF" style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.balanceAmount}>₹{stats.netBalance.toLocaleString('en-IN')}</Text>
          )}
          <View style={styles.balanceFooter}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceSubLabel}>Total Donations</Text>
              <Text style={styles.balanceSubVal}>₹{stats.totalDonations.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceCol}>
              <Text style={styles.balanceSubLabel}>Total Expenses</Text>
              <Text style={styles.balanceSubVal}>₹{stats.totalExpenses.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Header */}
        <Text style={styles.sectionHeader}>Management Controls</Text>

        <View style={styles.actionGrid}>
          {/* Record Donation */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/donations')}
            activeOpacity={0.85}
          >
            <BlurView intensity={25} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="cash-outline" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.actionTitle}>Add Donation</Text>
              <Text style={styles.actionSub}>Cash or UPI entries</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Record Expense */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/expenses')}
            activeOpacity={0.85}
          >
            <BlurView intensity={25} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="receipt-outline" size={24} color={COLORS.error} />
              </View>
              <Text style={styles.actionTitle}>Add Expense</Text>
              <Text style={styles.actionSub}>Upload bill & log cost</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Manage Events */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/events')}
            activeOpacity={0.85}
          >
            <BlurView intensity={25} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={24} color={COLORS.primaryOrange} />
              </View>
              <Text style={styles.actionTitle}>Festival Events</Text>
              <Text style={styles.actionSub}>Schedules & programs</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Members */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/members')}
            activeOpacity={0.85}
          >
            <BlurView intensity={25} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(217, 119, 6, 0.15)' }]}>
                <Ionicons name="people-outline" size={24} color={COLORS.saffron} />
              </View>
              <Text style={styles.actionTitle}>Members ({stats.membersCount})</Text>
              <Text style={styles.actionSub}>Role assignments</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Upload Reel */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/reels')}
            activeOpacity={0.85}
          >
            <BlurView intensity={25} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="videocam-outline" size={24} color={COLORS.gold} />
              </View>
              <Text style={styles.actionTitle}>Post Reel</Text>
              <Text style={styles.actionSub}>Share festival video</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Financial Reports */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/reports')}
            activeOpacity={0.85}
          >
            <BlurView intensity={25} tint="dark" style={styles.actionBlur}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(248, 250, 252, 0.15)' }]}>
                <Ionicons name="document-text-outline" size={24} color={COLORS.cream} />
              </View>
              <Text style={styles.actionTitle}>Reports</Text>
              <Text style={styles.actionSub}>Audited PDF & summary</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Today Summary */}
        <Text style={styles.sectionHeader}>Today's Summary</Text>
        <BlurView intensity={25} tint="dark" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Collected Today</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.success }]}>+₹{stats.todayDonations.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Spent Today</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.error }]}>-₹{stats.todayExpenses.toLocaleString('en-IN')}</Text>
          </View>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerBlur: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerAvatarBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  headerTextContainer: { flex: 1, marginHorizontal: 12 },
  committeeTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, flexShrink: 1 },
  locationText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  badgeApproved: { backgroundColor: 'rgba(6, 214, 160, 0.15)', borderWidth: 1, borderColor: 'rgba(6, 214, 160, 0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.success },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1, borderColor: '#1E293B' },
  balanceCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1 },
  balanceAmount: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginVertical: 8 },
  balanceFooter: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)' },
  balanceCol: { flex: 1 },
  divider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 12 },
  balanceSubLabel: { fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' },
  balanceSubVal: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: { width: '48%', marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  actionBlur: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  actionIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  actionSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  summaryCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryText: { fontSize: 12, color: COLORS.textSecondary },
  summaryAmount: { fontSize: 14, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginVertical: 12 },
});
