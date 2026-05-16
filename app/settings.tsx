import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Typography } from '../constants/Typography';
import { useAppTheme } from '../constants/ThemeContext';
import { getItem } from '../utils/storage';

import { BASE_URL } from '../constants/API';

export default function SettingsScreen() {
  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/users/profile/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        const err = await response.json();
        Alert.alert('Error', err.message || 'Failed to change password');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { direction: 'ltr' } as any]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: "",
        headerStyle: { backgroundColor: '#E65A2A' },
        headerShadowVisible: false,
        headerTintColor: '#FFFFFF',
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 'bold',
                fontFamily: Typography.fonts.bold
              }}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => null,
      }} />

      <View style={styles.centerContent}>
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonIconWrap}>
            <MaterialCommunityIcons name="cog-outline" size={48} color={THEME.brand} />
          </View>
          <Text style={styles.comingSoonTitle}>App Settings</Text>
          <Text style={styles.comingSoonDescription}>
            Soon you will be able to customize your settings and have full control over your experience in the app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: THEME.background,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    comingSoonCard: {
      backgroundColor: THEME.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: THEME.divider,
      padding: 40,
      alignItems: 'center',
      maxWidth: 360,
      width: '100%',
    },
    comingSoonIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'rgba(216, 67, 21, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    comingSoonTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: THEME.text,
      fontFamily: Typography.fonts.bold,
      marginBottom: 12,
    },
    comingSoonDescription: {
      fontSize: 14,
      color: THEME.secondaryText,
      textAlign: 'center',
      lineHeight: 22,
      fontFamily: Typography.fonts.regular,
    },
  });
}
