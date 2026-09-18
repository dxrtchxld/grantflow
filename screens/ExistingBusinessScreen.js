// screens/ExistingBusinessScreen.js
// Fast-track onboarding for entrepreneurs who already have an established LLC or entity
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import AppHeader from "../components/AppHeader";
import GrantGuideMascot from "../components/GrantGuideMascot";

const ALL_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "PR", name: "Puerto Rico" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const ENTITY_TYPES = ["LLC", "Sole Proprietorship", "Corporation", "Nonprofit", "Partnership"];

const INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Life Sciences",
  "Retail & E-Commerce",
  "Clean Energy & Sustainability",
  "Manufacturing & Trades",
  "Food & Beverage",
  "Creative & Marketing",
  "Education & Non-Profit",
];

export default function ExistingBusinessScreen({ navigation }) {
  const [businessName, setBusinessName] = useState("");
  const [entityType, setEntityType] = useState("LLC");
  const [state, setState] = useState("");
  const [industry, setIndustry] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return ALL_STATES;
    const q = stateSearch.trim().toLowerCase();
    return ALL_STATES.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  const selectedStateObj = ALL_STATES.find((s) => s.code === state);

  async function handleSaveAndSearch() {
    if (!businessName.trim()) {
      Alert.alert("Business Name Required", "Please enter the name of your business.");
      return;
    }
    if (!state) {
      Alert.alert("State Required", "Please choose the state where your business is registered.");
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await addDoc(collection(db, "businesses"), {
          name: businessName.trim(),
          businessType: entityType.toLowerCase(),
          state,
          industry,
          isExistingBusiness: true,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
      navigation.navigate("GrantSearch", {
        businessProfile: {
          name: businessName.trim(),
          state,
          industry,
          entityType,
        },
      });
    } catch (err) {
      console.error("Error saving existing business:", err);
      navigation.navigate("GrantSearch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Existing Business" navigation={navigation} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <GrantGuideMascot
            message="Great! Tell me a little about your business so I can find the best matching grants for your state and industry."
            subtitle="You don't have to file anything new — just connect your details."
          />

          <View style={styles.form}>
            {/* Business Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Business or LLC Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apex Design Studio LLC"
                placeholderTextColor="#A0A0B0"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

            {/* Entity Type Chips */}
            <View style={styles.field}>
              <Text style={styles.label}>Entity Structure</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {ENTITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, entityType === type && styles.chipSelected]}
                    onPress={() => setEntityType(type)}
                  >
                    <Text style={[styles.chipText, entityType === type && styles.chipTextSelected]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* State Selection */}
            <View style={styles.field}>
              <View style={styles.stateHeaderRow}>
                <Text style={styles.label}>State of Registration</Text>
                {selectedStateObj ? (
                  <Text style={styles.selectedBadge}>✓ {selectedStateObj.name} ({selectedStateObj.code})</Text>
                ) : null}
              </View>

              <TextInput
                style={styles.stateSearchInput}
                placeholder="Type to filter states (e.g. Ohio, CA)..."
                placeholderTextColor="#A0A0B0"
                value={stateSearch}
                onChangeText={setStateSearch}
                autoCapitalize="words"
              />

              <ScrollView
                style={styles.stateListContainer}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {filteredStates.map((s) => (
                  <TouchableOpacity
                    key={s.code}
                    style={[styles.stateItem, state === s.code && styles.stateItemSelected]}
                    onPress={() => {
                      setState(s.code);
                      setStateSearch("");
                    }}
                  >
                    <Text style={[styles.stateItemText, state === s.code && styles.stateItemTextSelected]}>
                      {s.name} ({s.code})
                    </Text>
                    {state === s.code && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Industry Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Primary Industry (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {INDUSTRIES.map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    style={[styles.chip, industry === ind && styles.chipSelected]}
                    onPress={() => setIndustry(ind === industry ? "" : ind)}
                  >
                    <Text style={[styles.chipText, industry === ind && styles.chipTextSelected]}>
                      {ind}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, (!businessName.trim() || !state || saving) && styles.submitBtnDisabled]}
              onPress={handleSaveAndSearch}
              disabled={!businessName.trim() || !state || saving}
            >
              {saving ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <Text style={styles.submitBtnText}>Find Matched Grants →</Text>
              )}
            </TouchableOpacity>

            {/* Skip Link */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => navigation.navigate("GrantSearch")}
            >
              <Text style={styles.skipBtnText}>Skip for now & browse all grants →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#1A1A2E",
  card: "#16213E",
  cardBorder: "#25253D",
  accent: "#E2B96F",
  text: "#FFFFFF",
  muted: "#A0A0B0",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  form: {
    marginTop: 16,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  chipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: "#22223B",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  chipTextSelected: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  stateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
    backgroundColor: "#22223B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stateSearchInput: {
    backgroundColor: "#22223B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stateListContainer: {
    maxHeight: 180,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  stateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E223D",
  },
  stateItemSelected: {
    backgroundColor: "#22223B",
  },
  stateItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  stateItemTextSelected: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  checkmark: {
    color: COLORS.accent,
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.bg,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: COLORS.muted,
  },
});
