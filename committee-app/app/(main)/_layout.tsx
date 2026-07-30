import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { createContext, useContext, useState, useEffect } from 'react';
import { CommitteeAuthService } from '../../services/api';

export const CommitteeContext = createContext<{ committeeId: string | null; committeeDetails: any }>({ committeeId: null, committeeDetails: null });

export const useCommittee = () => useContext(CommitteeContext);

const TAB_CONFIG: Record<string, { label: string; iconActive: string; iconInactive: string }> = {
  dashboard: { label: 'Home', iconActive: 'grid', iconInactive: 'grid-outline' },
  'donations/index': { label: 'Donate', iconActive: 'heart', iconInactive: 'heart-outline' },
  'expenses/index': { label: 'Expense', iconActive: 'wallet', iconInactive: 'wallet-outline' },
  'events/index': { label: 'Events', iconActive: 'calendar', iconInactive: 'calendar-outline' },
  'reels/index': { label: 'Reels', iconActive: 'videocam', iconInactive: 'videocam-outline' },
  'members/index': { label: 'Team', iconActive: 'people', iconInactive: 'people-outline' },
  'reports/index': { label: 'Reports', iconActive: 'bar-chart', iconInactive: 'bar-chart-outline' },
  profile: { label: 'Profile', iconActive: 'person-circle', iconInactive: 'person-circle-outline' },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              <Ionicons
                name={isFocused ? config.iconActive as any : config.iconInactive as any}
                size={18}
                color={isFocused ? COLORS.gold : 'rgba(255,255,255,0.35)'}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainLayout() {
  const [committeeData, setCommitteeData] = useState<{ committeeId: string | null; committeeDetails: any }>({ committeeId: null, committeeDetails: null });

  useEffect(() => {
    CommitteeAuthService.getProfile().then((res: any) => {
      const data = res?.data || res;
      if (data?.committeeMemberships && data.committeeMemberships.length > 0) {
        const membership = data.committeeMemberships[0];
        setCommitteeData({ committeeId: membership.committeeId, committeeDetails: membership });
      }
    }).catch(err => console.log('Failed to fetch profile', err));
  }, []);

  return (
    <CommitteeContext.Provider value={committeeData}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="donations/index" />
        <Tabs.Screen name="expenses/index" />
        <Tabs.Screen name="events/index" />
        <Tabs.Screen name="reels/index" />
        <Tabs.Screen name="members/index" />
        <Tabs.Screen name="reports/index" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </CommitteeContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
});
