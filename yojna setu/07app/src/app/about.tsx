import React from "react";
import { View, Text } from "react-native";
import Screen from "../components/Screen";

export default function AboutScreen() {
  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "800" }}>About YojnaSetu</Text>
        <Text style={{ fontSize: 14, color: "#52606D", marginTop: 8 }}>
          About the YojnaSetu mission placeholder.
        </Text>
      </View>
    </Screen>
  );
}
