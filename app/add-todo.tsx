import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { getItem } from '../utils/storage';
import { Typography } from '../constants/Typography';
import { useAppTheme } from '../constants/ThemeContext';
import SmartDateTimePicker from '../components/SmartDateTimePicker';

import { BASE_URL } from '../constants/API';

const TIME_OPTS = [
  { label: 'Morning', sub: '5 AM to 12 PM', value: 'MORNING',   icon: '🌅' },
  { label: 'Afternoon',  sub: '12 PM to 5 PM', value: 'AFTERNOON', icon: '☀️' },
  { label: 'Evening',  sub: '5 PM to 9 PM', value: 'EVENING',   icon: '🌆' },
  { label: 'Night',  sub: '9 PM to 5 AM', value: 'NIGHT',     icon: '🌙' },
];
const REPEAT_OPTS = [
  { label: 'Day', value: 'DAILY' }, { label: 'Week', value: 'WEEKLY' },
  { label: 'Month', value: 'MONTHLY' }, { label: 'Year', value: 'YEARLY' },
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
  const [wpModal, setWpModal] = useState(false);
  const [wpSearch, setWpSearch] = useState('');
  const [catPicking, setCatPicking] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  const [isSaving, setIsSaving]         = useState(false);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});
  const [successMsg, setSuccessMsg]     = useState('');
  const [adviceModal, setAdviceModal]    = useState(false);
  const [aiAdvice, setAiAdvice]          = useState<{ advice: string; source: string } | null>(null);

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

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
        Alert.alert('Error', 'Failed to add category');
      }
    } catch { Alert.alert('Error', 'Connection error'); }
    finally { setAddingCat(false); }
  };

  const parseErrors = (errBody: any): FieldErrors => {
    const msgs: string[] = Array.isArray(errBody?.message)
      ? errBody.message : [errBody?.message || 'An error occurred'];
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
    if (!title.trim()) { setFieldErrors({ title: 'Title is required' }); return; }
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
        const todoData = await res.json();
        const todoId = todoData.todoId;
        
        try {
          const token = await getItem('userToken');
          const adviceRes = await fetch(`${BASE_URL}/ai/get-task-advice/${todoId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (adviceRes.ok) {
            const adviceData = await adviceRes.json();
            setAiAdvice(adviceData);
            setAdviceModal(true);
            return;
          }
        } catch {}
        
        router.replace('/(tabs)?success=todo_added');
      } else {
        const errBody = await res.json();
        setFieldErrors(parseErrors(errBody));
      }
    } catch { setFieldErrors({ general: 'Server connection error' }); }
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
    <SafeAreaView style={[styles.container, { direction: 'ltr' } as any]}>
      <Stack.Screen options={{
        headerShown: true, headerTitle: '',
        headerStyle: { backgroundColor: '#E65A2A' },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.hdrLeft}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={THEME.white} />
            <Text style={styles.hdrTitle}>Add New Task</Text>
          </TouchableOpacity>
        ),
        headerRight: () => null,
      }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {fieldErrors.general ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#FF5252" />
              <Text style={styles.errorBannerText}>{fieldErrors.general}</Text>
            </View>
          ) : null}

          <Text style={styles.secTitle}>Basic Information</Text>
          <TextInput
            style={[styles.input, styles.titleInput, webInput, fieldErrors.title && styles.inputError]}
            placeholder="Task Title *" placeholderTextColor="#555"
            value={title} onChangeText={setTitle} textAlign="left"
          />
          {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}

          <TextInput
            style={[styles.input, styles.descInput, webInput]}
            placeholder="Detailed description (optional)..." placeholderTextColor="#555"
            value={description} onChangeText={setDescription}
            multiline textAlign="left"
          />

          <Text style={styles.secTitle}>Start Time</Text>
          <Text style={[styles.subLabel, timeDisabled && styles.mutedLabel]}>
            {timeDisabled ? '🔒 Time period disabled (you have a specific time)' : 'Approximate time period:'}
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
            <View style={styles.orLine} /><Text style={styles.orText}>OR</Text><View style={styles.orLine} />
          </View>

          <Text style={[styles.subLabel, dateDisabled && styles.mutedLabel]}>
            {dateDisabled ? '🔒 Specific date disabled (you have a time period)' : 'Specific date and time:'}
          </Text>
          <SmartDateTimePicker
            value={startDate}
            onChange={onStartDateChange}
            disabled={dateDisabled}
          />
          {fieldErrors.startDate ? <Text style={styles.fieldError}>{fieldErrors.startDate}</Text> : null}

          <Text style={styles.secTitle}>Repeat (Optional)</Text>
          <Text style={styles.subLabel}>Repeat unit:</Text>
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
              <Text style={styles.intervalPrefix}>Repeats every:</Text>
              <TextInput
                style={[styles.input, styles.intervalInput, webInput, fieldErrors.repeatInterval && styles.inputError]}
                value={repeatInterval} onChangeText={setRepeatInterval}
                keyboardType="numeric" textAlign="center"
              />
              <Text style={styles.intervalSuffix}>{REPEAT_OPTS.find(o => o.value === repeatUnit)?.label}</Text>
            </View>
          )}
          {fieldErrors.repeatInterval ? <Text style={styles.fieldError}>{fieldErrors.repeatInterval}</Text> : null}

          <Text style={styles.secTitle}>Category and Work Plan</Text>

          <Text style={styles.subLabel}>Category:</Text>
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownTouch} onPress={() => { setCatSearch(''); setCatPicking(true); }} activeOpacity={0.7}>
              <Text style={[styles.dropdownText, !categoryId && styles.dropdownPlaceholder]}>
                {categoryId ? categories.find(c => c.categoryId === categoryId)?.name || 'Select Category' : 'Select Category'}
              </Text>
            </TouchableOpacity>
            {categoryId ? (
              <TouchableOpacity onPress={() => setCategoryId(null)} style={styles.dropdownClear}>
                <MaterialCommunityIcons name="close-circle" size={18} color={THEME.secondaryText} />
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name="chevron-down" size={18} color={THEME.secondaryText} style={{ marginRight: 8 }} />
            )}
          </View>

          <Modal visible={catPicking} transparent animationType="fade" onRequestClose={() => setCatPicking(false)}>
            <Pressable style={styles.overlay} onPress={() => setCatPicking(false)}>
              <Pressable style={styles.dropdownModal} onPress={e => e.stopPropagation()}>
                <View style={styles.dropdownModalHdr}>
                  <Text style={styles.dropdownModalTitle}>Select Category</Text>
                  <TouchableOpacity onPress={() => setCatPicking(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={THEME.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.dropdownSearch}>
                  <MaterialCommunityIcons name="magnify" size={18} color={THEME.secondaryText} />
                  <TextInput
                    style={styles.dropdownSearchInput}
                    placeholder="Search for a category..."
                    placeholderTextColor={THEME.disabledText}
                    value={catSearch}
                    onChangeText={setCatSearch}
                  />
                </View>
                <ScrollView style={styles.dropdownList}>
                  {categories
                    .filter(c => !catSearch || c.name?.includes(catSearch))
                    .map(cat => (
                      <TouchableOpacity key={cat.categoryId} style={styles.dropdownOption} onPress={() => { setCategoryId(cat.categoryId); setCatPicking(false); }}>
                        <View style={styles.dropdownOptionLeft}>
                          <MaterialCommunityIcons name="folder-outline" size={20} color={THEME.brand} />
                          <Text style={styles.dropdownOptionText}>{cat.name}</Text>
                        </View>
                        {categoryId === cat.categoryId && <MaterialCommunityIcons name="check-circle" size={20} color={THEME.brand} />}
                      </TouchableOpacity>
                    ))}
                  {categories.filter(c => !catSearch || c.name?.includes(catSearch)).length === 0 && (
                    <Text style={styles.dropdownEmpty}>No results</Text>
                  )}
                </ScrollView>
                <TouchableOpacity style={styles.dropdownAdd} onPress={() => { setCatPicking(false); setCatModal(true); }}>
                  <MaterialCommunityIcons name="plus-circle" size={20} color={THEME.brand} />
                  <Text style={styles.dropdownAddText}>Add New Category</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          <Text style={[styles.subLabel, { marginTop: 16 }]}>Work Plan:</Text>
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownTouch} onPress={() => { setWpSearch(''); setWpModal(true); }} activeOpacity={0.7}>
              <Text style={[styles.dropdownText, !workplanId && styles.dropdownPlaceholder]}>
                {workplanId ? workplans.find(p => p.workplanId === workplanId)?.name || 'No Plan' : 'No Plan'}
              </Text>
            </TouchableOpacity>
            {workplanId ? (
              <TouchableOpacity onPress={() => setWorkplanId(null)} style={styles.dropdownClear}>
                <MaterialCommunityIcons name="close-circle" size={18} color={THEME.secondaryText} />
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name="chevron-down" size={18} color={THEME.secondaryText} style={{ marginRight: 8 }} />
            )}
          </View>

          <Modal visible={wpModal} transparent animationType="fade" onRequestClose={() => setWpModal(false)}>
            <Pressable style={styles.overlay} onPress={() => setWpModal(false)}>
              <Pressable style={styles.dropdownModal} onPress={e => e.stopPropagation()}>
                <View style={styles.dropdownModalHdr}>
                  <Text style={styles.dropdownModalTitle}>Select Work Plan</Text>
                  <TouchableOpacity onPress={() => setWpModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={THEME.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.dropdownSearch}>
                  <MaterialCommunityIcons name="magnify" size={18} color={THEME.secondaryText} />
                  <TextInput
                    style={styles.dropdownSearchInput}
                    placeholder="Search for a work plan..."
                    placeholderTextColor={THEME.disabledText}
                    value={wpSearch}
                    onChangeText={setWpSearch}
                  />
                </View>
                <ScrollView style={styles.dropdownList}>
                  {workplans
                    .filter(p => !wpSearch || p.name?.includes(wpSearch))
                    .map(plan => (
                      <TouchableOpacity key={plan.workplanId} style={styles.dropdownOption} onPress={() => { setWorkplanId(plan.workplanId); setWpModal(false); }}>
                        <View style={styles.dropdownOptionLeft}>
                          <MaterialCommunityIcons name="briefcase-outline" size={20} color={THEME.brand} />
                          <Text style={styles.dropdownOptionText}>{plan.name}</Text>
                        </View>
                        {workplanId === plan.workplanId && <MaterialCommunityIcons name="check-circle" size={20} color={THEME.brand} />}
                      </TouchableOpacity>
                    ))}
                  {workplans.filter(p => !wpSearch || p.name?.includes(wpSearch)).length === 0 && (
                    <Text style={styles.dropdownEmpty}>No results</Text>
                  )}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFF" /> : (
            <>
              <MaterialCommunityIcons name="check-circle" size={22} color="#FFF" />
              <Text style={styles.saveBtnText}>Create Task</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={adviceModal} transparent animationType="fade" onRequestClose={() => { setAdviceModal(false); router.replace('/(tabs)?success=todo_added'); }}>
        <Pressable style={styles.overlay} onPress={() => { setAdviceModal(false); router.replace('/(tabs)?success=todo_added'); }}>
          <View style={styles.adviceModalBox}>
            <TouchableOpacity style={styles.modalX} onPress={() => { setAdviceModal(false); router.replace('/(tabs)?success=todo_added'); }}>
              <MaterialCommunityIcons name="close" size={22} color={THEME.text} />
            </TouchableOpacity>
            <View style={styles.adviceIconCircle}>
              <MaterialCommunityIcons name="star-four-points" size={32} color="#D84315" />
            </View>
            <Text style={styles.adviceTitle}>Task Advice</Text>
            {aiAdvice && (
              <>
                <Text style={styles.adviceText}>{aiAdvice.advice}</Text>
              </>
            )}
            <TouchableOpacity 
              style={styles.adviceBtn} 
              onPress={() => { setAdviceModal(false); router.replace('/(tabs)?success=todo_added'); }}
            >
              <Text style={styles.adviceBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={catModal} transparent animationType="fade" onRequestClose={() => setCatModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setCatModal(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <TouchableOpacity style={styles.modalX} onPress={() => setCatModal(false)}>
              <MaterialCommunityIcons name="close" size={22} color={THEME.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TextInput
              style={[styles.input, { marginBottom: 20 }, webInput]}
              placeholder="e.g., Work, Study, Health..." placeholderTextColor="#555"
              value={newCatName} onChangeText={setNewCatName} autoFocus textAlign="left"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'rgba(216, 67, 21, 0.88)' }]} onPress={handleAddCategory} disabled={addingCat}>
                {addingCat ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.modalBtnText, { color: THEME.white }]}>Create</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.muted }]} onPress={() => setCatModal(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  hdrLeft: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 10 },
  hdrTitle: { color: THEME.white, fontSize: 17, fontFamily: Typography.fonts.bold },
  scroll: { padding: 20 },

  secTitle: {
    color: THEME.brand, fontSize: 13, fontFamily: Typography.fonts.bold,
    marginBottom: 12, marginTop: 8, textAlign: 'left', letterSpacing: 0.5,
  },
  subLabel: { color: THEME.secondaryText, fontSize: 13, fontFamily: Typography.fonts.medium, marginBottom: 10, textAlign: 'left' },
  mutedLabel: { color: THEME.disabledText, fontStyle: 'italic' },
  mutedText: { color: THEME.disabledText },
  emptyMsg: { color: THEME.secondaryText, fontFamily: Typography.fonts.regular, textAlign: 'left', fontStyle: 'italic', marginBottom: 8 },

  input: {
    backgroundColor: THEME.inputBg, borderRadius: 14, padding: 14,
    color: THEME.text, fontFamily: Typography.fonts.regular, fontSize: 15,
    marginBottom: 8, borderWidth: 1, borderColor: THEME.divider,
    textAlign: 'left',
  },
  titleInput: { fontSize: 18, fontFamily: Typography.fonts.medium, minHeight: 54 },
  descInput: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#FF5252' },
  inputDisabled: { backgroundColor: THEME.disabled, color: THEME.disabledText },
  fieldError: { color: '#FF5252', fontSize: 12, fontFamily: Typography.fonts.regular, textAlign: 'left', marginBottom: 6 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,82,82,0.1)', borderRadius: 12,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,82,82,0.3)',
  },
  errorBannerText: { color: '#FF5252', fontFamily: Typography.fonts.regular, flex: 1, textAlign: 'left' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    flex: 1, minWidth: '45%', backgroundColor: THEME.secondaryBackground,
    padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: THEME.divider,
  },
  gridActive: { backgroundColor: 'rgba(216,67,21,0.12)', borderColor: THEME.brand },
  gridDisabled: { opacity: 0.35 },
  gridEmoji: { fontSize: 22, marginBottom: 4 },
  gridLabel: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 14 },
  gridLabelActive: { color: THEME.brand },
  gridSub: { color: '#666', fontSize: 10, fontFamily: Typography.fonts.regular, marginTop: 2 },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: THEME.divider },
  orText: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 12 },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  hScroll: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    backgroundColor: THEME.secondaryBackground, borderWidth: 1, borderColor: THEME.divider,
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
  intervalPrefix: { color: THEME.secondaryText, fontFamily: Typography.fonts.medium, fontSize: 14, flex: 1, textAlign: 'left' },
  intervalSuffix: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 16 },
  intervalInput: { width: 70, height: 48, padding: 8, marginBottom: 0, textAlign: 'center' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: THEME.background,
    borderTopWidth: 1, borderTopColor: THEME.divider,
  },
  saveBtn: {
    backgroundColor: 'rgba(216, 67, 21, 0.88)', height: 56, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: THEME.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: { color: THEME.white, fontSize: 17, fontFamily: Typography.fonts.bold },

  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalBox: {
    width: '85%', backgroundColor: THEME.secondaryBackground,
    borderRadius: 22, padding: 24, borderWidth: 1, borderColor: THEME.divider,
  },
  modalX: { alignSelf: 'flex-end', marginBottom: 8 },
  modalTitle: { color: THEME.text, fontSize: 18, fontFamily: Typography.fonts.bold, marginBottom: 16, textAlign: 'left' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 15 },

  adviceModalBox: {
    width: '85%',
    backgroundColor: THEME.secondaryBackground,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(216,67,21,0.3)',
  },
  adviceIconCircle: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(216,67,21,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  adviceTitle: {
    color: THEME.text,
    fontSize: 18,
    fontFamily: Typography.fonts.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  adviceText: {
    color: THEME.text,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  adviceSource: {
    color: THEME.secondaryText,
    fontSize: 12,
    marginBottom: 20,
  },
  adviceBtn: {
    backgroundColor: THEME.brand,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  adviceBtnText: {
    color: THEME.white,
    fontSize: 15,
    fontFamily: Typography.fonts.bold,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  dropdownTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  dropdownText: {
    flex: 1,
    color: THEME.text,
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    textAlign: 'left',
  },
  dropdownPlaceholder: {
    color: THEME.secondaryText,
  },
  dropdownClear: {
    paddingRight: 8,
  },
  dropdownAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.divider,
  },
  dropdownAddText: {
    color: THEME.brand,
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
  },
  dropdownModal: {
    width: '88%',
    maxWidth: 440,
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
    maxHeight: 480,
  },
  dropdownModalHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownModalTitle: {
    color: THEME.text,
    fontSize: 17,
    fontFamily: Typography.fonts.bold,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    color: THEME.text,
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    textAlign: 'left',
    outlineStyle: 'none' as any,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.divider,
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownOptionText: {
    color: THEME.text,
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    textAlign: 'left',
  },
  dropdownEmpty: {
    color: THEME.secondaryText,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: Typography.fonts.regular,
  },
  });
}
