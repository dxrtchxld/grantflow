// screens/BusinessNameScreen.js
// Step 3 — User picks their business name; AI checks availability & suggests alternatives
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { chat } from "../services/aiService";

export default function BusinessNameScreen({ navigation, route }) {
  const { businessType, ownerDetails } = route.params ?? {};

  const [name, setName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");

  async function handleSuggest() {
    if (!name.trim()) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const reply = await chat([
        {
          role: "system",
          content:
            "You are a business naming expert. Given a business name idea and type, respond ONLY with a JSON array of 4 alternative name suggestions (strings). No explanation.",
        },
        {
          role: "user",
          content: `Business idea name: "${name}". Type: ${businessType}`,
        },
      ]);
      const parsed = JSON.parse(reply);
      setSuggestions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSuggestions(["Could not load suggestions — check your API key."]);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    const finalName = selected || name.trim();
    if (!finalName) return;
    navigation.navigate("LLCFormation", {
      businessType,
      ownerDetails,
      businessName: finalName,
    });
  }

  const canContinue = selected || name.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Name your{"\n"}business</Text>
          <Text style={styles.subheading}>Enter a name or let AI suggest options for you.</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Apex Ventures"
              placeholderTextColor="#A0A0B0"
              value={name}
              onChangeText={(v) => { setName(v); setSelected(""); }}
              autoCapitalize="words"
            />
            <TouchableOpacity style={styles.aiBtn} onPress={handleSuggest} disabled={loading || !name.trim()}>
              {loading ? (
                <ActivityIndicator size="small" color="#1A1A2E" />
              ) : (
                <Text style={styles.aiBtnText}>✦ AI</Text>
              )}
            </TouchableOpacity>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <Text style={styles.suggestionsLabel}>AI Suggestions — tap to select</Text>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestionChip, selected === s && styles.suggestionChipSelected]}
                  onPress={() => { setSelected(s); setName(s); }}
                >
                  <Text style={[styles.suggestionText, selected === s && styles.suggestionTextSelected]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {canContinue && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Your business name</Text>
              <Text style={styles.previewName}>{selected || name}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = { bg: "#1A1A2E", card: "#16213E", accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0" };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40, gap: 24 },
  heading: { fontSize: 28, fontWeight: "700", color: COLORS.text, lineHeight: 36 },
  subheading: { fontSize: 15, color: COLORS.muted, marginTop: 8 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  aiBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  aiBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.bg },
  suggestionsBox: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, gap: 10 },
  suggestionsLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  suggestionChipSelected: { borderColor: COLORS.accent },
  suggestionText: { fontSize: 15, color: COLORS.muted, fontWeight: "500" },
  suggestionTextSelected: { color: COLORS.accent },
  preview: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, alignItems: "center", gap: 4 },
  previewLabel: { fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  previewName: { fontSize: 22, fontWeight: "700", color: COLORS.accent, textAlign: "center" },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: "700", color: COLORS.bg },
});
