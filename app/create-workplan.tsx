import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { getItem } from '../utils/storage';
import { Typography } from '../constants/Typography';
import { useAppTheme } from '../constants/ThemeContext';

const BASE_URL = 'http://localhost:3000';

export default function CreateWorkplanScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availableTodos, setAvailableTodos] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('userToken');
        const res = await fetch(`${BASE_URL}/todo/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAvailableTodos(await res.json());
      } catch {} finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggleTodo = (id: number) => {
    setError('');
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
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

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) {
      setError('يرجى إدخال اسم خطة العمل');
      return;
    }
    if (selectedIds.length === 0) {
      setError('يجب اختيار مهمة واحدة على الأقل لإنشاء خطة العمل');
      return;
    }
    setIsSaving(true);
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/work-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, todoIds: selectedIds }),
      });
      if (res.ok) {
        router.replace('/(tabs)/plans');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'فشل إنشاء خطة العمل');
      }
    } catch {
      setError('مشكلة في الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTodos = availableTodos.filter(t => selectedIds.includes(t.todoId));
  const unselectedTodos = availableTodos.filter(t => !selectedIds.includes(t.todoId));

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: '', headerStyle: { backgroundColor: 'rgba(216, 67, 21, 0.88)' }, headerShadowVisible: false, headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: Typography.fonts.bold }}>إنشاء خطة عمل</Text>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ), headerLeft: () => null }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>الاسم</Text>
          <TextInput style={styles.input} value={name} onChangeText={v => { setError(''); setName(v); }} placeholder="مثال: مشروع البرمجة" placeholderTextColor={THEME.secondaryText} />

          <Text style={styles.label}>الوصف</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={v => { setError(''); setDescription(v); }} placeholder="وصف مختصر للخطة" placeholderTextColor={THEME.secondaryText} multiline numberOfLines={3} />

          <Text style={styles.sectionTitle}>المهام المحددة ({selectedIds.length})</Text>
          {selectedTodos.length === 0 ? (
            <Text style={styles.emptyHint}>اختر مهاماً من القائمة أدناه</Text>
          ) : (
            selectedTodos.map((todo, idx) => (
              <View key={todo.todoId} style={styles.todoRow}>
                <TouchableOpacity onPress={() => toggleTodo(todo.todoId)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={THEME.danger} />
                </TouchableOpacity>
                <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
                <Text style={styles.orderBadge}>{idx + 1}</Text>
                <TouchableOpacity onPress={() => moveUp(idx)} disabled={idx === 0}>
                  <Ionicons name="chevron-up" size={20} color={idx === 0 ? THEME.disabledText : THEME.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveDown(idx)} disabled={idx >= selectedIds.length - 1}>
                  <Ionicons name="chevron-down" size={20} color={idx >= selectedIds.length - 1 ? THEME.disabledText : THEME.text} />
                </TouchableOpacity>
              </View>
            ))
          )}

          {unselectedTodos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>المهام المتاحة</Text>
              {unselectedTodos.map(todo => (
                <TouchableOpacity key={todo.todoId} style={styles.todoRow} onPress={() => toggleTodo(todo.todoId)}>
                  <Ionicons name="add-circle-outline" size={22} color={THEME.brand} />
                  <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
                  {todo.category && (
                    <View style={styles.catBadge}>
                      <Text style={styles.catText}>{todo.category.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isLoading && <ActivityIndicator color={THEME.brand} style={{ marginTop: 20 }} />}

          <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleCreate} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={THEME.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={THEME.white} />
                <Text style={styles.saveText}>إنشاء خطة العمل</Text>
              </>
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
  label: { color: THEME.secondaryText, fontSize: 14, fontFamily: Typography.fonts.medium, marginBottom: 8, textAlign: 'right', marginTop: 16 },
  input: { backgroundColor: THEME.inputBg, borderRadius: 14, padding: 16, color: THEME.text, fontSize: 16, fontFamily: Typography.fonts.regular, textAlign: 'right', borderWidth: 1, borderColor: THEME.divider },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sectionTitle: { color: THEME.text, fontSize: 16, fontFamily: Typography.fonts.bold, marginTop: 24, marginBottom: 12, textAlign: 'right' },
  emptyHint: { color: THEME.disabledText, fontSize: 14, fontFamily: Typography.fonts.regular, textAlign: 'center', marginVertical: 20 },
  todoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, padding: 14, borderRadius: 12, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: THEME.divider },
  removeBtn: { padding: 2 },
  errorText: { color: THEME.danger, fontSize: 14, fontFamily: Typography.fonts.medium, textAlign: 'center', marginBottom: 12 },
  todoTitle: { flex: 1, color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.regular, textAlign: 'right' },
  orderBadge: { backgroundColor: THEME.brand, color: THEME.white, fontSize: 12, fontFamily: Typography.fonts.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', minWidth: 22, textAlign: 'center' },
  catBadge: { backgroundColor: 'rgba(216,67,21,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catText: { color: THEME.brand, fontSize: 12, fontFamily: Typography.fonts.medium },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216, 67, 21, 0.88)', padding: 18, borderRadius: 16, marginTop: 32, gap: 8 },
  saveText: { color: THEME.white, fontSize: 17, fontFamily: Typography.fonts.bold },
  });
}
