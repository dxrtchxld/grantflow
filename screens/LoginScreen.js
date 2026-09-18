// screens/LoginScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { auth } from "../firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    // Safely check Apple Authentication availability without crashing in Expo Go
    let isMounted = true;
    if (Platform.OS === "ios" && AppleAuthentication && AppleAuthentication.isAvailableAsync) {
      AppleAuthentication.isAvailableAsync()
        .then((available) => {
          if (isMounted) setIsAppleAvailable(available);
        })
        .catch(() => {
          if (isMounted) setIsAppleAvailable(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Information", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged in App.js navigates automatically
    } catch (error) {
      let msg = "Could not sign in. Please check your credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        msg = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      Alert.alert("Sign In Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      "Google Sign-In",
      "Google OAuth credentials need to be configured in your Firebase console. In the meantime, you can explore all features using Guest Demo Mode or Email Sign In.",
      [
        { text: "Enter Guest Mode", onPress: () => navigation.navigate("BusinessType") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleAppleLogin = async () => {
    if (!isAppleAvailable) {
      Alert.alert(
        "Apple Sign-In",
        "Apple Sign-In requires a standalone iOS build. Please use Guest Demo Mode or Email Sign In while running in Expo Go.",
        [
          { text: "Enter Guest Mode", onPress: () => navigation.navigate("BusinessType") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    setIsLoading(true);
    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (appleCredential.identityToken) {
        Alert.alert("Apple Sign-In", "Apple account connected.");
      }
    } catch (error) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Authentication", "Could not complete Apple sign-in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>GrantFlow</Text>
            <Text style={styles.subtitle}>
              Start your business & secure grant funding instantly.
            </Text>
          </View>

          {/* Guest Demo Mode Card - Prominent at the top for easy access */}
          <View style={styles.guestCard}>
            <Text style={styles.guestCardTitle}>Previewing in Expo Go?</Text>
            <Text style={styles.guestCardSubtitle}>
              Jump straight into the app with full access to grant searches, business formation, AI chat, and compliance tools.
            </Text>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => navigation.navigate("BusinessType")}
            >
              <Text style={styles.guestButtonText}>Enter as Guest (Demo Mode) →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#7f8c8d"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#7f8c8d"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account? <Text style={styles.registerLinkBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Sign-In */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {isAppleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1A1A2E" },
  scrollContainer: { padding: 24, paddingBottom: 40, justifyContent: "center" },
  headerContainer: { marginTop: 20, marginBottom: 24, alignItems: "center" },
  logoText: { fontSize: 38, fontWeight: "bold", color: "#E2B96F", letterSpacing: 1 },
  subtitle: { fontSize: 15, color: "#A0A0B0", textAlign: "center", marginTop: 8, paddingHorizontal: 16 },

  guestCard: {
    backgroundColor: "#22223B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2B96F44",
  },
  guestCardTitle: { fontSize: 17, fontWeight: "700", color: "#E2B96F", marginBottom: 6 },
  guestCardSubtitle: { fontSize: 13, color: "#C0C0D0", lineHeight: 18, marginBottom: 16 },
  guestButton: {
    backgroundColor: "#E2B96F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  guestButtonText: { color: "#1A1A2E", fontSize: 16, fontWeight: "bold" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#33334D" },
  dividerText: { marginHorizontal: 12, color: "#77778A", fontSize: 13 },

  formContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#C0C0D0", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#22223B",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#33334D",
  },
  primaryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  registerLink: { marginTop: 14, alignItems: "center" },
  registerLinkText: { color: "#A0A0B0", fontSize: 14 },
  registerLinkBold: { color: "#E2B96F", fontWeight: "bold" },

  socialContainer: { gap: 12 },
  socialButton: {
    backgroundColor: "#2A2A40",
    borderWidth: 1,
    borderColor: "#444460",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  socialButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  appleButton: { width: "100%", height: 50 },
});
