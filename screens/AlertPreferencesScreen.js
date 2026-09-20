import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Switch, TouchableOpacity, ScrollView, Alert } from "react-native";
import AppHeader from "../components/AppHeader";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", cardBorder: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  green: "#2ecc71"
};

export default function AlertPreferencesScreen({ navigation }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState(80);

  const handleSave = () => {
    Alert.alert("Preferences Saved", "We will notify you when high-match grants are posted.");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Smart Alerts" navigation={navigation} />
      <ScrollView style={styles.content}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>Tinder for Grants 🚀</Text>
          <Text style={styles.subtitle}>
            Don't miss out on free money. Set your match threshold, and our engine will proactively notify you the minute a highly relevant grant hits the federal database.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Email Alerts</Text>
              <Text style={styles.rowSub}>Daily digest of matched grants</Text>
            </View>
            <Switch value={emailAlerts} onValueChange={setEmailAlerts} trackColor={{ true: COLORS.green }} />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Instant ping for critical deadlines</Text>
            </View>
            <Switch value={pushAlerts} onValueChange={setPushAlerts} trackColor={{ true: COLORS.green }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Threshold</Text>
          <Text style={styles.thresholdValue}>{matchThreshold}%</Text>
          <Text style={styles.rowSub}>Only notify me if the AI determines I am a {matchThreshold}% match or higher.</Text>
          <View style={styles.sliderMock}>
            <TouchableOpacity onPress={() => setMatchThreshold(Math.max(50, matchThreshold - 5))} style={styles.sliderBtn}><Text style={styles.sliderBtnText}>-</Text></TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(matchThreshold - 50) * 2}%` }]} />
            </View>
            <TouchableOpacity onPress={() => setMatchThreshold(Math.min(100, matchThreshold + 5))} style={styles.sliderBtn}><Text style={styles.sliderBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: 20 },
  headerBox: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.muted, lineHeight: 22 },
  section: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  sectionTitle: { color: COLORS.accent, fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  rowTitle: { color: COLORS.text, fontSize: 16, fontWeight: "500" },
  rowSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  thresholdValue: { fontSize: 36, fontWeight: "800", color: COLORS.green, marginVertical: 8 },
  sliderMock: { flexDirection: "row", alignItems: "center", marginTop: 20, gap: 12 },
  sliderBtn: { width: 40, height: 40, backgroundColor: COLORS.cardBorder, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  sliderBtnText: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  sliderTrack: { flex: 1, height: 8, backgroundColor: COLORS.bg, borderRadius: 4, overflow: "hidden" },
  sliderFill: { height: "100%", backgroundColor: COLORS.green },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: "bold" }
});
