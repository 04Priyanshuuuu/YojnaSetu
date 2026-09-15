import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RefreshCw, ShieldAlert } from "lucide-react-native";
import * as Updates from "expo-updates";

import i18n from "i18next";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "Unhandled React Error Boundary Exception:",
      error,
      errorInfo,
    );
  }

  public handleReload = async () => {
    try {
      /*
       * Native Expo equivalent of:
       * window.location.reload()
       */
      await Updates.reloadAsync();
    } catch (reloadError) {
      /*
       * If a native reload is not available, reset the
       * error boundary state so the application can try
       * rendering the children again.
       */
      console.error("Failed to reload application:", reloadError);

      this.setState({
        hasError: false,
        error: null,
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.screen}>
          <View style={styles.errorCard}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <ShieldAlert size={32} color="#FB7185" strokeWidth={2} />
            </View>

            {/* Heading and Description */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {i18n.t("errors.somethingWentWrong", "Something Went Wrong")}
              </Text>

              <Text style={styles.description}>
                {i18n.t(
                  "errors.unexpectedRenderError",
                  "An unexpected application error occurred while rendering this interface.",
                )}
              </Text>
            </View>

            {/* Error Details */}
            {this.state.error ? (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetails}>
                  {this.state.error.toString()}
                </Text>
              </View>
            ) : null}

            {/* Reload Button */}
            <Pressable
              onPress={this.handleReload}
              accessibilityRole="button"
              accessibilityLabel={i18n.t(
                "errors.reloadApp",
                "Reload Application",
              )}
              style={({ pressed }) => [
                styles.reloadButton,
                pressed && styles.reloadButtonPressed,
              ]}
            >
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2.5} />

              <Text style={styles.reloadButtonText}>
                {i18n.t("errors.reloadApp", "Reload Application")}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  /*
   * Full-screen error state
   */
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  /*
   * Error card
   */
  errorCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  /*
   * Error icon
   */
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(244, 63, 94, 0.20)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.30)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  /*
   * Heading + description
   */
  textContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 8,
  },

  description: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    textAlign: "center",
  },

  /*
   * Error message/details
   */
  errorDetailsContainer: {
    width: "100%",
    maxHeight: 128,
    backgroundColor: "#020617",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    marginBottom: 24,
  },

  errorDetails: {
    color: "#FDA4AF",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "monospace",
  },

  /*
   * Reload button
   */
  reloadButton: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "#0284C7",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  reloadButtonPressed: {
    opacity: 0.8,
  },

  reloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
});

export default ErrorBoundary;
