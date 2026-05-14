import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { getItem } from '../../utils/storage';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../constants/ThemeContext';

const BASE_URL = 'http://localhost:3000';

export default function EditWorkplanScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [availableTodos, setAvailableTodos] = useState<any[]>([]);
  const [planTodoMap, setPlanTodoMap] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]         = useState(false);

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('userToken');
        const [planRes, availRes] = await Promise.all([
          fetch(`${BASE_URL}/work-plan/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BASE_URL}/todo/available`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (planRes.ok) {
          const plan = await planRes.json();
          setName(plan.name || '');
          setDescription(plan.description || '');
          const ids = (plan.todo || []).map((t: any) => t.todoId);
          setSelectedIds(ids);
          const map: Record<number, any> = {};
          (plan.todo || []).forEach((t: any) => { map[t.todoId] = t; });
          setPlanTodoMap(map);
        }
        if (availRes.ok) {
          setAvailableTodos(await availRes.json());
        }
      } catch {} finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const toggleTodo = (todoId: number) => {
    setSelectedIds(prev =>
      prev.includes(todoId) ? prev.filter(x => x !== todoId) : [...prev, todoId]
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selectedIds];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSelectedIds(next);
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    const next = [...selectedIds];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setSelectedIds(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم خطة العمل');
      return;
    }
    setIsSaving(true);
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/work-plan/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, todoIds: selectedIds }),
      });
      if (res.ok) {
        router.back();
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('خطأ', data.message || 'فشل تحديث خطة العمل');
      }
    } catch {
      Alert.alert('خطأ', 'مشكلة في الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  const allKnown = { ...planTodoMap };
  availableTodos.forEach((t: any) => { if (!allKnown[t.todoId]) allKnown[t.todoId] = t; });
  const selectedTodos = selectedIds.map(tid => allKnown[tid]).filter(Boolean);
  const selectedSet = new Set(selectedIds);
  const unselectedTodos = availableTodos.filter(t => !selectedSet.has(t.todoId));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={THEME.brand} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'تعديل خطة العمل', headerTitleStyle: { color: '#FFFFFF', fontFamily: Typography.fonts.bold }, headerStyle: { backgroundColor: '#E65A2A' }, headerTintColor: '#FFFFFF' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>الاسم</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="اسم خطة العمل" placeholderTextColor={THEME.secondaryText} />

          <Text style={styles.label}>الوصف</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="وصف مختصر" placeholderTextColor={THEME.secondaryText} multiline numberOfLines={3} />

          <Text style={styles.sectionTitle}>المهام المحددة ({selectedIds.length})</Text>
          {selectedTodos.length === 0 ? (
            <Text style={styles.emptyHint}>اختر مهاماً من القائمة أدناه</Text>
          ) : (
            selectedTodos.map((todo: any, idx: number) => (
              <View key={todo.todoId} style={styles.todoRow}>
                <TouchableOpacity onPress={() => toggleTodo(todo.todoId)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={THEME.danger} />
                </TouchableOpacity>
                <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
                <Text style={styles.orderBadge}>{idx + 1}</Text>
                <TouchableOpacity onPress={() => moveUp(idx)} disabled={idx === 0}>
                  <MaterialCommunityIcons name="chevron-up" size={20} color={idx === 0 ? THEME.disabledText : THEME.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveDown(idx)} disabled={idx >= selectedIds.length - 1}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={idx >= selectedIds.length - 1 ? THEME.disabledText : THEME.text} />
                </TouchableOpacity>
              </View>
            ))
          )}

          {unselectedTodos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>المهام المتاحة</Text>
              {unselectedTodos.map((todo: any) => (
                <TouchableOpacity key={todo.todoId} style={styles.todoRow} onPress={() => toggleTodo(todo.todoId)}>
                  <MaterialCommunityIcons name="plus-circle" size={22} color={THEME.brand} />
                  <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
                  {todo.category && (
                    <View style={styles.catBadge}><Text style={styles.catText}>{todo.category.name}</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={THEME.white} /> : (
              <><MaterialCommunityIcons name="check-circle" size={22} color={THEME.white} /><Text style={styles.saveText}>حفظ التغييرات</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { color: THEME.secondaryText, fontSize: 14, fontFamily: Typography.fonts.medium, marginBottom: 8, textAlign: 'right', marginTop: 16 },
  input: { backgroundColor: THEME.inputBg, borderRadius: 14, padding: 16, color: THEME.text, fontSize: 16, fontFamily: Typography.fonts.regular, textAlign: 'right', borderWidth: 1, borderColor: THEME.divider },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sectionTitle: { color: THEME.text, fontSize: 16, fontFamily: Typography.fonts.bold, marginTop: 24, marginBottom: 12, textAlign: 'right' },
  emptyHint: { color: THEME.disabledText, fontSize: 14, fontFamily: Typography.fonts.regular, textAlign: 'center', marginVertical: 20 },
  todoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, padding: 14, borderRadius: 12, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: THEME.divider },
  removeBtn: { padding: 2 },
  todoTitle: { flex: 1, color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.regular, textAlign: 'right' },
  orderBadge: { backgroundColor: THEME.brand, color: THEME.white, fontSize: 12, fontFamily: Typography.fonts.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', minWidth: 22, textAlign: 'center' },
  catBadge: { backgroundColor: 'rgba(216,67,21,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catText: { color: THEME.brand, fontSize: 12, fontFamily: Typography.fonts.medium },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216, 67, 21, 0.88)', padding: 18, borderRadius: 16, marginTop: 32, gap: 8 },
  saveText: { color: THEME.white, fontSize: 17, fontFamily: Typography.fonts.bold },
  });
}
