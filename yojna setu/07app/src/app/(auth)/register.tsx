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

export default function RegisterScreen() {
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleSubmit = async () => {
    if (!email.trim() && !phone.trim()) {
      setErrorMsg(
        "Please provide either an email address or phone number."
      );
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg(
        "Password must be at least 8 characters long."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await register({
        email: email.trim()
          ? email.trim()
          : undefined,
        phone: phone.trim()
          ? phone.trim()
          : undefined,
        password,
      });

      // The mobile AuthContext automatically logs
      // the newly registered user in.
      router.replace("/(tabs)");
    } catch (error: any) {
      let detail =
        "Registration failed. User with this email/phone may already exist.";

      if (!error?.response) {
        detail =
          "Unable to connect to YojnaSetu server. Please try again.";
      } else if (
        typeof error.response?.data?.detail ===
        "string"
      ) {
        detail =
          error.response.data.detail;
      } else if (
        Array.isArray(
          error.response?.data?.detail
        )
      ) {
        detail =
          error.response.data.detail
            .map(
              (item: any) =>
                item?.msg || item?.message
            )
            .filter(Boolean)
            .join(", ");
      } else if (
        error?.userFriendlyMessage
      ) {
        detail =
          error.userFriendlyMessage;
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
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Brand */}
            <View style={styles.brandSection}>
              <View style={styles.logo}>
                <Ionicons
                  name="git-network"
                  size={30}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.brandName}>
                YojnaSetu
              </Text>

              <Text style={styles.subtitle}>
                Create your account to access
                government schemes
              </Text>
            </View>

            {/* Registration Card */}
            <View style={styles.card}>
              <Text style={styles.title}>
                Create Account
              </Text>

              <Text style={styles.description}>
                Register to get started with
                YojnaSetu
              </Text>

              {/* Error */}
              {errorMsg && (
                <View
                  style={styles.errorContainer}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={21}
                    color="#B42318"
                  />

                  <Text
                    style={styles.errorText}
                  >
                    {errorMsg}
                  </Text>
                </View>
              )}

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Email Address
                </Text>

                <View
                  style={styles.inputWrapper}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#667085"
                  />

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
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

              {/* Phone */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Phone Number
                </Text>

                <View
                  style={styles.inputWrapper}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#667085"
                  />

                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="9876543210"
                    placeholderTextColor="#98A2B3"
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    style={styles.input}
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Helper text */}
              <Text style={styles.helperText}>
                Provide at least one: email or
                phone number.
              </Text>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Password
                </Text>

                <View
                  style={styles.inputWrapper}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#667085"
                  />

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#98A2B3"
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={
                      handleSubmit
                    }
                    style={styles.input}
                    editable={!isSubmitting}
                  />

                  <Pressable
                    onPress={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={21}
                      color="#667085"
                    />
                  </Pressable>
                </View>

                <Text style={styles.passwordHint}>
                  Password must be at least 8
                  characters long.
                </Text>
              </View>

              {/* Register Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed &&
                    !isSubmitting &&
                    styles.buttonPressed,
                  isSubmitting &&
                    styles.buttonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create account"
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="person-add-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.registerButtonText
                      }
                    >
                      Create Account
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View
                  style={styles.divider}
                />

                <Text
                  style={styles.dividerText}
                >
                  OR
                </Text>

                <View
                  style={styles.divider}
                />
              </View>

              {/* Google */}
              <Pressable
                disabled
                style={styles.googleButton}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <View
                  style={styles.googleIcon}
                >
                  <Text
                    style={styles.googleG}
                  >
                    G
                  </Text>
                </View>

                <Text
                  style={
                    styles.googleButtonText
                  }
                >
                  Continue with Google
                </Text>
              </Pressable>

              <Text style={styles.googleNote}>
                Google sign-up will be enabled
                when native Google authentication
                is configured.
              </Text>

              {/* Login */}
              <View
                style={styles.loginRow}
              >
                <Text
                  style={styles.loginText}
                >
                  Already have an account?
                </Text>

                <Link
                  href="/(auth)/login"
                  asChild
                >
                  <Pressable
                    disabled={isSubmitting}
                  >
                    <Text
                      style={styles.loginLink}
                    >
                      Sign In
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              Secure registration for YojnaSetu
              users
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
    paddingVertical: 24,
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
    marginBottom: 24,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#0E766E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  brandName: {
    fontSize: 27,
    fontWeight: "800",
    color: "#0E766E",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 5,
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 15,
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
    color:
      theme.colors?.text || "#101828",
    fontSize: 25,
    fontWeight: "800",
  },

  description: {
    color:
      theme.colors?.textSoft || "#667085",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 21,
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
    marginBottom: 15,
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

  input: {
    flex: 1,
    color: "#101828",
    fontSize: 15,
    minHeight: 50,
    paddingVertical: 0,
  },

  helperText: {
    color: "#98A2B3",
    fontSize: 11,
    marginTop: -7,
    marginBottom: 15,
  },

  passwordHint: {
    color: "#98A2B3",
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },

  registerButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor:
      theme.colors?.primary || "#0E766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 6,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 21,
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

  loginRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 23,
    gap: 5,
  },

  loginText: {
    color: "#667085",
    fontSize: 14,
  },

  loginLink: {
    color:
      theme.colors?.primary || "#0E766E",
    fontSize: 14,
    fontWeight: "800",
  },

  footerText: {
    color: "#98A2B3",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
});