import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../../components/Screen";
import AuthGuard from "../../../components/auth/AuthGuard";

export default function PartnerApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AuthGuard roles={["PARTNER_USER", "PARTNER_ADMIN", "SYSTEM_ADMIN"]}>
      <Screen scrollable>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 30, fontWeight: "800" }}>
            Partner Application Detail
          </Text>
          <Text style={{ fontSize: 16, color: "#52606D", marginTop: 12 }}>
            Application ID: {id}
          </Text>
        </View>
      </Screen>
    </AuthGuard>
  );
}
