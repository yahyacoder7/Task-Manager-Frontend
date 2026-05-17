import Colors from "@/constants/Colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
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
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const focusInput = (index: number) => {
    setFocusedIndex(index);
    setTimeout(() => {
      inputRefs.current[index]?.focus();
    }, 50);
  };

  const handleChange = (value: string, index: number) => {
    setError(null);

    if (value.length > 1) {
      const pasted = value.replace(/[^0-9]/g, "").split("").slice(0, OTP_LENGTH);
      const newOtp = Array(OTP_LENGTH).fill("");
      pasted.forEach((d, i) => {
        if (i < OTP_LENGTH) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      setFocusedIndex(nextIdx);
      setTimeout(() => {
        inputRefs.current[nextIdx]?.focus();
      }, 50);
      return;
    }

    if (value === "") return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (index < OTP_LENGTH - 1) {
      setFocusedIndex(index + 1);
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      const newOtp = [...otp];
      if (newOtp[index] !== "") {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        setFocusedIndex(index - 1);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 50);
      }
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < OTP_LENGTH) {
      setError("Please enter the full verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const emailString = Array.isArray(email) ? email[0] : email;

      const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailString,
          otp: Number(otpString),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // حفظ التوكن والبيانات في الجهاز بأمان
        if (data.access_token) {
          await saveItem('userToken', data.access_token);
        }
        if (data.user) {
          await saveItem('userData', JSON.stringify(data.user));
          await saveItem('userEmail', data.user.email);
        }
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // التوجيه إلى داخل التطبيق مباشرة
          router.replace("/(tabs)");
        }, 2000);
      } else {
        setError(data.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      console.error("Verify Error:", err);
      setError("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setOtp(Array(OTP_LENGTH).fill(""));
    setFocusedIndex(0);
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
        setSuccessMessage("Code resent to your email successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 300);
      } else {
        setError("Failed to resend code. Please try again later.");
      }
    } catch (err) {
      setError("Connection error.");
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
          keyboardShouldPersistTaps="always"
        >
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
              Verify Code
            </Text>
            <Text
              style={[styles.description, { color: theme.secondaryText }]}
            >
              Enter the 6-digit code sent to your email
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
              {otp.map((digit, index) => {
                const isFilled = digit !== "";
                const isActive = index === focusedIndex;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.otpTouch}
                    activeOpacity={1}
                    onPress={() => focusInput(index)}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        {
                          color: theme.text,
                          backgroundColor: isActive
                            ? "rgba(216, 67, 21, 0.1)"
                            : theme.secondaryBackground,
                          borderColor: isFilled
                            ? theme.brand
                            : isActive
                            ? theme.brand
                            : "rgba(255,255,255,0.15)",
                          borderWidth: 2,
                        },
                      ]}
                      maxLength={1}
                      keyboardType="numeric"
                      value={digit}
                      onChangeText={(val) => handleChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      textAlign="center"
                      editable
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: theme.secondaryText }]}>
                Didn't receive a code?{" "}
              </Text>
              {timer > 0 ? (
                <Text style={[styles.timerText, { color: theme.brand }]}>
                  Resend available in {timer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={[styles.resendLink, { color: theme.brand }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              )}
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
                <Text style={styles.loginButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={theme.brand} />
              <Text style={[styles.backText, { color: theme.brand }]}>
                Change Email
              </Text>
            </TouchableOpacity>
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
              Registration Successful
            </Text>
            <Text style={[styles.modalDescription, { color: theme.secondaryText }]}>
              Your account has been created. Please sign in to get started.
            </Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.modalLoaderRow}>
              <ActivityIndicator size="small" color={theme.brand} />
              <Text style={[styles.modalLoaderText, { color: theme.secondaryText }]}>
                Redirecting to login...
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
    justifyContent: "center",
    width: "100%",
    marginBottom: 30,
    gap: 10,
  },
  otpTouch: {
    width: 48,
    height: 58,
    borderRadius: 12,
    overflow: "hidden",
  },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    padding: 0,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  resendText: {
    fontSize: 14,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "bold",
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
