// screens/GrantComplianceWarningModal.js
import React from 'react';
import {
  View, Text, StyleSheet, Modal,
  TouchableOpacity, TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ Precise bottom inset for sheet

const GrantComplianceWarningModal = ({ visible, grantName, amount, onClose, onAccept }) => {
  // ✅ Fixed: useSafeAreaInsets instead of SafeAreaView inside Modal
  //    SafeAreaView inside Modal produces inconsistent insets on iOS
  const insets = useSafeAreaInsets();

  // ✅ Fixed: amount display — $ only shown for real numeric values
  const amountLabel =
    amount != null && Number(amount) > 0
      ? `$${Number(amount).toLocaleString()}`
      : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      // ✅ Fixed: required on Android so the hardware back button closes the modal
      onRequestClose={onClose}
    >
      {/* ✅ Tapping the dim overlay also closes the modal */}
      <TouchableWithoutFeedback onPress={onClose} accessible={false}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>⚠️ Important Funder Terms</Text>
        <Text style={styles.subtitle}>
          Before applying for "{grantName}"{amountLabel ? ` (${amountLabel})` : ""}:
        </Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>1. Reimbursement Structure</Text>
          <Text style={styles.warningText}>
            Most local grants require you to incur expenses first and submit receipts
            for reimbursement. Ensure you have sufficient operational liquidity before applying.
          </Text>

          <Text style={styles.warningTitle}>2. Potential Tax Implications</Text>
          <Text style={styles.warningText}>
            Grant awards may be considered taxable income depending on your business
            structure, grant type, and jurisdiction. Tax treatment varies — consult a
            qualified tax professional or CPA before filing.
          </Text>

          {/* ✅ Fixed: removed the false "GrantFlow has automatically allocated a 20%
              tax buffer" claim. The app has not done this, and stating so could cause
              users to under-save for taxes and face IRS penalties. */}
        </View>

        {/* Legal disclaimer */}
        <Text style={styles.disclaimer}>
          This information is for general awareness only and does not constitute legal,
          financial, or tax advice. GrantFlow is not a licensed financial advisor.
        </Text>

        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>I Understand, Proceed to Apply</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Review Later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ── Overlay (sits behind sheet, tappable to dismiss) ──────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },

  title:    { fontSize: 22, fontWeight: "bold", color: "#c0392b", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 16 },

  // ── Warning box ───────────────────────────────────────────────────────────
  warningBox: {
    backgroundColor: "#fdf2f2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f5c6cb",
  },
  warningTitle: { fontSize: 14, fontWeight: "bold", color: "#721c24", marginBottom: 4 },
  warningText:  { fontSize: 13, color: "#721c24", marginBottom: 12, lineHeight: 18 },

  // ── Legal disclaimer ──────────────────────────────────────────────────────
  disclaimer: {
    fontSize: 11,
    color: "#999",
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  acceptButton:     { backgroundColor: "#27ae60", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  acceptButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton:     { padding: 12, alignItems: "center" },
  cancelButtonText: { color: "#7f8c8d", fontSize: 14, fontWeight: "600" },
});

export default GrantComplianceWarningModal;
