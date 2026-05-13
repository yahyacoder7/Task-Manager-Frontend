/**
 * SmartDateTimePicker
 * - Native: react-native-modal-datetime-picker (native UI)
 * - Web:    custom 2-step modal with a styled time spinner (AM/PM + ▲▼ arrows)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Pressable, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/Typography';
import { useAppTheme } from '../constants/ThemeContext';

interface Props {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
}

// ── Native picker ─────────────────────────────────────────────────────────────
let DateTimePickerModal: any = null;
if (Platform.OS !== 'web') {
  try { DateTimePickerModal = require('react-native-modal-datetime-picker').default; }
  catch { /* not installed */ }
}

// ── Custom Time Spinner (Web only) ────────────────────────────────────────────
function TimeSpinner({
  hour, minute, isPM,
  onHourChange, onMinuteChange, onPMChange,
}: {
  hour: number; minute: number; isPM: boolean;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onPMChange: (pm: boolean) => void;
}) {
  const { theme: THEME } = useAppTheme();
  const ts = useMemo(() => createTsStyles(THEME), [THEME]);
  const pad = (n: number) => String(n).padStart(2, '0');

  const incHour = () => onHourChange(hour === 12 ? 1 : hour + 1);
  const decHour = () => onHourChange(hour === 1 ? 12 : hour - 1);
  const incMin  = () => onMinuteChange(minute >= 55 ? 0 : minute + 5);
  const decMin  = () => onMinuteChange(minute < 5 ? 55 : minute - 5);

  const SpinnerCol = ({ label, value, onUp, onDown, onManual }: {
    label: string; value: string;
    onUp: () => void; onDown: () => void;
    onManual?: (v: string) => void;
  }) => (
    <View style={ts.col}>
      <Text style={ts.colLabel}>{label}</Text>
      <TouchableOpacity style={ts.arrow} onPress={onUp}>
        <Ionicons name="chevron-up" size={20} color={THEME.brand} />
      </TouchableOpacity>
      <TextInput
        style={[ts.valueInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        value={value}
        onChangeText={onManual}
        maxLength={2}
        keyboardType="numeric"
        textAlign="center"
        selectTextOnFocus
      />
      <TouchableOpacity style={ts.arrow} onPress={onDown}>
        <Ionicons name="chevron-down" size={20} color={THEME.brand} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={ts.container}>
      <SpinnerCol
        label="الساعة"
        value={pad(hour)}
        onUp={incHour}
        onDown={decHour}
        onManual={v => {
          const n = parseInt(v);
          if (!isNaN(n) && n >= 1 && n <= 12) onHourChange(n);
        }}
      />

      <Text style={ts.colon}>:</Text>

      <SpinnerCol
        label="الدقائق"
        value={pad(minute)}
        onUp={incMin}
        onDown={decMin}
        onManual={v => {
          const n = parseInt(v);
          if (!isNaN(n) && n >= 0 && n <= 59) onMinuteChange(n);
        }}
      />

      {/* AM / PM */}
      <View style={ts.ampmCol}>
        <Text style={ts.colLabel}>الفترة</Text>
        <TouchableOpacity
          style={[ts.ampmBtn, !isPM && ts.ampmActive]}
          onPress={() => onPMChange(false)}
        >
          <Text style={[ts.ampmText, !isPM && ts.ampmTextActive]}>AM</Text>
          <Text style={[ts.ampmSubText, !isPM && ts.ampmTextActive]}>صباح</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ts.ampmBtn, isPM && ts.ampmActive]}
          onPress={() => onPMChange(true)}
        >
          <Text style={[ts.ampmText, isPM && ts.ampmTextActive]}>PM</Text>
          <Text style={[ts.ampmSubText, isPM && ts.ampmTextActive]}>مساء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createTsStyles(THEME: any) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  col: { alignItems: 'center', gap: 4 },
  colLabel: {
    color: THEME.secondaryText,
    fontSize: 11,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  arrow: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueInput: {
    backgroundColor: THEME.inputBg,
    color: THEME.text,
    fontFamily: Typography.fonts.bold,
    fontSize: 26,
    width: 60,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.divider,
    textAlign: 'center',
  },
  colon: {
    color: THEME.text,
    fontSize: 28,
    fontFamily: Typography.fonts.bold,
    marginTop: 20,
  },
  ampmCol: { alignItems: 'center', gap: 6, marginTop: 20 },
  ampmBtn: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  ampmActive: {
    backgroundColor: 'rgba(216,67,21,0.15)',
    borderColor: THEME.brand,
  },
  ampmText: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.bold,
    fontSize: 14,
  },
  ampmSubText: {
    color: THEME.secondaryText,
    fontFamily: Typography.fonts.regular,
    fontSize: 10,
  },
  ampmTextActive: { color: THEME.brand },
  });
}

