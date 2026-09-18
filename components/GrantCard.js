// components/GrantCard.js — Upgraded with AI match score, source badge, Write Proposal button
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

function getScoreStyle(score) {
  if (score >= 75) return { badge: styles.scoreBadgeHigh, text: styles.scoreTextHigh };
  if (score >= 50) return { badge: styles.scoreBadgeMid,  text: styles.scoreTextMid  };
  return             { badge: styles.scoreBadgeLow,  text: styles.scoreTextLow  };
}

function formatAmount(amount) {
  if (amount == null || amount === "" || amount === 0) return "Amount Varies";
  if (typeof amount === "string") return amount;
  return `$${amount.toLocaleString()}`;
}

function formatDeadline(deadline) {
  if (!deadline) return null;
  if (typeof deadline === "string") return deadline;
  if (deadline?.toDate) return deadline.toDate().toLocaleDateString();
  return null;
}

const GrantCard = ({ grant, onSave, onDiscard, onPress, onStartProposal }) => {
  const score     = grant.matchScore ?? null;
  const showScore = score !== null && score !== undefined;
  const { badge: badgeStyle, text: scoreTextStyle } = showScore ? getScoreStyle(score) : { badge: {}, text: {} };
  const deadline  = formatDeadline(grant.deadline);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <Text style={styles.grantName} numberOfLines={2}>{grant.name}</Text>
        {showScore && (
          <View style={[styles.scoreBadge, badgeStyle]}>
            <Text style={[styles.scoreText, scoreTextStyle]}>{score}%</Text>
            <Text style={[styles.scoreLabel, scoreTextStyle]}>Match</Text>
          </View>
        )}
      </View>

      {/* Source + agency */}
      <View style={styles.pillRow}>
        {grant.source && (
          <View style={styles.sourcePill}>
            <Text style={styles.sourcePillText}>{grant.source}</Text>
          </View>
        )}
        {grant.agency ? (
          <Text style={styles.agencyText} numberOfLines={1}>{grant.agency}</Text>
        ) : null}
      </View>

      <Text style={styles.amountText}>{formatAmount(grant.amount)}</Text>
      <Text style={styles.descriptionText} numberOfLines={2}>{grant.description}</Text>
      {deadline && <Text style={styles.deadlineText}>📅 {deadline}</Text>}

      <View style={styles.actionRow} onStartShouldSetResponder={() => true}>
        <TouchableOpacity style={[styles.actionBtn, styles.discardBtn]} onPress={onDiscard} activeOpacity={0.75}>
          <Text style={styles.discardBtnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={onSave} activeOpacity={0.75}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        {onStartProposal && (
          <TouchableOpacity style={[styles.actionBtn, styles.proposalBtn]} onPress={onStartProposal} activeOpacity={0.75}>
            <Text style={styles.proposalBtnText}>✨ Propose</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  grantName: { fontSize: 17, fontWeight: "bold", color: "#333", flex: 1 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: "center", minWidth: 52 },
  scoreText:  { fontWeight: "800", fontSize: 14, lineHeight: 16 },
  scoreLabel: { fontWeight: "700", fontSize: 9, letterSpacing: 0.5 },
  scoreBadgeHigh: { backgroundColor: "#e8f8f5" },
  scoreTextHigh:  { color: "#27ae60" },
  scoreBadgeMid:  { backgroundColor: "#fef9e7" },
  scoreTextMid:   { color: "#d4ac0d" },
  scoreBadgeLow:  { backgroundColor: "#fdf2f2" },
  scoreTextLow:   { color: "#c0392b" },
  pillRow:        { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  sourcePill:     { backgroundColor: "#f0f4ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sourcePillText: { color: "#3498db", fontSize: 11, fontWeight: "700" },
  agencyText:     { color: "#888", fontSize: 11, flex: 1 },
  amountText:     { fontSize: 19, fontWeight: "bold", color: "#2980b9", marginBottom: 6 },
  descriptionText: { fontSize: 14, color: "#666", marginBottom: 8, lineHeight: 19 },
  deadlineText:   { fontSize: 12, color: "#999", marginBottom: 12 },
  actionRow:      { flexDirection: "row", gap: 8 },
  actionBtn:      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  discardBtn:     { backgroundColor: "#fdf2f2" },
  discardBtnText: { color: "#c0392b", fontWeight: "700", fontSize: 13 },
  saveBtn:        { backgroundColor: "#3498db" },
  saveBtnText:    { color: "#fff", fontWeight: "700", fontSize: 13 },
  proposalBtn:    { backgroundColor: "#E2B96F" },
  proposalBtnText: { color: "#1A1A2E", fontWeight: "700", fontSize: 13 },
});

export default GrantCard;
