import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getItem } from '../../utils/storage';
import { isToday } from '../../utils/date';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

const BASE_URL = 'http://localhost:3000';

function ProgressBar({ percent }: { percent: number }) {
  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%` }]} />
    </View>
  );
}

const isTodoCompleted = (t: any) => {
  if (t.isCompleted) return true;
  if (t.repeatUnit && t.taskcompletions && t.taskcompletions.length > 0) {
    return t.taskcompletions.some((log: any) => isToday(log.completedAt));
  }
  return false;
};

export default function WorkplanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [workplan, setWorkplan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  const fetchWorkplan = async () => {
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/work-plan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setWorkplan(await res.json());
      } else {
        Alert.alert('خطأ', 'تعذر تحميل تفاصيل خطة العمل');
        router.back();
      }
    } catch {
      Alert.alert('خطأ', 'مشكلة في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchWorkplan(); }, [id]));

  const handleDelete = async () => {
    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/work-plan/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.replace('/(tabs)/plans');
      } else {
        Alert.alert('خطأ', 'فشل الحذف');
      }
    } catch {
      Alert.alert('خطأ', 'مشكلة في الاتصال');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveTodo = (todoId: number, title: string) => {
    Alert.alert('إزالة مهمة', `إزالة "${title}" من خطة العمل؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إزالة', style: 'destructive', onPress: async () => {
          try {
            const token = await getItem('userToken');
            const res = await fetch(`${BASE_URL}/work-plan/remove-todo/${todoId}`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              await fetchWorkplan();
            } else {
              Alert.alert('خطأ', 'فشلت الإزالة');
            }
          } catch {
            Alert.alert('خطأ', 'مشكلة في الاتصال');
          }
        },
      },
    ]);
  };

  const handleComplete = async (todoId: number) => {
    try {
      const token = await getItem('userToken');
      await fetch(`${BASE_URL}/todo/complete/${todoId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchWorkplan();
    } catch {}
  };

  if (isLoading || !workplan) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.brand} />
      </SafeAreaView>
    );
  }

  const { name, description, todo, progressState } = workplan;
  const { totalTodos, completedTodos, percOfCompletedTodos } = progressState || {};

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: '',
        headerStyle: { backgroundColor: '#E65A2A' },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerTitle}>تفاصيل الخطة</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color={THEME.white} />
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity onPress={() => setOptionsVisible(true)} style={styles.optionsBtn}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={THEME.white} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.titleRow}>
            <Text style={styles.fractionBadge}>{completedTodos || 0}/{totalTodos || 0}</Text>
            <Text style={styles.title}>{name}</Text>
          </View>
          {description ? <Text style={styles.desc}>{description}</Text> : null}
          <View style={styles.progressSection}>
            <ProgressBar percent={percOfCompletedTodos || 0} />
            <Text style={styles.progressLabel}>{percOfCompletedTodos || 0}% مكتمل</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>المهام ({todo?.length || 0})</Text>

        {(!todo || todo.length === 0) && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="file-document-outline" size={40} color={THEME.muted} />
            <Text style={styles.emptyText}>لا توجد مهام في هذه الخطة</Text>
          </View>
        )}

        {todo?.map((t: any, idx: number) => (
          <View key={t.todoId} style={styles.todoWrapper}>
            <View style={styles.timelineCol}>
              <View style={[styles.timelineCircle, isTodoCompleted(t) && styles.timelineCircleDone]}>
                {isTodoCompleted(t) ? (
                  <MaterialCommunityIcons name="check" size={18} color={THEME.white} />
                ) : (
                  <Text style={styles.timelineNum}>{idx + 1}</Text>
                )}
              </View>
              {idx < todo.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={[styles.todoCard, isTodoCompleted(t) && styles.todoCardDone]}>
              <View style={styles.todoInfo}>
                <View style={styles.todoHeaderRow}>
                  {t.category && (
                    <View style={styles.catBadge}>
                      <Text style={styles.catText}>{t.category.name}</Text>
                    </View>
                  )}
                  <Text style={[styles.todoTitle, isTodoCompleted(t) && styles.todoTitleDone]} numberOfLines={1}>{t.title}</Text>
                </View>
                {t.description ? (
                  <Text style={styles.todoDesc} numberOfLines={2}>{t.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => handleComplete(t.todoId)} style={styles.completeBtn}>
                <View style={[styles.completeCircle, isTodoCompleted(t) && styles.completeCircleDone]}>
                  <MaterialCommunityIcons name={isTodoCompleted(t) ? 'check' : 'circle-outline'} size={isTodoCompleted(t) ? 18 : 20} color={isTodoCompleted(t) ? THEME.white : THEME.brand} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={optionsVisible} transparent animationType="fade" onRequestClose={() => setOptionsVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setOptionsVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>خيارات خطة العمل</Text>

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => {
              setOptionsVisible(false);
              router.push({ pathname: '/edit-workplan/[id]', params: { id: id as string } } as any);
            }}>
              <MaterialCommunityIcons name="pencil" size={20} color={THEME.brand} />
              <Text style={styles.modalActionText}>تعديل خطة العمل</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalActionBtn} onPress={() => {
              setOptionsVisible(false);
              setConfirmDeleteVisible(true);
            }}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={THEME.danger} />
              <Text style={[styles.modalActionText, { color: THEME.danger }]}>حذف خطة العمل</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={confirmDeleteVisible} transparent animationType="fade" onRequestClose={() => setConfirmDeleteVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setConfirmDeleteVisible(false)}>
          <View style={styles.confirmModalBox}>
            <View style={styles.confirmIconCircle}>
              <MaterialCommunityIcons name="alert-outline" size={40} color={THEME.danger} />
            </View>
            <Text style={styles.confirmTitle}>حذف خطة العمل</Text>
            <Text style={styles.confirmMessage}>هل أنت متأكد من حذف "{name}"؟ لا يمكن التراجع عن هذا الإجراء.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                {isDeleting ? (
                  <ActivityIndicator color={THEME.white} size="small" />
                ) : (
                  <><MaterialCommunityIcons name="delete-outline" size={18} color={THEME.white} /><Text style={styles.deleteBtnText}>حذف</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  headerTitle: { color: THEME.white, fontSize: 18, fontFamily: Typography.fonts.bold },
  headerDeleteBtn: { padding: 8 },
  scroll: { padding: 20, paddingBottom: 40 },

  mainCard: { backgroundColor: THEME.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: THEME.divider },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: THEME.text, fontSize: 22, fontFamily: Typography.fonts.bold, textAlign: 'right', flex: 1 },
  fractionBadge: { backgroundColor: THEME.brand, color: THEME.white, fontSize: 14, fontFamily: Typography.fonts.bold, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', marginLeft: 12 },
  desc: { color: THEME.secondaryText, fontSize: 14, fontFamily: Typography.fonts.regular, marginTop: 8, textAlign: 'right', lineHeight: 22 },
  progressSection: { marginTop: 20 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: THEME.muted },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: THEME.brand },
  progressLabel: { color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.medium, marginTop: 8, textAlign: 'center' },

  sectionTitle: { color: THEME.text, fontSize: 17, fontFamily: Typography.fonts.bold, marginBottom: 12, textAlign: 'right' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: THEME.disabledText, fontSize: 15, fontFamily: Typography.fonts.regular, marginTop: 12 },

  todoWrapper: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 0, gap: 12 },
  timelineCol: { width: 36, alignItems: 'center', paddingTop: 4 },
  timelineCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: THEME.brand, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  timelineCircleDone: { backgroundColor: THEME.success },
  timelineNum: { color: THEME.white, fontSize: 13, fontFamily: Typography.fonts.bold },
  timelineLine: { width: 2, flex: 1, backgroundColor: THEME.brand, opacity: 0.3, minHeight: 30, marginVertical: -2 },
  todoCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, borderRadius: 14, padding: 12, marginBottom: 10, gap: 8, borderWidth: 1, borderColor: THEME.divider },
  todoCardDone: { opacity: 0.55 },
  todoInfo: { flex: 1 },
  todoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todoTitle: { color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.medium, textAlign: 'right', flex: 1 },
  todoTitleDone: { textDecorationLine: 'line-through', color: THEME.secondaryText },
  todoDesc: { color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.regular, textAlign: 'right', marginTop: 8 },
  catBadge: { backgroundColor: THEME.muted, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  catText: { color: THEME.secondaryText, fontSize: 11, fontFamily: Typography.fonts.medium },
  completeBtn: { padding: 4 },
  completeCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: THEME.brand, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.card, elevation: 4, shadowColor: THEME.brand, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  completeCircleDone: { backgroundColor: THEME.success, borderColor: THEME.success },

  optionsBtn: { padding: 8 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalBox: { backgroundColor: THEME.secondaryBackground, borderRadius: 20, padding: 24, width: '85%', maxWidth: 360 },
  modalTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, textAlign: 'center', marginBottom: 20 },
  modalActionBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 14, gap: 12 },
  modalActionText: { color: THEME.text, fontSize: 16, fontFamily: Typography.fonts.medium },
  modalDivider: { height: 1, backgroundColor: THEME.divider },

  confirmModalBox: { backgroundColor: THEME.secondaryBackground, borderRadius: 20, padding: 24, width: '85%', maxWidth: 360, alignItems: 'center' },
  confirmIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,82,82,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  confirmTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, marginBottom: 8, textAlign: 'center' },
  confirmMessage: { color: THEME.secondaryText, fontSize: 14, fontFamily: Typography.fonts.regular, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: THEME.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.divider },
  cancelBtnText: { color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.bold },
  deleteBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: THEME.danger, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  deleteBtnText: { color: THEME.white, fontSize: 15, fontFamily: Typography.fonts.bold },
  });
}