// ── Web 2-step modal ──────────────────────────────────────────────────────────
function WebPicker({ value, onConfirm, onCancel }: {
  value: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const { theme: THEME } = useAppTheme();
  const wp = useMemo(() => createWpStyles(THEME), [THEME]);
  const now = new Date();
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  const initDate = value ? new Date(value) : now;

  const [step, setStep] = useState<'date' | 'time'>('date');
  const [dateStr, setDateStr] = useState(toDateStr(initDate));

  // Time spinner state (12h format)
  const initHour24 = value ? initDate.getHours() : 8;
  const [isPM, setIsPM]     = useState(initHour24 >= 12);
  const [hour, setHour]     = useState(initHour24 % 12 || 12);
  const [minute, setMinute] = useState(value ? initDate.getMinutes() : 0);

  const handleConfirm = () => {
    const hour24 = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const [y, m, d] = dateStr.split('-').map(Number);
    const final = new Date(y, m - 1, d, hour24, minute, 0, 0);
    onConfirm(final);
  };

  return (
    <View>
      {/* Step dots */}
      <View style={wp.stepRow}>
        <View style={[wp.dot, step === 'date' && wp.dotActive]} />
        <View style={wp.stepLine} />
        <View style={[wp.dot, step === 'time' && wp.dotActive]} />
      </View>
      <Text style={wp.stepLabel}>
        {step === 'date' ? '📅 الخطوة 1 – اختر التاريخ' : '🕐 الخطوة 2 – اختر الوقت'}
      </Text>

      {step === 'date' ? (
        <input
          type="date"
          value={dateStr}
          min={toDateStr(now)}
          onChange={e => setDateStr(e.target.value)}
          style={{
            background: THEME.inputBg, color: THEME.text,
            border: `1px solid ${THEME.divider}`, borderRadius: 12,
            padding: '14px 16px', fontSize: 16,
            width: '100%', boxSizing: 'border-box',
            outline: 'none', fontFamily: 'inherit',
            colorScheme: 'dark', display: 'block',
          } as any}
        />
      ) : (
        <TimeSpinner
          hour={hour} minute={minute} isPM={isPM}
          onHourChange={setHour}
          onMinuteChange={setMinute}
          onPMChange={setIsPM}
        />
      )}

      <View style={[wp.btnRow, { marginTop: 20 }]}>
        {step === 'date' ? (
          <>
            <TouchableOpacity style={[wp.btn, wp.cancelBtn]} onPress={onCancel}>
              <Text style={wp.btnText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[wp.btn, wp.confirmBtn, !dateStr && { opacity: 0.5 }]}
              disabled={!dateStr}
              onPress={() => setStep('time')}
            >
              <Ionicons name="checkmark-outline" size={18} color={THEME.brand} />
              <Text style={wp.confirmBtnText}>التالي</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[wp.btn, wp.cancelBtn]} onPress={() => setStep('date')}>
              <Text style={wp.btnText}>→ رجوع</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[wp.btn, wp.confirmBtn]} onPress={handleConfirm}>
              <Ionicons name="checkmark-outline" size={18} color={THEME.brand} />
              <Text style={wp.confirmBtnText}>تأكيد</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function createWpStyles(THEME: any) {
  return StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.muted },
  dotActive: { backgroundColor: THEME.brand, width: 12, height: 12, borderRadius: 6 },
  stepLine: { flex: 1, height: 1, backgroundColor: THEME.divider, marginHorizontal: 10 },
  stepLabel: {
    color: THEME.text, fontFamily: Typography.fonts.bold,
    fontSize: 15, textAlign: 'center', marginBottom: 20,
  },
  btnRow: { flexDirection: 'row-reverse', gap: 12 },
  btn: { flex: 1, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  confirmBtn: { backgroundColor: 'rgba(216, 67, 21, 0.1)', borderWidth: 1, borderColor: THEME.brand },
  cancelBtn: { backgroundColor: THEME.muted, borderWidth: 1, borderColor: THEME.divider },
  btnText: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 15 },
  confirmBtnText: { color: THEME.text, fontFamily: Typography.fonts.bold, fontSize: 15 },
  });
}

