// screens/ComplianceReportScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { chat } from '../services/aiService'; // ✅ Reuses shared Mistral client
import AppHeader from '../components/AppHeader';

// ✅ Fixed: no hardcoded real-world grant name as a fallback — missing params
// produce an explicit error instead of a silently fabricated named document
const ComplianceReportScreen = ({ navigation, route }) => {
  const { grantName, awardAmount } = route.params || {};
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  // Guard: screen requires grant context to function
  if (!grantName || awardAmount == null) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Compliance Vault" navigation={navigation} />
        <View style={styles.body}>
          <Text style={styles.title}>Post-Award Compliance Vault</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              No grant selected. Navigate here from a saved grant to generate its compliance report.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Fixed: parse awardAmount to number so toLocaleString() formats correctly
  // even if route.params serialized it as a string
  const amount = Number(awardAmount);

  const generateAuditReport = async () => {
    setLoading(true);
    try {
      // ✅ Fixed: uses chat() → /v1/chat/completions + choices[0].message.content
      // ✅ Fixed: model "mistral-small-latest" (versioned name)
      const result = await chat(
        [
          {
            role: 'system',
            content:
              'You are a professional grant compliance officer. Generate clear, ' +
              'structured post-award compliance reports. Always include a prominent ' +
              'disclaimer that the report is AI-generated and must be reviewed by a ' +
              'qualified accountant or attorney before submission to any funding body.',
          },
          {
            role: 'user',
            content:
              `Generate a professional post-award financial compliance and expense ` +
              `report for a grant called "${grantName}" with an award amount of ` +
              `$${amount.toLocaleString()}.\n\n` +
              `Include sections for:\n` +
              `1. Executive Summary of Fund Allocation\n` +
              `2. Line-Item Expense Breakdown (R&D, Operations, Payroll)\n` +
              `3. Compliance Audit Attestation Statement`,
          },
        ],
        'mistral-small-latest'
      );

      setReport(result);
    } catch {
      Alert.alert('Error', 'Could not generate compliance report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Compliance Vault" navigation={navigation} />
      <View style={styles.body}>
        <Text style={styles.title}>Post-Award Compliance Vault</Text>
        <Text style={styles.subtitle}>
          Automated audit report for {grantName} (${amount.toLocaleString()}).
        </Text>

        {/* ✅ Fixed: legal disclaimer — AI output must not be filed as a real document */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️ AI-generated draft only. Review with a qualified accountant or attorney
            before submitting to any government or funding body.
          </Text>
        </View>

        {report ? (
          <ScrollView
            style={styles.reportBox}
            contentContainerStyle={styles.reportContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.reportText}>{report}</Text>
          </ScrollView>
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              Link your bank via Plaid to auto-populate expenses, then tap below to
              generate your AI draft compliance report.
            </Text>
          </View>
        )}

        {/* ✅ Fixed: disabled visual state applied when loading */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={generateAuditReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {report ? 'Regenerate Report' : 'Generate AI Audit Report'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f8f9fa' },
  body:         { flex: 1, padding: 20 },
  title:        { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle:     { fontSize: 14, color: '#666', marginBottom: 12 },

  // ── Disclaimer
  disclaimerBox: {
    backgroundColor: '#fef9e7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d4ac0d',
    padding: 12,
    marginBottom: 16,
  },
  disclaimerText: { fontSize: 12, color: '#7d6608', lineHeight: 17 },

  // ── Report / placeholder
  reportBox:    { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 20 },
  reportContent: { flexGrow: 1, padding: 16 },
  reportText:   { fontSize: 14, color: '#333', lineHeight: 22 },
  placeholderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
    padding: 20,
  },
  placeholderText: { color: '#888', textAlign: 'center', lineHeight: 20 },

  // ── Button
  button:         { backgroundColor: '#27ae60', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#95a5a6' },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ComplianceReportScreen;
