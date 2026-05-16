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

import { BASE_URL } from '../constants/API';

export default function RegisterScreen() {
  const theme = Colors.dark;
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
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
        router.push({
          pathname: "/verify-otp",
          params: { email: email.trim() },
        });
      } else {
        const data = await response.json();
        setError(
          data.message || "Account creation failed. Email may already be in use.",
        );
      }
    } catch (err) {
      console.error("Register Error:", err);
      setError("Server connection error.");
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
              <Text style={[styles.appName, { color: theme.text }]}>Task Flow</Text>
            </View>
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              Start your task management journey with Task Flow
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
                Full Name
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.secondaryBackground }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.secondaryText}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

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
                  placeholder="Create a password"
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

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.loginButton,
                { backgroundColor: theme.brand, marginTop: 20 },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: theme.text }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.signupLink, { color: theme.brand }]}>
                  Sign In
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
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  eyeIcon: {
    padding: 4,
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
});
