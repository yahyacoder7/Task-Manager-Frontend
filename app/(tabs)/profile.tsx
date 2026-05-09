import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getItem, deleteItem, saveItem } from '../../utils/storage';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useCallback, useRef } from 'react';
import { Typography } from '../../constants/Typography';
import { Animated } from 'react-native';

const BASE_URL = "http://localhost:3000";

const THEME = {
  background: '#0F0F0F',
  secondaryBackground: '#1A1A1A',
  brand: '#D84315',
  text: '#FFFFFF',
  secondaryText: '#A0A0A0',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export default function ProfileScreen() {
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
        // Clear the param so it doesn't show again on next focus
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
      // Clear storage
      await deleteItem('userToken');
      await deleteItem('userData');
      
      console.log("Logged out successfully");
      
      // Force navigation to login screen
      router.replace('/');
    } catch (err) {
      console.error("Logout Error:", err);
      // Fallback navigation
      router.replace('/');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير معروف';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const GlassCard = ({ children, style }: any) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return (
        <View style={[styles.glassCardContainer, style]}>
          <BlurView intensity={20} tint="dark" style={styles.blurView}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.activeBadge} />
          </View>
          <Text style={styles.userName}>{user?.name || 'مستخدم Task Flow'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        </View>

        {/* Info Glass Card */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>تاريخ الانضمام</Text>
              <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>الحالة</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>نشط</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الحساب</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleUpdateName}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="person-outline" size={22} color={THEME.brand} />
            </View>
            <Text style={styles.actionText}>تعديل البيانات الشخصية</Text>
            <Ionicons name="chevron-back" size={20} color={THEME.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={THEME.brand} />
            </View>
            <Text style={styles.actionText}>تغيير كلمة المرور</Text>
            <Ionicons name="chevron-back" size={20} color={THEME.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="notifications-outline" size={22} color={THEME.brand} />
            </View>
            <Text style={styles.actionText}>تنبيهات المهام</Text>
            <Ionicons name="chevron-back" size={20} color={THEME.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Stats Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نظرة سريعة</Text>
          <View style={styles.statsRow}>
            <GlassCard style={styles.statBox}>
              <Ionicons name="checkmark-done-circle" size={28} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>مهمة مكتملة</Text>
            </GlassCard>
            <GlassCard style={styles.statBox}>
              <Ionicons name="time-outline" size={28} color="#FF9800" />
              <Text style={styles.statValue}>{stats.incomplete}</Text>
              <Text style={styles.statLabel}>مهام قيد العمل</Text>
            </GlassCard>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF5252" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Task Flow v1.0.0</Text>
      </ScrollView>

      {/* Toast Message */}
      {showToast && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.toastText}>تم تحديث الاسم بنجاح</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
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
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#1A1A1A',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Typography.fonts.bold,
  },
  activeBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Typography.fonts.bold,
  },
  userEmail: {
    fontSize: 14,
    color: '#A0A0A0',
    fontFamily: Typography.fonts.regular,
  },
  glassCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassCardWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
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
    color: '#A0A0A0',
    marginBottom: 4,
    fontFamily: Typography.fonts.regular,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Typography.fonts.medium,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#4CAF50',
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
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
    fontFamily: Typography.fonts.bold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(216, 67, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
    fontFamily: Typography.fonts.medium,
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
    color: '#FFFFFF',
    marginTop: 8,
    fontFamily: Typography.fonts.bold,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
    fontFamily: Typography.fonts.regular,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    borderRadius: 16,
    marginBottom: 20,
    gap: 10,
  },
  logoutText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Typography.fonts.bold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 20,
    fontFamily: Typography.fonts.regular,
  },
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Typography.fonts.medium,
  },
});
