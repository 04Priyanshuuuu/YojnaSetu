import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthButtonProps {
  mode?: "login" | "register";
  onSuccess?: () => void;
  onError?: (errorMsg: string) => void;
  disabled?: boolean;
}

type GoogleAuthConfig = {
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
};

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";

const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || "";

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "";

const GOOGLE_CONFIG: GoogleAuthConfig = {
  webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
  iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
};

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = "login",
  onSuccess,
  onError,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const { loginWithGoogle } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);

  const redirectUri = useMemo(() => {
    return AuthSession.makeRedirectUri({
      scheme: "yojnasetu",
      path: "oauth",
    });
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CONFIG.webClientId || "",
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      extraParams: {
        prompt: "select_account",
      },
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    },
  );

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === "cancel") {
      return;
    }

    if (response.type === "dismiss") {
      return;
    }

    if (response.type !== "success") {
      const message = t(
        "auth.googleAuthFailed",
        "Google authentication failed.",
      );

      onError?.(message);
      setIsProcessing(false);
      return;
    }

    const idToken =
      response.params?.id_token ?? response.authentication?.idToken ?? null;

    if (!idToken) {
      const message = t(
        "auth.googleAuthFailed",
        "Google authentication failed to return a credential.",
      );

      onError?.(message);
      setIsProcessing(false);
      return;
    }

    const authenticate = async () => {
      try {
        setIsProcessing(true);

        await loginWithGoogle(idToken, i18n.language || "en");

        onSuccess?.();
      } catch (error: any) {
        let detail = t(
          "auth.googleAuthError",
          "Google authentication failed. Please try again.",
        );

        const responseDetail = error?.response?.data?.detail;

        if (responseDetail) {
          detail =
            typeof responseDetail === "string"
              ? responseDetail
              : JSON.stringify(responseDetail);
        } else if (error?.message) {
          detail = error.message;
        }

        onError?.(detail);
      } finally {
        setIsProcessing(false);
      }
    };

    void authenticate();
  }, [response, loginWithGoogle, i18n.language, onSuccess, onError, t]);

  const handlePress = async () => {
    if (disabled || isProcessing) {
      return;
    }

    if (!request) {
      const message = t(
        "auth.googleSdkLoading",
        "Google Services are loading. Please try again in a moment.",
      );

      onError?.(message);

      Alert.alert(t("auth.google", "Google"), message);

      return;
    }

    setIsProcessing(true);

    try {
      await promptAsync();
    } catch (error: any) {
      setIsProcessing(false);

      const message =
        error?.message ||
        t(
          "auth.googleAuthError",
          "Google authentication failed. Please try again.",
        );

      onError?.(message);
    }
  };

  const buttonText =
    mode === "register"
      ? t("auth.continueWithGoogle", "Continue with Google")
      : t("auth.signInWithGoogle", "Sign in with Google");

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonText}
        accessibilityState={{
          disabled: disabled || isProcessing,
          busy: isProcessing,
        }}
        disabled={disabled || isProcessing}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          pressed && !isProcessing && styles.buttonPressed,
          (disabled || isProcessing) && styles.buttonDisabled,
        ]}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator
              size="small"
              color="#2563EB"
              style={styles.spinner}
            />

            <Text style={styles.buttonText}>
              {t("auth.verifyingGoogle", "Verifying with Google Identity...")}
            </Text>
          </>
        ) : (
          <>
            <View accessible={false} style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>

            <Text style={styles.buttonText}>{buttonText}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  buttonPressed: {
    backgroundColor: "#F8FAFC",
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  googleIconText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "700",
    color: "#4285F4",
  },

  buttonText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },

  spinner: {
    marginRight: 12,
  },
});

export default GoogleAuthButton;
