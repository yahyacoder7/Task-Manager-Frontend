import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { Typography } from '../../constants/Typography';

const THEME = {
  background: '#0F0F0F',
  secondaryBackground: '#1A1A1A',
  brand: '#D84315',
  text: '#FFFFFF',
  secondaryText: '#A0A0A0',
};

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Helper to render tab title explicitly on the RIGHT side of the header
function HeaderTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: THEME.text,
        fontSize: 20,
        fontFamily: Typography.fonts.bold,
        paddingRight: 16,
      }}
    >
      {title}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: THEME.brand,
        tabBarInactiveTintColor: THEME.secondaryText,
        tabBarLabelStyle: {
          fontFamily: Typography.fonts.medium,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: THEME.secondaryBackground,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: THEME.secondaryBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        },
        // Title is null globally; each screen sets it via headerRight
        headerTitle: () => null,
        headerLeft: () => null,
        headerShown: true,
      }}>

      {/* 4. الإحصائيات - أقصى اليسار */}
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: 'الإحصائيات',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
          headerRight: () => <HeaderTitle title="الإحصائيات" />,
        }}
      />

      {/* 3. الخطط */}
      <Tabs.Screen
        name="plans"
        options={{
          tabBarLabel: 'الخطط',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
          headerRight: () => <HeaderTitle title="خطط العمل" />,
        }}
      />

      {/* 2. المهام */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'المهام',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: () => <HeaderTitle title="المهام القادمة" />,
        }}
      />

      {/* 1. حسابي - أقصى اليمين */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'الحساب',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
          headerRight: () => <HeaderTitle title="حسابي" />,
        }}
      />

    </Tabs>
  );
}
