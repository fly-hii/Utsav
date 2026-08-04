import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { GRADIENTS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data.notifications || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = !item.isRead;
    return (
      <TouchableOpacity onPress={() => markAsRead(item.id, item.isRead)} activeOpacity={0.8}>
        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.card, { borderColor: colors.glassBorder, backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.5)' }, isUnread && { borderColor: `${colors.primaryOrange}4D`, backgroundColor: `${colors.primaryOrange}0D` }]}>
          <View style={styles.iconContainer}>
            <Ionicons name={isUnread ? 'notifications' : 'notifications-outline'} size={24} color={isUnread ? colors.primaryOrange : colors.textMuted} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }, isUnread && { color: colors.primaryOrange }]}>{item.title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{item.body}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={isDark ? GRADIENTS.dark : GRADIENTS.lightDark} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'Notifications',
          headerTitleStyle: { color: colors.textPrimary, fontWeight: 'bold' },
          headerTintColor: colors.textPrimary,
          headerRight: () => (
            <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: 15 }}>
              <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.primaryOrange} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={[styles.listContainer, { paddingTop: insets.top + 50 }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryOrange} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primaryOrange} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications yet.</Text>
              </View>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  unreadCard: {
  },
  iconContainer: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadText: {
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
});
