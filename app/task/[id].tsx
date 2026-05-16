import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal, Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getItem } from '../../utils/storage';
import { formatDateFull, formatDateOnly, isToday } from '../../utils/date';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

import { BASE_URL } from '../../constants/API';

const REPEAT_UNIT_EN: Record<string, string> = {
  DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year',
};
const EXPECTED_TIME_EN: Record<string, string> = {
  MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening', NIGHT: 'Night',
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

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  const isEffectivelyCompleted = () => {
    if (!task) return false;
    if (task.isCompleted) return true;
    
    if (task.repeatUnit && task.taskcompletions && task.taskcompletions.length > 0) {
      return task.taskcompletions.some((log: any) => isToday(log.completedAt));
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
        
        try {
          const adviceRes = await fetch(`${BASE_URL}/ai/get-task-advice/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (adviceRes.ok) {
            setAiAdvice(await adviceRes.json());
          }
        } catch {}
      } else {
        Alert.alert('Error', 'Unable to load task details');
        router.back();
      }
    } catch {
      Alert.alert('Error', 'Server connection problem');
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
        await fetchTask();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.message || 'Unable to complete task');
      }
    } catch {
      Alert.alert('Error', 'Server connection problem');
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
      Alert.alert('Error', 'No token found');
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
        Alert.alert('Error', 'Delete failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection problem');
    }
    setIsDeleting(false);
  };

  const showTaskOptions = () => {
    setOptionsModalVisible(true);
  };

  if (isLoading || !task) {
    return (
      <SafeAreaView style={[styles.centerContainer, { direction: 'ltr' } as any]}>
        <ActivityIndicator size="large" color={THEME.brand} />
      </SafeAreaView>
    );
  }

  const completed = isEffectivelyCompleted();

  return (
    <SafeAreaView style={[styles.container, { direction: 'ltr' } as any]}>
      <LinearGradient
        colors={THEME.pageGradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Stack.Screen options={{
        headerTitle: '',
        headerStyle: { backgroundColor: '#E65A2A' },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.white} />
            <Text style={styles.headerTitle}>Task Details</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={showTaskOptions} style={styles.optionsBtn}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color={THEME.white} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.mainCard}>
          <View style={[styles.statusBadge, completed && styles.statusBadgeDone]}>
            <MaterialCommunityIcons name={completed ? "check-circle" : "clock-outline"} size={16} color={THEME.brand} />
            <Text style={[styles.statusText, { color: THEME.brand }]}>
              {completed ? 'Task Completed' : 'Pending'}
            </Text>
          </View>

          <Text style={styles.title}>{task.title}</Text>
          {task.description ? (
            <Text style={styles.desc}>{task.description}</Text>
          ) : null}
        </View>

        {aiAdvice && (
          <View style={styles.adviceCard}>
            <View style={styles.adviceRow}>
              <View style={styles.adviceIconBox}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={THEME.brand} />
              </View>
              <Text style={styles.adviceTitle}>Task Advice</Text>
            </View>
            <Text style={styles.adviceText}>{aiAdvice.advice}</Text>
          </View>
        )}

        <View style={styles.detailsCard}>
          
          {task.workplan && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>Work Plan</Text>
              </View>
              <Text style={styles.detailValue}>{task.workplan.name}</Text>
            </View>
          )}

          {task.category && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialCommunityIcons name="folder-open-outline" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>Category</Text>
              </View>
              <Text style={styles.detailValue}>{task.category.name}</Text>
            </View>
          )}

          {task.repeatUnit && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialCommunityIcons name="repeat" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>Repeat</Text>
              </View>
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>Every {task.repeatInterval} {REPEAT_UNIT_EN[task.repeatUnit]}</Text>
              </View>
            </View>
          )}

          {task.startDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialCommunityIcons name="calendar-outline" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>Start Date</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>
                {formatDateOnly(task.startDate)}
              </Text>
            </View>
          )}

          {task.expectedTime && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color={THEME.secondaryText} />
                <Text style={styles.detailLabel}>Approximate Time</Text>
              </View>
              <Text style={styles.detailValue}>{EXPECTED_TIME_EN[task.expectedTime]}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailLeft}>
              <MaterialCommunityIcons name="plus-circle" size={20} color={THEME.secondaryText} />
              <Text style={styles.detailLabel}>Created</Text>
            </View>
            <Text style={[styles.detailValue, { fontSize: 12 }]} numberOfLines={1}>
              {formatDateFull(task.createdAt)}
            </Text>
          </View>
        </View>

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
                <Text style={styles.accordionTitle}>Completion Logs</Text>
              </View>
              <MaterialCommunityIcons name={logsOpen ? "chevron-up" : "chevron-down"} size={20} color={THEME.text} />
            </TouchableOpacity>

            {logsOpen && (
              <View style={styles.accordionBody}>
                {task.taskcompletions.map((log: any, idx: number) => (
                  <View key={log.completionId || idx} style={styles.logItem}>
                    <View style={styles.logDot} />
                    <Text style={styles.logText}>{formatDateOnly(log.completedAt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.completeBtn, completed && styles.completeBtnDone]} 
          activeOpacity={0.8}
          disabled={isCompleting || completed}
          onPress={completeTask}
        >
          {isCompleting ? (
            <ActivityIndicator color={THEME.white} />
          ) : (
            <>
              {completed ? <MaterialCommunityIcons name="check-circle" size={22} color={THEME.brand} /> : <MaterialCommunityIcons name="check" size={22} color={THEME.white} />}
              <Text style={[styles.completeBtnText, completed && { color: THEME.brand }]}>
                {completed ? 'Task Completed' : 'Complete Task'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={optionsModalVisible} transparent animationType="fade" onRequestClose={() => setOptionsModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setOptionsModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHdr}>
              <Text style={styles.modalTitle}>Task Options</Text>
              <TouchableOpacity onPress={() => setOptionsModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalActionBtn} 
              onPress={() => { 
                setOptionsModalVisible(false); 
                router.push({ pathname: '/edit-todo/[id]', params: { id: id as string } } as any); 
              }}
            >
              <View style={[styles.modalActionIcon, { backgroundColor: 'rgba(216,67,21,0.1)' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={THEME.brand} />
              </View>
              <View style={styles.modalActionContent}>
                <Text style={styles.modalActionText}>Edit Task</Text>
                <Text style={styles.modalActionSub}>Edit title, category, time and more</Text>
              </View>
            </TouchableOpacity>
            
            <View style={{ height: 12 }} />
            
            <TouchableOpacity 
              style={styles.modalActionBtn} 
              onPress={() => { 
                setOptionsModalVisible(false); 
                deleteTask(); 
              }}
            >
              <View style={[styles.modalActionIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                <MaterialCommunityIcons name="delete-outline" size={20} color={THEME.danger} />
              </View>
              <View style={styles.modalActionContent}>
                <Text style={[styles.modalActionText, { color: THEME.danger }]}>Delete Task</Text>
                <Text style={styles.modalActionSub}>This action cannot be undone</Text>
              </View>
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
            <Text style={styles.confirmTitle}>Delete Task</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to permanently delete this task? This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={performDelete}
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color={THEME.white} />
                <Text style={styles.deleteBtnText}>Delete</Text>
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
  centerContainer: { flex: 1, backgroundColor: THEME.background, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingTop: 16, paddingBottom: 100 },
  
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 10 },
  headerTitle: { color: THEME.white, fontSize: 18, fontFamily: Typography.fonts.bold },
  optionsBtn: { paddingHorizontal: 16, paddingVertical: 8 },

  mainCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.divider,
    shadowColor: THEME.black,
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
  title: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 22, marginBottom: 8, textAlign: 'left' },
  desc: { color: THEME.secondaryText, fontFamily: Typography.fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'left' },

  adviceCard: {
    backgroundColor: 'rgba(216,67,21,0.08)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(216,67,21,0.2)',
  },
  adviceRow: {
    flexDirection: 'row',
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
    textAlign: 'left',
  },
  adviceText: {
    color: THEME.text,
    fontFamily: Typography.fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'left',
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
    padding: 16, backgroundColor: THEME.muted,
  },
  accordionTitle: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 15 },
  logsBadge: {
    backgroundColor: THEME.brand, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },
  logsBadgeText: { color: THEME.white, fontFamily: Typography.fonts.bold, fontSize: 12 },
  accordionBody: {
    padding: 16, paddingTop: 0,
    borderTopWidth: 1, borderTopColor: THEME.divider,
  },
  logItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,     borderBottomWidth: 1, borderBottomColor: THEME.divider,
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
    color: THEME.white, fontFamily: Typography.fonts.bold, fontSize: 16,
  },

  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalBox: {
    width: '85%', backgroundColor: THEME.card,
    borderRadius: 22, padding: 20, borderWidth: 1, borderColor: THEME.divider,
  },
  modalHdr: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: { color: THEME.text, fontSize: 17, fontFamily: Typography.fonts.bold },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  modalActionIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  modalActionContent: { flex: 1 },
  modalActionText: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 15, textAlign: 'left' },
  modalActionSub: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.regular, marginTop: 2, textAlign: 'left' },

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
    backgroundColor: THEME.danger,
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: THEME.white,
    fontSize: 15,
    fontFamily: Typography.fonts.bold,
  },
  });
}
