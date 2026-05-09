import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const saveItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const deleteItem = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error deleting from localStorage', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
