import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

const BASE_URL = "http://localhost:3000";

export default function RegisterScreen() {
  const theme = Colors.dark;
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("يرجى ملء كافة الحقول");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      if (response.status === 201) {
        // Registration success - move to OTP verification
        router.push({
          pathname: "/verify-otp",
          params: { email: email.trim() },
        });
      } else {
        const data = await response.json();
        setError(
          data.message || "فشل إنشاء الحساب. قد يكون البريد مستخدماً بالفعل.",
        );
      }
    } catch (err) {
      console.error("Register Error:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {/* 🚩🚩🚩 CHANGE LOGO HERE 🚩🚩🚩 */}
              <Image 
                source={require("../assets/images/logo.png")} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              {/* 🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩 */}
              <Text style={[styles.appName, { color: theme.text }]}>Task Flow</Text>
            </View>
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              ابدأ رحلتك في إدارة المهام مع Task Flow
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color:
                      focusedInput === "name"
                        ? theme.brand
                        : theme.secondaryText,
                  },
                ]}
              >
                الاسم بالكامل
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor:
                      focusedInput === "name"
                        ? "rgba(255, 255, 255, 0.15)"
                        : theme.secondaryBackground,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={
                    focusedInput === "name" ? theme.brand : theme.secondaryText
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }] as any}
                  placeholder="يحيى مدني"
                  placeholderTextColor={theme.secondaryText}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color:
                      focusedInput === "email"
                        ? theme.brand
                        : theme.secondaryText,
                  },
                ]}
              >
                البريد الإلكتروني
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor:
                      focusedInput === "email"
                        ? "rgba(255, 255, 255, 0.15)"
                        : theme.secondaryBackground,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={
                    focusedInput === "email" ? theme.brand : theme.secondaryText
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }] as any}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.secondaryText}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color:
                      focusedInput === "password"
                        ? theme.brand
                        : theme.secondaryText,
                  },
                ]}
              >
                كلمة المرور
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor:
                      focusedInput === "password"
                        ? "rgba(255, 255, 255, 0.15)"
                        : theme.secondaryBackground,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    focusedInput === "password"
                      ? theme.brand
                      : theme.secondaryText
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }] as any}
                  placeholder="••••••••"
                  placeholderTextColor={theme.secondaryText}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.secondaryText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.loginButton,
                { backgroundColor: theme.brand, marginTop: 20 },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>إنشاء حساب جديد</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.secondaryBackground, opacity: 0.3 },
                ]}
              />
              <Text
                style={[styles.dividerText, { color: theme.secondaryText }]}
              >
                أو إنشاء حساب باستخدام:
              </Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.secondaryBackground, opacity: 0.3 },
                ]}
              />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.secondaryBackground },
                ]}
              >
                <Ionicons name="logo-google" size={24} color="#EA4335" />
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: theme.text }]}>
                لديك حساب بالفعل؟{" "}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.signupLink, { color: theme.brand }]}>
                  تسجيل الدخول
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "right",
  },
  inputWrapper: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlign: "right",
    // @ts-ignore
    outlineStyle: "none",
  } as any,
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 40,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  signupContainer: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 15,
    opacity: 0.8,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: "800",
  },
});
