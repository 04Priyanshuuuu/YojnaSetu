import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../components/Screen";
import theme from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import YojnaSetuLogo from "../../components/branding/YojnaSetuLogo";

export default function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setErrorMsg("Please provide both email/phone and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const loginResponse = await login({
        identifier: username.trim(),
        password,
      });

      const userRole = loginResponse?.user?.role;

      if (userRole === "SYSTEM_ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      let detail = "Invalid email/phone or password.";

      if (!error?.response) {
        detail = "Unable to connect to YojnaSetu server. Please try again.";
      } else if (error.response.status === 401) {
        detail = "Invalid email/phone or password.";
      } else if (error.response.status === 403) {
        detail = "User account is deactivated.";
      } else if (typeof error.response?.data?.detail === "string") {
        detail = error.response.data.detail;
      } else if (Array.isArray(error.response?.data?.detail)) {
        detail = error.response.data.detail
          .map((item: any) => item?.msg || item?.message)
          .filter(Boolean)
          .join(", ");
      } else if (error?.userFriendlyMessage) {
        detail = error.userFriendlyMessage;
      }

      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scrollable>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Brand */}
            <View style={styles.brandSection}>
              <YojnaSetuLogo size={112} style={styles.logo} />

              <Text style={styles.brandName}>YojnaSetu</Text>

              <Text style={styles.subtitle}>
                Your gateway to government schemes
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Welcome Back</Text>

              <Text style={styles.description}>
                Sign in to continue to YojnaSetu
              </Text>

              {/* Error */}
              {errorMsg && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={21}
                    color="#B42318"
                  />

                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Email / Phone */}
              <View style={styles.field}>
                <Text style={styles.label}>Email / Phone</Text>

                <View
                  style={[
                    styles.inputWrapper,
                    errorMsg ? styles.inputWrapperNormal : null,
                  ]}
                >
                  <Ionicons name="person-outline" size={20} color="#667085" />

                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter email or phone"
                    placeholderTextColor="#98A2B3"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    style={styles.input}
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#667085"
                  />

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#98A2B3"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    style={styles.input}
                    editable={!isSubmitting}
                  />

                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={21}
                      color="#667085"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Login */}
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !isSubmitting && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={21} color="#FFFFFF" />

                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.divider} />

                <Text style={styles.dividerText}>OR</Text>

                <View style={styles.divider} />
              </View>

              {/* Google placeholder */}
              <Pressable
                disabled
                style={styles.googleButton}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleG}>G</Text>
                </View>

                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </Pressable>

              <Text style={styles.googleNote}>
                Google sign-in will be enabled when native Google authentication
                is configured.
              </Text>

              {/* Register */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Don't have an account?</Text>

                <Link href="/(auth)/register" asChild>
                  <Pressable disabled={isSubmitting}>
                    <Text style={styles.registerLink}>Create an account</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              Secure access to government welfare schemes
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: 28,
  },

  container: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  logo: {
    marginBottom: 12,
  },

  brandName: {
    fontSize: 27,
    fontWeight: "800",
    color: "#861823",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 5,
    color: "#667085",
    fontSize: 14,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#EAECF0",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  title: {
    color: theme.colors?.text || "#101828",
    fontSize: 25,
    fontWeight: "800",
  },

  description: {
    color: theme.colors?.textSoft || "#667085",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 22,
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FDA29B",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },

  errorText: {
    flex: 1,
    color: "#B42318",
    fontSize: 13,
    lineHeight: 19,
  },

  field: {
    marginBottom: 17,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  inputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },

  inputWrapperNormal: {
    borderColor: "#D0D5DD",
  },

  input: {
    flex: 1,
    color: "#101828",
    fontSize: 15,
    minHeight: 50,
    paddingVertical: 0,
  },

  loginButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: theme.colors?.primary || "#861823",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 4,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EAECF0",
  },

  dividerText: {
    color: "#98A2B3",
    fontSize: 12,
    fontWeight: "700",
    marginHorizontal: 12,
  },

  googleButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    opacity: 0.6,
  },

  googleIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  googleG: {
    color: "#4285F4",
    fontSize: 17,
    fontWeight: "800",
  },

  googleButtonText: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "700",
  },

  googleNote: {
    color: "#98A2B3",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },

  registerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 5,
  },

  registerText: {
    color: "#667085",
    fontSize: 14,
  },

  registerLink: {
    color: theme.colors?.primary || "#861823",
    fontSize: 14,
    fontWeight: "800",
  },

  footerText: {
    color: "#98A2B3",
    fontSize: 12,
    textAlign: "center",
    marginTop: 22,
    marginBottom: 8,
  },
});
