import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert } from "react-native";
import AppHeader from "../components/AppHeader";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", cardBorder: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  blue: "#3498db", green: "#2ecc71"
};

const INITIAL_DOCS = [
  { id: "1", name: "IRS Form 990 (2023)", type: "Tax Form", date: "Oct 1, 2024" },
  { id: "2", name: "CEO Resume - J. Smith", type: "Resume", date: "Sep 15, 2024" },
  { id: "3", name: "Minority Business Enterprise (MBE) Cert", type: "Certification", date: "Aug 20, 2024" }
];

export default function DocumentVaultScreen({ navigation }) {
  const [docs, setDocs] = useState(INITIAL_DOCS);

  const handleUpload = () => {
    Alert.alert("Upload Document", "Select a file to securely upload to your vault.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Select File", 
        onPress: () => {
          const newDoc = { id: Date.now().toString(), name: "New_Document.pdf", type: "Misc", date: "Today" };
          setDocs([newDoc, ...docs]);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Document Vault" navigation={navigation} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Secure Vault</Text>
            <Text style={styles.subtitle}>Store certs and tax forms for 1-click AI autofill.</Text>
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
            <Text style={styles.uploadBtnText}>+ Upload</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={docs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.docCard}>
              <View style={styles.docIcon}><Text style={{fontSize: 24}}>📄</Text></View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{item.name}</Text>
                <Text style={styles.docMeta}>{item.type} • Uploaded {item.date}</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.muted, maxWidth: 220 },
  uploadBtn: { backgroundColor: COLORS.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  uploadBtnText: { color: "#fff", fontWeight: "bold" },
  docCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center" },
  docIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center", marginRight: 16 },
  docInfo: { flex: 1 },
  docName: { color: COLORS.text, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  docMeta: { color: COLORS.muted, fontSize: 12 },
  viewBtn: { padding: 8 },
  viewBtnText: { color: COLORS.accent, fontWeight: "600" }
});
