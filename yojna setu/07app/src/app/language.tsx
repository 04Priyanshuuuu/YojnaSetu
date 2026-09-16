import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import i18n, { SUPPORTED_LANGUAGES } from "../i18n";
import AppHeader from "../components/AppHeader";

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AppHeader
        title={t("language", "Language")}
        subtitle={t(
          "language.chooseYourPreferredLanguage",
          "Choose your preferred language",
        )}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.currentCard}>
          <View style={styles.iconBadge}>
            <Ionicons name="language-outline" size={20} color="#091928" />
          </View>

          <View style={styles.currentTextWrap}>
            <Text style={styles.labelText}>
              {t("language.currentLanguage", "Current language")}
            </Text>
            <Text style={styles.currentLanguageText}>
              {currentLanguage.nativeName} · {currentLanguage.name}
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {SUPPORTED_LANGUAGES.map((language) => {
            const isSelected = language.code === i18n.language;

            return (
              <Pressable
                key={language.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => i18n.changeLanguage(language.code)}
                style={({ pressed }) => [
                  styles.languageRow,
                  isSelected && styles.languageRowSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.nativeName}</Text>
                  <Text style={styles.languageMeta}>{language.name}</Text>
                </View>

                <View
                  style={[
                    styles.selectionCircle,
                    isSelected && styles.selectionCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.selectionDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  screenTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    color: "#091928",
  },
  screenSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#475569",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  currentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#B9E92F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  currentTextWrap: {
    flex: 1,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#475569",
    marginBottom: 4,
  },
  currentLanguageText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: "#091928",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  languageRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  languageRowSelected: {
    backgroundColor: "#F8FAEC",
  },
  languageInfo: {
    flex: 1,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#091928",
  },
  languageMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },
  selectionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  selectionCircleSelected: {
    borderColor: "#091928",
    backgroundColor: "#091928",
  },
  selectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B9E92F",
  },
  pressed: {
    opacity: 0.82,
  },
});
