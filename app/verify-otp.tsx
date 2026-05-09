import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
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

const BASE_URL = "http://localhost:3000";

export default function VerifyOtpScreen() {
  const theme = Colors.dark;
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [result, setResult] = useState<any>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    // Handle Copy-Paste of multiple digits
    if (value.length > 1) {
      const pastedOtp = value.split("").slice(0, 6);
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);

      // Focus the last filled input or the last one
      const nextIndex = Math.min(pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
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
        // Save using our cross-platform utility
        await saveItem('userToken', data.access_token);
        await saveItem('userData', JSON.stringify(data.user));
        
        setResult(data);
        console.log("Verify Success:", data);
        // We can navigate immediately or stay on success screen. 
        // Let's stay for a second then navigate or let user click.
        // For better UX, let's auto navigate after 1.5s
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
          {result ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
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
                  setOtp(["", "", "", "", "", ""]);
                  router.replace("/register");
                }}
              >
                <Ionicons
                  name="person-add-outline"
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

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: theme.secondaryBackground,
                          color: theme.text,
                          borderColor: digit ? theme.brand : "transparent",
                          borderWidth: digit ? 1 : 0,
                        },
                      ]}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                    />
                  ))}
                </View>

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
                  <Ionicons name="arrow-back" size={20} color={theme.brand} />
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
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
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
    flexDirection: "row-reverse",
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
