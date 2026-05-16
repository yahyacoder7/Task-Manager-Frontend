import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getItem } from '../../utils/storage';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

import { BASE_URL } from '../../constants/API';

function ProgressBar({ percent }: { percent: number }) {
  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

function PlanCard({ plan, onPress }: { plan: any; onPress: () => void }) {
  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  const { name, description, progressState } = plan;
  const { totalTodos, completedTodos, percOfCompletedTodos } = progressState || {};

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.cardOuter}>
      <LinearGradient colors={THEME.cardGradient as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.fractionBadge}>{completedTodos || 0}/{totalTodos || 0}</Text>
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
            {description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>{description}</Text>
            ) : null}
          </View>
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color={THEME.brand} />
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>{percOfCompletedTodos || 0}%</Text>
          <ProgressBar percent={percOfCompletedTodos || 0} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  const fetchPlans = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/work-plan/get-all-work-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPlans(await res.json());
      } else {
        setError('فشل تحميل خطط العمل');
      }
    } catch {
      setError('تعذّر الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPlans(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchPlans(true); }} tintColor={THEME.brand} />}
      >
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPlans()}>
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={THEME.brand} />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="calendar-outline" size={64} color={THEME.muted} />
            <Text style={styles.emptyTitle}>لا توجد خطط عمل</Text>
            <Text style={styles.emptySub}>أنشئ خطة عمل جديدة لتنظيم مهامك</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-workplan')}>
              <MaterialCommunityIcons name="plus" size={20} color={THEME.white} />
              <Text style={styles.createBtnText}>إنشاء خطة عمل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.createBtnTop} onPress={() => router.push('/create-workplan')}>
              <MaterialCommunityIcons name="plus-circle" size={22} color={THEME.secondaryText} />
              <Text style={styles.createBtnTopText}>إنشاء خطة عمل جديدة</Text>
            </TouchableOpacity>

            {plans.map(plan => (
              <PlanCard
                key={plan.workplanId}
                plan={plan}
                onPress={() => router.push({ pathname: '/workplan/[id]', params: { id: plan.workplanId.toString() } } as any)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  scroll: { padding: 20, paddingBottom: 100, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  errorText: { color: THEME.danger, fontSize: 16, fontFamily: Typography.fonts.regular, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: THEME.card, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: THEME.brand, fontFamily: Typography.fonts.bold, fontSize: 14 },
  emptyTitle: { color: THEME.text, fontSize: 20, fontFamily: Typography.fonts.bold, marginTop: 16 },
  emptySub: { color: THEME.secondaryText, fontSize: 14, fontFamily: Typography.fonts.regular, marginTop: 8, textAlign: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.brand, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 24, gap: 8 },
  createBtnText: { color: THEME.white, fontFamily: Typography.fonts.bold, fontSize: 16 },
  createBtnTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.muted, padding: 16, borderRadius: 16, marginBottom: 20, gap: 10, borderWidth: 1, borderColor: THEME.divider },
  createBtnTopText: { color: THEME.secondaryText, fontFamily: Typography.fonts.bold, fontSize: 15 },

  cardOuter: { marginBottom: 14, borderRadius: 16 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: THEME.divider, overflow: 'hidden' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fractionBadge: { backgroundColor: THEME.brand, color: THEME.white, fontSize: 14, fontFamily: Typography.fonts.bold, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', marginLeft: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(216,67,21,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  cardTitleArea: { flex: 1 },
  cardTitle: { color: THEME.text, fontSize: 16, fontFamily: Typography.fonts.bold, textAlign: 'right' },
  cardDesc: { color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.regular, marginTop: 4, textAlign: 'right' },
  progressSection: { marginTop: 14 },
  progressLabel: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.medium, marginBottom: 6, textAlign: 'left' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: THEME.muted },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: THEME.brand },
  });
}
