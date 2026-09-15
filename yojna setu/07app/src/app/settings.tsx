import React from "react";
import { View, Text } from "react-native";
import Screen from "../components/Screen";

export default function SettingsScreen() {
  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "800" }}>Settings</Text>
        <Text style={{ fontSize: 14, color: "#52606D", marginTop: 8 }}>
          Mobile settings placeholder.
        </Text>
      </View>
    </Screen>
  );
}
