import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GRADIENTS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../services/api';
import { useCommittee } from './_layout';
import { useAppTheme } from '../../context/ThemeContext';

export default function CommitteeDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
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
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Top Header */}
      <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.headerBlur, { paddingTop: insets.top + 10, borderBottomColor: colors.glassBorder, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)' }]}>
        <View style={styles.headerRow}>
          <View style={{ marginRight: 12, justifyContent: 'center' }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.committeeTitle, { color: colors.textPrimary }]} numberOfLines={1}>{committeeDetails?.name || 'Loading...'}</Text>
              <View style={[styles.badgeApproved, { backgroundColor: `${colors.success}26`, borderColor: `${colors.success}66` }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>{committeeDetails?.status || 'Active'}</Text>
              </View>
            </View>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>📍 {committeeDetails?.village}, {committeeDetails?.district}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
              <View style={[styles.notificationDot, { backgroundColor: colors.error, borderColor: colors.background }]} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryOrange} />}
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
              <Text style={[styles.balanceSubVal, { color: '#FFF' }]}>₹{stats.totalDonations.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceCol}>
              <Text style={styles.balanceSubLabel}>Total Expenses</Text>
              <Text style={[styles.balanceSubVal, { color: '#FFF' }]}>₹{stats.totalExpenses.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Header */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Management Controls</Text>

        <View style={styles.actionGrid}>
          {/* Record Donation */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/donations')}
            activeOpacity={0.85}
          >
            <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.actionBlur, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={[styles.actionIconBg, { backgroundColor: `${colors.success}26` }]}>
                <Ionicons name="cash-outline" size={20} color={colors.success} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Add Donation</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>Cash or UPI entries</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Record Expense */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/expenses')}
            activeOpacity={0.85}
          >
            <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.actionBlur, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={[styles.actionIconBg, { backgroundColor: `${colors.error}26` }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.error} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Add Expense</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>Upload bill & log cost</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Manage Events */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/events')}
            activeOpacity={0.85}
          >
            <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.actionBlur, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={[styles.actionIconBg, { backgroundColor: `${colors.primaryOrange}26` }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.primaryOrange} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Festival Events</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>Schedules & programs</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Members */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/members')}
            activeOpacity={0.85}
          >
            <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.actionBlur, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={[styles.actionIconBg, { backgroundColor: `${colors.saffron}26` }]}>
                <Ionicons name="people-outline" size={20} color={colors.saffron} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Members ({stats.membersCount})</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>Role assignments</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Upload Reel */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/reels')}
            activeOpacity={0.85}
          >
            <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.actionBlur, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={[styles.actionIconBg, { backgroundColor: `${colors.gold}26` }]}>
                <Ionicons name="videocam-outline" size={20} color={colors.gold} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Post Reel</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>Share festival video</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Financial Reports */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/reports')}
            activeOpacity={0.85}
          >
            <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.actionBlur, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
              <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(248, 250, 252, 0.15)' : 'rgba(0,0,0,0.1)' }]}>
                <Ionicons name="document-text-outline" size={20} color={isDark ? colors.cream : colors.textPrimary} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Reports</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>Audited PDF & summary</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Today Summary */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Today's Summary</Text>
        <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.summaryCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Collected Today</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>+₹{stats.todayDonations.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.glassBorder }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Spent Today</Text>
            <Text style={[styles.summaryAmount, { color: colors.error }]}>-₹{stats.todayExpenses.toLocaleString('en-IN')}</Text>
          </View>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerBlur: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerAvatarBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTextContainer: { flex: 1, marginHorizontal: 12 },
  committeeTitle: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  locationText: { fontSize: 11, marginTop: 4 },
  badgeApproved: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  balanceCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 1 },
  balanceAmount: { fontSize: 32, fontWeight: '900', color: '#FFF', marginVertical: 8 },
  balanceFooter: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)' },
  balanceCol: { flex: 1 },
  divider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 12 },
  balanceSubLabel: { fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' },
  balanceSubVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  sectionHeader: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  actionCard: { width: '31%', marginBottom: 8, borderRadius: 12, overflow: 'hidden', height: 120 },
  actionBlur: { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-start' },
  actionIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionTitle: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  actionSub: { fontSize: 9, marginTop: 2, textAlign: 'center' },
  summaryCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryText: { fontSize: 12 },
  summaryAmount: { fontSize: 14, fontWeight: '800' },
  summaryDivider: { height: 1, marginVertical: 12 },
});
