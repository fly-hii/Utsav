import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
  Modal,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';

const ReelThumbnail = ({ item }: { item: any }) => {
  const [thumb, setThumb] = useState<string | null>(item.thumbnailS3Url || null);

  useEffect(() => {
    if (!item.thumbnailS3Url && item.videoS3Url && !thumb) {
      VideoThumbnails.getThumbnailAsync(item.videoS3Url, { time: 1000 })
        .then((res) => setThumb(res.uri))
        .catch((err) => console.log('Thumbnail err:', err));
    }
  }, [item.videoS3Url, item.thumbnailS3Url]);

  if (thumb) {
    return <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
  }
  return <Ionicons name="film" size={24} color={COLORS.primaryOrange} />;
};
import { ReelService } from '../../../services/api';

export default function CommitteeReelsManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Active Tab: 'LIST' | 'CREATE'
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // Published Reels List
  const [reels, setReels] = useState<any[]>([]);
  const [loadingReels, setLoadingReels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload New Reel States
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('#SriRama #Utsav2026 #VillageFestival');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
    if (activeTab === 'CREATE') player.play();
  });

  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReel, setEditingReel] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const editPlayer = useVideoPlayer(editingReel?.videoS3Url, player => {
    player.loop = true;
    if (editModalVisible) player.play();
  });

  // Delete Confirmation States
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReels = async () => {
    try {
      setLoadingReels(true);
      const res: any = await ReelService.getAll();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setReels(list);
    } catch (err) {
      console.error('Failed to fetch reels:', err);
    } finally {
      setLoadingReels(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReels();
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required 📷', 'Permission to access media library is required to select video reels.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 300, // 5 minutes max
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
        Alert.alert('Video Attached! 🎥', 'Selected vertical festival reel (up to 5 min duration).');
      }
    } catch (err: any) {
      console.error('Pick video error:', err);
      Alert.alert('Error 🎥', err?.message || 'Failed to open video picker on this device.');
    }
  };

  const handleSubmitNewReel = async () => {
    if (!videoUri) {
      Alert.alert('Validation Error', 'Please select a vertical festival video first.');
      return;
    }

    try {
      setSubmitting(true);

      const parameters = {
        committeeId: 'comm-kovvur-101',
        caption: caption || 'Grand Procession Festival Reel',
        hashtags: hashtags || '#Utsav2026',
        duration: '300',
      };

      await ReelService.createWithVideo(videoUri, parameters);

      Alert.alert(
        'Reel Published!',
        'Your festival reel has been securely uploaded to S3 and is now live!',
        [{ text: 'Awesome!', onPress: () => {
          setVideoUri(null); setActiveTab('LIST'); fetchReels(); } }]
      );
    } catch (err: any) {
      console.error('Reel upload error:', err);
      Alert.alert(
        'Upload Failed ❌',
        err?.message || 'Failed to upload your video reel. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Reel Logic
  const openEditModal = (reel: any) => {
    setEditingReel(reel);
    setEditCaption(reel.caption || '');
    setEditHashtags(reel.hashtags || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReel?.id) return;
    try {
      setSavingEdit(true);
      await ReelService.update(editingReel.id, {
        caption: editCaption,
        hashtags: editHashtags,
      });

      // Update local state
      setReels((prev) =>
        prev.map((r) => (r.id === editingReel.id ? { ...r, caption: editCaption, hashtags: editHashtags } : r))
      );

      Alert.alert('Success ✨', 'Reel details updated successfully.');
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reel');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Reel Logic
  const handleDeleteReel = async (reelId: string) => {
    Alert.alert(
      'Delete Reel? 🗑️',
      'Are you sure you want to permanently delete this video reel and remove its S3 assets?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(reelId);
              await ReelService.delete(reelId);
              setReels((prev) => prev.filter((r) => r.id !== reelId));
              Alert.alert('Deleted', 'Reel removed permanently.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete reel');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <View style={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 20, flex: 1 }]}>
        {/* Navigation Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Festival Reels Hub 🎥</Text>
            <Text style={styles.subtitle}>Upload, audit, edit & moderate village video reels (up to 5 min)</Text>
          </View>
        </View>

        {/* Tab Segment Controls */}
        <View style={styles.tabSegmentRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('LIST')}
            style={[styles.tabBtn, activeTab === 'LIST' && styles.tabBtnActive]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="film-outline"
              size={18}
              color={activeTab === 'LIST' ? COLORS.primaryOrange : COLORS.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'LIST' && styles.tabTextActive]}>
              Published Reels ({reels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('CREATE')}
            style={[styles.tabBtn, activeTab === 'CREATE' && styles.tabBtnActive]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={activeTab === 'CREATE' ? COLORS.primaryOrange : COLORS.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'CREATE' && styles.tabTextActive]}>+ Post New Reel</Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: LIST OF PUBLISHED REELS WITH EDIT/DELETE */}
        {activeTab === 'LIST' && (
          <View style={{ flex: 1 }}>
            {loadingReels ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primaryOrange} size="large" />
                <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: 12 }}>
                  Loading Published Video Reels...
                </Text>
              </View>
            ) : reels.length === 0 ? (
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <Ionicons name="videocam-off-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Published Reels Yet</Text>
                <Text style={styles.emptySub}>Post short videos (up to 5 minutes) of festival celebrations to engage devotees.</Text>
                <TouchableOpacity onPress={() => setActiveTab('CREATE')} style={styles.createNowBtn} activeOpacity={0.85}>
                  <Text style={styles.createNowText}>+ Post First Video Reel</Text>
                </TouchableOpacity>
              </BlurView>
            ) : (
              <FlatList
                data={reels}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryOrange} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <BlurView intensity={25} tint="dark" style={styles.reelCard}>
                    <View style={styles.reelCardHeader}>
                      <View style={styles.thumbnailSim}>
                        <ReelThumbnail item={item} />
                      </View>

                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={styles.reelCaption} numberOfLines={2}>
                          {item.caption || 'Festival Celebration Reel'}
                        </Text>
                        <Text style={styles.reelHashtags} numberOfLines={1}>
                          {item.hashtags || '#Utsav2026'}
                        </Text>
                        <View style={styles.metricsRow}>
                          <Text style={styles.metricText}>👁️ {item.viewCount || 0} views</Text>
                          <Text style={styles.metricText}>❤️ {item.likeCount || 0} likes</Text>
                          <Text style={styles.metricText}>💬 {item.commentCount || 0} comments</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons: EDIT & DELETE */}
                    <View style={styles.reelCardActions}>
                      <TouchableOpacity
                        onPress={() => openEditModal(item)}
                        style={styles.editActionBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="pencil-outline" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
                        <Text style={styles.editActionText}>Edit Reel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteReel(item.id)}
                        disabled={deletingId === item.id}
                        style={styles.deleteActionBtn}
                        activeOpacity={0.8}
                      >
                        {deletingId === item.id ? (
                          <ActivityIndicator size="small" color="#EF476F" />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={14} color="#EF476F" style={{ marginRight: 4 }} />
                            <Text style={styles.deleteActionText}>Delete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 2: POST NEW REEL FORM */}
        {activeTab === 'CREATE' && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 20}
          >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <BlurView intensity={20} tint="dark" style={styles.glassCard}>
              <View style={styles.group}>
                <Text style={styles.label}>Festival Video Reel File (Max 5 Min / 500 MB)</Text>
                {videoUri ? (
                  <View style={styles.videoPreviewContainer}>
                    <View style={styles.videoPreviewBox}>
                      {Platform.OS === 'web' ? (
                        // @ts-ignore
                        <video
                          src={videoUri}
                          controls
                          autoPlay
                          loop
                          style={{ width: '100%', height: 220, borderRadius: 12, objectFit: 'cover' }}
                        />
                      ) : (
                        <VideoView
                          player={player}
                          style={{ width: '100%', height: 220, borderRadius: 12 }}
                        />
                      )}
                    </View>

                    <View style={styles.previewFooterRow}>
                      <View style={styles.previewBadge}>
                        <Ionicons name="film" size={14} color="#06D6A0" style={{ marginRight: 4 }} />
                        <Text style={styles.previewBadgeText}>Attached Video Preview 🎬</Text>
                      </View>

                      <TouchableOpacity onPress={handlePickVideo} style={styles.changeVideoBtn} activeOpacity={0.8}>
                        <Ionicons name="swap-horizontal" size={14} color={COLORS.primaryOrange} style={{ marginRight: 4 }} />
                        <Text style={styles.changeVideoText}>Change Video</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handlePickVideo} style={styles.uploadBtn} activeOpacity={0.8}>
                    <Ionicons name="videocam-outline" size={36} color={COLORS.primaryOrange} />
                    <Text style={styles.uploadText}>Select Vertical Video from Gallery (Any Format up to 5 min)</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Caption</Text>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="e.g. Grand Sitarama Kalyanam Rathotsavam Procession!"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { height: 75 }]}
                />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Hashtags</Text>
                <TextInput
                  value={hashtags}
                  onChangeText={setHashtags}
                  placeholder="#VillageFestival #Utsav #SriRama"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity onPress={handleSubmitNewReel} disabled={submitting} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENTS.festival} style={styles.btn}>
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnText}>Upload & Publish Reel to Village Feed</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* EDIT REEL MODAL */}
        <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Reel Details 📝</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {editingReel?.videoS3Url && (
                <View style={[styles.videoPreviewBox, { height: 160, marginBottom: 16 }]}>
                  {Platform.OS === 'web' ? (
                    // @ts-ignore
                    <video
                      src={editingReel.videoS3Url}
                      controls
                      autoPlay
                      loop
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <VideoView
                      player={editPlayer}
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}
                </View>
              )}

              <View style={styles.group}>
                <Text style={styles.label}>Update Caption</Text>
                <TextInput
                  value={editCaption}
                  onChangeText={setEditCaption}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { height: 75 }]}
                />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Update Hashtags</Text>
                <TextInput value={editHashtags} onChangeText={setEditHashtags} style={styles.input} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSaveEdit} disabled={savingEdit} style={styles.saveBtn}>
                  {savingEdit ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  tabSegmentRow: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  tabBtnActive: { backgroundColor: 'rgba(255, 107, 53, 0.2)', borderWidth: 1, borderColor: COLORS.primaryOrange },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primaryOrange, fontWeight: '800' },
  loadingBox: { padding: 40, alignItems: 'center' },
  emptyCard: { padding: 32, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  createNowBtn: { backgroundColor: COLORS.primaryOrange, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  createNowText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  reelCard: { padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  reelCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  thumbnailSim: { width: 64, height: 84, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  reelCaption: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  reelHashtags: { fontSize: 11, color: COLORS.saffron, marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  metricText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  reelCardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  editActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  editActionText: { color: '#3B82F6', fontSize: 11, fontWeight: '700' },
  deleteActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239, 71, 111, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 71, 111, 0.3)' },
  deleteActionText: { color: '#EF476F', fontSize: 11, fontWeight: '700' },
  glassCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: COLORS.glassCard },
  group: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 12, padding: 12, color: COLORS.textPrimary, fontSize: 13 },
  uploadBtn: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primaryOrange, backgroundColor: 'rgba(255, 107, 53, 0.08)' },
  uploadText: { fontSize: 13, fontWeight: '600', color: COLORS.primaryOrange },
  videoPreviewContainer: { borderRadius: 16, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: COLORS.glassBorder },
  videoPreviewBox: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', marginBottom: 10 },
  previewFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  previewBadge: { flexDirection: 'row', alignItems: 'center' },
  previewBadgeText: { color: '#06D6A0', fontSize: 11, fontWeight: '700' },
  changeVideoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 107, 53, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.4)' },
  changeVideoText: { color: COLORS.primaryOrange, fontSize: 11, fontWeight: '700' },
  btn: { padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },

  // Edit Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder, backgroundColor: '#1F1F30' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.primaryOrange },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
});
