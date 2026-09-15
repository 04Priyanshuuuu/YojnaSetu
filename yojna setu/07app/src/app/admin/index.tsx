import React from "react";
import { View, Text } from "react-native";
import Screen from "../../components/Screen";
import AuthGuard from "../../components/auth/AuthGuard";

export default function AdminScreen() {
  return (
    <AuthGuard roles={["SYSTEM_ADMIN"]}>
      <Screen scrollable>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 30, fontWeight: "800" }}>
            Admin Dashboard
          </Text>
          <Text style={{ fontSize: 14, color: "#52606D", marginTop: 8 }}>
            System admin placeholder.
          </Text>
        </View>
      </Screen>
    </AuthGuard>
  );
}
