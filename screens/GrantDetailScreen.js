// screens/GrantDetailScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase"; // ✅ Fixed: correct root-level import path

const GrantDetailScreen = ({ route, navigation }) => {
  const { grant } = route.params; // ✅ Fixed: userId dropped — always derive from auth
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyNow = async () => {
    // ✅ Fixed: auth guard — never trust route.params for identity
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Session Expired", "Please sign in again to continue.");
      return;
    }

    setIsApplying(true);
    try {
      // ✅ Fixed: write to `applications` collection (has proper security rules)
      //           instead of arrayUnion on users doc (unbounded growth → 1 MB limit)
      // ✅ Fixed: try/catch wraps the actual async work directly — no setTimeout
      await addDoc(collection(db, "applications"), {
        userId: currentUser.uid,
        grantId: grant.id,
        grantName: grant.name,
        status: "submitted",
        appliedAt: serverTimestamp(),
      });

      Alert.alert(
        "Application Submitted! 🎉",
        "Your grant application has been auto-filled and submitted successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      // ✅ Fixed: catch actually fires now — was unreachable inside setTimeout
      console.error("Error submitting application:", error);
      Alert.alert("Error", "Could not submit application. Please check your network.");
    } finally {
      setIsApplying(false);
    }
  };

  // ✅ Fixed: $ only shown when amount is a real number
  const formattedAmount =
    grant.amount && grant.amount > 0
      ? `$${grant.amount.toLocaleString()}`
      : "Undisclosed";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{grant.name}</Text>
        <Text style={styles.amount}>Funding Pool: {formattedAmount}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.bodyText}>
            {grant.description || "No description provided."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
          {Array.isArray(grant.eligibility) && grant.eligibility.length > 0 ? (
            grant.eligibility.map((item, index) => (
              <Text key={index} style={styles.bulletText}>• {item}</Text>
            ))
          ) : (
            <Text style={styles.bodyText}>
              Open to registered local businesses matching industry requirements.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
          onPress={handleApplyNow}
          disabled={isApplying}
        >
          {isApplying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Auto-Fill & Apply</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent:   { padding: 20 },
  title:           { fontSize: 26, fontWeight: "bold", color: "#333", marginBottom: 8 },
  amount:          { fontSize: 20, fontWeight: "600", color: "#27ae60", marginBottom: 20 },
  section:         { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  sectionTitle:    { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 8 },
  bodyText:        { fontSize: 14, color: "#666", lineHeight: 20 },
  bulletText:      { fontSize: 14, color: "#666", marginBottom: 4 },
  footer:          { padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  applyButton:         { backgroundColor: "#2ecc71", padding: 16, borderRadius: 12, alignItems: "center" },
  applyButtonDisabled: { backgroundColor: "#95a5a6" },
  applyButtonText:     { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default GrantDetailScreen;
