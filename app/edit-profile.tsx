import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { getItem, saveItem } from '../utils/storage';
import { Typography } from '../constants/Typography';
import { useAppTheme } from '../constants/ThemeContext';

const BASE_URL = "http://localhost:3000";

export default function EditProfileScreen() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { theme: THEME } = useAppTheme();
  const styles = useMemo(() => createStyles(THEME), [THEME]);

  useEffect(() => {
    loadCurrentName();
  }, []);

  const loadCurrentName = async () => {
    setIsLoading(true);
    const userData = await getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setName(user.name);
    }
    setIsLoading(false);
  };

  const handleUpdate = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${BASE_URL}/users/profile/update`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: name.trim() })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update local storage
        await saveItem('userData', JSON.stringify(updatedUser));
        router.replace('/(tabs)/profile?updated=true');
      } else {
        alert("فشل تحديث البيانات.");
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        headerTitle: "", // Disable default title
        headerStyle: { backgroundColor: 'rgba(216, 67, 21, 0.88)' },
        headerShadowVisible: false,
        headerTintColor: '#FFFFFF',
        headerRight: () => ( 
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, gap: 12 }}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 16, 
                fontWeight: 'bold',
                fontFamily: Typography.fonts.bold
              }}>
                تعديل الملف الشخصي
              </Text>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ),
        headerLeft: () => null,
      }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.form}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={THEME.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={name}
              onChangeText={setName}
              placeholder="أدخل اسمك الجديد"
              placeholderTextColor="#666"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.updateButton, isSaving && { opacity: 0.7 }]} 
            onPress={handleUpdate}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <><Ionicons name="checkmark-circle" size={20} color={THEME.white} /><Text style={styles.updateButtonText}>حفظ التغييرات</Text></>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={THEME.secondaryText} />
          <Text style={styles.infoText}>
            الاسم الذي ستضعه هنا هو الذي سيظهر لزملائك في خطط العمل والمهام المشتركة.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(THEME: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  form: {
    marginTop: 20,
  },
  label: {
    color: THEME.secondaryText,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
    marginRight: 4,
    fontFamily: Typography.fonts.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: THEME.divider,
    marginBottom: 24,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    color: THEME.text,
    fontSize: 16,
    textAlign: 'right',
    fontFamily: Typography.fonts.regular,
  },
  updateButton: {
    backgroundColor: 'rgba(216, 67, 21, 0.88)',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: THEME.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: THEME.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Typography.fonts.bold,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: THEME.muted,
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    color: THEME.secondaryText,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 20,
    fontFamily: Typography.fonts.regular,
  },
  });
}
