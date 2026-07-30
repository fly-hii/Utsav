import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { COLORS, GRADIENTS } from '../../constants/theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
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
        <BlurView intensity={20} tint="dark" style={[styles.card, isUnread && styles.unreadCard]}>
          <View style={styles.iconContainer}>
            <Ionicons name={isUnread ? 'notifications' : 'notifications-outline'} size={24} color={isUnread ? COLORS.primaryOrange : COLORS.textMuted} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, isUnread && styles.unreadText]}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: 'Notifications',
          headerTitleStyle: { color: '#FFF', fontWeight: 'bold' },
          headerTintColor: '#FFF',
          headerRight: () => (
            <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: 15 }}>
              <Ionicons name="checkmark-done-circle-outline" size={24} color={COLORS.primaryOrange} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={[styles.listContainer, { paddingTop: insets.top + 50 }]}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryOrange} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primaryOrange} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No notifications yet.</Text>
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
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  unreadCard: {
    borderColor: 'rgba(255, 107, 53, 0.3)',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadText: {
    color: COLORS.primaryOrange,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 15,
    fontSize: 16,
  },
});
