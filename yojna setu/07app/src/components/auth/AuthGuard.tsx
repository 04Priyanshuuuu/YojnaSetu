import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

type AuthGuardProps = {
  children: React.ReactNode;
  roles?: string[];
};

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const hasRole = !roles || (role ? roles.includes(role) : false);

  if (!isAuthenticated || !hasRole) {
    router.replace("/unauthorized");
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Checking access...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