// ── Main exported component ───────────────────────────────────────────────────
export default function SmartDateTimePicker({ value, onChange, disabled }: Props) {
  const [showNative, setShowNative] = useState(false);
  const [nativeStep, setNativeStep] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate]     = useState<Date | null>(null);
  const [showWeb, setShowWeb]       = useState(false);

  const { theme: THEME } = useAppTheme();
  const s = useMemo(() => createSStyles(THEME), [THEME]);

  const formatDisplay = (iso: string) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        hour12: true,
      });
    } catch { return iso; }
  };

  const handleNativeConfirm = (date: Date) => {
    if (nativeStep === 'date') {
      setTempDate(date);
      setShowNative(false);
      setTimeout(() => { setNativeStep('time'); setShowNative(true); }, 300);
    } else {
      if (tempDate) {
        const final = new Date(tempDate);
        final.setHours(date.getHours(), date.getMinutes(), 0, 0);
        onChange(final.toISOString());
      }
      setShowNative(false); setNativeStep('date'); setTempDate(null);
    }
  };

  const openPicker = () => {
    if (disabled) return;
    if (Platform.OS === 'web') setShowWeb(true);
    else { setNativeStep('date'); setTempDate(null); setShowNative(true); }
  };

  const display = formatDisplay(value);

  return (
    <>
      <TouchableOpacity
        style={[s.trigger, disabled && s.triggerDisabled]}
        onPress={openPicker}
        disabled={disabled}
      >
        <Ionicons name="calendar-outline" size={20} color={disabled ? THEME.disabledText : THEME.brand} />
        <Text style={[s.triggerText, disabled && { color: THEME.disabledText }]} numberOfLines={1}>
          {display || 'اضغط لاختيار التاريخ والوقت'}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => !disabled && onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#FF5252" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={disabled ? THEME.disabledText : THEME.secondaryText} />
        )}
      </TouchableOpacity>

      {/* Native */}
      {Platform.OS !== 'web' && DateTimePickerModal && (
        <DateTimePickerModal
          isVisible={showNative}
          mode={nativeStep}
          date={tempDate || new Date()}
          onConfirm={handleNativeConfirm}
          onCancel={() => { setShowNative(false); setNativeStep('date'); setTempDate(null); }}
          is24Hour={false}
          locale="en"
          confirmTextIOS="تأكيد"
          cancelTextIOS="إلغاء"
        />
      )}

      {/* Web modal */}
      {Platform.OS === 'web' && (
        <Modal visible={showWeb} transparent animationType="fade" onRequestClose={() => setShowWeb(false)}>
          <Pressable style={s.overlay} onPress={() => setShowWeb(false)}>
            <Pressable style={s.modalBox} onPress={e => e.stopPropagation()}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={s.modalTitle}>اختر التاريخ والوقت</Text>
                <TouchableOpacity onPress={() => setShowWeb(false)}>
                  <Ionicons name="close" size={24} color={THEME.text} />
                </TouchableOpacity>
              </View>
              <WebPicker
                value={value}
                onConfirm={d => { onChange(d.toISOString()); setShowWeb(false); }}
                onCancel={() => setShowWeb(false)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

function createSStyles(THEME: any) {
  return StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: THEME.inputBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: THEME.divider, marginBottom: 8,
  },
  triggerDisabled: { opacity: 0.4, borderColor: THEME.divider },
  triggerText: {
    flex: 1, color: THEME.text,
    fontFamily: Typography.fonts.regular, fontSize: 15, textAlign: 'right',
  },
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalBox: {
    width: '92%', maxWidth: 420,
    backgroundColor: THEME.secondaryBackground,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: THEME.divider,
    overflow: 'hidden' as any,
  },
  modalTitle: {
    color: THEME.text, fontSize: 18,
    fontFamily: Typography.fonts.bold, textAlign: 'right', marginBottom: 20,
  },
  });
}
