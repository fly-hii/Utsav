import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthService } from '../../services/api';
import { COLORS, GRADIENTS } from '../../constants/theme';

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My Account Profile 👤</Text>
            <Text style={styles.subtitle}>Account settings, security & password management</Text>
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
            {/* Profile Info Card */}
            <BlurView intensity={25} tint="dark" style={styles.profileCard}>
              <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal} activeOpacity={0.8}>
                <Ionicons name="pencil" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                  ) : (
                    <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user?.name || 'Villager Account'}</Text>
                  <Text style={styles.userPhone}>📞 {user?.phone || 'Not set'}</Text>
                  {user?.email && <Text style={styles.userEmail}>✉️ {user.email}</Text>}
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
                </View>
              </View>
            </BlurView>

            {/* Change Password Card */}
            <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="lock-closed" size={18} color={COLORS.textPrimary} />
                <Text style={styles.sectionTitle}>Change Account Password</Text>
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Current Password *</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>New Password *</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new strong password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Confirm New Password *</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Retype new password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={updatingPw} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.gold} style={styles.submitGradient}>
                  {updatingPw ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="key-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitText}>Update Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            {/* Logout Action Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Log Out Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage} activeOpacity={0.8}>
              {editPhotoUri ? (
                <Image source={{ uri: editPhotoUri }} style={styles.editAvatarImage} />
              ) : user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.editAvatarImage} />
              ) : (
                <View style={styles.editAvatarPlaceholder}>
                  <Ionicons name="camera" size={32} color={COLORS.textPrimary} />
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="pencil" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.group}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateProfile} disabled={updatingProfile} activeOpacity={0.85}>
              <LinearGradient colors={GRADIENTS.festival} style={styles.submitGradient}>
                {updatingProfile ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Save Changes</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  profileCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24, alignItems: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)' },
  avatarText: { fontSize: 24, fontWeight: '800', color: COLORS.gold },
  userName: { fontSize: 18, fontWeight: '800', color: COLORS.gold, marginBottom: 4 },
  userPhone: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '700', marginBottom: 2 },
  userEmail: { fontSize: 12, color: COLORS.textSecondary },
  roleBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' },
  roleText: { fontSize: 10, fontWeight: '800', color: COLORS.success, letterSpacing: 1 },

  sectionCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard, marginBottom: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, paddingBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginLeft: 8 },

  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.glassCard, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.glassBorder },

  submitBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.glassCard, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 71, 111, 0.3)' },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },

  // Edit Profile Styles
  editProfileBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.glassCard, borderWidth: 1, borderColor: COLORS.glassBorder, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.glassCard, justifyContent: 'center', alignItems: 'center' },
  editAvatarBtn: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  editAvatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primaryOrange },
  editAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.glassCard, borderWidth: 3, borderColor: COLORS.glassBorder, justifyContent: 'center', alignItems: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primaryOrange, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background },

  appVersion: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 12 },
});
