import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../context/AuthContext";
import { ComparisonProvider } from "../context/ComparisonContext";
import { TextSizeProvider } from "../context/TextSizeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TextSizeProvider>
          <ComparisonProvider>
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
          </ComparisonProvider>
        </TextSizeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
