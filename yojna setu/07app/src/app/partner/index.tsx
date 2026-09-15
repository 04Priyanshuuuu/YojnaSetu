import React from "react";
import { Text, View } from "react-native";
import Screen from "../../components/Screen";
import AuthGuard from "../../components/auth/AuthGuard";

export default function PartnerQueueScreen() {
  return (
    <AuthGuard roles={["PARTNER_USER", "PARTNER_ADMIN", "SYSTEM_ADMIN"]}>
      <Screen scrollable>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 30, fontWeight: "800" }}>Partner Queue</Text>
          <Text style={{ fontSize: 14, color: "#52606D", marginTop: 8 }}>
            Partner application queue placeholder.
          </Text>
        </View>
      </Screen>
    </AuthGuard>
  );
}
