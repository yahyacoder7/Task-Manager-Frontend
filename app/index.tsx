import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { saveItem, getItem } from "../utils/storage";

import { useFocusEffect } from '@react-navigation/native';

import { BASE_URL } from "../constants/API";

export default function LoginScreen() {
  const theme = Colors.dark;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSuccess) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 10,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [showSuccess]);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const checkLoginStatus = async () => {
    const token = await getItem('userToken');
    if (token) {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await saveItem('userToken', data.access_token);
        await saveItem('userData', JSON.stringify(data.user));
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.replace("/(tabs)");
        }, 2000);
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server connection error. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }, { direction: 'ltr' } as any]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require("../assets/images/logo.png")} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={[styles.appName, { color: theme.text }]}>
                Task Flow
              </Text>
            </View>
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              Welcome back to Task Flow
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.brand }]}>
                Email
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.secondaryBackground }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="example@gmail.com"
                  placeholderTextColor={theme.secondaryText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.brand }]}>
                Password
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.secondaryBackground }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.secondaryText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.brand }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.loginButton, { backgroundColor: theme.brand }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="login-variant" size={20} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: theme.text }]}>
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={[styles.signupLink, { color: theme.brand }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccess} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              { backgroundColor: theme.secondaryBackground, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="check-circle-outline" size={44} color="#4CAF50" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.modalDescription, { color: theme.secondaryText }]}>
              Signed in successfully. Redirecting to your dashboard...
            </Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.modalLoaderRow}>
              <ActivityIndicator size="small" color={theme.brand} />
              <Text style={[styles.modalLoaderText, { color: theme.secondaryText }]}>
                Redirecting...
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 5,
  },
  appName: {
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
    opacity: 0.95,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 24,
    maxWidth: "80%",
  },
  form: {
    width: "100%",
  },
  errorContainer: {
    backgroundColor: "rgba(234, 67, 53, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EA4335",
  },
  errorText: {
    color: "#EA4335",
    textAlign: "center",
    fontSize: 14,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  inputWrapper: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "700",
  },
  loginButton: {
    height: 58,
    width: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    gap: 10,
    shadowColor: Colors.dark.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  signupText: {
    fontSize: 15,
    opacity: 0.8,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 28,
    paddingVertical: 44,
    paddingHorizontal: 36,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 0,
  },
  modalDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginTop: 24,
    marginBottom: 20,
  },
  modalLoaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalLoaderText: {
    fontSize: 13,
    textAlign: "center",
  },
});
