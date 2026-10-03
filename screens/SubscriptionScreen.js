import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", cardBorder: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  blue: "#3498db", green: "#2ecc71", darkAccent: "#c29d5b"
};

export default function SubscriptionScreen({ navigation }) {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("isPro").then(val => {
      if (val === "true") setIsPro(true);
    });
  }, []);

  const handleUpgrade = async () => {
    await AsyncStorage.setItem("isPro", "true");
    setIsPro(true);
    Alert.alert("Welcome to Pro!", "You now have access to PDF Exports and AI Quality Audits.");
  };

  const handleDowngrade = async () => {
    await AsyncStorage.removeItem("isPro");
    setIsPro(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Upgrade" navigation={navigation} />
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Unlock GrantFlow Pro</Text>
        <Text style={styles.subtitle}>Win more grants with advanced AI tools, professional exports, and quality audits.</Text>

        {/* Free Tier */}
        <View style={styles.tierCard}>
          <Text style={styles.tierName}>Starter</Text>
          <Text style={styles.tierPrice}>$0<Text style={styles.tierInterval}>/mo</Text></Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✔️ Basic grant search</Text>
            <Text style={styles.feature}>✔️ Plain-language summaries</Text>
            <Text style={styles.feature}>✔️ Limited AI drafting (3 sections)</Text>
            <Text style={styles.featureNot}>❌ No PDF Exports</Text>
            <Text style={styles.featureNot}>❌ No AI Quality Audits</Text>
          </View>
          {isPro ? (
            <TouchableOpacity style={styles.downgradeBtn} onPress={handleDowngrade}>
              <Text style={styles.downgradeText}>Downgrade to Free</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.currentBadge}><Text style={styles.currentText}>Current Plan</Text></View>
          )}
        </View>

        {/* Pro Tier */}
        <View style={[styles.tierCard, styles.proCard]}>
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>RECOMMENDED</Text></View>
          <Text style={[styles.tierName, { color: COLORS.bg }]}>Professional</Text>
          <Text style={[styles.tierPrice, { color: COLORS.bg }]}>$49<Text style={[styles.tierInterval, { color: "#333" }]}>/mo</Text></Text>
          <View style={styles.featureList}>
            <Text style={[styles.feature, { color: "#333" }]}>✔️ Unlimited AI Grant Drafting</Text>
            <Text style={[styles.feature, { color: "#333" }]}>✔️ Professional PDF Exports</Text>
            <Text style={[styles.feature, { color: "#333" }]}>✔️ AI Readiness & Quality Audits</Text>
            <Text style={[styles.feature, { color: "#333" }]}>✔️ Document Vault & Autofill</Text>
            <Text style={[styles.feature, { color: "#333" }]}>✔️ Team Collaboration Workspaces</Text>
          </View>
          {isPro ? (
            <View style={[styles.currentBadge, { backgroundColor: COLORS.bg }]}><Text style={[styles.currentText, { color: COLORS.text }]}>Current Plan</Text></View>
          ) : (
            <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
              <Text style={styles.upgradeText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.text, textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 15, color: COLORS.muted, textAlign: "center", marginBottom: 30, lineHeight: 22, paddingHorizontal: 10 },
  tierCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 16, padding: 24, marginBottom: 20 },
  proCard: { backgroundColor: COLORS.accent, borderColor: COLORS.darkAccent, position: "relative" },
  proBadge: { position: "absolute", top: -12, alignSelf: "center", backgroundColor: COLORS.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accent },
  proBadgeText: { color: COLORS.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  tierName: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  tierPrice: { fontSize: 40, fontWeight: "900", color: COLORS.text, marginBottom: 20 },
  tierInterval: { fontSize: 16, fontWeight: "500", color: COLORS.muted },
  featureList: { gap: 12, marginBottom: 24 },
  feature: { color: COLORS.text, fontSize: 15 },
  featureNot: { color: COLORS.muted, fontSize: 15, textDecorationLine: "line-through" },
  currentBadge: { padding: 16, borderRadius: 12, backgroundColor: COLORS.cardBorder, alignItems: "center" },
  currentText: { color: COLORS.text, fontWeight: "bold" },
  upgradeBtn: { backgroundColor: COLORS.bg, padding: 16, borderRadius: 12, alignItems: "center" },
  upgradeText: { color: COLORS.text, fontWeight: "bold", fontSize: 16 },
  downgradeBtn: { padding: 16, alignItems: "center" },
  downgradeText: { color: COLORS.muted, fontWeight: "600" }
});
