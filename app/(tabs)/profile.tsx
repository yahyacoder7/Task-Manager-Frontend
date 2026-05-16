import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItem, deleteItem, saveItem } from '../../utils/storage';
import { formatDateArabic } from '../../utils/date';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useCallback, useRef } from 'react';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';
import { Animated } from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';

import { BASE_URL } from '../../constants/API';

export default function ProfileScreen() {
  const { theme: THEME, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  const { notifications, clearNotifications, refreshNotifications } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ completed: 0, incomplete: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  const router = useRouter();
  const params = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      
      if (params.updated === 'true') {
        triggerToast();
        router.setParams({ updated: undefined });
      }
    }, [params.updated])
  );

  const triggerToast = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    await loadUserDataFromStorage();
    await fetchLatestProfile();
    await fetchTaskStats();
    setIsLoading(false);
  };

  const loadUserDataFromStorage = async () => {
    const data = await getItem('userData');
    if (data) setUser(JSON.parse(data));
  };

  const fetchLatestProfile = async () => {
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/users/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        await saveItem('userData', JSON.stringify(data));
      }
    } catch (err) {
      console.error("Fetch Profile Error:", err);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/todo/status/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Fetch Stats Error:", err);
    }
  };

  const handleUpdateName = () => {
    router.push('/edit-profile');
  };

  const handleLogout = async () => {
    try {
      await deleteItem('userToken');
      await deleteItem('userData');
      await deleteItem('userEmail');
      router.replace('/');
      setTimeout(() => router.navigate('/'), 100);
    } catch (err) {
      console.error("Error during logout:", err);
      router.replace('/');
    }
  };

  const GlassCard = ({ children, style }: any) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return (
        <View style={[styles.glassCardContainer, style]}>
          <BlurView intensity={isDark ? 20 : 80} tint={isDark ? "dark" : "light"} style={styles.blurView}>
            {children}
          </BlurView>
        </View>
      );
    }
    return (
      <View style={[styles.glassCardWeb, style]}>
        {children}
      </View>
    );
  };

  if (isLoading && !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { direction: 'ltr' } as any]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.themeToggleRow}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
            <MaterialCommunityIcons name={isDark ? "weather-night" : "weather-sunny"} size={20} color={THEME.text} />
            <Text style={[styles.themeToggleText, { color: THEME.secondaryText }]}>{isDark ? 'Dark' : 'Light'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.activeBadge} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Task Flow User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        </View>

        <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{formatDateArabic(user?.createdAt)}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Data</Text>

            <TouchableOpacity style={styles.actionButton} onPress={handleUpdateName}>
              <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons name="account-outline" size={22} color={THEME.brand} />
              </View>
              <Text style={styles.actionText}>Edit Profile</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/settings')}>
              <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons name="cog-outline" size={22} color={THEME.brand} />
              </View>
              <Text style={styles.actionText}>Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.secondaryText} />
            </TouchableOpacity>
          </View>

          {notifications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TouchableOpacity onPress={refreshNotifications}>
                    <MaterialCommunityIcons name="refresh" size={18} color={THEME.brand} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearNotifications}>
                    <Text style={styles.clearText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {notifications.slice(0, 5).map((n) => (
                <View key={n.id} style={styles.notifCard}>
                  <MaterialCommunityIcons name="bell-outline" size={18} color={THEME.brand} style={styles.notifIcon} />
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMessage}>{n.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Overview</Text>
            <View style={styles.statsRow}>
              <GlassCard style={styles.statBox}>
                <MaterialCommunityIcons name="check-circle" size={28} color={THEME.success} />
                <Text style={styles.statValue}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </GlassCard>
              <GlassCard style={styles.statBox}>
                <MaterialCommunityIcons name="clock-outline" size={28} color={THEME.warning} />
                <Text style={styles.statValue}>{stats.incomplete}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </GlassCard>
            </View>
          </View>

        <View style={styles.logoutSection}>
          <View style={styles.logoutDivider} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={16} color={THEME.secondaryText} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Task Flow v1.0.0</Text>
        </View>
      </ScrollView>

      {showToast && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <MaterialCommunityIcons name="check-circle" size={20} color={THEME.white} />
          <Text style={styles.toastText}>Name updated successfully</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.brand,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: THEME.card,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: THEME.white,
    fontFamily: Typography.fonts.bold,
  },
  activeBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.success,
    borderWidth: 3,
    borderColor: THEME.card,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 4,
    fontFamily: Typography.fonts.bold,
  },
  userEmail: {
    fontSize: 14,
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.regular,
  },
  glassCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.divider,
    backgroundColor: THEME.glass,
  },
  glassCardWeb: {
    backgroundColor: THEME.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
    padding: 20,
    shadowColor: THEME.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  blurView: {
    padding: 20,
  },
  infoCard: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.secondaryText,
    marginBottom: 4,
    fontFamily: Typography.fonts.regular,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    fontFamily: Typography.fonts.medium,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.divider,
  },
  statusBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: THEME.success,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Typography.fonts.bold,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16,
    textAlign: 'left',
    fontFamily: Typography.fonts.bold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearText: {
    fontSize: 13,
    color: THEME.brand,
    fontFamily: Typography.fonts.medium,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 12,
  },
  notifIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: Typography.fonts.bold,
  },
  notifMessage: {
    fontSize: 12,
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.regular,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(216, 67, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    textAlign: 'left',
    fontFamily: Typography.fonts.medium,
  },
  actionHint: {
    fontSize: 12,
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.regular,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginTop: 8,
    fontFamily: Typography.fonts.bold,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.secondaryText,
    marginTop: 2,
    fontFamily: Typography.fonts.regular,
  },
  logoutSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoutDivider: {
    width: 60,
    height: 1,
    backgroundColor: THEME.divider,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: THEME.secondaryText,
    fontSize: 13,
    fontFamily: Typography.fonts.medium,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: THEME.divider,
    marginTop: 8,
    marginBottom: 20,
    fontFamily: Typography.fonts.regular,
  },
  themeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  themeToggleText: {
    fontSize: 13,
    fontFamily: Typography.fonts.medium,
  },
toastContainer: {
     position: 'absolute',
     bottom: Platform.OS === 'ios' ? 85 : 75,
    left: 20,
    right: 20,
    backgroundColor: THEME.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: THEME.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Typography.fonts.medium,
  },
});
}
