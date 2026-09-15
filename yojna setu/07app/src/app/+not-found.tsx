import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Home, Compass } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFound() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* YojnaSetu Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>Y</Text>
            </View>

            <Text style={styles.brandText}>YojnaSetu</Text>
          </View>

          {/* 404 Badge & Error Details */}
          <View style={styles.errorSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>404</Text>
            </View>

            <Text style={styles.title}>
              {t("errors.pageNotFound", "Page Not Found")}
            </Text>

            <Text style={styles.description}>
              {t(
                "errors.pageNotFoundDesc",
                "The page you are looking for does not exist or has been moved.",
              )}
            </Text>
          </View>

          {/* Navigation Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Home Button */}
            <Pressable
              style={({ pressed }) => [
                styles.homeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/")}
            >
              <Home size={16} color="#ffffff" strokeWidth={2.5} />

              <Text style={styles.homeButtonText}>{t("nav.home", "Home")}</Text>
            </Pressable>

            {/* Explore Schemes Button */}
            <Pressable
              style={({ pressed }) => [
                styles.schemesButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/(tabs)/schemes")}
            >
              <Compass size={16} color="#0369a1" strokeWidth={2.5} />

              <Text style={styles.schemesButtonText}>
                {t("nav.schemes", "Explore Schemes")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  /* Branding */

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  brandText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.4,
  },

  /* Error */

  errorSection: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },

  badge: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 2,
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
    maxWidth: 360,
    marginTop: 2,
  },

  /* Buttons */

  buttonsContainer: {
    width: "100%",
    paddingTop: 16,
    gap: 12,
  },

  homeButton: {
    width: "100%",
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },

  homeButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  schemesButton: {
    width: "100%",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  schemesButtonText: {
    color: "#0369a1",
    fontSize: 12,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.7,
  },
});
