import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeManagementService } from '../../../services/api';
import { useCommittee } from '../_layout';

export default function MembersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { committeeId } = useCommittee();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');

  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      const res: any = await CommitteeManagementService.getMembers(committeeId);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setMembersList(list);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [committeeId]);

  const handleAddMember = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Validation Error', 'Please enter member name (at least 2 characters).');
      return;
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!committeeId) {
      Alert.alert('Error', 'Committee data not loaded yet. Please wait and try again.');
      return;
    }

    try {
      setSubmitting(true);
      await CommitteeManagementService.addMember(committeeId, { name: name.trim(), phone, role });

      Alert.alert(
        'Member Added! 👥',
        `Phone ${phone} has been assigned as ${role}.\n\nLogin credentials:\nUsername: ${phone}\nPassword: ${phone}`,
        [{ text: 'OK', onPress: () => { setName(''); setPhone(''); fetchMembers(); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not add member.');
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
            <Text style={styles.title}>Committee Members Management</Text>
            <Text style={styles.subtitle}>Assign roles & administrative permissions to festival officers</Text>
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


        {/* Add Member Card */}
        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          <Text style={styles.cardHeader}>Add New Committee Officer / Member</Text>

          <View style={styles.group}>
            <Text style={styles.label}>Officer Full Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Ramesh Varma" placeholderTextColor={COLORS.textMuted} style={styles.input} />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Mobile Phone Number (Login ID) *</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="10-digit phone" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" style={styles.input} />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Member Role</Text>
            <View style={styles.roleRow}>
              {(['MEMBER', 'ADMIN'] as const).map((r) => (
                <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleChip, role === r && styles.roleChipActive]}>
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity onPress={handleAddMember} disabled={submitting} activeOpacity={0.85}>
            <LinearGradient colors={GRADIENTS.festival} style={styles.btn}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnText}>Add Member & Grant Permissions</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        {/* Active Members List */}
        <Text style={styles.sectionTitle}>Active Officers & Members ({membersList.length})</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primaryOrange} style={{ marginVertical: 14 }} />
        ) : membersList.length === 0 ? (
          <BlurView intensity={15} tint="dark" style={styles.memberCard}>
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', fontSize: 12 }}>No committee members found in database.</Text>
          </BlurView>
        ) : (
          membersList.map((m: any) => (
            <BlurView key={m.id} intensity={20} tint="dark" style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>{(m.user?.name || m.name || 'M')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.user?.name || m.name || 'Committee Officer'}</Text>
                <Text style={styles.memberPhone}>📞 {m.user?.phone || m.phone || '9876543210'}</Text>
              </View>
              <View style={[styles.roleBadge, m.role === 'ADMIN' && { backgroundColor: 'rgba(255, 107, 53, 0.2)', borderColor: COLORS.primaryOrange }]}>
                <Text style={[styles.roleBadgeText, m.role === 'ADMIN' && { color: COLORS.primaryOrange }]}>{m.role || 'MEMBER'}</Text>
              </View>
            </BlurView>
          ))
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  glassCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  cardHeader: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  group: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: { backgroundColor: COLORS.glassCard, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12, padding: 12, color: COLORS.textPrimary, fontSize: 13 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', backgroundColor: COLORS.glassCard },
  roleChipActive: { backgroundColor: COLORS.primaryOrange, borderColor: COLORS.primaryOrange },
  roleChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  roleChipTextActive: { color: '#FFF' },
  btn: { padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 10 },
  memberAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.primaryOrange },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  memberPhone: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
});
