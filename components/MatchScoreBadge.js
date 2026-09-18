// components/MatchScoreBadge.js — AI match score badge (0-100)
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function getColor(score) {
  if (score === null || score === undefined) return "#555";
  if (score >= 75) return "#2ecc71";
  if (score >= 50) return "#E2B96F";
  if (score >= 30) return "#e67e22";
  return "#e74c3c";
}

function getLabel(score) {
  if (score === null || score === undefined) return "?";
  if (score >= 75) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 30) return "Fair";
  return "Low";
}

export default function MatchScoreBadge({ score, size = "medium" }) {
  const color = getColor(score);
  const label = getLabel(score);
  const small = size === "small";

  if (score === null || score === undefined) return null;

  return (
    <View style={[styles.badge, { borderColor: color + "88", backgroundColor: color + "22" }, small && styles.badgeSmall]}>
      <Text style={[styles.score, { color }, small && styles.scoreSmall]}>
        {score}
      </Text>
      <Text style={[styles.label, { color }, small && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge:       { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5, alignItems: "center" },
  badgeSmall:  { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  score:       { fontSize: 18, fontWeight: "800", lineHeight: 20 },
  scoreSmall:  { fontSize: 13, lineHeight: 16 },
  label:       { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  labelSmall:  { fontSize: 9 },
});
