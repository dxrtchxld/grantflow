// screens/BusinessDetailsScreen.js
// Step 2 — Collect owner info: name, email, state of formation
import React from "react";
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
} from "react-native";
import { Formik } from "formik";

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

function validate(values) {
  const errors = {};
  if (!values.ownerName.trim()) errors.ownerName = "Required";
  if (!values.email.trim()) {
    errors.email = "Required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Invalid email";
  }
  if (!values.state) errors.state = "Required";
  return errors;
}

export default function BusinessDetailsScreen({ navigation, route }) {
  const { businessType } = route.params ?? {};
  const [stateSearch, setStateSearch] = React.useState("");

  function handleSubmit(values) {
    navigation.navigate("BusinessName", { businessType, ownerDetails: values });
  }

  const filteredStates = React.useMemo(() => {
    if (!stateSearch.trim()) return ALL_STATES;
    const q = stateSearch.trim().toLowerCase();
    return ALL_STATES.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Tell us about{"\n"}yourself</Text>
          <Text style={styles.subheading}>We'll use this to prepare your formation documents.</Text>

          <Formik initialValues={{ ownerName: "", email: "", state: "" }} validate={validate} onSubmit={handleSubmit}>
            {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => {
              const selectedStateObj = ALL_STATES.find((s) => s.code === values.state);

              return (
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Full Legal Name</Text>
                    <TextInput
                      style={[styles.input, touched.ownerName && errors.ownerName && styles.inputError]}
                      placeholder="Jane Smith"
                      placeholderTextColor="#A0A0B0"
                      onChangeText={handleChange("ownerName")}
                      onBlur={handleBlur("ownerName")}
                      value={values.ownerName}
                      autoCapitalize="words"
                    />
                    {touched.ownerName && errors.ownerName && (
                      <Text style={styles.error}>{errors.ownerName}</Text>
                    )}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[styles.input, touched.email && errors.email && styles.inputError]}
                      placeholder="jane@example.com"
                      placeholderTextColor="#A0A0B0"
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      value={values.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.error}>{errors.email}</Text>
                    )}
                  </View>

                  <View style={styles.field}>
                    <View style={styles.stateHeaderRow}>
                      <Text style={styles.label}>State of Formation</Text>
                      {selectedStateObj && (
                        <Text style={styles.selectedStateBadge}>
                          ✓ {selectedStateObj.name} ({selectedStateObj.code})
                        </Text>
                      )}
                    </View>

                    {/* Search / Filter Input */}
                    <TextInput
                      style={styles.stateSearchInput}
                      placeholder="Type state name or code (e.g. Ohio, GA, TX)..."
                      placeholderTextColor="#7E7E94"
                      value={stateSearch}
                      onChangeText={setStateSearch}
                      autoCapitalize="none"
                    />

                    {/* All States Grid */}
                    <View style={styles.stateGrid}>
                      {filteredStates.map((s) => {
                        const isSelected = values.state === s.code;
                        return (
                          <TouchableOpacity
                            key={s.code}
                            style={[styles.stateChip, isSelected && styles.stateChipSelected]}
                            onPress={() => setFieldValue("state", s.code)}
                          >
                            <Text style={[styles.stateText, isSelected && styles.stateTextSelected]}>
                              {s.code} - {s.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {filteredStates.length === 0 && (
                      <Text style={styles.noStateText}>
                        No states matching "{stateSearch}". Check spelling or clear search.
                      </Text>
                    )}

                    {touched.state && errors.state && (
                      <Text style={styles.error}>{errors.state}</Text>
                    )}
                  </View>

                  <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
                    <Text style={styles.btnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = { bg: "#1A1A2E", card: "#16213E", accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0", err: "#FF6B6B" };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: "700", color: COLORS.text, lineHeight: 36 },
  subheading: { fontSize: 15, color: COLORS.muted, marginTop: 8, marginBottom: 32 },
  form: { gap: 24 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: { borderColor: COLORS.err },
  error: { fontSize: 12, color: COLORS.err },
  stateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  selectedStateBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.accent,
    backgroundColor: "#2A2A44",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stateSearchInput: {
    backgroundColor: "#22223B",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: "#3A3A54",
    marginBottom: 8,
  },
  noStateText: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  stateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  stateChipSelected: { borderColor: COLORS.accent, backgroundColor: "#2A2418" },
  stateText: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  stateTextSelected: { color: COLORS.accent, fontWeight: "700" },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontWeight: "700", color: COLORS.bg },
});
