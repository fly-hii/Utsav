import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG: Record<string, { label: string; iconActive: string; iconInactive: string }> = {
  home: { label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  'committees/index': { label: 'Temples', iconActive: 'library', iconInactive: 'library-outline' },
  'reels/index': { label: 'Reels', iconActive: 'play-circle', iconInactive: 'play-circle-outline' },
  'events/index': { label: 'Events', iconActive: 'calendar', iconInactive: 'calendar-outline' },
  'donate/index': { label: 'Donate', iconActive: 'gift', iconInactive: 'gift-outline' },
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
                size={20}
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
  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="committees/index" />
      <Tabs.Screen name="reels/index" />
      <Tabs.Screen name="events/index" />
      <Tabs.Screen name="donate/index" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="committees/[id]" options={{ href: null }} />
    </Tabs>
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
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
});
