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

  const inputRef = useRef<TextInput | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    focusTimerRef.current = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, []);

  const handleFocusInput = () => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleChange = (value: string) => {
    setError(null);

    const digits = value.replace(/[^0-9]/g, "").split("").slice(0, OTP_LENGTH);

    const newOtp = Array(OTP_LENGTH).fill("");
    digits.forEach((d, i) => {
      if (i < OTP_LENGTH) newOtp[i] = d;
    });
    setOtp(newOtp);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      const filledCount = otp.filter((d) => d !== "").length;
      if (filledCount > 0) {
        const newOtp = [...otp];
        newOtp[filledCount - 1] = "";
        setOtp(newOtp);
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
          router.replace("/");
        }, 1500);
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
          keyboardShouldPersistTaps="handled"
        >
          {result ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
              <Text style={[styles.successTitle, { color: theme.text }]}>
                Account Created Successfully!
              </Text>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.secondaryBackground },
                ]}
              >
                <Text style={[styles.resultText, { color: theme.text }]}>
                  Welcome: {result.user.name}
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
                <Text style={styles.loginButtonText}>Go to Sign In</Text>
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
                  Create Another Account
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

                <TouchableOpacity
                  style={styles.otpContainer}
                  onPress={handleFocusInput}
                  activeOpacity={1}
                >
                  {otp.map((digit, index) => {
                    const isFilled = digit !== "";
                    const isEmptySpot = !isFilled && index === otp.filter((d) => d !== "").length;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpBox,
                          {
                            backgroundColor: isEmptySpot && isFocused
                              ? "rgba(216, 67, 21, 0.1)"
                              : theme.secondaryBackground,
                            borderColor: isFilled
                              ? theme.brand
                              : isEmptySpot && isFocused
                              ? theme.brand
                              : "rgba(255,255,255,0.15)",
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Text style={[styles.otpDigit, { color: theme.text }]}>
                          {digit}
                        </Text>
                        {isEmptySpot && isFocused && (
                          <View style={styles.cursor} />
                        )}
                      </View>
                    );
                  })}
                </TouchableOpacity>

                <TextInput
                  ref={inputRef}
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
                  importantForAutofill="no"
                />

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
    justifyContent: "center",
    width: "100%",
    marginBottom: 30,
    gap: 10,
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
    left: 14,
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
