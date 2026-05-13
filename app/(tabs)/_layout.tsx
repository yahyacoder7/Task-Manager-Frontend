import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Text, TouchableOpacity, Animated } from 'react-native';

import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

function HeaderTitle({ title }: { title: string }) {
  const { theme: THEME } = useAppTheme();
  return (
    <Text
      style={{
        color: THEME.white,
        fontSize: 20,
        fontFamily: Typography.fonts.bold,
        paddingRight: 16,
      }}
    >
      {title}
    </Text>
  );
}

function TabItem({ icon, label, focused, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; focused: boolean; onPress: (e: any) => void }) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: focused ? 1 : 0, useNativeDriver: true, friction: 8, tension: 40 }).start();
  }, [focused]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
      <Animated.View style={{ position: 'absolute', top: 4, bottom: 4, left: 4, right: 4, borderRadius: 14, backgroundColor: '#FFFFFF', opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }} />
      <Ionicons name={icon} size={20} color={focused ? '#E65A2A' : 'rgba(255,255,255,0.6)'} />
      <Text style={{ fontSize: 10, fontFamily: Typography.fonts.medium, color: focused ? '#E65A2A' : 'rgba(255,255,255,0.6)', marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { theme: THEME } = useAppTheme();
  const tabs = [
    { name: 'stats', label: 'الإحصائيات', icon: 'bar-chart' as const, header: 'الإحصائيات' },
    { name: 'plans', label: 'الخطط', icon: 'calendar' as const, header: 'خطط العمل' },
    { name: 'index', label: 'المهام', icon: 'list' as const, header: 'المهام' },
    { name: 'profile', label: 'الحساب', icon: 'person' as const, header: 'حسابي' },
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: {
          fontFamily: Typography.fonts.medium,
          fontSize: 10,
        },
        tabBarStyle: {
          backgroundColor: '#E65A2A',
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          borderRadius: 24,
          height: Platform.OS === 'ios' ? 75 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: 'rgba(216, 67, 21, 0.88)',
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
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ color }) => <Ionicons name={tab.icon} size={20} color={color} />,
            tabBarButton: (props: any) => <TabItem icon={tab.icon} label={tab.label} focused={props.accessibilityState?.selected || false} onPress={props.onPress} />,
            headerRight: () => <HeaderTitle title={tab.header} />,
          }}
        />
      ))}
    </Tabs>
  );
}
