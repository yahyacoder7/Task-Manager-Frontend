import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { saveItem } from "../utils/storage";

import { BASE_URL } from '../constants/API';

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const theme = Colors.dark;
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [result, setResult] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const hiddenInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getActiveIndex = (): number => {
    const idx = otp.findIndex((d) => d === "");
    return idx === -1 ? OTP_LENGTH - 1 : idx;
  };

  const handleChange = (value: string) => {
    setError(null);

    const digits = value.replace(/[^0-9]/g, "").split("").slice(0, OTP_LENGTH);

    if (digits.length === 0) return;

    if (digits.length > 1) {
      const filled = [...otp];
      digits.forEach((d, i) => {
        if (i < OTP_LENGTH) filled[i] = d;
      });
      setOtp(filled);
      return;
    }

    const activeIndex = getActiveIndex();
    const newOtp = [...otp];
    newOtp[activeIndex] = digits[0];
    setOtp(newOtp);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      const activeIndex = getActiveIndex();
      const newOtp = [...otp];

      if (newOtp[activeIndex] !== "") {
        newOtp[activeIndex] = "";
        setOtp(newOtp);
      } else if (activeIndex > 0) {
        newOtp[activeIndex - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleBoxPress = () => {
    hiddenInputRef.current?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < OTP_LENGTH) {
      setError("يرجى إدخال رمز التحقق كاملاً");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await saveItem('userToken', data.access_token);
        await saveItem('userData', JSON.stringify(data.user));
        
        setResult(data);
        console.log("Verify Success:", data);
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        setError(data.message || "رمز التحقق غير صحيح أو انتهت صلاحيته.");
      }
    } catch (err) {
      console.error("Verify Error:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setTimer(60);
        setSuccessMessage("تم إعادة إرسال الرمز إلى بريدك بنجاح");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("فشل إعادة إرسال الرمز. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال.");
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
          keyboardShouldPersistTaps="handled"
        >
          {result ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
              <Text style={[styles.successTitle, { color: theme.text }]}>
                تم إنشاء الحساب بنجاح!
              </Text>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.secondaryBackground },
                ]}
              >
                <Text style={[styles.resultText, { color: theme.text }]}>
                  مرحباً بك: {result.user.name}
                </Text>
                <Text style={[styles.jsonText, { color: theme.secondaryText }]}>
                  {JSON.stringify(result.user, null, 2)}
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
                onPress={() => router.replace("/")}
              >
                <Text style={styles.loginButtonText}>الذهاب لتسجيل الدخول</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.backButton, { marginTop: 20 }]}
                onPress={() => {
                  setResult(null);
                  setOtp(Array(OTP_LENGTH).fill(""));
                  router.replace("/register");
                }}
              >
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={20}
                  color={theme.brand}
                />
                <Text style={[styles.backText, { color: theme.brand }]}>
                  إنشاء حساب آخر
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require("../assets/images/logo.png")} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={[styles.appName, { color: theme.text }]}>Task Flow</Text>
                </View>
                <Text style={[styles.welcomeText, { color: theme.text }]}>
                  تأكيد الرمز
                </Text>
                <Text
                  style={[styles.description, { color: theme.secondaryText }]}
                >
                  أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني
                </Text>
                <Text style={[styles.emailText, { color: theme.brand }]}>
                  {email}
                </Text>
              </View>

              <View style={styles.form}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {successMessage && (
                  <View
                    style={[
                      styles.errorContainer,
                      {
                        borderColor: "#4CAF50",
                        backgroundColor: "rgba(76, 175, 80, 0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: "#4CAF50" }]}>
                      {successMessage}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.otpContainer}
                  onPress={handleBoxPress}
                  activeOpacity={1}
                >
                  {otp.map((digit, index) => {
                    const isActive = digit === "" && index === getActiveIndex();
                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpBox,
                          {
                            backgroundColor: isActive && isFocused
                              ? "rgba(216, 67, 21, 0.15)"
                              : theme.secondaryBackground,
                            borderColor: digit
                              ? theme.brand
                              : isActive && isFocused
                              ? theme.brand
                              : "transparent",
                            borderWidth: digit || (isActive && isFocused) ? 2 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.otpDigit, { color: theme.text }]}>
                          {digit}
                        </Text>
                        {isActive && isFocused && (
                          <View style={styles.cursor} />
                        )}
                      </View>
                    );
                  })}
                </TouchableOpacity>

                <TextInput
                  ref={hiddenInputRef}
                  style={styles.hiddenInput}
                  value={otp.join("")}
                  onChangeText={handleChange}
                  onKeyPress={handleKeyPress}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  caretHidden
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                />

                <View style={styles.resendContainer}>
                  <Text
                    style={[styles.resendText, { color: theme.secondaryText }]}
                  >
                    لم يصلك الرمز؟{" "}
                    {timer > 0 ? (
                      <Text style={{ color: theme.secondaryText }}>
                        إعادة إرسال الرمز (بعد{" "}
                        {timer < 10 ? `0${timer}` : timer}:00)
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleResendOtp}>
                        <Text
                          style={{ color: theme.brand, fontWeight: "bold" }}
                        >
                          إعادة إرسال الرمز
                        </Text>
                      </TouchableOpacity>
                    )}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.loginButton,
                    { backgroundColor: theme.brand, marginTop: 40 },
                  ]}
                  onPress={handleVerify}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>تأكيد الرمز</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <MaterialCommunityIcons name="arrow-right" size={20} color={theme.brand} />
                  <Text style={[styles.backText, { color: theme.brand }]}>
                    تغيير البريد الإلكتروني
                  </Text>
                </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  form: {
    width: "100%",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: "bold",
  },
  cursor: {
    position: "absolute",
    right: 14,
    width: 2,
    height: 24,
    backgroundColor: "#D84315",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
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
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
  },
  loginButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D84315",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    gap: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
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
