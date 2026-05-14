import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [selectedTodos, setSelectedTodos] = useState<any[]>([]);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

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
    setSelectedTodos(prev => {
      const exists = prev.find(t => t.todoId === id);
      if (exists) return prev.filter(t => t.todoId !== id);
      const todo = availableTodos.find(t => t.todoId === id);
      return todo ? [...prev, todo] : prev;
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setSelectedTodos(prev => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    const moved = selectedTodos[index + direction];
    if (moved) {
      setHighlightedId(moved.todoId);
      setTimeout(() => setHighlightedId(null), 400);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) {
      setError('يرجى إدخال اسم خطة العمل');
      return;
    }
    if (selectedTodos.length === 0) {
      setError('يجب اختيار مهمة واحدة على الأقل');
      return;
    }
    setIsSaving(true);
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/work-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, todoIds: selectedTodos.map(t => t.todoId) }),
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

  const allSearchResults = availableTodos.filter(t =>
    !selectedTodos.some((s: any) => s.todoId === t.todoId) &&
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: '', headerStyle: { backgroundColor: '#E65A2A' }, headerShadowVisible: false, headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: Typography.fonts.bold }}>إنشاء خطة عمل</Text>
              <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ), headerLeft: () => null }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>الاسم</Text>
          <TextInput style={styles.input} value={name} onChangeText={v => { setError(''); setName(v); }} placeholder="مثال: مشروع البرمجة" placeholderTextColor={THEME.secondaryText} />

          <Text style={styles.label}>الوصف</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={v => { setError(''); setDescription(v); }} placeholder="وصف مختصر للخطة" placeholderTextColor={THEME.secondaryText} multiline numberOfLines={3} />

          <Text style={styles.sectionTitle}>المهام المحددة ({selectedTodos.length})</Text>
          {selectedTodos.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={40} color={THEME.disabledText} />
              <Text style={styles.emptyTitle}>لا توجد مهام مضافة</Text>
              <Text style={styles.emptyHint}>اضغط على "إضافة مهام" لاختيار المهام التي تريد إضافتها إلى خطة العمل</Text>
            </View>
          ) : (
            selectedTodos.map((item: any, idx: number) => (
              <View key={item.todoId} style={[styles.todoRow, highlightedId === item.todoId && { backgroundColor: THEME.brand + '18', borderColor: THEME.brand }]}>
                <TouchableOpacity onPress={() => toggleTodo(item.todoId)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={THEME.danger} />
                </TouchableOpacity>
                <Text style={styles.todoTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.orderBadge}>{idx + 1}</Text>
                <TouchableOpacity onPress={() => moveItem(idx, -1)} disabled={idx === 0}>
                  <MaterialCommunityIcons name="chevron-up" size={20} color={idx === 0 ? THEME.disabledText : THEME.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveItem(idx, 1)} disabled={idx >= selectedTodos.length - 1}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={idx >= selectedTodos.length - 1 ? THEME.disabledText : THEME.text} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addBtn} onPress={() => { setSearch(''); setModalVisible(true); }}>
            <View style={styles.addBtnIconWrap}>
              <MaterialCommunityIcons name="grid" size={18} color={THEME.brand} />
            </View>
            <View style={styles.addBtnContent}>
              <Text style={styles.addBtnLabel}>إضافة مهام</Text>
              <Text style={styles.addBtnHint}>اختر من قائمة المهام المتاحة</Text>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={18} color={THEME.secondaryText} />
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isLoading && <ActivityIndicator color={THEME.brand} style={{ marginTop: 20 }} />}

          <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleCreate} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={THEME.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={22} color={THEME.white} />
                <Text style={styles.saveText}>إنشاء خطة العمل</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>اختيار المهام</Text>
            </View>

            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={18} color={THEME.secondaryText} />
              <TextInput
                style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                value={search}
                onChangeText={setSearch}
                placeholder="ابحث عن مهمة..."
                placeholderTextColor={THEME.secondaryText}
                autoFocus
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={THEME.secondaryText} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {allSearchResults.length === 0 ? (
                <Text style={styles.modalEmpty}>لا توجد مهام متاحة</Text>
              ) : (
                allSearchResults.map(todo => (
                  <TouchableOpacity
                    key={todo.todoId}
                    style={styles.modalRow}
                    onPress={() => toggleTodo(todo.todoId)}
                  >
                    <View style={styles.modalRowContent}>
                      {todo.category && (
                        <View style={styles.catBadge}>
                          <Text style={styles.catText}>{todo.category.name}</Text>
                        </View>
                      )}
                      <Text style={styles.modalRowTitle} numberOfLines={1}>{todo.title}</Text>
                    </View>
                    <MaterialCommunityIcons name="plus-circle" size={24} color={THEME.brand} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalNote}>
              <MaterialCommunityIcons name="information" size={20} color={THEME.brand} />
              <Text style={styles.modalNoteText}>يمكنك ترتيب المهام حسب الأولوية بعد إضافتها باستخدام الأسهم</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyTitle: { color: THEME.disabledText, fontSize: 16, fontFamily: Typography.fonts.medium, textAlign: 'center' },
  emptyHint: { color: THEME.disabledText, fontSize: 13, fontFamily: Typography.fonts.regular, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  todoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, padding: 14, borderRadius: 12, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: THEME.divider },
  removeBtn: { padding: 2 },
  errorText: { color: THEME.danger, fontSize: 14, fontFamily: Typography.fonts.medium, textAlign: 'center', marginBottom: 12 },
  todoTitle: { flex: 1, color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.regular, textAlign: 'right' },
  orderBadge: { backgroundColor: THEME.brand, color: THEME.white, fontSize: 12, fontFamily: Typography.fonts.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', minWidth: 22, textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216, 67, 21, 0.88)', padding: 18, borderRadius: 16, marginTop: 32, gap: 8 },
  saveText: { color: THEME.white, fontSize: 17, fontFamily: Typography.fonts.bold },
  catBadge: { backgroundColor: 'rgba(216,67,21,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catText: { color: THEME.brand, fontSize: 12, fontFamily: Typography.fonts.medium },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, padding: 14, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: THEME.divider, gap: 14 },
  addBtnIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(216,67,21,0.1)', justifyContent: 'center', alignItems: 'center' },
  addBtnContent: { flex: 1 },
  addBtnLabel: { color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.medium, textAlign: 'right' },
  addBtnHint: { color: THEME.secondaryText, fontSize: 12, fontFamily: Typography.fonts.regular, textAlign: 'right', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContainer: { backgroundColor: THEME.background, borderRadius: 24, width: '100%', maxWidth: 480, maxHeight: '80%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, padding: 20, paddingBottom: 12 },
  modalTitle: { flex: 1, color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, textAlign: 'right' },
  modalNote: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(216,67,21,0.08)', marginHorizontal: 20, marginBottom: 4, padding: 14, borderRadius: 12, gap: 10 },
  modalNoteText: { flex: 1, color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.regular, textAlign: 'right', lineHeight: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, marginHorizontal: 20, marginBottom: 12, borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: THEME.divider },
  searchInput: { flex: 1, color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.regular, textAlign: 'right' },
  modalList: { paddingHorizontal: 20 },
  modalEmpty: { color: THEME.disabledText, fontSize: 14, fontFamily: Typography.fonts.regular, textAlign: 'center', marginVertical: 30 },
  modalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, padding: 14, borderRadius: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: THEME.divider },
  modalRowContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalRowTitle: { flex: 1, color: THEME.text, fontSize: 15, fontFamily: Typography.fonts.regular, textAlign: 'right' },
  });
}
