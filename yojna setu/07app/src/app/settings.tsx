import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";

type SettingRow = {
  title: string;
  description?: string;
  route?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress?: () => void;
  accent?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, logout, role } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const accountRows: SettingRow[] = [
    {
      title: t("settings.myProfile", "My Profile"),
      description: t("settings.myProfileDesc", "View your citizen profile"),
      route: "/(tabs)/profile",
      icon: "person-outline",
      color: "#091928",
    },
  ];

  const preferenceRows: SettingRow[] = [
    {
      title: t("settings.language", "Language"),
      description: t("settings.languageDesc", "Choose your preferred language"),
      route: "/language",
      icon: "language-outline",
      color: "#0F766E",
    },
    {
      title: t("settings.notifications", "Notifications"),
      description: t("settings.notificationsDesc", "Review your updates"),
      route: "/notifications",
      icon: "notifications-outline",
      color: "#B45309",
    },
  ];

  const informationRows: SettingRow[] = [
    {
      title: t("settings.resources", "Resources"),
      description: t(
        "settings.resourcesDesc",
        "Guidance and official references",
      ),
      route: "/resources",
      icon: "library-outline",
      color: "#2563EB",
    },
    {
      title: t("settings.faq", "FAQ"),
      description: t("settings.faqDesc", "Answers to common questions"),
      route: "/faq",
      icon: "help-circle-outline",
      color: "#7C3AED",
    },
    {
      title: t("settings.about", "About YojnaSetu"),
      description: t("settings.aboutDesc", "About the platform and mission"),
      route: "/about",
      icon: "information-circle-outline",
      color: "#861823",
    },
  ];

  const renderSection = (title: string, rows: SettingRow[]) => (
    <View key={title} style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((row) => (
        <Pressable
          key={row.title}
          accessibilityRole="button"
          onPress={() => {
            if (row.onPress) {
              row.onPress();
              return;
            }
            if (row.route) {
              router.push(row.route as any);
            }
          }}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${row.color ?? "#E2E8F0"}18` },
            ]}
          >
            <Ionicons
              name={row.icon}
              size={20}
              color={row.color ?? "#091928"}
            />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            {row.description ? (
              <Text style={styles.rowDescription}>{row.description}</Text>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("settings.title", "Settings")}
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isAuthenticated &&
          renderSection(t("settings.account", "Account"), accountRows)}

        {renderSection(
          t("settings.preferences", "Preferences"),
          preferenceRows,
        )}

        {renderSection(
          t("settings.appAndInformation", "App & Information"),
          informationRows,
        )}

        {role === "SYSTEM_ADMIN" &&
          renderSection(t("settings.admin", "Admin"), [
            {
              title: t("settings.adminControlCenter", "Admin Control Center"),
              description: t(
                "settings.adminDesc",
                "Manage platform operations",
              ),
              route: "/admin",
              icon: "shield-checkmark-outline",
              color: "#861823",
            },
          ])}

        {isAuthenticated && (
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.signOutText}>
              {t("settings.signOut", "Sign Out")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    color: "#091928",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
    letterSpacing: 0.9,
    color: "#475569",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#091928",
  },
  rowDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },
  signOutButton: {
    backgroundColor: "#861823",
    borderRadius: 16,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  signOutText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.82,
  },
});
