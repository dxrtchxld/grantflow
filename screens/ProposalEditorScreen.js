// screens/ProposalEditorScreen.js
// AI-powered multi-section grant proposal editor with budget generation
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import AppHeader from "../components/AppHeader";
import GrantGuideMascot from "../components/GrantGuideMascot";
import env from "../env";

const BACKEND_URL = env.backendUrl || "";

const COLORS = {
  bg: "#1A1A2E",
  card: "#16213E",
  cardBorder: "#2A2A44",
  accent: "#E2B96F",
  text: "#FFFFFF",
  muted: "#A0A0B0",
  green: "#2ecc71",
  red: "#e74c3c",
  blue: "#3498db",
};

const TEMPLATES = [
  { id: "default",      label: "📋 Standard",     color: COLORS.accent },
  { id: "nonprofit",   label: "❤️ Nonprofit",    color: "#e74c3c" },
  { id: "education",   label: "🎓 Education",     color: "#3498db" },
  { id: "research",    label: "🔬 Research",      color: "#9b59b6" },
  { id: "small_business", label: "🏢 Business",  color: "#2ecc71" },
];

const TEMPLATE_SECTIONS = {
  default:       ["Executive Summary", "Organization Background", "Problem Statement", "Project Description", "Budget Narrative", "Evaluation Plan"],
  nonprofit:     ["Mission Statement", "Community Impact", "Project Description", "Funding Request", "Sustainability Plan"],
  education:     ["Project Overview", "Educational Goals", "Target Audience", "Curriculum Plan", "Assessment Methods", "Budget Narrative"],
  research:      ["Abstract", "Background and Significance", "Research Design and Methods", "Expected Outcomes", "Dissemination Plan", "Budget Narrative"],
  small_business: ["Executive Summary", "Business Overview", "Market Opportunity", "Use of Funds", "Growth Plan", "Financial Projections"],
};

