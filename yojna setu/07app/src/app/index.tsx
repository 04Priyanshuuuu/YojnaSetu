import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useAuth } from "../context/AuthContext";
import YojnaSetuLogo from "../components/branding/YojnaSetuLogo";

export default function StartupScreen() {
  const { isLoading, isReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isReady || isLoading) return;

    router.replace("/(tabs)/home");
  }, [isReady, isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <YojnaSetuLogo size={128} style={styles.logo} />

      <Text style={styles.appName}>YojnaSetu</Text>
      <Text style={styles.tagline}>Government schemes, simplified</Text>
      <ActivityIndicator size="large" color="#0E766E" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2FDFB",
    paddingHorizontal: 24,
  },
  logo: {
    marginBottom: 2,
  },
  appName: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
  },
  spinner: {
    marginTop: 22,
  },
});
