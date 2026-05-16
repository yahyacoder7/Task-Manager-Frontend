import Colors from "@/constants/Colors";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
} from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const { from } = useLocalSearchParams<{ from?: string }>();

  useEffect(() => {
    const delay = from === 'logout' ? 0 : 2000;
    const timer = setTimeout(() => {
      router.replace('/');
    }, delay);
    return () => clearTimeout(timer);
  }, [from]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }, { direction: 'ltr' } as any]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <Image 
          source={require("../assets/images/logo.png")} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.text }]}>
          Task Flow
        </Text>
        <Text style={[styles.description, { color: theme.secondaryText }]}>
          A simple and practical task management application.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
  },
});
