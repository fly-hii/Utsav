import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
  Share,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReelService } from '../../../services/api';
import { COLORS, GRADIENTS } from '../../../constants/theme';

const { width, height } = Dimensions.get('window');

const ReelItem = ({
  item,
  index,
  activeIndex,
  isPlaying,
  setIsPlaying,
  likedMap,
  likeCountMap,
  commentCountMap,
  toggleLike,
  openCommentsModal,
}: any) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const likes = likeCountMap[item.id] !== undefined ? likeCountMap[item.id] : (item.likeCount || 0);
  const comments = commentCountMap[item.id] !== undefined ? commentCountMap[item.id] : (item.commentCount || 0);
  const isLiked = likedMap[item.id] || false;

  const isCurrentActive = activeIndex === index && isFocused;

  const player = useVideoPlayer(item.videoS3Url, (player) => {
    player.loop = true;
    player.muted = false;
    if (isCurrentActive && isPlaying) player.play();
  });

  useEffect(() => {
    if (isCurrentActive && isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isCurrentActive, isPlaying, player]);

  // Auto-detect horizontal vs vertical video
  const videoTrackEvent = useEvent(player, 'videoTrackChange', { videoTrack: player.videoTrack });
  const videoSize = videoTrackEvent.videoTrack?.size;
  const contentFit = videoSize && videoSize.width > videoSize.height ? 'contain' : 'cover';

  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (!isLiked) toggleLike(item.id);
      setIsPlaying(true); // Resume playing if it was paused by the first tap

      // Trigger heart animation
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);

      lastTapRef.current = 0; // reset
    } else {
      // Single tap
      setIsPlaying(!isPlaying);
      lastTapRef.current = now;
    }
  };

  const handleLongPress = () => {
    setIsFastForwarding(true);
    player.playbackRate = 2.0;
  };

  const handlePressOut = () => {
    if (player.playbackRate !== 1.0) {
      player.playbackRate = 1.0;
    }
    setIsFastForwarding(false);
  };

  return (
    <View style={[styles.reelPage, { height }]}>
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <video
            src={item.videoS3Url}
            poster={item.thumbnailS3Url}
            autoPlay={isCurrentActive && isPlaying}
            loop
            muted={false}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit={contentFit}
          />
        )}
      </View>

      {/* Touch Overlay to capture gestures ON TOP of the native VideoView */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={400}
      >
        {/* Play / Pause Center Overlay Icon */}
        {(!isPlaying || !isCurrentActive) && !showHeartAnim && (
          <View style={styles.playCenterOverlay}>
            <Ionicons name="play-circle-outline" size={72} color="rgba(255, 255, 255, 0.85)" />
          </View>
        )}

        {/* Double Tap Heart Animation */}
        {showHeartAnim && (
          <View style={styles.playCenterOverlay}>
            <Ionicons name="heart" size={100} color="#EF476F" />
          </View>
        )}

        {/* Fast Forward Indicator */}
        {isFastForwarding && (
          <View style={[styles.videoStatusBadge, { borderColor: 'rgba(255, 107, 53, 0.5)' }]}>
            <Ionicons name="play-forward" size={14} color="#FF6B35" style={{ marginRight: 6 }} />
            <Text style={[styles.videoStatusText, { color: "#FF6B35" }]}>
              2x Speed ⏩
            </Text>
          </View>
        )}
      </Pressable>

      {/* Right Sidebar Interactive Actions */}
      <View style={styles.rightSidebar}>
        {/* Like Action */}
        <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionBtn} activeOpacity={0.8}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={32} color={isLiked ? '#EF476F' : '#FFF'} />
          <Text style={styles.actionCount}>{likes}</Text>
        </TouchableOpacity>

        {/* Comment Action */}
        <TouchableOpacity onPress={() => openCommentsModal(item)} style={styles.actionBtn} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={28} color="#FFF" />
          <Text style={styles.actionCount}>{comments}</Text>
        </TouchableOpacity>

        {/* Share Action */}
        <TouchableOpacity
          onPress={async () => {
            try {
              await Share.share({
                message: `Check out this amazing reel from ${item.committeeName || item.committee?.name || 'Utsav'}: ${item.caption || ''}\n\nApp Link: https://utsav.app/reels/${item.id}`,
              });
            } catch (error) {
              console.error('Error sharing', error);
            }
          }}
          style={styles.actionBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="paper-plane-outline" size={28} color="#FFF" />
          <Text style={styles.actionCount}>{item.shareCount || 0}</Text>
        </TouchableOpacity>

        {/* Donate Action Icon */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(main)/donate',
              params: { committeeId: item.committeeId || 'comm-kovvur-101' },
            })
          }
          style={styles.actionBtn}
          activeOpacity={0.8}
        >
          <View style={styles.donateIconBg}>
            <Ionicons name="heart" size={20} color="#FFF" />
          </View>
          <Text style={styles.donateIconText}>Donate</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info Overlay with Direct Donate Button */}
      <BlurView intensity={35} tint="dark" style={[styles.bottomInfo, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.committeeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.committeeName}>{item.committeeName || item.committee?.name || 'Sri Rama Youth Committee'} 🛕</Text>
            <View style={styles.villageTag}>
              <Text style={styles.villageText}>📍 {item.village || item.committee?.village || 'Kovvur'}</Text>
            </View>
          </View>

          {/* Quick Donate Chip */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(main)/donate',
                params: { committeeId: item.committeeId || 'comm-kovvur-101' },
              })
            }
            style={styles.quickDonateBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.quickDonateText}>Donate 💐</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.captionText}>{item.caption || 'Sri Seetha Rama Kalyana Utsavam Grand Procession 🛕✨'}</Text>
        {item.hashtags && <Text style={styles.hashText}>{item.hashtags}</Text>}
      </BlurView>
    </View>
  );
};

