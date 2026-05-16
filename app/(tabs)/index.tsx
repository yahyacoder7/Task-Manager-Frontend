import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, TextInput,
  Modal, Pressable, Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getItem } from '../../utils/storage';
import { formatDateShort, isToday } from '../../utils/date';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

import { BASE_URL } from '../../constants/API';

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

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task }: { task: any }) {
  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  const router = useRouter();
  const hasRepeat = !!task.repeatUnit;

  const isEffectivelyCompleted = (() => {
    if (task.isCompleted) return true;
    
    if (task.repeatUnit && task.taskcompletions && task.taskcompletions.length > 0) {
      return task.taskcompletions.some((log: any) => isToday(log.completedAt));
    }
    return false;
  })();

  const timeDisplay = task.startDate
    ? { icon: '📅', text: formatDateShort(task.startDate) }
    : task.expectedTime
    ? { icon: EXPECTED_TIME_ICON[task.expectedTime] || '🕐', text: EXPECTED_TIME_AR[task.expectedTime] || task.expectedTime }
    : null;

  // Dim the card instead of changing background color if completed

  return (
    <View style={[styles.card, isEffectivelyCompleted && styles.cardDone]}>
      <LinearGradient
        colors={THEME.cardGradient as [string, string]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradientBg}
      />
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.todoId } } as any)}
        style={styles.cardTouch}
      >
      {/* Row 1: Title (Right) and Repeat Badge (Left) */}
      <View style={styles.cardHeader}>
        {hasRepeat ? (
          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>
              كل {task.repeatInterval} {REPEAT_UNIT_AR[task.repeatUnit] || task.repeatUnit}
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
            {isEffectivelyCompleted ? <MaterialCommunityIcons name="check-circle" size={14} color={THEME.brand} /> : <MaterialCommunityIcons name="clock-outline" size={14} color={THEME.brand} />}
            <Text style={[styles.statusText, { color: THEME.brand }]}>
              {isEffectivelyCompleted ? 'مكتملة' : 'قيد الانتظار'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </View>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [catFiltering, setCatFiltering] = useState(false);

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

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
    
    if (t.repeatUnit && t.taskcompletions && t.taskcompletions.length > 0) {
      return t.taskcompletions.some((log: any) => isToday(log.completedAt));
    }
    return false;
  };

  const filterBySearch = (t: any) => !searchQuery || t.title?.includes(searchQuery) || t.description?.includes(searchQuery);
  const pending   = tasks.filter(t => !isTaskCompleted(t) && filterBySearch(t));
  const completed = tasks.filter(t => isTaskCompleted(t) && filterBySearch(t));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={THEME.pageGradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={18} color={THEME.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن مهمة..."
          placeholderTextColor={THEME.disabledText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
            <MaterialCommunityIcons name="close-circle" size={20} color={THEME.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View>
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.catDropdown} onPress={() => setCatFiltering(true)}>
          <MaterialCommunityIcons name="folder-outline" size={16} color={THEME.text} />
          <Text style={styles.catDropdownText}>
            {selectedCategory ? categories.find(c => c.categoryId === selectedCategory)?.name || 'الكل' : 'الكل'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={THEME.secondaryText} />
        </TouchableOpacity>
        <Text style={styles.filterLabel}>فلتر:</Text>
      </View>

      <Modal visible={catFiltering} transparent animationType="fade" onRequestClose={() => setCatFiltering(false)}>
        <Pressable style={styles.overlay} onPress={() => setCatFiltering(false)}>
          <Pressable style={styles.catDropdownModal} onPress={e => e.stopPropagation()}>
            <View style={styles.catDropdownHdr}>
              <Text style={styles.catDropdownTitle}>اختر تصنيف</Text>
              <TouchableOpacity onPress={() => setCatFiltering(false)}>
                <MaterialCommunityIcons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.catDropdownOption} onPress={() => { setSelectedCategory(null); setCatFiltering(false); }}>
              <MaterialCommunityIcons name="grid" size={18} color={THEME.brand} />
              <Text style={styles.catDropdownOptText}>الكل</Text>
              {selectedCategory === null && <MaterialCommunityIcons name="check-circle" size={18} color={THEME.brand} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity key={cat.categoryId} style={styles.catDropdownOption} onPress={() => { setSelectedCategory(cat.categoryId); setCatFiltering(false); }}>
                <MaterialCommunityIcons name="folder-outline" size={18} color={THEME.brand} />
                <Text style={styles.catDropdownOptText}>{cat.name}</Text>
                {selectedCategory === cat.categoryId && <MaterialCommunityIcons name="check-circle" size={18} color={THEME.brand} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.brand} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="cloud-off-outline" size={60} color={THEME.muted} />
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
          {tasks.length === 0 && !searchQuery ? (
            <View style={styles.center}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={72} color={THEME.muted} />
              <Text style={styles.emptyTitle}>لا توجد مهام بعد</Text>
              <Text style={styles.emptySubtitle}>اضغط + لإضافة أولى مهامك</Text>
            </View>
          ) : searchQuery && pending.length === 0 && completed.length === 0 ? (
            <View style={styles.center}>
              <MaterialCommunityIcons name="magnify" size={72} color={THEME.muted} />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>لا توجد مهام تطابق بحث "{searchQuery}"</Text>
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
                  <View style={[styles.sectionHeader, { marginTop: 32 }]}>
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
        <MaterialCommunityIcons name="plus" size={32} color={THEME.white} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(THEME: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  scroll: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },

  // Filters
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  filterLabel: {
    color: THEME.secondaryText,
    fontSize: 13,
    fontFamily: Typography.fonts.medium,
  },
  catDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 6,
  },
  catDropdownText: {
    flex: 1,
    color: THEME.text,
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
    textAlign: 'right',
  },
  catDropdownModal: {
    width: '80%',
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
    maxHeight: 400,
  },
  catDropdownHdr: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  catDropdownTitle: {
    color: THEME.text,
    fontSize: 16,
    fontFamily: Typography.fonts.bold,
  },
  catDropdownOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.divider,
  },
  catDropdownOptText: {
    flex: 1,
    color: THEME.text,
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    textAlign: 'right',
  },
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    color: THEME.text,
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    textAlign: 'right',
    outlineStyle: 'none' as any,
  },
  searchClearBtn: { padding: 6 },
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
    borderColor: THEME.divider,
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
    color: THEME.white,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row-reverse',
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
    color: THEME.white,
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
    borderColor: THEME.divider,
    gap: 10,
    shadowColor: THEME.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },
  cardTouch: {
    borderRadius: 18,
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
    color: THEME.text,
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
    borderTopColor: THEME.divider,
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
    backgroundColor: THEME.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: THEME.text,
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
    color: THEME.text,
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
    color: THEME.white, fontFamily: Typography.fonts.bold, fontSize: 14,
  },

  // FAB
  fab: {
     position: 'absolute',
     bottom: 76,
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
}
