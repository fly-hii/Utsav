import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
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
  const { colors, isDark } = useAppTheme();

  const isReels = state.routes[state.index].name === 'reels/index';

  return (
    <View style={[
      styles.tabBarWrapper, 
      { paddingBottom: Math.max(insets.bottom, 6), backgroundColor: isDark ? '#0A0A0F' : '#F8FAFC' },
      isReels && { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' }
    ]}>
      <View style={[styles.tabBarContainer, { backgroundColor: isReels ? 'rgba(0,0,0,0.4)' : colors.glassCard, borderColor: isReels ? 'rgba(255,255,255,0.1)' : colors.glassBorder }]}>
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
              style={[styles.tabItem, isFocused && { backgroundColor: `${colors.gold}26` }]} // 15% opacity
            >
              <Ionicons
                name={isFocused ? config.iconActive as any : config.iconInactive as any}
                size={20}
                color={isFocused ? colors.gold : colors.textMuted}
              />
              <Text style={[styles.tabLabel, { color: colors.textSecondary }, isFocused && { color: colors.gold, fontWeight: '700' }]}>
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
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
});