export default function UserReelsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Track like states per reel ID
  const [likedMap, setLikedMap] = useState<{ [id: string]: boolean }>({});
  const [likeCountMap, setLikeCountMap] = useState<{ [id: string]: number }>({});
  const [commentCountMap, setCommentCountMap] = useState<{ [id: string]: number }>({});

  // Comments Modal States
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activeReelForComments, setActiveReelForComments] = useState<any | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const fetchReels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res: any = await ReelService.getAll();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      if (list.length > 0) {
        setReels(list);

        // Initialize maps
        const initialLiked: { [id: string]: boolean } = {};
        const initialLikes: { [id: string]: number } = {};
        const initialComments: { [id: string]: number } = {};

        list.forEach((r: any) => {
          initialLiked[r.id] = Boolean(r.isLiked);
          initialLikes[r.id] = typeof r.likeCount === 'number' ? r.likeCount : 0;
          initialComments[r.id] = typeof r.commentCount === 'number' ? r.commentCount : 0;
        });

        setLikedMap(initialLiked);
        setLikeCountMap(initialLikes);
        setCommentCountMap(initialComments);
      } else {
        setReels([
          {
            id: 'reel-101',
            committeeId: 'comm-kovvur-101',
            caption: 'Sri Seetha Rama Kalyana Utsavam Grand Procession 🛕✨',
            hashtags: '#SriRama #Utsav2026',
            videoS3Url: 'https://assets.mixkit.co/videos/preview/mixkit-temple-procession-festival-41586-large.mp4',
            thumbnailS3Url: 'https://images.unsplash.com/photo-1609743522653-52354461eb27?w=600',
            committeeName: 'Sri Rama Youth Committee',
            village: 'Kovvur',
            likeCount: 385,
            commentCount: 42,
            shareCount: 18,
            isLiked: 0,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch reels:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchReels(true);
  };

  useEffect(() => {
    fetchReels();

    // @ts-ignore - tabPress is available on BottomTab navigation
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      // If the user taps the Reels tab while already on the Reels screen
      if (navigation.isFocused()) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        fetchReels(true); // Trigger refresh
      }
    });

    return unsubscribe;
  }, [navigation]);

  const toggleLike = async (reelId: string) => {
    if (!reelId) return;
    const prevLiked = Boolean(likedMap[reelId]);
    const prevCount = likeCountMap[reelId] || 0;

    try {
      // Optimistic Update
      setLikedMap((prev) => ({ ...prev, [reelId]: !prevLiked }));
      setLikeCountMap((prev) => ({ ...prev, [reelId]: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1 }));

      const res: any = await ReelService.like(reelId);
      const data = res?.data || res;
      if (typeof data?.isLiked !== 'undefined') {
        setLikedMap((prev) => ({ ...prev, [reelId]: Boolean(data.isLiked) }));
      }
      if (typeof data?.likeCount === 'number') {
        setLikeCountMap((prev) => ({ ...prev, [reelId]: data.likeCount }));
      }
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
      // Rollback Optimistic Update
      setLikedMap((prev) => ({ ...prev, [reelId]: prevLiked }));
      setLikeCountMap((prev) => ({ ...prev, [reelId]: prevCount }));
      Alert.alert('Error', 'Failed to like the reel. Please try again.');
    }
  };

  const openCommentsModal = async (reel: any) => {
    if (!reel?.id) return;
    setActiveReelForComments(reel);
    setCommentsModalVisible(true);
    setLoadingComments(true);
    try {
      const res: any = await ReelService.getComments(reel.id);
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setCommentsList(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !activeReelForComments?.id) return;
    const targetId = activeReelForComments.id;
    setPostingComment(true);
    try {
      const res: any = await ReelService.addComment(targetId, newCommentText.trim());
      const data = res?.data || res;
      const addedComment = data?.comment;
      const updatedCount = data?.commentCount;

      if (addedComment) {
        setCommentsList((prev) => [addedComment, ...prev]);
      }

      const newCount = typeof updatedCount === 'number' ? updatedCount : (commentCountMap[targetId] || 0) + 1;
      setCommentCountMap((prev) => ({ ...prev, [targetId]: newCount }));
      setNewCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  // Tracking visible item on swipe
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (typeof idx === 'number') {
        setActiveIndex(idx);
        setIsPlaying(true);
      }
    }
  }).current;

  // Single Reel Item Renderer with Real Expo Video Player
  const renderReelItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <ReelItem
        item={item}
        index={index}
        activeIndex={activeIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        likedMap={likedMap}
        likeCountMap={likeCountMap}
        commentCountMap={commentCountMap}
        toggleLike={toggleLike}
        openCommentsModal={openCommentsModal}
        router={router}
        insets={insets}
      />
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF6B35" size="large" />
          <Text style={{ color: '#FFF', marginTop: 12, fontSize: 13 }}>Loading Festival Video Feed...</Text>
        </View>
      ) : (
        <>
          {/* INSTAGRAM REELS VERTICAL SNAP SCROLLING FLATLIST */}
          <FlatList
            ref={flatListRef}
            data={reels}
            keyExtractor={(item) => item.id}
            renderItem={renderReelItem}
            pagingEnabled={true}
            showsVerticalScrollIndicator={false}
            snapToInterval={height}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF6B35"
                colors={['#FF6B35']}
                progressViewOffset={insets.top + 50} // offset so it shows below the top bar
              />
            }
          />

          {/* Fixed Floating Top Bar with Back Button */}
          <View style={[styles.topOverlay, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.reelsHeader}>Festival Reels</Text>
          </View>

          {/* REAL COMMENTS BOTTOM SHEET MODAL */}
          <Modal
            visible={commentsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCommentsModalVisible(false)}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
              <View style={styles.commentsSheet}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <View style={styles.dragHandle} />
                  <View style={styles.sheetHeaderTitleRow}>
                    <Text style={styles.sheetTitle}>
                      Comments ({activeReelForComments ? commentCountMap[activeReelForComments.id] || 0 : 0})
                    </Text>
                    <TouchableOpacity onPress={() => setCommentsModalVisible(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Comments List */}
                {loadingComments ? (
                  <View style={styles.commentsLoading}>
                    <ActivityIndicator color="#FF6B35" />
                    <Text style={{ color: '#888', marginTop: 8, fontSize: 12 }}>Loading comments...</Text>
                  </View>
                ) : commentsList.length === 0 ? (
                  <View style={styles.emptyComments}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#555" />
                    <Text style={styles.emptyCommentsText}>No comments yet. Be the first to comment!</Text>
                  </View>
                ) : (
                  <FlatList
                    data={commentsList}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
                    renderItem={({ item }) => (
                      <View style={styles.commentItem}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{(item.userName || 'U')[0].toUpperCase()}</Text>
                        </View>
                        <View style={styles.commentContentBg}>
                          <View style={styles.commentUserRow}>
                            <Text style={styles.commentUserName}>{item.userName || 'Devotee'}</Text>
                            <Text style={styles.commentTime}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </Text>
                          </View>
                          <Text style={styles.commentText}>{item.content}</Text>
                        </View>
                      </View>
                    )}
                  />
                )}

                {/* Comment Input */}
                <View style={[styles.commentInputRow, { paddingBottom: insets.bottom + 12 }]}>
                  <TextInput
                    placeholder="Add a devotion comment..."
                    placeholderTextColor="#666"
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                    style={styles.commentInput}
                  />
                  <TouchableOpacity
                    onPress={handlePostComment}
                    disabled={postingComment || !newCommentText.trim()}
                    style={[styles.sendBtn, (!newCommentText.trim() || postingComment) && { opacity: 0.5 }]}
                  >
                    {postingComment ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={16} color="#FFF" />}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reelPage: { width, height, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  videoSim: { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  playCenterOverlay: { position: 'absolute', top: '45%', left: '40%', zIndex: 5 },
  videoStatusBadge: { position: 'absolute', top: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.65)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)', zIndex: 10 },
  videoStatusText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  topOverlay: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', zIndex: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reelsHeader: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  rightSidebar: { position: 'absolute', right: 16, bottom: 120, alignItems: 'center', gap: 18, zIndex: 15 },
  actionBtn: { alignItems: 'center' },
  actionCount: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  donateIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryOrange, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  donateIconText: { fontSize: 10, fontWeight: '800', color: COLORS.primaryOrange, marginTop: 4 },
  bottomInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, zIndex: 15 },
  committeeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  committeeName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  villageTag: { backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2, alignSelf: 'flex-start' },
  villageText: { fontSize: 10, color: COLORS.gold, fontWeight: '700' },
  quickDonateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryOrange, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.5)' },
  quickDonateText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },
  captionText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' },
  hashText: { fontSize: 11, color: COLORS.gold, marginTop: 4, fontWeight: '600' },

  // Comments BottomSheet Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  commentsSheet: { backgroundColor: COLORS.glassCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.7, flex: 1, borderWidth: 1, borderColor: COLORS.glassBorder },
  sheetHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignSelf: 'center', marginBottom: 10 },
  sheetHeaderTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  commentsLoading: { padding: 40, alignItems: 'center' },
  emptyComments: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyCommentsText: { color: COLORS.textMuted, marginTop: 8, fontSize: 12, textAlign: 'center' },
  commentItem: { flexDirection: 'row', marginBottom: 14, gap: 10 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryOrange, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 14 },
  commentContentBg: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  commentUserRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentUserName: { color: COLORS.gold, fontWeight: '700', fontSize: 12 },
  commentTime: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10 },
  commentText: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, backgroundColor: COLORS.background, gap: 10 },
  commentInput: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.textPrimary, fontSize: 13, borderWidth: 1, borderColor: COLORS.glassBorder },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryOrange, justifyContent: 'center', alignItems: 'center' },
});
