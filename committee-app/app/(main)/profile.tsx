import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeAuthService, CommitteeManagementService } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function CommitteeProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);
  
  const [upiId, setUpiId] = useState('');
  const [updatingUpi, setUpdatingUpi] = useState(false);
  
  const [uploadingQR, setUploadingQR] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await CommitteeAuthService.getProfile();
      if (res?.data) {
        setUser(res.data);
        if (res.data.committeeMemberships?.[0]?.upiId) {
          setUpiId(res.data.committeeMemberships[0].upiId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch officer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please enter your current and new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return;
    }

    try {
      setUpdatingPw(true);
      await CommitteeAuthService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password Updated! 🔐', 'Your committee officer password has been updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not update password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  const handleUpdateUpiId = async () => {
    if (!upiId) {
      Alert.alert('Validation Error', 'Please enter a valid UPI ID (e.g. name@okhdfcbank).');
      return;
    }
    
    try {
      setUpdatingUpi(true);
      const committeeId = user?.committeeMemberships?.[0]?.committeeId;
      if (!committeeId) throw new Error('Committee ID not found.');
      
      await CommitteeManagementService.updateCommittee(committeeId, { upiId });
      Alert.alert('Success', 'UPI ID updated successfully! Users can now pay directly via their UPI apps.');
      fetchProfile();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not update UPI ID.');
    } finally {
      setUpdatingUpi(false);
    }
  };

  const handleUploadQR = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setUploadingQR(true);
        // Assuming committee ID is user.committeeId. Let's see if it's available.
        // Wait, the user object returned from /auth/me might not have committeeId at root.
        // Let's use user.memberships[0].committeeId or user.committeeId.
        const committeeId = user?.committeeMemberships?.[0]?.committeeId;
        
        if (!committeeId) {
          Alert.alert('Error', 'Committee ID not found for this user.');
          return;
        }

        await CommitteeManagementService.uploadQRCode(committeeId, imageUri);
        Alert.alert('Success', 'QR Code uploaded successfully!');
        fetchProfile(); // Refresh to get the new QR Code URL
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to upload QR code.');
    } finally {
      setUploadingQR(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Officer Logout',
      'Are you sure you want to log out of Committee Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await CommitteeAuthService.logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
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
            <Text style={styles.title}>Committee Officer Profile 🛕</Text>
            <Text style={styles.subtitle}>Administrative security & credential settings</Text>
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
            {/* Officer Info Card */}
            <BlurView intensity={25} tint="dark" style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(user?.name || 'O')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user?.name || 'Committee Officer'}</Text>
                  <Text style={styles.userPhone}>📞 {user?.phone || 'Not set'}</Text>
                  <Text style={styles.commTag}>🛕 Sri Rama Youth Committee</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user?.role || 'COMMITTEE'}</Text>
                </View>
              </View>
            </BlurView>

            {/* QR Code Upload Card */}
            <BlurView intensity={20} tint="dark" style={styles.glassCard}>
              <Text style={styles.cardHeader}>Online Donation QR Code 📱</Text>
              <Text style={[styles.subtitle, { color: COLORS.textSecondary, marginBottom: 16, fontSize: 13 }]}>
                Upload your PhonePe or Google Pay QR code. Users will scan this to make online donations.
              </Text>

              {user?.committeeMemberships?.[0]?.qrCodeS3Url ? (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Image source={{ uri: user.committeeMemberships[0].qrCodeS3Url }} style={{ width: 200, height: 200, borderRadius: 12, backgroundColor: '#FFF' }} resizeMode="contain" />
                </View>
              ) : (
                <View style={{ alignItems: 'center', marginBottom: 16, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12, borderStyle: 'dashed' }}>
                  <Ionicons name="qr-code-outline" size={40} color={COLORS.textMuted} />
                  <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>No QR Code uploaded</Text>
                </View>
              )}

              <TouchableOpacity style={styles.pwBtn} onPress={handleUploadQR} disabled={uploadingQR} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.pwGradient}>
                  {uploadingQR ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.pwText}>{user?.committeeMemberships?.[0]?.qrCodeS3Url ? 'Update QR Code' : 'Upload QR Code'}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            {/* UPI ID Card */}
            <BlurView intensity={20} tint="dark" style={styles.glassCard}>
              <Text style={styles.cardHeader}>Direct UPI App Payment 🔗</Text>
              <Text style={[styles.subtitle, { color: COLORS.textSecondary, marginBottom: 16, fontSize: 13 }]}>
                Configure your UPI ID so users can donate directly from their installed UPI apps (PhonePe, GPay).
              </Text>

              <View style={styles.group}>
                <Text style={styles.label}>Committee UPI ID</Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="e.g. sriramayouth@ybl"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={styles.pwBtn} onPress={handleUpdateUpiId} disabled={updatingUpi} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.pwGradient}>
                  {updatingUpi ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="link-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.pwText}>Update UPI ID</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            {/* Change Password Card */}
            <BlurView intensity={20} tint="dark" style={styles.glassCard}>
              <Text style={styles.cardHeader}>Change Officer Password 🔐</Text>

              <View style={styles.group}>
                <Text style={styles.label}>Current Password *</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>New Password *</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter minimum 6 characters"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Confirm New Password *</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.pwBtn} onPress={handleChangePassword} disabled={updatingPw} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.pwGradient}>
                  {updatingPw ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="key-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.pwText}>Update Officer Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            {/* Logout Action Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Logout Officer Account</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  profileCard: { borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 107, 53, 0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: COLORS.primaryOrange },
  avatarText: { fontSize: 20, fontWeight: '900', color: COLORS.primaryOrange },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  userPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  commTag: { fontSize: 11, color: COLORS.gold, marginTop: 2, fontWeight: '700' },
  roleBadge: { backgroundColor: 'rgba(255, 107, 53, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primaryOrange },
  roleText: { fontSize: 10, fontWeight: '800', color: COLORS.primaryOrange },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  cardHeader: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  group: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },
  pwBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  pwGradient: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pwText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239, 71, 111, 0.15)', paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 71, 111, 0.4)' },
  logoutText: { color: COLORS.error, fontWeight: '800', fontSize: 14 },
});
