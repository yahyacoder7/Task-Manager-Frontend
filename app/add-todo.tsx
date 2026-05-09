import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { getItem } from '../utils/storage';
import { Typography } from '../constants/Typography';
import SmartDateTimePicker from '../components/SmartDateTimePicker';

const BASE_URL = 'http://localhost:3000';
const THEME = {
  background: '#0F0F0F', secondaryBackground: '#1A1A1A',
  brand: '#D84315', text: '#FFFFFF', secondaryText: '#A0A0A0',
  inputBg: '#252525', disabled: '#2A2A2A', disabledText: '#555',
};

const TIME_OPTS = [
  { label: 'صباحاً', sub: '5ص–12ظ', value: 'MORNING',   icon: '🌅' },
  { label: 'ظهراً',  sub: '12ظ–5م', value: 'AFTERNOON', icon: '☀️' },
  { label: 'مساءً',  sub: '5م–9م',  value: 'EVENING',   icon: '🌆' },
  { label: 'ليلاً',  sub: '9م–5ص',  value: 'NIGHT',     icon: '🌙' },
];
const REPEAT_OPTS = [
  { label: 'يوم', value: 'DAILY' }, { label: 'أسبوع', value: 'WEEKLY' },
  { label: 'شهر', value: 'MONTHLY' }, { label: 'سنة', value: 'YEARLY' },
];

type FieldErrors = { title?: string; startDate?: string; repeatInterval?: string; general?: string };

