import React, { useMemo, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppDrawer } from "../components/navigation/AppDrawer";
import AppHeader from "../components/AppHeader";
import { AuthProvider } from "../context/AuthContext";
import { ComparisonProvider } from "../context/ComparisonContext";
import { NavigationProvider } from "../context/NavigationContext";

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const edgeSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const fromLeftEdge = gestureState.x0 < 28;
          const horizontalIntent =
            Math.abs(gestureState.dx) > 10 && gestureState.dx > 0;

          return !drawerOpen && fromLeftEdge && horizontalIntent;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!drawerOpen && gestureState.x0 < 28 && gestureState.dx > 45) {
            setDrawerOpen(true);
          }
        },
      }),
    [drawerOpen],
  );

  return (
    <NavigationProvider openDrawer={() => setDrawerOpen(true)}>
      <View style={styles.root}>
        {!isTabRoute(pathname) &&
          pathname !== "/" &&
          !hasLocalHeader(pathname) && (
            <AppHeader
              title={
                pathname.includes("/auth/")
                  ? pathname.includes("register")
                    ? "Register"
                    : "Login"
                  : getRouteTitle(pathname)
              }
              showBack={isDetailRoute(pathname)}
              safeAreaTop
            />
          )}

        <View pointerEvents="box-none" style={styles.stackWrapper}>
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="schemes/[id]"
              options={{
                title: "Scheme Detail",
              }}
            />

            <Stack.Screen
              name="saved"
              options={{
                title: "Saved Schemes",
              }}
            />

            <Stack.Screen
              name="applications"
              options={{
                title: "Applications",
              }}
            />

            <Stack.Screen
              name="applications/[id]"
              options={{
                title: "Application Detail",
              }}
            />

            <Stack.Screen
              name="notifications"
              options={{
                title: "Notifications",
              }}
            />

            <Stack.Screen
              name="compare"
              options={{
                title: "Compare Schemes",
              }}
            />

            <Stack.Screen
              name="partners"
              options={{
                title: "Channel Partners",
              }}
            />

            <Stack.Screen
              name="partners/[id]"
              options={{
                title: "Partner Detail",
              }}
            />

            <Stack.Screen
              name="copilot"
              options={{
                title: "AI Copilot",
              }}
            />

            <Stack.Screen
              name="resources"
              options={{
                title: "Resources",
              }}
            />

            <Stack.Screen
              name="about"
              options={{
                title: "About",
              }}
            />

            <Stack.Screen
              name="faq"
              options={{
                title: "FAQ",
              }}
            />

            <Stack.Screen
              name="settings"
              options={{
                title: "Settings",
              }}
            />

            <Stack.Screen
              name="language"
              options={{
                title: "Language",
              }}
            />

            <Stack.Screen
              name="unauthorized"
              options={{
                title: "Unauthorized",
              }}
            />

            <Stack.Screen
              name="partner/applications/[id]"
              options={{
                title: "Partner Application Detail",
              }}
            />

            <Stack.Screen
              name="admin"
              options={{
                title: "Admin Dashboard",
              }}
            />
          </Stack>
        </View>

        <View
          pointerEvents="box-none"
          style={styles.edgeGestureArea}
          {...edgeSwipeResponder.panHandlers}
        />

        <AppDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => setDrawerOpen(true)}
        />
      </View>
    </NavigationProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ComparisonProvider>
          <AppShell />
        </ComparisonProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  stackWrapper: {
    flex: 1,
  },
  edgeGestureArea: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 26,
    zIndex: 20,
  },
});

function isDetailRoute(pathname: string) {
  return /\/(schemes|applications|partners|partner\/applications)\/[^/]+/.test(
    pathname,
  );
}

function isTabRoute(pathname: string) {
  return ["/home", "/schemes", "/match", "/calculator", "/profile"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function hasLocalHeader(pathname: string) {
  return (
    pathname === "/settings" ||
    pathname === "/language" ||
    pathname === "/applications" ||
    pathname.startsWith("/applications/")
  );
}

function getRouteTitle(pathname: string) {
  const titles: Record<string, string> = {
    "/faq": "FAQ",
    "/settings": "Settings",
    "/language": "Language",
    "/resources": "Resources",
    "/about": "About",
    "/notifications": "Notifications",
    "/compare": "Compare Schemes",
    "/applications": "Applications",
    "/partners": "Channel Partners",
    "/copilot": "AI Copilot",
    "/admin": "Admin Dashboard",
    "/unauthorized": "Unauthorized",
  };

  if (pathname.startsWith("/schemes/")) return "Scheme Detail";
  if (pathname.startsWith("/partners/")) return "Partner Detail";
  if (pathname.startsWith("/applications/")) return "Application Detail";
  return titles[pathname] ?? "YojnaSetu";
}