async function callBackend(endpoint, body) {
  if (!BACKEND_URL) throw new Error("Backend URL not configured");
  const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

export default function ProposalEditorScreen({ navigation, route }) {
  const { grant, orgContext } = route.params || {};

  const [templateId, setTemplateId]     = useState("default");
  const [sections, setSections]         = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [generating, setGenerating]     = useState(null); // section name being generated
  const [generatingAll, setGeneratingAll] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [showReqInput, setShowReqInput] = useState(true);
  const [budget, setBudget]             = useState(null);
  const [generatingBudget, setGeneratingBudget] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [showRefine, setShowRefine]     = useState(false);
  const [tab, setTab]                   = useState("proposal"); // "proposal" | "budget"

  const currentSections = TEMPLATE_SECTIONS[templateId] || TEMPLATE_SECTIONS.default;

  // Initialize sections when template changes
  useEffect(() => {
    const init = {};
    currentSections.forEach(s => { init[s] = sections[s] || ""; });
    setSections(init);
    setActiveSection(currentSections[0]);
  }, [templateId]);

  const generateSection = useCallback(async (sectionName) => {
    if (!grant) return;
    setGenerating(sectionName);
    try {
      const data = await callBackend("/api/proposals/section", {
        section_name: sectionName,
        grant,
        requirements,
        org_context: orgContext || {},
      });
      setSections(prev => ({ ...prev, [sectionName]: data.content }));
    } catch (e) {
      Alert.alert("AI Error", e.message || "Could not generate section. Check your backend URL.");
    } finally {
      setGenerating(null);
    }
  }, [grant, requirements, orgContext]);

  const generateAllSections = async () => {
    if (!grant) {
      Alert.alert("Missing Grant", "Navigate here from a grant detail page.");
      return;
    }
    setGeneratingAll(true);
    setShowReqInput(false);
    for (const s of currentSections) {
      setGenerating(s);
      try {
        const data = await callBackend("/api/proposals/section", {
          section_name: s,
          grant,
          requirements,
          org_context: orgContext || {},
        });
        setSections(prev => ({ ...prev, [s]: data.content }));
      } catch (e) {
        setSections(prev => ({ ...prev, [s]: "[Generation failed — please retry this section]" }));
      }
    }
    setGenerating(null);
    setGeneratingAll(false);
  };

  const refineCurrentSection = async () => {
    if (!activeSection || !refineFeedback.trim()) return;
    const current = sections[activeSection] || "";
    setGenerating(activeSection);
    try {
      const data = await callBackend("/api/proposals/refine", {
        section_text: current,
        feedback: refineFeedback,
        section_name: activeSection,
      });
      setSections(prev => ({ ...prev, [activeSection]: data.content }));
      setRefineFeedback("");
      setShowRefine(false);
    } catch (e) {
      Alert.alert("Error", "Could not refine section.");
    } finally {
      setGenerating(null);
    }
  };

  const generateBudget = async () => {
    setGeneratingBudget(true);
    try {
      const data = await callBackend("/api/budget/generate", {
        requirements: requirements || `Grant proposal for ${grant?.name || "funding opportunity"}`,
        total_hint: grant?.amount || null,
      });
      setBudget(data.budget);
      setTab("budget");
    } catch (e) {
      Alert.alert("Error", "Could not generate budget.");
    } finally {
      setGeneratingBudget(false);
    }
  };

  const saveProposal = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to save proposals.");
      return;
    }
    setSaving(true);
    try {
      const ref = doc(collection(db, "proposals"));
      await setDoc(ref, {
        userId: user.uid,
        grantId: grant?.id || "manual",
        grantName: grant?.name || "Manual Proposal",
        templateId,
        sections,
        budget: budget || null,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Saved! ✅", "Your proposal draft has been saved.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Save Failed", "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const shareProposal = async () => {
    const text = currentSections
      .map(s => `## ${s}\n\n${sections[s] || "(empty)"}`)
      .join("\n\n---\n\n");
    await Share.share({ message: `${grant?.name || "Grant Proposal"}\n\n${text}` });
  };

  const completedCount = currentSections.filter(s => sections[s]?.trim().length > 50).length;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Proposal Editor" navigation={navigation} />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === "proposal" && styles.tabActive]} onPress={() => setTab("proposal")}>
          <Text style={[styles.tabText, tab === "proposal" && styles.tabTextActive]}>📝 Proposal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "budget" && styles.tabActive]} onPress={() => setTab("budget")}>
          <Text style={[styles.tabText, tab === "budget" && styles.tabTextActive]}>💰 Budget</Text>
        </TouchableOpacity>
      </View>

      {tab === "proposal" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>

            {/* Grant info */}
            {grant && (
              <View style={styles.grantBadge}>
                <Text style={styles.grantBadgeText} numberOfLines={1}>
                  🏛️ {grant.name}
                </Text>
                {grant.amount > 0 && (
                  <Text style={styles.grantBadgeAmount}>${grant.amount?.toLocaleString()}</Text>
                )}
              </View>
            )}

            {/* Progress */}
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {completedCount}/{currentSections.length} sections written
              </Text>
              <TouchableOpacity onPress={shareProposal}>
                <Text style={styles.shareBtn}>Share 📤</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(completedCount / currentSections.length) * 100}%` }]} />
            </View>

            {/* Template selector */}
            <Text style={styles.sectionLabel}>TEMPLATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
              {TEMPLATES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.templateChip, templateId === t.id && { borderColor: t.color, backgroundColor: `${t.color}22` }]}
                  onPress={() => setTemplateId(t.id)}
                >
                  <Text style={[styles.templateChipText, templateId === t.id && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Requirements input */}
            {showReqInput && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>PROJECT DESCRIPTION (helps AI write better)</Text>
                <TextInput
                  style={styles.reqInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe your project, goals, and what you'll use the funding for..."
                  placeholderTextColor={COLORS.muted}
                  value={requirements}
                  onChangeText={setRequirements}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.generateAllBtn, generatingAll && styles.btnDisabled]}
                  onPress={generateAllSections}
                  disabled={generatingAll}
                >
                  {generatingAll ? (
                    <View style={styles.row}>
                      <ActivityIndicator color={COLORS.bg} size="small" />
                      <Text style={styles.generateAllBtnText}>  Generating {generating}...</Text>
                    </View>
                  ) : (
                    <Text style={styles.generateAllBtnText}>✨ Generate All Sections with AI</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Section tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabRow}>
              {currentSections.map(s => {
                const done = sections[s]?.trim().length > 50;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sectionTab, activeSection === s && styles.sectionTabActive]}
                    onPress={() => setActiveSection(s)}
                  >
                    <Text style={[styles.sectionTabText, activeSection === s && styles.sectionTabTextActive]}>
                      {done ? "✓ " : ""}{s.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active section editor */}
            {activeSection && (
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{activeSection}</Text>
                  <TouchableOpacity
                    style={[styles.genBtn, generating === activeSection && styles.btnDisabled]}
                    onPress={() => generateSection(activeSection)}
                    disabled={!!generating}
                  >
                    {generating === activeSection ? (
                      <ActivityIndicator color={COLORS.bg} size="small" />
                    ) : (
                      <Text style={styles.genBtnText}>✨ AI</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.sectionInput}
                  multiline
                  placeholder={`Write the ${activeSection} here, or tap ✨ AI to generate...`}
                  placeholderTextColor={COLORS.muted}
                  value={sections[activeSection] || ""}
                  onChangeText={text => setSections(prev => ({ ...prev, [activeSection]: text }))}
                  textAlignVertical="top"
                />

                <View style={styles.sectionFooter}>
                  <Text style={styles.charCount}>
                    {(sections[activeSection] || "").length} chars
                  </Text>
                  <TouchableOpacity onPress={() => setShowRefine(!showRefine)}>
                    <Text style={styles.refineToggle}>Refine with feedback ↩</Text>
                  </TouchableOpacity>
                </View>

                {showRefine && (
                  <View style={styles.refineBox}>
                    <TextInput
                      style={styles.refineInput}
                      placeholder="e.g. 'Make it more concise' or 'Add specific metrics'"
                      placeholderTextColor={COLORS.muted}
                      value={refineFeedback}
                      onChangeText={setRefineFeedback}
                    />
                    <TouchableOpacity style={styles.refineBtn} onPress={refineCurrentSection} disabled={!!generating}>
                      <Text style={styles.refineBtnText}>Apply Feedback</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Save + Budget buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveProposal} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.bg} size="small" /> : <Text style={styles.saveBtnText}>💾 Save Draft</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.budgetBtn} onPress={generateBudget} disabled={generatingBudget}>
                {generatingBudget ? <ActivityIndicator color={COLORS.accent} size="small" /> : <Text style={styles.budgetBtnText}>💰 Budget</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* Budget Tab */
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
          {budget ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AI-Generated Budget</Text>
              <View style={styles.budgetTable}>
                <View style={[styles.budgetRow, styles.budgetHeader]}>
                  <Text style={[styles.budgetCell, styles.budgetCellCategory, styles.budgetHeaderText]}>Category</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellDesc, styles.budgetHeaderText]}>Description</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellAmount, styles.budgetHeaderText]}>Amount</Text>
                </View>
                {(budget.line_items || []).map((item, i) => (
                  <View key={i} style={[styles.budgetRow, i % 2 === 0 && styles.budgetRowAlt]}>
                    <Text style={[styles.budgetCell, styles.budgetCellCategory]} numberOfLines={2}>{item.category}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellDesc]} numberOfLines={2}>{item.description}</Text>
                    <Text style={[styles.budgetCell, styles.budgetCellAmount]}>${(item.amount || 0).toLocaleString()}</Text>
                  </View>
                ))}
                <View style={[styles.budgetRow, styles.budgetTotalRow]}>
                  <Text style={[styles.budgetCell, styles.budgetCellCategory, styles.budgetTotalText]}>TOTAL</Text>
                  <Text style={[styles.budgetCell, styles.budgetCellDesc]} />
                  <Text style={[styles.budgetCell, styles.budgetCellAmount, styles.budgetTotalText]}>${(budget.total || 0).toLocaleString()}</Text>
                </View>
              </View>
              {budget.notes && (
                <Text style={styles.budgetNotes}>{budget.notes}</Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyBudget}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyTitle}>No budget yet</Text>
              <Text style={styles.emptyBody}>Go to the Proposal tab and tap the Budget button to generate an AI budget breakdown.</Text>
              <TouchableOpacity style={styles.generateAllBtn} onPress={() => { setTab("proposal"); }}>
                <Text style={styles.generateAllBtnText}>← Back to Proposal</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  scroll:         { padding: 16, paddingBottom: 48 },
  row:            { flexDirection: "row", alignItems: "center" },

  tabBar:         { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  tab:            { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText:        { color: COLORS.muted, fontWeight: "600" },
  tabTextActive:  { color: COLORS.accent },

  grantBadge:     { backgroundColor: "#1E223D", borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: COLORS.accent + "44" },
  grantBadgeText: { color: COLORS.text, fontWeight: "600", flex: 1, fontSize: 13 },
  grantBadgeAmount: { color: COLORS.green, fontWeight: "700", fontSize: 14 },

  progressRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  progressText:   { color: COLORS.muted, fontSize: 12 },
  shareBtn:       { color: COLORS.accent, fontSize: 12, fontWeight: "700" },
  progressBarBg:  { height: 4, backgroundColor: COLORS.cardBorder, borderRadius: 2, marginBottom: 16 },
  progressBarFill: { height: 4, backgroundColor: COLORS.accent, borderRadius: 2 },

  sectionLabel:   { fontSize: 11, fontWeight: "800", color: COLORS.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 },

  templateRow:    { flexDirection: "row", gap: 8, paddingVertical: 4, marginBottom: 16 },
  templateChip:   { borderWidth: 1.5, borderColor: COLORS.cardBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  templateChipText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },

  card:           { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 16 },

  reqInput:       { color: COLORS.text, fontSize: 14, minHeight: 100, lineHeight: 20, marginBottom: 12 },
  generateAllBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  generateAllBtnText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
  btnDisabled:    { opacity: 0.6 },

  sectionTabRow:  { flexDirection: "row", gap: 8, paddingVertical: 4, marginBottom: 12 },
  sectionTab:     { backgroundColor: COLORS.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  sectionTabActive: { borderColor: COLORS.accent, backgroundColor: "#1E223D" },
  sectionTabText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  sectionTabTextActive: { color: COLORS.accent },

  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:   { color: COLORS.text, fontWeight: "700", fontSize: 16, flex: 1 },
  genBtn:         { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  genBtnText:     { color: COLORS.bg, fontWeight: "700", fontSize: 13 },

  sectionInput:   { color: COLORS.text, fontSize: 14, minHeight: 180, lineHeight: 22 },
  sectionFooter:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  charCount:      { color: COLORS.muted, fontSize: 11 },
  refineToggle:   { color: COLORS.accent, fontSize: 12 },

  refineBox:      { marginTop: 12, gap: 8 },
  refineInput:    { backgroundColor: "#22223B", borderRadius: 8, padding: 10, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.cardBorder },
  refineBtn:      { backgroundColor: "#22223B", borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.accent + "88" },
  refineBtnText:  { color: COLORS.accent, fontWeight: "600", fontSize: 13 },

  actionRow:      { flexDirection: "row", gap: 12 },
  saveBtn:        { flex: 1, backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveBtnText:    { color: COLORS.bg, fontWeight: "700", fontSize: 14 },
  budgetBtn:      { backgroundColor: COLORS.card, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.accent },
  budgetBtnText:  { color: COLORS.accent, fontWeight: "700", fontSize: 14 },

  // Budget table
  budgetTable:    { marginTop: 12 },
  budgetRow:      { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  budgetRowAlt:   { backgroundColor: "#1E223D" + "66" },
  budgetHeader:   { borderBottomWidth: 2, borderBottomColor: COLORS.accent + "88" },
  budgetTotalRow: { borderTopWidth: 2, borderTopColor: COLORS.accent + "88", borderBottomWidth: 0 },
  budgetHeaderText: { color: COLORS.accent, fontWeight: "700", fontSize: 12 },
  budgetTotalText: { color: COLORS.accent, fontWeight: "700" },
  budgetCell:     { fontSize: 13, color: COLORS.text },
  budgetCellCategory: { flex: 2 },
  budgetCellDesc: { flex: 3, paddingHorizontal: 8, color: COLORS.muted },
  budgetCellAmount: { flex: 2, textAlign: "right" },
  budgetNotes:    { marginTop: 12, color: COLORS.muted, fontSize: 13, lineHeight: 18, fontStyle: "italic" },

  emptyBudget:    { flex: 1, alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon:      { fontSize: 48 },
  emptyTitle:     { color: COLORS.text, fontWeight: "700", fontSize: 18 },
  emptyBody:      { color: COLORS.muted, fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },
});
