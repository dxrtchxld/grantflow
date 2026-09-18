// components/GrantCard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

/**
 * Returns badge styles based on match score thresholds.
 * ≥ 75 → green  |  ≥ 50 → amber  |  < 50 → red
 */
function getScoreStyle(score) {
  if (score >= 75) return { badge: styles.scoreBadgeHigh,  text: styles.scoreTextHigh  };
  if (score >= 50) return { badge: styles.scoreBadgeMid,   text: styles.scoreTextMid   };
  return             { badge: styles.scoreBadgeLow,   text: styles.scoreTextLow   };
}

/** Format the funding amount — handles numbers, missing values, and "Varies". */
function formatAmount(amount) {
  if (amount == null || amount === "") return "Amount Varies";
  if (typeof amount === "string") return amount;
  if (amount === 0) return "Amount Varies";
  return `$${amount.toLocaleString()}`;
}

const GrantCard = ({ grant, onSave, onDiscard, onPress }) => {
  const score = grant.matchScore ?? 85;
  const { badge: badgeStyle, text: scoreTextStyle } = getScoreStyle(score);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <Text style={styles.grantName} numberOfLines={1}>
          {grant.name}
        </Text>
        <View style={[styles.scoreBadge, badgeStyle]}>
          <Text style={[styles.scoreText, scoreTextStyle]}>{score}% Match</Text>
        </View>
      </View>

      <Text style={styles.amountText}>{formatAmount(grant.amount)}</Text>
      <Text style={styles.descriptionText} numberOfLines={2}>
        {grant.description}
      </Text>

      {/* onStartShouldSetResponder captures touches here so they don't
          bubble up to the outer TouchableOpacity card press handler */}
      <View style={styles.actionRow} onStartShouldSetResponder={() => true}>
        <TouchableOpacity
          style={[styles.actionButton, styles.discardButton]}
          onPress={onDiscard}
          activeOpacity={0.75}
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={onSave}
          activeOpacity={0.75}
        >
          <Text style={styles.saveButtonText}>Save Grant</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  grantName: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1, marginRight: 8 },

  // ── Score badge — base
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scoreText:  { fontWeight: "bold", fontSize: 12 },

  // ── Score badge — high (≥ 75%)
  scoreBadgeHigh: { backgroundColor: "#e8f8f5" },
  scoreTextHigh:  { color: "#27ae60" },

  // ── Score badge — mid (50–74%)
  scoreBadgeMid: { backgroundColor: "#fef9e7" },
  scoreTextMid:  { color: "#d4ac0d" },

  // ── Score badge — low (< 50%)
  scoreBadgeLow: { backgroundColor: "#fdf2f2" },
  scoreTextLow:  { color: "#c0392b" },

  amountText:      { fontSize: 20, fontWeight: "bold", color: "#2980b9", marginBottom: 8 },
  descriptionText: { fontSize: 14, color: "#666", marginBottom: 16 },
  actionRow:       { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  actionButton:    { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  discardButton:   { backgroundColor: "#fdf2f2" },
  discardButtonText: { color: "#c0392b", fontWeight: "bold" },
  saveButton:      { backgroundColor: "#3498db" },
  saveButtonText:  { color: "#fff", fontWeight: "bold" },
});

export default GrantCard;
