// screens/BusinessTypeScreen.js
// Step 1 — User selects their business type (LLC, Sole Prop, etc.)
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

const BUSINESS_TYPES = [
  { id: "llc", label: "LLC", description: "Limited Liability Company" },
  { id: "sole_prop", label: "Sole Proprietorship", description: "Simple single-owner business" },
  { id: "corp", label: "Corporation", description: "C-Corp or S-Corp structure" },
  { id: "nonprofit", label: "Nonprofit", description: "501(c)(3) or similar" },
];

export default function BusinessTypeScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  function handleContinue() {
    if (!selected) return;
    navigation.navigate("BusinessDetails", { businessType: selected });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>What type of business{"\n"}are you forming?</Text>
      <Text style={styles.subheading}>Choose the structure that fits your goals.</Text>

      <View style={styles.options}>
        {BUSINESS_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.card, selected === type.id && styles.cardSelected]}
            onPress={() => setSelected(type.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.cardLabel, selected === type.id && styles.cardLabelSelected]}>
              {type.label}
            </Text>
            <Text style={[styles.cardDesc, selected === type.id && styles.cardDescSelected]}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, !selected && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const COLORS = { bg: "#1A1A2E", card: "#16213E", accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0" };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 24, paddingTop: 48 },
  heading: { fontSize: 28, fontWeight: "700", color: COLORS.text, lineHeight: 36 },
  subheading: { fontSize: 15, color: COLORS.muted, marginTop: 8, marginBottom: 32 },
  options: { gap: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: COLORS.accent },
  cardLabel: { fontSize: 17, fontWeight: "600", color: COLORS.text },
  cardLabelSelected: { color: COLORS.accent },
  cardDesc: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  cardDescSelected: { color: COLORS.text },
  btn: {
    marginTop: "auto",
    marginBottom: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: "700", color: COLORS.bg },
});
