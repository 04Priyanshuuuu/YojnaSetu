import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../constants/theme";
import { useNavigation } from "../context/NavigationContext";
import YojnaSetuLogo from "./branding/YojnaSetuLogo";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  rightContent?: React.ReactNode;
  showBack?: boolean;
  safeAreaTop?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "YojnaSetu",
  subtitle,
  showLogo = true,
  rightContent,
  showBack = false,
  safeAreaTop = false,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useNavigation();

  return (
    <View
      style={[
        styles.container,
        safeAreaTop && { paddingTop: insets.top + spacing.sm },
      ]}
    >
      <View style={styles.leftSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showBack ? "Go back" : "Open navigation drawer"}
          onPress={showBack ? router.back : openDrawer}
          style={styles.menuButton}
        >
          <Ionicons
            name={showBack ? "arrow-back" : "menu"}
            size={24}
            color={colors.white}
          />
        </Pressable>

        {showLogo && !showBack && (
          <YojnaSetuLogo size={40} style={styles.logo} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>

          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {rightContent ? (
        <View style={styles.rightSection}>{rightContent}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.maroon,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.maroonDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },

  titleContainer: {
    flexShrink: 1,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 1,
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
  },

  rightSection: {
    marginLeft: 12,
  },
});

export default AppHeader;
