import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

const iconMap: Record<string, string> = {
  ChartBar: 'chart-bar',
  Calendar: 'calendar',
  List: 'format-list-bulleted',
  User: 'account-outline',
};

const TABS = [
  { name: 'index', icon: 'List', label: 'Tasks' },
  { name: 'plans', icon: 'Calendar', label: 'Plans' },
  { name: 'stats', icon: 'ChartBar', label: 'Stats' },
  { name: 'profile', icon: 'User', label: 'Profile' },
];

function HeaderTitle({ title }: { title: string }) {
  const { theme: THEME } = useAppTheme();
  return <Text style={{ color: THEME.white, fontSize: 20, fontFamily: Typography.fonts.bold, paddingLeft: 16 }}>{title}</Text>;
}

function MyTabBar({ state, navigation }: any) {
  const { theme: THEME } = useAppTheme();
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
            <MaterialCommunityIcons name={iconMap[tab.icon] as any} size={20} color={focused ? '#E65A2A' : 'rgba(255,255,255,0.55)'} />
            <Text style={{ fontSize: 10, fontFamily: Typography.fonts.medium, color: focused ? '#E65A2A' : 'rgba(255,255,255,0.55)', marginTop: 2 }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { theme: THEME } = useAppTheme();
  return (
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
      <Tabs.Screen name="stats" options={{ headerLeft: () => <HeaderTitle title="Statistics" /> }} />
      <Tabs.Screen name="plans" options={{ headerLeft: () => <HeaderTitle title="Work Plans" /> }} />
      <Tabs.Screen name="index" options={{ headerLeft: () => <HeaderTitle title="Tasks" /> }} />
      <Tabs.Screen name="profile" options={{ headerLeft: () => <HeaderTitle title="My Profile" /> }} />
    </Tabs>
  );
}
