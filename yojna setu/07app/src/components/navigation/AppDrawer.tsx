import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import YojnaSetuLogo from "../branding/YojnaSetuLogo";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(Math.max(SCREEN_WIDTH * 0.82, 280), 380);

const normalizePath = (value: string) => value.replace(/\/+$/, "");

const isRouteActive = (target: string, current: string) => {
  const normalizedTarget = normalizePath(target);
  const normalizedCurrent = normalizePath(current);

  if (normalizedCurrent === normalizedTarget) {
    return true;
  }

  if (
    normalizedTarget === "/(tabs)/schemes" &&
    normalizedCurrent.startsWith("/schemes")
  ) {
    return true;
  }

  if (
    normalizedTarget === "/(tabs)/home" &&
    (normalizedCurrent === "/" || normalizedCurrent === "/(tabs)/home")
  ) {
    return true;
  }

  if (normalizedTarget === "/saved" && normalizedCurrent.startsWith("/saved")) {
    return true;
  }

  if (
    normalizedTarget === "/applications" &&
    normalizedCurrent.startsWith("/applications")
  ) {
    return true;
  }

  if (
    normalizedTarget === "/balance" &&
    normalizedCurrent.startsWith("/balance")
  ) {
    return true;
  }

  if (
    normalizedTarget === "/partners" &&
    normalizedCurrent.startsWith("/partners")
  ) {
    return true;
  }

  return false;
};

type AppDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function AppDrawer({ visible, onClose, onOpen }: AppDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isAuthenticated, user, role, logout } = useAuth();

  const panelTranslate = useRef(
    new Animated.Value(visible ? 0 : -DRAWER_WIDTH),
  ).current;

  useEffect(() => {
    Animated.timing(panelTranslate, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [panelTranslate, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const onHardwareBack = () => {
      onClose();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );

    return () => subscription.remove();
  }, [onClose, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isEdgeSwipe = gestureState.x0 < 28;
          const horizontalGesture = Math.abs(gestureState.dx) > 10;

          if (visible) {
            return horizontalGesture;
          }

          return isEdgeSwipe && gestureState.dx > 0 && horizontalGesture;
        },
        onPanResponderMove: (_, gestureState) => {
          if (visible) {
            const nextPosition = Math.min(
              0,
              Math.max(-DRAWER_WIDTH, gestureState.dx),
            );
            panelTranslate.setValue(nextPosition);
            return;
          }

          if (gestureState.x0 <= 28 && gestureState.dx > 0) {
            const nextPosition = Math.min(0, gestureState.dx - DRAWER_WIDTH);
            panelTranslate.setValue(nextPosition);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (visible) {
            if (gestureState.dx < -70) {
              onClose();
            } else {
              Animated.spring(panelTranslate, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 0,
              }).start();
            }
            return;
          }

          if (gestureState.dx > 70) {
            onOpen();
          } else {
            Animated.spring(panelTranslate, {
              toValue: -DRAWER_WIDTH,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
      }),
    [onClose, onOpen, panelTranslate, visible],
  );

  const navigate = (target: string) => {
    onClose();
    router.push(target as any);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onClose();
      router.replace("/(auth)/login");
    }
  };

  const publicItems = [
    {
      label: t("nav.home", "Home"),
      route: "/(tabs)/home",
      icon: "home-outline",
    },
    {
      label: t("nav.exploreSchemes", "Explore Schemes"),
      route: "/(tabs)/schemes",
      icon: "search-outline",
    },
    {
      label: t("nav.smartMatching", "Smart Matching"),
      route: "/(tabs)/match",
      icon: "sparkles-outline",
    },
    {
      label: t("nav.financialCalculator", "Financial Calculator"),
      route: "/(tabs)/calculator",
      icon: "calculator-outline",
    },
    {
      label: t("nav.findNearbyPartner", "Find Nearby Partner"),
      route: "/partners",
      icon: "location-outline",
    },
  ];

  const citizenItems = [
    {
      label: t("nav.myProfile", "My Profile"),
      route: "/(tabs)/profile",
      icon: "person-outline",
    },
    {
      label: t("nav.citizenDashboard", "Citizen Dashboard"),
      route: "/(tabs)/home",
      icon: "grid-outline",
    },
    {
      label: t("nav.applicationsGuidance", "Applications & Guidance"),
      route: "/applications",
      icon: "briefcase-outline",
    },
    {
      label: t("nav.savedSchemes", "Saved Schemes"),
      route: "/saved",
      icon: "bookmark-outline",
    },
    {
      label: t("nav.notifications", "Notifications"),
      route: "/notifications",
      icon: "notifications-outline",
    },
    {
      label: t("nav.compareSchemes", "Compare Schemes"),
      route: "/compare",
      icon: "bar-chart-outline",
    },
  ];

  const infoItems = [
    {
      label: t("nav.resources", "Resources & Guidelines"),
      route: "/resources",
      icon: "library-outline",
    },
    {
      label: t("nav.faqs", "FAQs"),
      route: "/faq",
      icon: "help-circle-outline",
    },
    {
      label: t("nav.about", "About YojnaSetu"),
      route: "/about",
      icon: "information-circle-outline",
    },
    {
      label: t("nav.settings", "Settings"),
      route: "/settings",
      icon: "settings-outline",
    },
    {
      label: t("nav.language", "Language"),
      route: "/language",
      icon: "language-outline",
    },
  ];

  const userName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    user?.phone ||
    "Citizen";
  const userEmail = user?.email || user?.phone || "User";

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close navigation drawer"
        style={styles.backdrop}
        onPress={onClose}
      />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateX: panelTranslate }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <YojnaSetuLogo size={52} />
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandText}>YojnaSetu</Text>
              <Text style={styles.brandSubtext}>
                Government Scheme Discovery Platform
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close drawer"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          bounces={false}
        >
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Public</Text>
            {publicItems.map((item) => {
              const active = isRouteActive(item.route, pathname);

              return (
                <Pressable
                  key={item.route}
                  accessibilityRole="button"
                  onPress={() => navigate(item.route)}
                  style={({ pressed }) => [
                    styles.itemRow,
                    active && styles.itemActive,
                    pressed && styles.pressedButton,
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={active ? "#B9E92F" : "#E2E8F0"}
                  />
                  <Text
                    style={[styles.itemLabel, active && styles.itemLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!isAuthenticated && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {t("nav.accountSection", "Account")}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => navigate("/(auth)/login")}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed && styles.pressedButton,
                ]}
              >
                <Ionicons name="log-in-outline" size={18} color="#091928" />
                <Text style={styles.primaryActionText}>
                  {t("nav.logIn", "Log in")}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => navigate("/(auth)/register")}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressedButton,
                ]}
              >
                <Ionicons name="person-add-outline" size={18} color="#F8FAFC" />
                <Text style={styles.secondaryActionText}>
                  {t("nav.createAccount", "Create account")}
                </Text>
              </Pressable>
            </View>
          )}

          {isAuthenticated && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>
                {t("nav.publicSection", "Public")}
              </Text>

              <View style={styles.userCard}>
                <View style={styles.avatarShell}>
                  <Text style={styles.avatarText}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userMeta}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userEmail}>{userEmail}</Text>
                  <Text style={styles.userRole}>{role || "BENEFICIARY"}</Text>
                </View>
              </View>

              {role === "BENEFICIARY" &&
                citizenItems.map((item) => {
                  const active = isRouteActive(item.route, pathname);

                  return (
                    <Pressable
                      key={item.route}
                      accessibilityRole="button"
                      onPress={() => navigate(item.route)}
                      style={({ pressed }) => [
                        styles.itemRow,
                        active && styles.itemActive,
                        pressed && styles.pressedButton,
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={active ? "#B9E92F" : "#E2E8F0"}
                      />
                      <Text
                        style={[
                          styles.itemLabel,
                          active && styles.itemLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}

              {role === "SYSTEM_ADMIN" && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigate("/admin")}
                  style={({ pressed }) => [
                    styles.itemRow,
                    isRouteActive("/admin", pathname) && styles.itemActive,
                    pressed && styles.pressedButton,
                  ]}
                >
                  <Ionicons
                    name="shield-outline"
                    size={20}
                    color={
                      isRouteActive("/admin", pathname) ? "#B9E92F" : "#E2E8F0"
                    }
                  />
                  <Text
                    style={[
                      styles.itemLabel,
                      isRouteActive("/admin", pathname) &&
                        styles.itemLabelActive,
                    ]}
                  >
                    Admin Control Center
                  </Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <Ionicons name="log-out-outline" size={18} color="#F8FAFC" />
                <Text style={styles.logoutText}>
                  {t("nav.signOut", "Sign Out")}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>
              {t("nav.informationHelp", "Information & Help")}
            </Text>
            {infoItems.map((item) => {
              const active = isRouteActive(item.route, pathname);

              return (
                <Pressable
                  key={item.route}
                  accessibilityRole="button"
                  onPress={() => navigate(item.route)}
                  style={({ pressed }) => [
                    styles.itemRow,
                    active && styles.itemActive,
                    pressed && styles.pressedButton,
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={active ? "#B9E92F" : "#E2E8F0"}
                  />
                  <Text
                    style={[styles.itemLabel, active && styles.itemLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 25,
    flexDirection: "row",
    pointerEvents: "box-none",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.56)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#861823",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 0 },
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  logoWrap: {
    width: 52,
    height: 52,
  },
  brandTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 12,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginVertical: 2,
  },
  itemActive: {
    backgroundColor: "rgba(185, 233, 47, 0.12)",
  },
  itemLabel: {
    fontSize: 15,
    color: "#F8FAFC",
    fontWeight: "600",
    marginLeft: 12,
    flexShrink: 1,
  },
  itemLabelActive: {
    color: "#B9E92F",
  },
  pressedButton: {
    opacity: 0.8,
  },
  primaryAction: {
    backgroundColor: "#B9E92F",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  primaryActionText: {
    color: "#091928",
    fontWeight: "800",
    fontSize: 15,
    marginLeft: 8,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#F8FAFC",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  avatarShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#B9E92F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#091928",
    fontSize: 18,
    fontWeight: "800",
  },
  userMeta: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
  },
  userEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  userRole: {
    color: "#B9E92F",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 3,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#F8FAFC",
    fontWeight: "700",
    marginLeft: 8,
  },
});

export default AppDrawer;
