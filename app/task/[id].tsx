import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal, Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  divider: 'rgba(255,255,255,0.08)',
};

const REPEAT_UNIT_AR: Record<string, string> = {
  DAILY: 'يوم', WEEKLY: 'أسبوع', MONTHLY: 'شهر', YEARLY: 'سنة',
};
const EXPECTED_TIME_AR: Record<string, string> = {
  MORNING: 'صباحاً', AFTERNOON: 'ظهراً', EVENING: 'مساءً', NIGHT: 'ليلاً',
};

const formatFullDate = (iso: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
};

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<{ advice: string; source: string } | null>(null);

  // Helper to determine if task is completed
  const isEffectivelyCompleted = () => {
    if (!task) return false;
    if (task.isCompleted) return true;
    
    // For repeating tasks, it is completed ONLY if completed today
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
  };

  const fetchTask = async () => {
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/todo/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTask(await res.json());
        
        // Fetch AI advice
        try {
          const adviceRes = await fetch(`${BASE_URL}/ai/get-task-advice/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (adviceRes.ok) {
            setAiAdvice(await adviceRes.json());
          }
        } catch {}
      } else {
        Alert.alert('خطأ', 'تعذر تحميل تفاصيل المهمة');
        router.back();
      }
    } catch {
      Alert.alert('خطأ', 'مشكلة في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTask(); }, [id]));

  const completeTask = async () => {
    setIsCompleting(true);
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/todo/complete/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Fetch the fresh data with all relations (categories, completions) from the server
        await fetchTask();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('خطأ', errData.message || 'تعذر إكمال المهمة');
      }
    } catch {
      Alert.alert('خطأ', 'مشكلة في الاتصال بالخادم');
    } finally {
      setIsCompleting(false);
    }
  };

  const deleteTask = async () => {
    setConfirmDeleteVisible(true);
  };

  const performDelete = async () => {
    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    const token = await getItem('userToken');
    
    if (!token) {
      Alert.alert('خطأ', 'لا يوجد توكن');
      setIsDeleting(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/todo/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('خطأ', 'فشل الحذف');
      }
    } catch (e) {
      Alert.alert('خطأ', 'مشكلة في الاتصال');
    }
    setIsDeleting(false);
  };

  const showTaskOptions = () => {
    setOptionsModalVisible(true);
  };

  if (isLoading || !task) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.brand} />
      </SafeAreaView>
    );
  }

  const completed = isEffectivelyCompleted();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: '',
        headerStyle: { backgroundColor: THEME.background },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerTitle}>تفاصيل المهمة</Text>
            <Ionicons name="arrow-forward" size={24} color={THEME.text} />
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity onPress={showTaskOptions} style={styles.optionsBtn}>
            <Ionicons name="ellipsis-vertical" size={24} color={THEME.text} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.mainCard}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, completed && styles.statusBadgeDone]}>
            <Ionicons name={completed ? "checkmark-circle" : "time"} size={16} color={THEME.brand} />
            <Text style={[styles.statusText, { color: THEME.brand }]}>
              {completed ? 'مهمة مكتملة' : 'قيد الانتظار'}
            </Text>
          </View>

          <Text style={styles.title}>{task.title}</Text>
          {task.description ? (
            <Text style={styles.desc}>{task.description}</Text>
          ) : null}
        </View>

        {/* AI Advice Section */}
        {aiAdvice && (
          <View style={styles.adviceCard}>
            <View style={styles.adviceRow}>
              <View style={styles.adviceIconBox}>
                <Ionicons name="bulb" size={16} color={THEME.brand} />
              </View>
              <Text style={styles.adviceTitle}>نصيحة لمهمتك</Text>
            </View>
            <Text style={styles.adviceText}>{aiAdvice.advice}</Text>
          </View>
        )}

        {/* Details Section */}
        <View style={styles.detailsCard}>
          
          {task.category && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="folder-open-outline" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>التصنيف</Text>
              </View>
              <Text style={styles.detailValue}>{task.category.name}</Text>
            </View>
          )}

          {task.repeatUnit && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="repeat" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>التكرار</Text>
              </View>
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>كل {task.repeatInterval} {REPEAT_UNIT_AR[task.repeatUnit]}</Text>
              </View>
            </View>
          )}

          {task.startDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="calendar-outline" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>تاريخ البدء</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>
                {formatFullDate(task.startDate)}
              </Text>
            </View>
          )}

          {task.expectedTime && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="partly-sunny-outline" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>الوقت التقريبي</Text>
              </View>
              <Text style={styles.detailValue}>{EXPECTED_TIME_AR[task.expectedTime]}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailLeft}>
              <Ionicons name="add-circle-outline" size={20} color={THEME.secondaryText} />
              <Text style={styles.detailLabel}>تاريخ الإنشاء</Text>
            </View>
            <Text style={[styles.detailValue, { fontSize: 12 }]} numberOfLines={1}>
              {formatFullDate(task.createdAt)}
            </Text>
          </View>
        </View>

        {/* Completion Logs Accordion */}
        {task.taskcompletions && task.taskcompletions.length > 0 && (
          <View style={styles.accordionContainer}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              activeOpacity={0.7} 
              onPress={() => setLogsOpen(!logsOpen)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.logsBadge}>
                  <Text style={styles.logsBadgeText}>{task.taskcompletions.length}</Text>
                </View>
                <Text style={styles.accordionTitle}>سجلات الإكمال</Text>
              </View>
              <Ionicons name={logsOpen ? "chevron-up" : "chevron-down"} size={20} color={THEME.text} />
            </TouchableOpacity>

            {logsOpen && (
              <View style={styles.accordionBody}>
                {task.taskcompletions.map((log: any, idx: number) => (
                  <View key={log.completionId || idx} style={styles.logItem}>
                    <View style={styles.logDot} />
                    <Text style={styles.logText}>{formatFullDate(log.completedAt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Complete Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.completeBtn, completed && styles.completeBtnDone]} 
          activeOpacity={0.8}
          disabled={isCompleting || completed}
          onPress={completeTask}
        >
          {isCompleting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name={completed ? "checkmark-done" : "checkmark"} size={22} color={completed ? THEME.brand : "#FFF"} />
              <Text style={[styles.completeBtnText, completed && { color: THEME.brand }]}>
                {completed ? 'تم إنجاز المهمة' : 'إكمال المهمة'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Options Modal */}
      <Modal visible={optionsModalVisible} transparent animationType="fade" onRequestClose={() => setOptionsModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => { console.log('Overlay pressed'); setOptionsModalVisible(false); }}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>خيارات المهمة</Text>
            
            <TouchableOpacity 
              style={styles.modalActionBtn} 
              onPress={() => { 
                console.log('Edit pressed');
                setOptionsModalVisible(false); 
                router.push({ pathname: '/edit-todo/[id]', params: { id: id as string } } as any); 
              }}
            >
              <Ionicons name="pencil" size={20} color={THEME.brand} />
              <Text style={styles.modalActionText}>تعديل المهمة</Text>
            </TouchableOpacity>
            
            <View style={styles.modalDivider} />
            
            <TouchableOpacity 
              style={styles.modalActionBtn} 
              onPress={() => { 
                console.log('Delete pressed in modal');
                setOptionsModalVisible(false); 
                deleteTask(); 
              }}
            >
              <Ionicons name="trash" size={20} color="#FF5252" />
              <Text style={[styles.modalActionText, { color: '#FF5252' }]}>حذف المهمة</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={confirmDeleteVisible} transparent animationType="fade" onRequestClose={() => setConfirmDeleteVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setConfirmDeleteVisible(false)}>
          <View style={styles.confirmModalBox}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="warning" size={40} color="#FF5252" />
            </View>
            <Text style={styles.confirmTitle}>حذف المهمة</Text>
            <Text style={styles.confirmMessage}>
              هل أنت متأكد من حذف هذه المهمة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={performDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#FFF" />
                <Text style={styles.deleteBtnText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, direction: 'rtl' as any },
  centerContainer: { flex: 1, backgroundColor: THEME.background, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 100 },
  
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 10 },
  headerTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold },
  optionsBtn: { paddingHorizontal: 16, paddingVertical: 8 },

  mainCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 6, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(216,67,21,0.1)', borderRadius: 10,
    marginBottom: 16,
  },
  statusBadgeDone: { backgroundColor: 'rgba(216,67,21,0.05)' },
  statusText: { fontFamily: Typography.fonts.bold, fontSize: 13 },
  title: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 22, marginBottom: 8, textAlign: 'right' },
  desc: { color: THEME.secondaryText, fontFamily: Typography.fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'right' },

  adviceCard: {
    backgroundColor: 'rgba(216,67,21,0.08)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(216,67,21,0.2)',
  },
  adviceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  adviceIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(216,67,21,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adviceTitle: {
    color: THEME.brand,
    fontFamily: Typography.fonts.bold,
    fontSize: 15,
    textAlign: 'right',
  },
  adviceText: {
    color: THEME.text,
    fontFamily: Typography.fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    opacity: 0.9,
  },

  detailsCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.divider,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 14 },
  detailValue: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 14 },

  repeatBadge: {
    backgroundColor: 'rgba(216,67,21,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  repeatBadgeText: { color: THEME.brand, fontFamily: Typography.fonts.bold, fontSize: 12 },

  accordionContainer: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.divider,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: 'rgba(255,255,255,0.02)',
  },
  accordionTitle: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 15 },
  logsBadge: {
    backgroundColor: THEME.brand, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },
  logsBadgeText: { color: '#FFF', fontFamily: Typography.fonts.bold, fontSize: 12 },
  accordionBody: {
    padding: 16, paddingTop: 0,
    borderTopWidth: 1, borderTopColor: THEME.divider,
  },
  logItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.brand },
  logText: { color: THEME.secondaryText, fontFamily: Typography.fonts.regular, fontSize: 14 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: THEME.background,
    padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: THEME.divider,
  },
  completeBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: THEME.brand,
    height: 56, borderRadius: 16,
    shadowColor: THEME.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  completeBtnDone: {
    backgroundColor: 'rgba(216,67,21,0.08)',
    borderWidth: 1.5, borderColor: THEME.brand,
  },
  completeBtnText: {
    color: '#FFF', fontFamily: Typography.fonts.bold, fontSize: 16,
  },

  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalBox: {
    width: '80%', backgroundColor: THEME.card,
    borderRadius: 22, padding: 24, borderWidth: 1, borderColor: THEME.divider,
  },
  modalTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, marginBottom: 16, textAlign: 'center' },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, justifyContent: 'flex-start' },
  modalActionText: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 16 },
  modalDivider: { height: 1, backgroundColor: THEME.divider, marginVertical: 4 },

  confirmModalBox: {
    width: '85%',
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  confirmIconCircle: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,82,82,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    color: THEME.text,
    fontSize: 20,
    fontFamily: Typography.fonts.bold,
    marginBottom: 8,
  },
  confirmMessage: {
    color: THEME.secondaryText,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: THEME.muted,
    justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: {
    color: THEME.text,
    fontSize: 15,
    fontFamily: Typography.fonts.bold,
  },
  deleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: Typography.fonts.bold,
  },
});
