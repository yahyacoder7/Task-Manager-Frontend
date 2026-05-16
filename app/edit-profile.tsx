import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { getItem, saveItem } from '../utils/storage';
import { Typography } from '../constants/Typography';
import { useAppTheme } from '../constants/ThemeContext';

import { BASE_URL } from '../constants/API';

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
        await saveItem('userData', JSON.stringify(updatedUser));
        router.replace('/(tabs)/profile?updated=true');
      } else {
        alert("Failed to update data.");
      }
    } catch (err) {
      alert("Connection error.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { direction: 'ltr' } as any]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        headerTitle: "",
        headerStyle: { backgroundColor: '#E65A2A' },
        headerShadowVisible: false,
        headerTintColor: '#FFFFFF',
        headerLeft: () => ( 
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, gap: 12 }}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 16, 
                fontWeight: 'bold',
                fontFamily: Typography.fonts.bold
              }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => null,
      }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-outline" size={20} color={THEME.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your new name"
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
              <><MaterialCommunityIcons name="check-circle" size={20} color={THEME.white} /><Text style={styles.updateButtonText}>Save Changes</Text></>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color={THEME.secondaryText} />
          <Text style={styles.infoText}>
            The name you enter here will be visible to your colleagues in work plans and shared tasks.
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
    textAlign: 'left',
    marginLeft: 4,
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
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: THEME.text,
    fontSize: 16,
    textAlign: 'left',
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
    textAlign: 'left',
    lineHeight: 20,
    fontFamily: Typography.fonts.regular,
  },
  });
}
