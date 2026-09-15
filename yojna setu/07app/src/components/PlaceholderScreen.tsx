import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Screen from "./Screen";
import AppButton from "./AppButton";
import theme from "../constants/theme";

type PlaceholderScreenProps = {
  title: string;
  message: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export function PlaceholderScreen({
  title,
  message,
  ctaLabel,
  onPressCta,
}: PlaceholderScreenProps) {
  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {ctaLabel && onPressCta ? (
          <AppButton
            label={ctaLabel}
            onPress={onPressCta}
            variant="primary"
            style={styles.button}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "800",
    marginBottom: theme.spacing.md,
  },
  message: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  button: {
    alignSelf: "flex-start",
  },
});

export default PlaceholderScreen;
