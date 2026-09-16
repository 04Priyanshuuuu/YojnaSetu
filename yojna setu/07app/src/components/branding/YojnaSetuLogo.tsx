import React from "react";
import { Image, StyleProp, View, ViewStyle } from "react-native";

interface YojnaSetuLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function YojnaSetuLogo({
  size = 40,
  style,
  accessibilityLabel = "YojnaSetu logo",
}: YojnaSetuLogoProps) {
  const cornerRadius = Math.min(22, Math.max(10, size * 0.25));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Image
        source={require("../../../assets/images/logo.png")}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}
