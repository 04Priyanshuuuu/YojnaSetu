import React, { useMemo, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppDrawer } from "../components/navigation/AppDrawer";
import { DrawerTrigger } from "../components/navigation/DrawerTrigger";
import { AuthProvider } from "../context/AuthContext";
import { ComparisonProvider } from "../context/ComparisonContext";

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <View style={styles.root}>
      <View pointerEvents="box-none" style={styles.stackWrapper}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: "#0E766E",
            },
            headerTintColor: "#FFFFFF",
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

      <DrawerTrigger onOpen={() => setDrawerOpen(true)} />

      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      />
    </View>
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
