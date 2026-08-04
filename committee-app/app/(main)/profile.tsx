import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeAuthService, CommitteeManagementService } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/ThemeContext';

export default function CommitteeProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, theme, setTheme } = useAppTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);
  
  // Password visibility toggles
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  
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

  const renderPasswordInput = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPassword: boolean,
    toggleShowPassword: () => void
  ) => (
    <View style={styles.passwordContainer}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={!showPassword}
        style={styles.passwordInput}
      />
      <TouchableOpacity
        onPress={toggleShowPassword}
        style={styles.eyeBtn}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Navigation Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Committee Officer Profile 🛕</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Administrative security & credential settings</Text>
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
            { paddingBottom: 40, paddingTop: 10 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >


          {loading ? (
            <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 30 }} />
          ) : (
            <>
              {/* Officer Info Card */}
              <BlurView intensity={isDark ? 25 : 50} tint={isDark ? "dark" : "light"} style={[styles.profileCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatar, { backgroundColor: `${colors.primaryOrange}40`, borderColor: colors.primaryOrange }]}>
                    <Text style={styles.avatarText}>{(user?.name || 'O')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'Committee Officer'}</Text>
                    <Text style={[styles.userPhone, { color: colors.textSecondary }]}>📞 {user?.phone || 'Not set'}</Text>
                    <Text style={[styles.commTag, { color: colors.gold }]}>🛕 Sri Rama Youth Committee</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: `${colors.primaryOrange}33`, borderColor: colors.primaryOrange }]}>
                    <Text style={[styles.roleText, { color: colors.primaryOrange }]}>{user?.role || 'COMMITTEE'}</Text>
                  </View>
                </View>
              </BlurView>

              {/* Theme Settings Card */}
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>App Theme 🎨</Text>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity 
                    style={[styles.themeOption, theme === 'dark' && [styles.themeOptionActive, { borderColor: colors.primaryOrange, backgroundColor: `${colors.primaryOrange}1A` }], { borderColor: colors.glassBorder, backgroundColor: colors.background }]} 
                    onPress={() => setTheme('dark')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="moon" size={24} color={theme === 'dark' ? colors.primaryOrange : colors.textSecondary} />
                    <Text style={[styles.themeOptionText, theme === 'dark' ? { color: colors.primaryOrange } : { color: colors.textSecondary }]}>Dark Mode</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.themeOption, theme === 'light' && [styles.themeOptionActive, { borderColor: colors.primaryOrange, backgroundColor: `${colors.primaryOrange}1A` }], { borderColor: colors.glassBorder, backgroundColor: colors.background }]} 
                    onPress={() => setTheme('light')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="sunny" size={24} color={theme === 'light' ? colors.primaryOrange : colors.textSecondary} />
                    <Text style={[styles.themeOptionText, theme === 'light' ? { color: colors.primaryOrange } : { color: colors.textSecondary }]}>Light Mode</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>

              {/* QR Code Upload Card */}
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>Online Donation QR Code 📱</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 16, fontSize: 13 }]}>
                  Upload your PhonePe or Google Pay QR code. Users will scan this to make online donations.
                </Text>

                {user?.committeeMemberships?.[0]?.qrCodeS3Url ? (
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Image source={{ uri: user.committeeMemberships[0].qrCodeS3Url }} style={{ width: 200, height: 200, borderRadius: 12, backgroundColor: isDark ? '#FFF' : '#F8FAFC' }} resizeMode="contain" />
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', marginBottom: 16, padding: 20, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, borderStyle: 'dashed' }}>
                    <Ionicons name="qr-code-outline" size={40} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, marginTop: 8 }}>No QR Code uploaded</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.pwBtn} onPress={handleUploadQR} disabled={uploadingQR} activeOpacity={0.85}>
                  <LinearGradient colors={GRADIENTS.festival} style={styles.pwGradient}>
                    {uploadingQR ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={[styles.pwText, { color: '#FFF' }]}>{user?.committeeMemberships?.[0]?.qrCodeS3Url ? 'Update QR Code' : 'Upload QR Code'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>

              {/* UPI ID Card */}
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>Direct UPI App Payment 🔗</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 16, fontSize: 13 }]}>
                  Configure your UPI ID so users can donate directly from their installed UPI apps (PhonePe, GPay).
                </Text>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Committee UPI ID</Text>
                  <TextInput
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. sriramayouth@ybl"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', color: colors.textPrimary, borderColor: colors.glassBorder }]}
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
                        <Text style={[styles.pwText, { color: '#FFF' }]}>Update UPI ID</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>

              {/* Change Password Card */}
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>Change Officer Password 🔐</Text>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password *</Text>
                  {renderPasswordInput(
                    currentPassword,
                    setCurrentPassword,
                    'Enter current password',
                    showCurrentPw,
                    () => setShowCurrentPw(!showCurrentPw)
                  )}
                </View>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>New Password *</Text>
                  {renderPasswordInput(
                    newPassword,
                    setNewPassword,
                    'Enter minimum 6 characters',
                    showNewPw,
                    () => setShowNewPw(!showNewPw)
                  )}
                </View>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password *</Text>
                  {renderPasswordInput(
                    confirmPassword,
                    setConfirmPassword,
                    'Re-enter new password',
                    showConfirmPw,
                    () => setShowConfirmPw(!showConfirmPw)
                  )}
                </View>

                <TouchableOpacity style={styles.pwBtn} onPress={handleChangePassword} disabled={updatingPw} activeOpacity={0.85}>
                  <LinearGradient colors={GRADIENTS.festival} style={styles.pwGradient}>
                    {updatingPw ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="key-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={[styles.pwText, { color: '#FFF' }]}>Update Officer Password</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>

              {/* Logout Action Button */}
              <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.glassCard, borderColor: `${colors.error}4D` }]} onPress={handleLogout} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Logout Officer Account</Text>
              </TouchableOpacity>
            </>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  profileCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1 },
  avatarText: { fontSize: 20, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800' },
  userPhone: { fontSize: 12, marginTop: 2 },
  commTag: { fontSize: 11, marginTop: 2, fontWeight: '700' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  roleText: { fontSize: 10, fontWeight: '800' },
  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
  cardHeader: { fontSize: 15, fontWeight: '800', marginBottom: 16 },
  group: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, borderWidth: 1 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pwBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  pwGradient: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pwText: { fontWeight: '800', fontSize: 14 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontWeight: '800', fontSize: 14 },
  themeOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1 },
  themeOptionActive: { borderWidth: 1 },
  themeOptionText: { fontSize: 12, fontWeight: '700', marginTop: 8 },
});
