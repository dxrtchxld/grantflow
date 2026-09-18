// screens/RegisterScreen.js
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function RegisterScreen({ navigation }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Set display name on the Firebase Auth profile
      await updateProfile(user, { displayName: name.trim() });

      // Create the user document in Firestore (uid as doc ID)
      await setDoc(doc(db, "users", user.uid), {
        displayName: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });
      // onAuthStateChanged in App.js switches to AppNavigator automatically
    } catch (err) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : "Registration failed. Please try again.";
      Alert.alert("Registration Error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>GrantFlow</Text>
          <Text style={styles.tagline}>Create your account.</Text>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#A0A0B0" value={name} onChangeText={setName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#A0A0B0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <TextInput style={styles.input} placeholder="Password (8+ chars)" placeholderTextColor="#A0A0B0" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#A0A0B0" value={confirm} onChangeText={setConfirm} secureTextEntry />

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#1A1A2E" />
                : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkAccent}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const C = { bg: "#1A1A2E", card: "#16213E", accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0" };
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  inner:       { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },
  logo:        { fontSize: 36, fontWeight: "800", color: C.accent, textAlign: "center", marginBottom: 6 },
  tagline:     { fontSize: 15, color: C.muted, textAlign: "center", marginBottom: 40 },
  form:        { gap: 14, marginBottom: 28 },
  input:       { backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text, borderWidth: 1.5, borderColor: "transparent" },
  btn:         { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: "700", color: C.bg },
  link:        { textAlign: "center", color: C.muted, fontSize: 14 },
  linkAccent:  { color: C.accent, fontWeight: "600" },
});
