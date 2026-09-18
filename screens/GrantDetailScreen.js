// screens/GrantDetailScreen.js — Upgraded: tabs (Overview/Eligibility/AI Summary/Apply), Start Proposal button
import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import AppHeader from "../components/AppHeader";
import { chat } from "../services/aiService";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", cardBorder: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  green: "#2ecc71", blue: "#3498db", red: "#e74c3c",
};

const TABS = ["Overview", "Eligibility", "AI Summary", "Apply"];

const GrantDetailScreen = ({ route, navigation }) => {
  const { grant } = route.params;
  const [activeTab, setActiveTab]   = useState("Overview");
  const [isApplying, setIsApplying] = useState(false);
  const [aiSummary, setAiSummary]   = useState("");
  const [loadingAI, setLoadingAI]   = useState(false);

  const formattedAmount = grant.amount > 0
    ? `$${grant.amount.toLocaleString()}`
    : "Undisclosed";

  const handleApplyNow = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Session Expired", "Please sign in again to continue.");
      return;
    }
    setIsApplying(true);
    try {
      await addDoc(collection(db, "applications"), {
        userId: currentUser.uid,
        grantId: grant.id,
        grantName: grant.name,
        status: "submitted",
        appliedAt: serverTimestamp(),
      });
      Alert.alert("Application Submitted! 🎉",
        "Your grant application has been submitted successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error submitting application:", error);
      Alert.alert("Error", "Could not submit application. Please check your network.");
    } finally {
      setIsApplying(false);
    }
  };

  const loadAISummary = async () => {
    if (aiSummary) return; // already loaded
    setLoadingAI(true);
    try {
      const result = await chat([
        {
          role: "system",
          content: "You are a grant advisor. Summarize this grant opportunity in 3 key sections: 1) Who should apply, 2) Key requirements, 3) Pro tips for a strong application. Be concise and actionable.",
        },
        {
          role: "user",
          content: `Grant: ${grant.name}\nAgency: ${grant.agency || "Unknown"}\nAmount: ${formattedAmount}\nDescription: ${grant.description || "No description"}\nEligibility: ${Array.isArray(grant.eligibility) ? grant.eligibility.join(", ") : "Not specified"}`,
        },
      ], "mistral-small-latest");
      setAiSummary(result);
    } catch {
      setAiSummary("AI summary unavailable. Check your connection and Mistral API key.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "AI Summary") loadAISummary();
  };

  const handleStartProposal = () => {
    navigation.navigate("ProposalEditor", {
      grant,
      orgContext: {},
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Grant Details" navigation={navigation} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={3}>{grant.name}</Text>
        <Text style={styles.amount}>{formattedAmount}</Text>
        {grant.source && (
          <View style={styles.sourcePill}>
            <Text style={styles.sourcePillText}>{grant.source}</Text>
          </View>
        )}
        {typeof grant.matchScore === "number" && (
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>{grant.matchScore}% AI Match</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => handleTabChange(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>

        {activeTab === "Overview" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Grant</Text>
              <Text style={styles.bodyText}>{grant.description || "No description provided."}</Text>
            </View>
            {grant.agency && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Funding Agency</Text>
                <Text style={styles.bodyText}>{grant.agency}</Text>
              </View>
            )}
            {grant.deadline && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Deadline</Text>
                <Text style={styles.bodyText}>
                  {typeof grant.deadline === "string"
                    ? grant.deadline
                    : grant.deadline?.toDate?.()?.toLocaleDateString?.() || "Not specified"}
                </Text>
              </View>
            )}
            {grant.url && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Official Link</Text>
                <Text style={[styles.bodyText, { color: COLORS.blue }]} numberOfLines={2}>{grant.url}</Text>
              </View>
            )}
          </>
        )}

        {activeTab === "Eligibility" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
            {Array.isArray(grant.eligibility) && grant.eligibility.length > 0 ? (
              grant.eligibility.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.bodyText}>
                Open to registered businesses. Visit the official grant page for full eligibility requirements.
              </Text>
            )}
            {grant.category && (
              <View style={[styles.section, { marginTop: 16 }]}>
                <Text style={styles.sectionTitle}>Category</Text>
                <Text style={styles.bodyText}>{grant.category}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "AI Summary" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Grant Advisor</Text>
            {loadingAI ? (
              <View style={styles.aiLoader}>
                <ActivityIndicator color={COLORS.accent} />
                <Text style={styles.aiLoaderText}>Analyzing grant requirements...</Text>
              </View>
            ) : (
              <Text style={styles.bodyText}>{aiSummary || "Loading AI analysis..."}</Text>
            )}
          </View>
        )}

        {activeTab === "Apply" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ready to Apply?</Text>
              <Text style={styles.bodyText}>
                You can write an AI-powered proposal first, or submit a quick application now.
              </Text>
            </View>
            <TouchableOpacity style={styles.proposalBtn} onPress={handleStartProposal}>
              <Text style={styles.proposalBtnText}>✨ Write AI Proposal First</Text>
              <Text style={styles.proposalBtnSub}>Recommended — takes ~2 min</Text>
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.writeBtn} onPress={handleStartProposal}>
          <Text style={styles.writeBtnText}>✨ Write Proposal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyBtn, isApplying && styles.applyBtnDisabled]}
          onPress={handleApplyNow}
          disabled={isApplying}
        >
          {isApplying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyBtnText}>Apply Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  header:     { padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  title:      { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 6 },
  amount:     { fontSize: 20, fontWeight: "700", color: COLORS.green, marginBottom: 8 },
  sourcePill: { alignSelf: "flex-start", backgroundColor: "#3498db22", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: "#3498db44" },
  sourcePillText: { color: COLORS.blue, fontSize: 11, fontWeight: "700" },
  scorePill:  { alignSelf: "flex-start", backgroundColor: "#E2B96F22", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#E2B96F44" },
  scorePillText: { color: COLORS.accent, fontSize: 11, fontWeight: "700" },

  tabBar:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  tab:        { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive:  { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText:    { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: COLORS.accent },

  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 20 },
  section:    { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  bodyText:   { fontSize: 14, color: COLORS.muted, lineHeight: 22 },
  bulletRow:  { flexDirection: "row", gap: 8, marginBottom: 8 },
  bullet:     { color: COLORS.green, fontWeight: "700", marginTop: 1 },
  bulletText: { color: COLORS.text, fontSize: 14, lineHeight: 20, flex: 1 },

  aiLoader:     { alignItems: "center", padding: 20, gap: 10 },
  aiLoaderText: { color: COLORS.muted, fontSize: 13 },

  proposalBtn: { backgroundColor: "#E2B96F22", borderRadius: 12, padding: 18, borderWidth: 1.5, borderColor: COLORS.accent, marginBottom: 16, alignItems: "center" },
  proposalBtnText: { color: COLORS.accent, fontWeight: "700", fontSize: 16 },
  proposalBtnSub:  { color: COLORS.muted, fontSize: 12, marginTop: 4 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.cardBorder },
  dividerText: { color: COLORS.muted, fontSize: 13 },

  footer:     { flexDirection: "row", padding: 16, gap: 12, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  writeBtn:   { flex: 1, backgroundColor: "#E2B96F22", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.accent },
  writeBtnText: { color: COLORS.accent, fontWeight: "700", fontSize: 14 },
  applyBtn:   { flex: 1, backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  applyBtnDisabled: { backgroundColor: "#555" },
  applyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default GrantDetailScreen;
