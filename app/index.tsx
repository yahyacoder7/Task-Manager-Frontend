import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { saveItem, getItem } from "../utils/storage";
import { useEffect } from "react";

import { BASE_URL } from "../constants/API";

export default function LoginScreen() {
  const theme = Colors.dark;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = await getItem('userToken');
    if (token) {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoginResult(null);

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
        // Save using our cross-platform utility
        await saveItem('userToken', data.access_token);
        await saveItem('userData', JSON.stringify(data.user));
        
        console.log("Login Success:", data);
        router.replace("/(tabs)");
      } else {
        setError(data.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم. تأكد من تشغيل الـ Backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }, { direction: 'rtl' } as any]}
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
          {loginResult ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
              <Text style={[styles.successTitle, { color: theme.text }]}>
                تم تسجيل الدخول بنجاح!
              </Text>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.secondaryBackground },
                ]}
              >
                <Text style={[styles.resultText, { color: theme.text }]}>
                  بيانات المستخدم:
                </Text>
                <Text style={[styles.jsonText, { color: theme.secondaryText }]}>
                  {JSON.stringify(loginResult.user, null, 2)}
                </Text>
                <Text
                  style={[
                    styles.resultText,
                    { color: theme.text, marginTop: 16 },
                  ]}
                >
                  Token:
                </Text>
                <Text
                  style={[styles.jsonText, { color: theme.secondaryText }]}
                  numberOfLines={3}
                >
                  {loginResult.access_token}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: theme.brand,
                    width: "100%",
                    marginTop: 24,
                  },
                ]}
                onPress={() => setLoginResult(null)}
              >
                <Text style={styles.loginButtonText}>العودة لتسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  {/* 🚩🚩🚩 CHANGE LOGO HERE 🚩🚩🚩 */}
                  <Image 
                    source={require("../assets/images/logo.png")} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  {/* 🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩🚩 */}
                  <Text style={[styles.appName, { color: theme.text }]}>
                    Task Flow
                  </Text>
                </View>
                <Text style={[styles.welcomeText, { color: theme.text }]}>
                  مرحباً بك مجدداً في نظام إدارة المهام Task Flow
                </Text>
              </View>

              <View style={styles.form}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

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
                        borderColor:
                          focusedInput === "email"
                            ? theme.brand
                            : "transparent",
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: theme.text }] as any}
                      placeholder="example@gmail.com"
                      placeholderTextColor={theme.secondaryText}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <MaterialCommunityIcons name="email-outline"
                      size={20}
                      color={
                        focusedInput === "email" ? theme.brand : theme.secondaryText
                      }
                      style={styles.inputIcon}
                    />
                  </View>
                </View>

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
                        borderColor:
                          focusedInput === "password"
                            ? theme.brand
                            : "transparent",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      {showPassword ? <MaterialCommunityIcons name="eye-off" size={20} color={theme.secondaryText} /> : <MaterialCommunityIcons name="eye" size={20} color={theme.secondaryText} />}
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, { color: theme.text }] as any}
                      placeholder="••••••••••••"
                      placeholderTextColor={theme.secondaryText}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                    />
                    <MaterialCommunityIcons name="lock-outline"
                      size={20}
                      color={
                        focusedInput === "password"
                          ? theme.brand
                          : theme.secondaryText
                      }
                      style={styles.inputIcon}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text
                    style={[styles.forgotPasswordText, { color: theme.brand }]}
                  >
                    نسيت كلمة المرور؟
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
                      <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                    </>
                  )}
                </TouchableOpacity>





                <View style={styles.signupContainer}>
                  <Text style={[styles.signupText, { color: theme.text }]}>
                    ليس لديك حساب؟{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/register")}>
                    <Text style={[styles.signupLink, { color: theme.brand }]}>
                      أنشئ حساباً جديداً
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
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
    alignItems: 'flex-end',
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
    textAlign: "right",
    alignSelf: 'flex-end',
    paddingRight: 4,
    color: '#D84315', // لون برتقالي لتمييز العنوان
  },
  inputWrapper: {
    width: '100%',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    textAlign: "right",
    writingDirection: "rtl",
    marginRight: 10,
    // We handle the outline removal for web with a conditional prop or CSS-in-JS if needed,
    // but for now, we remove it from the standard RN StyleSheet to fix TS error.
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  } as any,
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
  successContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 30,
  },
  resultCard: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  jsonText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    lineHeight: 20,
  },
});
