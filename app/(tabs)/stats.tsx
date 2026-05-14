import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getItem } from '../../utils/storage';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

const BASE_URL = 'http://localhost:3000';

export default function StatsScreen() {
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [timeDist, setTimeDist] = useState<any[]>([]);
  const [workplanSummary, setWorkplanSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(false);
  const [expandedWorkplan, setExpandedWorkplan] = useState(false);

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = await getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, trendRes, catRes, timeRes, wpRes] = await Promise.all([
        fetch(`${BASE_URL}/analytics/overview`, { headers }),
        fetch(`${BASE_URL}/analytics/completion-trend?days=7`, { headers }),
        fetch(`${BASE_URL}/analytics/category-breakdown`, { headers }),
        fetch(`${BASE_URL}/analytics/time-distribution`, { headers }),
        fetch(`${BASE_URL}/analytics/workplan-summary`, { headers }),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (trendRes.ok) setTrend(await trendRes.json());
      if (catRes.ok) setCategoryBreakdown(await catRes.json());
      if (timeRes.ok) setTimeDist(await timeRes.json());
      if (wpRes.ok) setWorkplanSummary(await wpRes.json());
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const MAX_TREND = 10;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(true); }} tintColor={THEME.brand} />}
      >
        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>نظرة عامة</Text>
        <View style={styles.cardsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color="#6366F1" />
            </View>
            <Text style={styles.statValue}>{overview?.totalTasks ?? 0}</Text>
            <Text style={styles.statLabel}>إجمالي المهام</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#22C55E" />
            </View>
            <Text style={styles.statValue}>{overview?.completedToday ?? 0}</Text>
            <Text style={styles.statLabel}>مكتمل اليوم</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
              <MaterialCommunityIcons name="calendar-outline" size={22} color="#FBBF24" />
            </View>
            <Text style={styles.statValue}>{overview?.activeWorkplans ?? 0}</Text>
            <Text style={styles.statLabel}>خطط العمل</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
              <MaterialCommunityIcons name="infinity" size={22} color="#A855F7" />
            </View>
            <Text style={styles.statValue}>{overview?.repeatingTasks ?? 0}</Text>
            <Text style={styles.statLabel}>مهام متكررة</Text>
          </View>
        </View>

        {/* Weekly Completion Trend */}
        <Text style={styles.sectionTitle}>آخر 7 أيام</Text>
        <View style={styles.chartCard}>
          {trend.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد بيانات</Text>
          ) : (
            <View style={styles.chartBars}>
              {trend.map((day, idx) => {
                const barHeight = Math.max((day.count / MAX_TREND) * 100, day.count > 0 ? 8 : 4);
                const dayName = new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short' });
                return (
                  <View key={idx} style={styles.barCol}>
                    <Text style={styles.barCount}>{day.count}</Text>
                    <View style={[styles.bar, { height: barHeight }]} />
                    <Text style={styles.barLabel}>{dayName}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>المهام حسب التصنيف</Text>
            <View style={styles.chartCard}>
              {(expandedCategory ? categoryBreakdown : categoryBreakdown.slice(0, 3)).map((cat, idx) => {
                const remaining = cat.total - cat.completed;
                const catColors = ['#6366F1', '#22C55E', '#FBBF24', '#A855F7', '#EC4899', '#14B8A6'];
                const dotColor = cat.color || catColors[idx % catColors.length];
                return (
                  <View key={idx} style={styles.catCard}>
                    <View style={styles.catCardRow}>
                      <View style={styles.catCardLeft}>
                        <View style={[styles.catDot, { backgroundColor: dotColor }]} />
                        <Text style={styles.catCardName}>{cat.categoryName}</Text>
                      </View>
                      <Text style={styles.catCardFraction}>{cat.completed}/{cat.total}</Text>
                    </View>
                    <Text style={styles.catCardSub}>
                      {cat.total} مهام — {remaining > 0 ? `${remaining} متبقية` : 'مكتملة'}
                    </Text>
                  </View>
                );
              })}
            </View>
            {categoryBreakdown.length > 3 && (
              <TouchableOpacity style={styles.toggleBtn} onPress={() => setExpandedCategory(!expandedCategory)}>
                <Text style={styles.toggleBtnText}>{expandedCategory ? 'عرض أقل' : 'عرض المزيد'}</Text>
                <MaterialCommunityIcons name={expandedCategory ? "chevron-up" : "chevron-down"} size={16} color={THEME.brand} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Time Distribution */}
        <>
          <Text style={styles.sectionTitle}>توزيع الوقت التقريبي</Text>
          <Text style={styles.timeDesc}>مهامك موزعة حسب الوقت المناسب: صباحاً، مساءً، ليلاً</Text>
          <View style={styles.chartCard}>
            <View style={styles.timeGrid}>
              {[
                { label: 'صباح', icon: 'weather-partly-cloudy' },
                { label: 'ظهر', icon: 'weather-sunny' },
                { label: 'مساء', icon: 'weather-night-partly-cloudy' },
                { label: 'ليل', icon: 'weather-night' },
              ].map((period, idx) => {
                const match = timeDist.find((t: any) => t.label?.includes(period.label));
                return (
                  <View key={idx} style={styles.timeChip}>
                    <MaterialCommunityIcons name={period.icon} size={20} color={THEME.secondaryText} />
                    <Text style={styles.timeCount}>{match?.count ?? 0}</Text>
                    <Text style={styles.timeLabel}>{period.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
  scroll: { padding: 20 },
  sectionTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, textAlign: 'right', marginTop: 24, marginBottom: 14 },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', backgroundColor: THEME.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: THEME.divider },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { color: THEME.text, fontSize: 28, fontFamily: Typography.fonts.bold, textAlign: 'right' },
  statLabel: { color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.regular, marginTop: 4, textAlign: 'right' },

  chartCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: THEME.divider },
  emptyText: { color: THEME.disabledText, fontSize: 14, fontFamily: Typography.fonts.regular, textAlign: 'center', paddingVertical: 20 },

  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  barCol: { alignItems: 'center', flex: 1 },
  barCount: { color: THEME.secondaryText, fontSize: 11, fontFamily: Typography.fonts.medium, marginBottom: 4 },
  bar: { width: 24, borderRadius: 6, backgroundColor: THEME.brand, minHeight: 4 },
  barLabel: { color: THEME.disabledText, fontSize: 11, fontFamily: Typography.fonts.regular, marginTop: 6 },

  catCard: { backgroundColor: THEME.muted, borderRadius: 12, padding: 14, marginBottom: 10 },
  catCardRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  catCardLeft: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catCardName: { color: THEME.text, fontSize: 14, fontFamily: Typography.fonts.medium, textAlign: 'right' },
  catCardFraction: { color: THEME.brand, fontSize: 14, fontFamily: Typography.fonts.bold },
  catCardSub: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.regular, marginTop: 6, textAlign: 'right' },

  timeDesc: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.regular, textAlign: 'right', marginBottom: 14 },
  timeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  timeChip: { backgroundColor: THEME.muted, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', minWidth: 70, gap: 4 },
  timeCount: { color: THEME.text, fontSize: 22, fontFamily: Typography.fonts.bold },
  timeLabel: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.regular, marginTop: 4 },

  wpCard: { backgroundColor: THEME.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: THEME.divider },
  wpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  wpName: { color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.bold, textAlign: 'right', flex: 1 },
  wpPercent: { color: THEME.brand, fontSize: 16, fontFamily: Typography.fonts.bold },
  wpBarTrack: { height: 8, borderRadius: 4, backgroundColor: THEME.muted, overflow: 'hidden' },
  wpBarFill: { height: 8, borderRadius: 4, backgroundColor: THEME.brand },
  wpCount: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.regular, marginTop: 6, textAlign: 'right' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 4 },
  toggleBtnText: { color: THEME.brand, fontSize: 13, fontFamily: Typography.fonts.medium, marginRight: 6 },
  });
}
