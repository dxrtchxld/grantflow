// components/EligibilityMatrixCard.js — Evidence-Backed Eligibility & Pursuit Decision
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";

const COLORS = {
  bg: "#16213E",
  border: "#2A2A44",
  text: "#FFFFFF",
  muted: "#A0A0B0",
  green: "#2ecc71",
  red: "#e74c3c",
  yellow: "#f39c12",
  blue: "#3498db",
  gold: "#E2B96F",
};

export default function EligibilityMatrixCard({ economics, onAssignUnknown }) {
  if (!economics) return null;

  const { fitScore, probabilityBand, estimatedHours, decision, reasoning, evalResult } = economics;

  const getBadgeStyle = (status) => {
    switch (status) {
      case "PASS": return { bg: "#1e379922", border: COLORS.green, text: COLORS.green };
      case "FAIL": return { bg: "#b7154022", border: COLORS.red, text: COLORS.red };
      case "UNKNOWN": return { bg: "#e67e2222", border: COLORS.yellow, text: COLORS.yellow };
      default: return { bg: "#3c40c622", border: COLORS.muted, text: COLORS.muted };
    }
  };

  const getDecisionColor = (d) => {
    switch (d) {
      case "PURSUE": return COLORS.green;
      case "PARTNER": return COLORS.blue;
      case "WAIT": return COLORS.yellow;
      case "DECLINE": return COLORS.red;
      default: return COLORS.gold;
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Pursuit Decision Banner */}
      <View style={styles.decisionBanner}>
        <View style={styles.decisionLeft}>
          <Text style={styles.decisionLabel}>PURSUIT RECOMMENDATION</Text>
          <Text style={[styles.decisionBadge, { color: getDecisionColor(decision) }]}>{decision}</Text>
        </View>
        <View style={styles.metricsGroup}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{fitScore}%</Text>
            <Text style={styles.metricSub}>Fit Score</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{estimatedHours}h</Text>
            <Text style={styles.metricSub}>Est. Effort</Text>
          </View>
        </View>
      </View>
      <Text style={styles.reasoningText}>{reasoning}</Text>

      {/* Evidence-Backed Matrix */}
      <View style={styles.matrixHeader}>
        <Text style={styles.matrixTitle}>EVIDENCE-BACKED ELIGIBILITY MATRIX</Text>
        <Text style={styles.matrixSub}>
          {evalResult.passCount} PASS • {evalResult.unknownCount} UNKNOWN • {evalResult.failCount} FAIL
        </Text>
      </View>

      {evalResult.rules.map((rule) => {
        const badge = getBadgeStyle(rule.status);
        return (
          <View key={rule.id} style={styles.ruleRow}>
            <View style={styles.ruleTop}>
              <Text style={styles.ruleName}>{rule.name}</Text>
              <View style={[styles.statusTag, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                <Text style={[styles.statusText, { color: badge.text }]}>{rule.status}</Text>
              </View>
            </View>
            <Text style={styles.evidenceText}>📌 {rule.evidence}</Text>
            <View style={styles.provenanceRow}>
              <Text style={styles.provenanceText}>
                Source: {rule.sourceSection} ({rule.retrievedAt})
              </Text>
            </View>
            {rule.actionRequired && onAssignUnknown && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onAssignUnknown(rule)}
              >
                <Text style={styles.actionBtnText}>⚡ Assign Unknown to Client Queue</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  decisionBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 10,
  },
  decisionLeft: { flex: 1 },
  decisionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  decisionBadge: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  metricsGroup: { flexDirection: "row", gap: 16 },
  metricItem: { alignItems: "flex-end" },
  metricVal: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  metricSub: { color: COLORS.muted, fontSize: 10 },
  reasoningText: { color: COLORS.text, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  matrixHeader: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  matrixTitle: { color: COLORS.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  matrixSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  ruleRow: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#25253D",
  },
  ruleTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  ruleName: { color: COLORS.text, fontSize: 14, fontWeight: "600", flex: 1, marginRight: 8 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "800" },
  evidenceText: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginBottom: 6 },
  provenanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  provenanceText: { color: "#666", fontSize: 10, fontStyle: "italic" },
  actionBtn: { marginTop: 8, backgroundColor: "#e67e2222", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: COLORS.yellow },
  actionBtnText: { color: COLORS.yellow, fontSize: 11, fontWeight: "700", textAlign: "center" },
});
