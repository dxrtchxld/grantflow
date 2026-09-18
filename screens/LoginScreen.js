// screens/LoginScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { auth } from "../firebase"; // ✅ Fixed: correct root-level import path

WebBrowser.maybeCompleteAuthSession();

// ── Google OAuth (PKCE flow via expo-auth-session) ────────────────────────────
// Replace these with your actual client IDs from the Firebase Console →
// Authentication → Sign-in method → Google → Web SDK configuration
const GOOGLE_CLIENT_IDS = {
  iosClientId:     "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
  androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
  webClientId:     "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
};

// ── Nonce helpers for Apple Sign-In ──────────────────────────────────────────
/** Generate a cryptographically random hex nonce of `length` bytes. */
async function generateNonce(length = 32) {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 hash a string, returned as a lowercase hex digest. */
async function sha256(value) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fixed: useAuthRequest uses PKCE — replaces the deprecated implicit
  //    response_type=token flow that returned tokens in URL fragments
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest(GOOGLE_CLIENT_IDS);

  // Handle Google response whenever it changes
  useEffect(() => {
    if (!googleResponse) return;

    const handleGoogleResponse = async () => {
      if (googleResponse.type === "success") {
        const { authentication } = googleResponse;
        try {
          const credential = GoogleAuthProvider.credential(null, authentication.accessToken);
          await signInWithCredential(auth, credential);
          // ✅ Fixed: no userId in params — screens read from auth.currentUser
          // onAuthStateChanged in App.js switches to AppNavigator automatically
        } catch {
          Alert.alert("Authentication Failed", "Could not complete Google sign-in. Please try again.");
        }
      } else if (googleResponse.type === "error") {
        Alert.alert("Authentication Failed", "Google sign-in was unsuccessful. Please try again.");
      }
      setIsLoading(false);
    };

    handleGoogleResponse();
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await googlePromptAsync();
      // Result is handled in the useEffect above; loading reset there too
    } catch {
      Alert.alert("Authentication Failed", "Could not open Google sign-in.");
      setIsLoading(false);
    }
  };

  // ── Apple Sign-In ─────────────────────────────────────────────────────────
  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      // ✅ Fixed: generate a nonce before the Apple request.
      //    Pass the hashed nonce to Apple and the raw nonce to Firebase so
      //    Firebase can verify the token hasn't been replayed.
      const rawNonce = await generateNonce();
      const hashedNonce = await sha256(rawNonce);

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce, // Apple receives the hash
      });

      if (!appleCredential.identityToken) {
        throw new Error("Apple Sign-In did not return an identity token.");
      }

      const provider = new OAuthProvider("apple.com");
      const oAuthCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce, // Firebase verifies rawNonce against the hash Apple signed
      });

      await signInWithCredential(auth, oAuthCredential);
      // onAuthStateChanged in App.js handles navigation
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        // User dismissed the Apple sheet — not an error
      } else {
        // ✅ Fixed: safe message only — no raw error.message exposed to the user
        Alert.alert("Apple Authentication Failed", "Could not complete Apple sign-in. Please try again.");
        console.error("Apple login error:", error.code ?? error.message);
      }
    } finally {
      // ✅ Fixed: always resets loading — even if an unhandled path exits the try block
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.logoText}>GrantFlow</Text>
        <Text style={styles.subtitle}>Start your business & secure grant funding instantly.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loaderText}>Authenticating securely...</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple Sign-In is required by App Store guidelines when any
              third-party social login is offered on iOS */}
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          )}

          {/* ✅ Fixed: guest mode navigates without a fake userId in params.
              Downstream screens guard against auth.currentUser === null.  */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.replace("BusinessType")}
          >
            <Text style={styles.skipButtonText}>Continue as Guest (Demo Mode)</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, padding: 24, justifyContent: "space-between", backgroundColor: "#f8f9fa" },
  headerContainer: { marginTop: 60, alignItems: "center" },
  logoText:        { fontSize: 36, fontWeight: "bold", color: "#2c3e50", marginBottom: 8 },
  subtitle:        { fontSize: 16, color: "#7f8c8d", textAlign: "center", paddingHorizontal: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText:      { marginTop: 12, color: "#7f8c8d", fontSize: 16 },
  buttonContainer: { marginBottom: 40, width: "100%", gap: 16 },
  googleButton:    { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#bdc3c7", padding: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  googleButtonText:{ color: "#2c3e50", fontSize: 16, fontWeight: "bold" },
  appleButton:     { width: "100%", height: 50 },
  skipButton:      { padding: 12, alignItems: "center" },
  skipButtonText:  { color: "#95a5a6", fontSize: 14, fontWeight: "600" },
});

export default LoginScreen;
