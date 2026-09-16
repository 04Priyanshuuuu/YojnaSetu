import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DrawerTriggerProps = {
  onOpen: () => void;
};

export function DrawerTrigger({ onOpen }: DrawerTriggerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open navigation drawer"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.button,
        { top: Math.max(insets.top + 10, 18) },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="menu" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#861823",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.82,
  },
});

export default DrawerTrigger;
