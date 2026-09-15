import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import theme from "../constants/theme";

export function LoadingScreen({
  title = "Loading YojnaSetu...",
}: {
  title?: string;
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    marginTop: theme.spacing.lg,
  },
});

export default LoadingScreen;