export default function AddTodoScreen() {
  const router = useRouter();

  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [expectedTime, setExpectedTime] = useState<string | null>(null);
  const [startDate, setStartDate]       = useState('');
  const [repeatUnit, setRepeatUnit]     = useState<string | null>(null);
  const [repeatInterval, setRepeatInterval] = useState('1');
  const [categoryId, setCategoryId]     = useState<number | null>(null);
  const [workplanId, setWorkplanId]     = useState<number | null>(null);

  const [categories, setCategories]   = useState<any[]>([]);
  const [workplans, setWorkplans]     = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [catModal, setCatModal]         = useState(false);
  const [newCatName, setNewCatName]     = useState('');
  const [addingCat, setAddingCat]       = useState(false);

  const [isSaving, setIsSaving]         = useState(false);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});
  const [successMsg, setSuccessMsg]     = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const token = await getItem('userToken');
      const h = { Authorization: `Bearer ${token}` };
      const [cR, pR] = await Promise.all([
        fetch(`${BASE_URL}/category/get-all-categories`, { headers: h }),
        fetch(`${BASE_URL}/work-plan/get-all-work-plans`, { headers: h }),
      ]);
      if (cR.ok) setCategories(await cR.json());
      if (pR.ok) setWorkplans(await pR.json());
    } catch { /* silent */ }
    finally { setIsLoadingData(false); }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const token = await getItem('userToken');
      const res = await fetch(`${BASE_URL}/category/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(p => [...p, cat]);
        setCategoryId(cat.categoryId);
        setCatModal(false); setNewCatName('');
      } else {
        Alert.alert('خطأ', 'فشل إضافة التصنيف');
      }
    } catch { Alert.alert('خطأ', 'حدث خطأ في الاتصال'); }
    finally { setAddingCat(false); }
  };

  // Parse API error into field-level messages
  const parseErrors = (errBody: any): FieldErrors => {
    const msgs: string[] = Array.isArray(errBody?.message)
      ? errBody.message : [errBody?.message || 'حدث خطأ'];
    const fe: FieldErrors = {};
    msgs.forEach((m: string) => {
      const low = m.toLowerCase();
      if (low.includes('title'))          fe.title = m;
      else if (low.includes('startdate') || low.includes('date')) fe.startDate = m;
      else if (low.includes('interval'))  fe.repeatInterval = m;
      else                                fe.general = (fe.general ? fe.general + '\n' : '') + m;
    });
    return fe;
  };

  const handleSave = async () => {
    setFieldErrors({});
    if (!title.trim()) { setFieldErrors({ title: 'العنوان مطلوب' }); return; }
    setIsSaving(true);
    try {
      const token = await getItem('userToken');
      const payload: Record<string, any> = { title: title.trim() };
      if (description.trim())  payload.description    = description.trim();
      if (expectedTime)        payload.expectedTime   = expectedTime;
      if (startDate.trim())    payload.startDate      = startDate.trim();
      if (repeatUnit) {
        payload.repeatUnit     = repeatUnit;
        payload.repeatInterval = parseInt(repeatInterval) || 1;
      }
      if (categoryId) payload.categoryId = categoryId;
      if (workplanId) payload.workplanId = workplanId;

      const res = await fetch(`${BASE_URL}/todo/add-todo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.replace('/(tabs)?success=todo_added');
      } else {
        const errBody = await res.json();
        setFieldErrors(parseErrors(errBody));
      }
    } catch { setFieldErrors({ general: 'حدث خطأ في الاتصال بالسيرفر' }); }
    finally { setIsSaving(false); }
  };

  const selectTime = (val: string) => {
    setExpectedTime(expectedTime === val ? null : val);
    setStartDate('');
  };
  const onStartDateChange = (val: string) => {
    setStartDate(val);
    if (val.trim()) setExpectedTime(null);
  };

  const dateDisabled = !!expectedTime;
  const timeDisabled = startDate.trim().length > 0;

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerShown: true, headerTitle: '',
        headerStyle: { backgroundColor: THEME.background },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.hdrRight}>
            <Text style={styles.hdrTitle}>إضافة مهمة جديدة</Text>
            <Ionicons name="close" size={22} color={THEME.text} />
          </TouchableOpacity>
        ),
        headerLeft: () => null,
      }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* General error */}
          {fieldErrors.general ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF5252" />
              <Text style={styles.errorBannerText}>{fieldErrors.general}</Text>
            </View>
          ) : null}

          {/* ── المعلومات الأساسية ── */}
          <Text style={styles.secTitle}>المعلومات الأساسية</Text>
          <TextInput
            style={[styles.input, styles.titleInput, webInput, fieldErrors.title && styles.inputError]}
            placeholder="عنوان المهمة *" placeholderTextColor="#555"
            value={title} onChangeText={setTitle} textAlign="right"
          />
          {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}

          <TextInput
            style={[styles.input, styles.descInput, webInput]}
            placeholder="وصف تفصيلي (اختياري)..." placeholderTextColor="#555"
            value={description} onChangeText={setDescription}
            multiline textAlign="right"
          />

          {/* ── وقت البداية ── */}
          <Text style={styles.secTitle}>وقت البداية</Text>
          <Text style={[styles.subLabel, timeDisabled && styles.mutedLabel]}>
            {timeDisabled ? '🔒 الفترة اليومية معطّلة (لديك وقت محدد)' : 'فترة يومية تقريبية:'}
          </Text>
          <View style={styles.grid}>
            {TIME_OPTS.map(opt => (
              <TouchableOpacity
                key={opt.value} disabled={timeDisabled}
                style={[styles.gridItem, expectedTime === opt.value && styles.gridActive, timeDisabled && styles.gridDisabled]}
                onPress={() => selectTime(opt.value)}
              >
                <Text style={styles.gridEmoji}>{opt.icon}</Text>
                <Text style={[styles.gridLabel, expectedTime === opt.value && styles.gridLabelActive, timeDisabled && styles.mutedText]}>{opt.label}</Text>
                <Text style={[styles.gridSub, timeDisabled && styles.mutedText]}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.orRow}>
            <View style={styles.orLine} /><Text style={styles.orText}>أو</Text><View style={styles.orLine} />
          </View>

          <Text style={[styles.subLabel, dateDisabled && styles.mutedLabel]}>
            {dateDisabled ? '🔒 التاريخ المحدد معطّل (لديك فترة يومية)' : 'تاريخ ووقت محدد:'}
          </Text>
          <SmartDateTimePicker
            value={startDate}
            onChange={onStartDateChange}
            disabled={dateDisabled}
          />
          {fieldErrors.startDate ? <Text style={styles.fieldError}>{fieldErrors.startDate}</Text> : null}

          {/* ── التكرار ── */}
          <Text style={styles.secTitle}>التكرار (اختياري)</Text>
          <Text style={styles.subLabel}>وحدة التكرار:</Text>
          <View style={styles.chipsRow}>
            {REPEAT_OPTS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, repeatUnit === opt.value && styles.chipActive]}
                onPress={() => setRepeatUnit(repeatUnit === opt.value ? null : opt.value)}
              >
                <Text style={[styles.chipText, repeatUnit === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {repeatUnit && (
            <View style={styles.intervalRow}>
              <Text style={styles.intervalSuffix}>{REPEAT_OPTS.find(o => o.value === repeatUnit)?.label}</Text>
              <TextInput
                style={[styles.input, styles.intervalInput, webInput, fieldErrors.repeatInterval && styles.inputError]}
                value={repeatInterval} onChangeText={setRepeatInterval}
                keyboardType="numeric" textAlign="center"
              />
              <Text style={styles.intervalPrefix}>يتكرر كل:</Text>
            </View>
          )}
          {fieldErrors.repeatInterval ? <Text style={styles.fieldError}>{fieldErrors.repeatInterval}</Text> : null}

          {/* ── التصنيف وخطة العمل ── */}
          <Text style={styles.secTitle}>التصنيف وخطة العمل</Text>

          <Text style={styles.subLabel}>التصنيف:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.categoryId}
                style={[styles.chip, categoryId === cat.categoryId && styles.chipActive]}
                onPress={() => setCategoryId(categoryId === cat.categoryId ? null : cat.categoryId)}
              >
                <Text style={[styles.chipText, categoryId === cat.categoryId && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addChip} onPress={() => setCatModal(true)}>
              <Ionicons name="add" size={14} color={THEME.brand} />
              <Text style={styles.addChipText}>جديد</Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={[styles.subLabel, { marginTop: 16 }]}>خطة العمل:</Text>
          {workplans.length === 0 ? (
            <Text style={styles.emptyMsg}>لا توجد خطط عمل حالياً</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {workplans.map(plan => (
                <TouchableOpacity
                  key={plan.workplanId}
                  style={[styles.chip, workplanId === plan.workplanId && styles.chipActive]}
                  onPress={() => setWorkplanId(workplanId === plan.workplanId ? null : plan.workplanId)}
                >
                  <Text style={[styles.chipText, workplanId === plan.workplanId && styles.chipTextActive]}>{plan.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* زر الحفظ */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.saveBtnText}>إنشاء المهمة</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal تصنيف جديد */}
      <Modal visible={catModal} transparent animationType="fade" onRequestClose={() => setCatModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setCatModal(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>إضافة تصنيف جديد</Text>
            <TextInput
              style={[styles.input, { marginBottom: 20 }, webInput]}
              placeholder="مثال: عمل، دراسة، صحة..." placeholderTextColor="#555"
              value={newCatName} onChangeText={setNewCatName} autoFocus textAlign="right"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.brand }]} onPress={handleAddCategory} disabled={addingCat}>
                {addingCat ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>إنشاء</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]} onPress={() => setCatModal(false)}>
                <Text style={styles.modalBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, direction: 'rtl' as any },
  hdrRight: { flexDirection: 'row', alignItems: 'center', marginRight: 12, gap: 10 },
  hdrTitle: { color: THEME.text, fontSize: 17, fontFamily: Typography.fonts.bold },
  scroll: { padding: 20 },

  secTitle: {
    color: THEME.brand, fontSize: 13, fontFamily: Typography.fonts.bold,
    marginBottom: 12, marginTop: 8, textAlign: 'right', letterSpacing: 0.5,
  },
  subLabel: { color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.medium, marginBottom: 10, textAlign: 'right' },
  mutedLabel: { color: THEME.disabledText, fontStyle: 'italic' },
  mutedText: { color: THEME.disabledText },
  emptyMsg: { color: THEME.secondaryText, fontFamily: Typography.fonts.regular, textAlign: 'right', fontStyle: 'italic', marginBottom: 8 },

  input: {
    backgroundColor: THEME.inputBg, borderRadius: 14, padding: 14,
    color: THEME.text, fontFamily: Typography.fonts.regular, fontSize: 15,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    textAlign: 'right',
  },
  titleInput: { fontSize: 18, fontFamily: Typography.fonts.medium, minHeight: 54 },
  descInput: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#FF5252' },
  inputDisabled: { backgroundColor: THEME.disabled, color: THEME.disabledText },
  fieldError: { color: '#FF5252', fontSize: 12, fontFamily: Typography.fonts.regular, textAlign: 'right', marginBottom: 6 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,82,82,0.1)', borderRadius: 12,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,82,82,0.3)',
  },
  errorBannerText: { color: '#FF5252', fontFamily: Typography.fonts.regular, flex: 1, textAlign: 'right' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    flex: 1, minWidth: '45%', backgroundColor: THEME.secondaryBackground,
    padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  gridActive: { backgroundColor: 'rgba(216,67,21,0.12)', borderColor: THEME.brand },
  gridDisabled: { opacity: 0.35 },
  gridEmoji: { fontSize: 22, marginBottom: 4 },
  gridLabel: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 14 },
  gridLabelActive: { color: THEME.brand },
  gridSub: { color: '#666', fontSize: 10, fontFamily: Typography.fonts.regular, marginTop: 2 },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  orText: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 12 },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  hScroll: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    backgroundColor: THEME.secondaryBackground, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: THEME.brand, borderColor: THEME.brand },
  chipText: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium },
  chipTextActive: { color: '#FFF' },
  addChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderStyle: 'dashed', borderColor: THEME.brand,
  },
  addChipText: { color: THEME.brand, fontSize: 13, fontFamily: Typography.fonts.medium },

  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  intervalPrefix: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 14, flex: 1, textAlign: 'right' },
  intervalSuffix: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 16 },
  intervalInput: { width: 70, height: 48, padding: 8, marginBottom: 0, textAlign: 'center' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: THEME.background,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: {
    backgroundColor: THEME.brand, height: 56, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  saveBtnText: { color: '#FFF', fontSize: 17, fontFamily: Typography.fonts.bold },

  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalBox: {
    width: '85%', backgroundColor: THEME.secondaryBackground,
    borderRadius: 22, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, marginBottom: 16, textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontFamily: Typography.fonts.bold, fontSize: 15 },
});
