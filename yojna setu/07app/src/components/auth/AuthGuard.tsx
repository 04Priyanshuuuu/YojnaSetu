import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";

type AuthGuardProps = {
  children: React.ReactNode;
  roles?: string[];
};

export function AuthGuard({
  children,
  roles,
}: AuthGuardProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user, role } = useAuth();
  const pathname = usePathname();

  /*
   * Authentication redirect
   *
   * Equivalent to the web ProtectedRoute:
   * if (!isAuthenticated) {
   *   return <Navigate to="/login" ... />
   * }
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace({
        pathname: "/(auth)/login",
        params: {
          from: pathname,
        },
      });
    }
  }, [isAuthenticated, isLoading, pathname]);

  /*
   * Role authorization redirect
   *
   * Equivalent to the web RoleGate:
   * if (!user || !role || !allowedRoles.includes(role)) {
   *   return <Navigate to="/unauthorized" />
   * }
   */
  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    if (!roles || roles.length === 0) {
      return;
    }

    const hasRole =
      !!user &&
      !!role &&
      roles.includes(role);

    if (!hasRole) {
      router.replace("/unauthorized");
    }
  }, [
    isAuthenticated,
    isLoading,
    role,
    roles,
    user,
  ]);

  /*
   * While AuthContext is restoring/checking the session.
   */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#0284C7"
        />

        <Text style={styles.loadingText}>
          {t(
            "auth.verifyingSecurity",
            "Verifying Session Security..."
          )}
        </Text>
      </View>
    );
  }

  /*
   * Not authenticated.
   *
   * The useEffect above performs the actual redirect.
   * We render a temporary native loading state while
   * Expo Router changes the route.
   */
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color="#0284C7"
        />

        <Text style={styles.loadingText}>
          {t(
            "auth.checkingSession",
            "Checking your session..."
          )}
        </Text>
      </View>
    );
  }

  /*
   * No role restriction.
   *
   * This is equivalent to ProtectedRoute after
   * successful authentication.
   */
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  /*
   * Check whether the authenticated user has one
   * of the roles required by this protected screen.
   */
  const hasRole =
    !!user &&
    !!role &&
    roles.includes(role);

  /*
   * Unauthorized.
   *
   * The useEffect above performs the redirect.
   */
  if (!hasRole) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color="#0284C7"
        />

        <Text style={styles.loadingText}>
          {t(
            "auth.checkingRole",
            "Checking Authorization Role..."
          )}
        </Text>
      </View>
    );
  }

  /*
   * Authentication and authorization successful.
   */
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
  },
});

export default AuthGuard;

