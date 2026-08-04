import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthService } from '../../services/api';
import { GRADIENTS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, theme, setTheme } = useAppTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await AuthService.getProfile();
      if (res?.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditPhotoUri(null);
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditPhotoUri(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    try {
      setUpdatingProfile(true);
      await AuthService.updateProfile({ name: editName }, editPhotoUri || undefined);
      Alert.alert('Success', 'Profile updated successfully!');
      setEditModalVisible(false);
      fetchProfile();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update profile.');
    } finally {
      setUpdatingProfile(false);
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
      await AuthService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password Updated! 🔐', 'Your account password has been updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not update password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out of your Utsav account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassCard }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>My Account Profile 👤</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Account settings, security & password management</Text>
          </View>
          <View style={{ justifyContent: 'center', marginLeft: 10 }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 40, height: 40, borderRadius: 10, resizeMode: 'cover' }} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20, paddingTop: 10 },
        ]}
      >


        {loading ? (
          <ActivityIndicator color={colors.primaryOrange} style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Profile Info Card */}
            <BlurView intensity={isDark ? 25 : 40} tint={isDark ? "dark" : "light"} style={[styles.profileCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
              <TouchableOpacity style={[styles.editProfileBtn, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]} onPress={openEditModal} activeOpacity={0.8}>
                <Ionicons name="pencil" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.avatarRow}>
                <View style={[styles.avatar, { backgroundColor: `${colors.gold}33`, borderColor: `${colors.gold}66` }]}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                  ) : (
                    <Text style={[styles.avatarText, { color: colors.gold }]}>{(user?.name || 'U')[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.gold }]}>{user?.name || 'Villager Account'}</Text>
                  <Text style={[styles.userPhone, { color: colors.textPrimary }]}>📞 {user?.phone || 'Not set'}</Text>
                  {user?.email && <Text style={[styles.userEmail, { color: colors.textSecondary }]}>✉️ {user.email}</Text>}
                </View>
                <View style={[styles.roleBadge, { backgroundColor: `${colors.success}33`, borderColor: `${colors.success}66` }]}>
                  <Text style={[styles.roleText, { color: colors.success }]}>{user?.role || 'USER'}</Text>
                </View>
              </View>
            </BlurView>

            {/* Theme Settings Card */}
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.sectionCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
              <View style={[styles.sectionTitleRow, { borderBottomColor: colors.glassBorder }]}>
                <Ionicons name="color-palette" size={18} color={colors.textPrimary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>App Theme</Text>
              </View>
              
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

            {/* Change Password Card */}
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.sectionCard, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
              <View style={[styles.sectionTitleRow, { borderBottomColor: colors.glassBorder }]}>
                <Ionicons name="lock-closed" size={18} color={colors.textPrimary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Change Account Password</Text>
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password *</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                />
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>New Password *</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new strong password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                />
              </View>

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password *</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Retype new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={updatingPw} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.gold} style={styles.submitGradient}>
                  {updatingPw ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="key-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.submitText, { color: '#FFF' }]}>Update Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            {/* Logout Action Button */}
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.glassCard, borderColor: `${colors.error}4D` }]} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[styles.logoutText, { color: colors.error }]}>Log Out Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.glassCard }]}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage} activeOpacity={0.8}>
              {editPhotoUri ? (
                <Image source={{ uri: editPhotoUri }} style={styles.editAvatarImage} />
              ) : user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.editAvatarImage} />
              ) : (
                <View style={[styles.editAvatarPlaceholder, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder }]}>
                  <Ionicons name="camera" size={32} color={colors.textPrimary} />
                </View>
              )}
              <View style={[styles.editAvatarBadge, { backgroundColor: colors.primaryOrange, borderColor: colors.background }]}>
                <Ionicons name="pencil" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.glassCard, borderColor: colors.glassBorder, color: colors.textPrimary }]}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateProfile} disabled={updatingProfile} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
                {updatingProfile ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.submitText, { color: '#FFF' }]}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4 },

  profileCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)' },
  avatarText: { fontSize: 24, fontWeight: '800' },
  userName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  userPhone: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  userEmail: { fontSize: 12 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  sectionCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, paddingBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginLeft: 8 },

  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, borderWidth: 1 },

  submitBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { fontWeight: '800', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  logoutText: { fontSize: 14, fontWeight: '700' },

  // Theme Select Styles
  themeOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1 },
  themeOptionActive: { borderWidth: 1 },
  themeOptionText: { fontSize: 12, fontWeight: '700', marginTop: 8 },

  // Edit Profile Styles
  editProfileBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  editAvatarBtn: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  editAvatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#F59E0B' },
  editAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
});
