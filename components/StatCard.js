// components/StatCard.js — Reusable stat card for dashboard
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatCard({ icon, label, value, color = "#E2B96F", subtitle }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card:     { flex: 1, minWidth: "45%", backgroundColor: "#16213E", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#2A2A44", borderLeftWidth: 3, gap: 4 },
  icon:     { fontSize: 22, marginBottom: 4 },
  value:    { fontSize: 28, fontWeight: "800" },
  label:    { fontSize: 12, color: "#A0A0B0", fontWeight: "600" },
  subtitle: { fontSize: 11, color: "#A0A0B0" },
});
