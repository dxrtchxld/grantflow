// screens/LLCFormationScreen.js
// Step 4 — Review all collected info and submit via Stripe Atlas
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { createAtlasOrder } from "../services/stripeAtlas";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import AppHeader from "../components/AppHeader";

export default function LLCFormationScreen({ navigation, route }) {
  const { businessType, ownerDetails, businessName } = route.params ?? {};
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const summary = [
    { label: "Business Name", value: businessName },
    { label: "Structure", value: businessType?.toUpperCase() },
    { label: "Owner", value: ownerDetails?.ownerName },
    { label: "Email", value: ownerDetails?.email },
    { label: "State", value: ownerDetails?.state },
  ];

  async function handleFormLLC() {
    setLoading(true);
    try {
      // 1. Submit to Stripe Atlas
      const atlasOrder = await createAtlasOrder({
        companyName: businessName,
        email: ownerDetails.email,
        country: "US",
        state: ownerDetails.state,
      });

      // 2. Persist the order details in Firestore
      await addDoc(collection(db, "llcOrders"), {
        businessName,
        businessType,
        ownerName: ownerDetails.ownerName,
        email: ownerDetails.email,
        state: ownerDetails.state,
        stripeAtlasOrderId: atlasOrder.id,
        status: atlasOrder.status ?? "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      Alert.alert(
        "Formation Failed",
        err?.response?.data?.error?.message ?? err.message ?? "Something went wrong.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successHeading}>Order Submitted!</Text>
          <Text style={styles.successBody}>
            Your {businessType?.toUpperCase()} formation for{" "}
            <Text style={{ color: COLORS.accent }}>{businessName}</Text> has been sent to Stripe Atlas.
            You'll receive a confirmation email at {ownerDetails?.email}.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("BusinessType")}
          >
            <Text style={styles.btnText}>Start New Formation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Review & Submit" navigation={navigation} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.heading}>Review &{"\n"}Submit</Text>
        <Text style={styles.subheading}>
          Confirm your details before we file with Stripe Atlas.
        </Text>

        <View style={styles.summaryCard}>
          {summary.map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value ?? "—"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            By tapping "Form My LLC" you authorize GrantFlow to submit your formation order via
            Stripe Atlas. Standard Stripe Atlas fees apply. This is not legal advice.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleFormLLC}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.btnText}>Form My LLC →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = { bg: "#1A1A2E", card: "#16213E", accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0" };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60, gap: 24 },
  heading: { fontSize: 28, fontWeight: "700", color: COLORS.text, lineHeight: 36 },
  subheading: { fontSize: 15, color: COLORS.muted, marginTop: 8 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#0F3460",
  },
  summaryLabel: { fontSize: 13, color: COLORS.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 15, color: COLORS.text, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 16 },
  disclaimer: {
    backgroundColor: "#0F3460",
    borderRadius: 10,
    padding: 14,
  },
  disclaimerText: { fontSize: 12, color: COLORS.muted, lineHeight: 18 },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: "700", color: COLORS.bg },
  backBtn: { alignItems: "center", paddingVertical: 8 },
  backBtnText: { fontSize: 15, color: COLORS.muted },
  successBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 16 },
  successIcon: { fontSize: 64 },
  successHeading: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  successBody: { fontSize: 15, color: COLORS.muted, textAlign: "center", lineHeight: 22 },
});
