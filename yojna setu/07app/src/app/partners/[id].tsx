import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../components/Screen";

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "800" }}>Partner Detail</Text>
        <Text style={{ fontSize: 16, color: "#52606D", marginTop: 12 }}>
          Partner ID: {id}
        </Text>
      </View>
    </Screen>
  );
}
