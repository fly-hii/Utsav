import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { createContext, useContext, useState, useEffect } from 'react';
import { CommitteeAuthService } from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';

export const CommitteeContext = createContext<{ committeeId: string | null; committeeDetails: any }>({ committeeId: null, committeeDetails: null });

export const useCommittee = () => useContext(CommitteeContext);

const TAB_CONFIG: Record<string, { label: string; iconActive: string; iconInactive: string }> = {
  dashboard: { label: 'Home', iconActive: 'grid', iconInactive: 'grid-outline' },
  'donations/index': { label: 'Donate', iconActive: 'heart', iconInactive: 'heart-outline' },
  'expenses/index': { label: 'Expense', iconActive: 'wallet', iconInactive: 'wallet-outline' },
  'events/index': { label: 'Events', iconActive: 'calendar', iconInactive: 'calendar-outline' },
  'reels/index': { label: 'Reels', iconActive: 'videocam', iconInactive: 'videocam-outline' },
  'members/index': { label: 'Team', iconActive: 'people', iconInactive: 'people-outline' },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: Math.max(insets.bottom, 6), backgroundColor: colors.background }]}>
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: colors.glassBorder }]}>
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
              style={[styles.tabItem, isFocused && [styles.tabItemActive, { backgroundColor: `${colors.warning}26` }]]}
            >
              <Ionicons
                name={isFocused ? config.iconActive as any : config.iconInactive as any}
                size={18}
                color={isFocused ? colors.warning : colors.textMuted}
              />
              <Text style={[styles.tabLabel, { color: colors.textSecondary }, isFocused && [styles.tabLabelActive, { color: colors.warning }]]}>
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
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tabItemActive: {
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
