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

const STATES = ["DE", "WY", "NV", "TX", "CA", "NY", "FL", "WA", "CO", "IL"];

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

  function handleSubmit(values) {
    navigation.navigate("BusinessName", { businessType, ownerDetails: values });
  }

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
            {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
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
                  <Text style={styles.label}>State of Formation</Text>
                  <View style={styles.stateGrid}>
                    {STATES.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.stateChip, values.state === s && styles.stateChipSelected]}
                        onPress={() => setFieldValue("state", s)}
                      >
                        <Text style={[styles.stateText, values.state === s && styles.stateTextSelected]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {touched.state && errors.state && (
                    <Text style={styles.error}>{errors.state}</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
                  <Text style={styles.btnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}
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
  stateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  stateChipSelected: { borderColor: COLORS.accent },
  stateText: { fontSize: 14, fontWeight: "600", color: COLORS.muted },
  stateTextSelected: { color: COLORS.accent },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontWeight: "700", color: COLORS.bg },
});
