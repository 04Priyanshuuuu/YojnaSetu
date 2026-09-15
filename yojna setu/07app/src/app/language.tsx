import React from "react";
import { View, Text } from "react-native";
import Screen from "../components/Screen";

export default function LanguageScreen() {
  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "800" }}>Language</Text>
        <Text style={{ fontSize: 14, color: "#52606D", marginTop: 8 }}>
          Localization route placeholder.
        </Text>
      </View>
    </Screen>
  );
}
