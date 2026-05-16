import React, { useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';
import NotificationOverlay from '../../components/NotificationOverlay';
import { useNotifications } from '../../contexts/NotificationContext';
import { getItem } from '../../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

const iconMap: Record<string, string> = {
  ChartBar: 'chart-bar',
  Calendar: 'calendar',
  List: 'format-list-bulleted',
  User: 'account-outline',
};

const TABS = [
  { name: 'profile', icon: 'User', label: 'Profile' },
  { name: 'index', icon: 'List', label: 'Tasks' },
  { name: 'plans', icon: 'Calendar', label: 'Work Plans' },
  { name: 'stats', icon: 'ChartBar', label: 'Statistics' },
];

function HeaderTitle({ title }: { title: string }) {
  const { theme: THEME } = useAppTheme();
  return <Text style={{ color: THEME.white, fontSize: 20, fontFamily: Typography.fonts.bold, paddingLeft: 16 }}>{title}</Text>;
}

function MyTabBar({ state, navigation }: any) {
  const { theme: THEME } = useAppTheme();
  const { unreadCount } = useNotifications();
  return (
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#E65A2A', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: Platform.OS === 'ios' ? 75 : 65,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8,
        flexDirection: 'row', alignItems: 'center',
        elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 12,
      }}>
      {state.routes.map((route: any, i: number) => {
        const focused = state.index === i;
        const tab = TABS.find(t => t.name === route.name);
        if (!tab) return null;
        return (
          <TouchableOpacity key={route.name} onPress={() => navigation.navigate(route.name)} activeOpacity={0.7}
            style={{ flex: 1, marginHorizontal: 6, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, backgroundColor: focused ? THEME.secondaryBackground : 'transparent' }}>
            <View style={{ position: 'relative' }}>
              <MaterialCommunityIcons name={iconMap[tab.icon] as any} size={20} color={focused ? '#E65A2A' : 'rgba(255,255,255,0.55)'} />
              {route.name === 'profile' && unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#FF3B30', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 10, fontFamily: Typography.fonts.medium, color: focused ? '#E65A2A' : 'rgba(255,255,255,0.55)', marginTop: 2 }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { theme: THEME } = useAppTheme();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const token = await getItem('userToken');
        if (!token) {
          router.replace('/');
        }
      };
      checkAuth();
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <MyTabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#E65A2A',
            elevation: 4,
            shadowColor: 'rgba(216, 67, 21, 0.15)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            borderBottomWidth: 1,
            borderBottomColor: THEME.divider,
          },
          headerTitle: () => null,
          headerLeft: () => null,
          headerShown: true,
        }}>
        <Tabs.Screen name="profile" options={{ headerLeft: () => <HeaderTitle title="Profile" /> }} />
        <Tabs.Screen name="index" options={{ headerLeft: () => <HeaderTitle title="Tasks" /> }} />
        <Tabs.Screen name="plans" options={{ headerLeft: () => <HeaderTitle title="Work Plans" /> }} />
        <Tabs.Screen name="stats" options={{ headerLeft: () => <HeaderTitle title="Statistics" /> }} />
      </Tabs>
      <NotificationOverlay />
    </View>
  );
}
