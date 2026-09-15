import React from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import theme from "../constants/theme";

export default function NotFoundScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{ fontSize: 30, fontWeight: "800", color: theme.colors.text }}
      >
        Page not found
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.textSoft,
          marginTop: 12,
          textAlign: "center",
        }}
      >
        The page you are looking for is not available in this mobile app.
      </Text>
      <Link
        href="/(tabs)"
        style={{
          marginTop: 24,
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: theme.radius.md,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Go to Home</Text>
      </Link>
    </View>
  );
}
