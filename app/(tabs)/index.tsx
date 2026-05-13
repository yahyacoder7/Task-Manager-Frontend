import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getItem } from '../../utils/storage';
import { Typography } from '../../constants/Typography';

const BASE_URL = 'http://localhost:3000';

const THEME = {
  background: '#0F0F0F',
  card: '#1A1A1A',
  brand: '#D84315',
  text: '#FFFFFF',
  secondaryText: '#A0A0A0',
  success: '#4CAF50',
  muted: '#3A3A3A',
  chipBg: '#252525',
};

// ── Translation helpers ───────────────────────────────────────────────────────
const REPEAT_UNIT_AR: Record<string, string> = {
  DAILY: 'يوم', WEEKLY: 'أسبوع', MONTHLY: 'شهر', YEARLY: 'سنة',
};
const EXPECTED_TIME_AR: Record<string, string> = {
  MORNING: 'صباحاً', AFTERNOON: 'ظهراً', EVENING: 'مساءً', NIGHT: 'ليلاً',
};
const EXPECTED_TIME_ICON: Record<string, string> = {
  MORNING: '🌅', AFTERNOON: '☀️', EVENING: '🌆', NIGHT: '🌙',
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
};

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task }: { task: any }) {
  const router = useRouter();
  const hasRepeat = !!task.repeatUnit;

  const isEffectivelyCompleted = (() => {
    if (task.isCompleted) return true;
    
    // For repeating tasks, check if there is a completion log for today
    if (task.repeatUnit && task.taskcompletions && task.taskcompletions.length > 0) {
      const today = new Date();
      return task.taskcompletions.some((log: any) => {
        const d = new Date(log.completedAt);
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      });
    }
    return false;
  })();

  const timeDisplay = task.startDate
    ? { icon: '📅', text: formatDate(task.startDate) }
    : task.expectedTime
    ? { icon: EXPECTED_TIME_ICON[task.expectedTime] || '🕐', text: EXPECTED_TIME_AR[task.expectedTime] || task.expectedTime }
    : null;

  // Dim the card instead of changing background color if completed
  const cardStyle = { backgroundColor: '#1A1A1A' };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.todoId } } as any)}
      style={[styles.card, cardStyle, isEffectivelyCompleted && styles.cardDone]}
    >
      {/* Row 1: Title (Right) and Repeat Badge (Left) */}
      <View style={styles.cardHeader}>
        {hasRepeat ? (
          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>
              كل:{task.repeatInterval} {REPEAT_UNIT_AR[task.repeatUnit] || task.repeatUnit}
            </Text>
          </View>
        ) : <View style={{ width: 4 }} />}
        
        <Text style={[styles.title, isEffectivelyCompleted && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
      </View>

      {/* Row 2: Description */}
      {task.description ? (
        <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
      ) : null}

      {/* Row 3: Footer (Status & Category on Right, Time on Left) */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          {timeDisplay && (
            <View style={styles.timeRow}>
              <Text style={styles.timeIcon}>{timeDisplay.icon}</Text>
              <Text style={styles.timeText}>{timeDisplay.text}</Text>
            </View>
          )}
        </View>

        <View style={styles.footerRight}>
          {task.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category.name}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, isEffectivelyCompleted && styles.statusBadgeDone]}>
            <Ionicons name={isEffectivelyCompleted ? "checkmark-circle" : "time"} size={14} color={THEME.brand} />
            <Text style={[styles.statusText, { color: THEME.brand }]}>
              {isEffectivelyCompleted ? 'مكتملة' : 'قيد الانتظار'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks]         = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const fetchCategories = async () => {
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/category/get-all-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.log("Error fetching categories", err);
    }
  };

  const fetchTasks = async (silent = false, catId: number | null = selectedCategory) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const token = await getItem('userToken');
      const url = catId 
        ? `${BASE_URL}/todo/category/${catId}` 
        : `${BASE_URL}/todo/get-all-todos`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTasks(await res.json());
      } else {
        setError('فشل تحميل المهام');
      }
    } catch {
      setError('تعذّر الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch when returning to screen or when category changes
  useFocusEffect(useCallback(() => { 
    fetchCategories();
    fetchTasks(false, selectedCategory); 
  }, [selectedCategory]));

  const isTaskCompleted = (t: any) => {
    if (t.isCompleted) return true;
    
    // For repeating tasks, it's completed only if completed today
    if (t.repeatUnit && t.taskcompletions && t.taskcompletions.length > 0) {
      const today = new Date();
      return t.taskcompletions.some((log: any) => {
        const d = new Date(log.completedAt);
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      });
    }
    return false;
  };

  const pending   = tasks.filter(t => !isTaskCompleted(t));
  const completed = tasks.filter(t => isTaskCompleted(t));

  return (
    <SafeAreaView style={styles.container}>
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, selectedCategory === null && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterChipText, selectedCategory === null && styles.filterChipTextActive]}>الكل</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.categoryId}
              style={[styles.filterChip, selectedCategory === cat.categoryId && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.categoryId)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.categoryId && styles.filterChipTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.brand} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={60} color={THEME.muted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTasks()}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); fetchTasks(true); }}
              tintColor={THEME.brand}
            />
          }
        >
          {tasks.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="clipboard-outline" size={72} color={THEME.muted} />
              <Text style={styles.emptyTitle}>لا توجد مهام بعد</Text>
              <Text style={styles.emptySubtitle}>اضغط + لإضافة أولى مهامك</Text>
            </View>
          ) : (
            <>
              {/* Pending tasks */}
              {pending.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionCount}>{pending.length}</Text>
                    <Text style={styles.sectionTitle}>المهام القادمة</Text>
                  </View>
                  {pending.map(t => <TaskCard key={t.todoId} task={t} />)}
                </>
              )}

              {/* Completed tasks */}
              {completed.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionCount}>{completed.length}</Text>
                    <Text style={[styles.sectionTitle, { color: THEME.brand }]}>المنجزة</Text>
                  </View>
                  {completed.map(t => <TaskCard key={t.todoId} task={t} />)}
                </>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-todo')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, direction: 'rtl' as any },
  scroll: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },

  // Filters
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: THEME.chipBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: THEME.brand,
    borderColor: THEME.brand,
    shadowColor: THEME.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipText: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#FFF',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: THEME.text,
    fontFamily: Typography.fonts.bold,
    fontSize: 17,
  },
  sectionCount: {
    color: '#FFF',
    backgroundColor: THEME.brand,
    fontFamily: Typography.fonts.bold,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Card
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardDone: {
    borderColor: 'rgba(216,67,21,0.3)',
    backgroundColor: 'rgba(216,67,21,0.03)',
  },

  // Card header row
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: THEME.text,
    fontFamily: Typography.fonts.bold,
    fontSize: 16,
    textAlign: 'right',
  },
  titleDone: {
    color: THEME.secondaryText,
    textDecorationLine: 'line-through',
  },

  // Repeat badge
  repeatBadge: {
    backgroundColor: 'rgba(216,67,21,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(216,67,21,0.25)',
  },
  repeatText: {
    color: THEME.brand,
    fontFamily: Typography.fonts.bold,
    fontSize: 11,
  },

  // Description
  desc: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.regular,
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(216,67,21,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(216,67,21,0.05)',
  },
  statusText: {
    fontFamily: Typography.fonts.bold,
    fontSize: 12,
  },

  // Category Badge
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
  },

  // Time row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: { fontSize: 14 },
  timeText: {
    color: '#888',
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
  },

  // Empty / error
  emptyTitle: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.bold,
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#555',
    fontFamily: Typography.fonts.regular,
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: THEME.brand,
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF', fontFamily: Typography.fonts.bold, fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 26,
    right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: THEME.brand,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: THEME.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});
