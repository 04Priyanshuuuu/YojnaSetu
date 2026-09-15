import React from "react";
import { View, Text } from "react-native";
import Screen from "../components/Screen";

export default function UnauthorizedScreen() {
  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "800" }}>Unauthorized</Text>
        <Text style={{ fontSize: 14, color: "#52606D", marginTop: 8 }}>
          You do not have permission to access this area.
        </Text>
      </View>
    </Screen>
  );
}
