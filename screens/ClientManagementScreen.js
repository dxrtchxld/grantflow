// screens/ClientManagementScreen.js — Multi-Client Management & Workspace Selector
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, Alert, ScrollView
} from "react-native";
import AppHeader from "../components/AppHeader";
import { getOrCreateFirmWorkspace, getFirmClients, createClientWorkspace, SEED_CLIENTS } from "../services/tenancyService";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", border: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  blue: "#3498db", green: "#2ecc71"
};

export default function ClientManagementScreen({ navigation }) {
  const [firm, setFirm] = useState(null);
  const [clients, setClients] = useState(SEED_CLIENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newState, setNewState] = useState("");

  useEffect(() => {
    async function loadData() {
      const f = await getOrCreateFirmWorkspace();
      setFirm(f);
      if (f) {
        const fetched = await getFirmClients(f.id);
        if (fetched && fetched.length > 0) {
          setClients(fetched);
        }
      }
    }
    loadData();
  }, []);

  const handleAddClient = async () => {
    if (!newBizName.trim()) {
      Alert.alert("Missing Name", "Please enter a client business name.");
      return;
    }

    const payload = {
      businessName: newBizName,
      industry: newIndustry || "General",
      state: newState || "US",
      entityType: "LLC",
      status: "Active",
      matchCount: 3,
    };

    if (firm) {
      const created = await createClientWorkspace(firm.id, payload);
      setClients([created, ...clients]);
    } else {
      setClients([{ id: Date.now().toString(), ...payload }, ...clients]);
    }

    setNewBizName("");
    setNewIndustry("");
    setNewState("");
    setShowAdd(false);
    Alert.alert("Client Created", `Workspace for ${payload.businessName} initialized.`);
  };

  const handleSelectClient = (client) => {
    Alert.alert("Active Workspace Set", `Switching to workspace: ${client.businessName}`, [
      {
        text: "Search Grants for Client",
        onPress: () => navigation.navigate("GrantSearch", { businessProfile: client })
      },
      {
        text: "View Dashboard",
        onPress: () => navigation.navigate("AnalyticsDashboard", { activeClient: client })
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Client Workspaces" navigation={navigation} />
      <ScrollView style={styles.content}>
        <View style={styles.headerBox}>
          <Text style={styles.title}>Advisor Client Portfolio</Text>
          <Text style={styles.subtitle}>
            Manage up to 10 active client workspaces. Each workspace isolates client data, funding strategies, and proposals.
          </Text>
        </View>

        {/* Firm Status */}
        <View style={styles.firmCard}>
          <View style={styles.firmHeader}>
            <View>
              <Text style={styles.firmName}>{firm?.name || "Advisory Practice"}</Text>
              <Text style={styles.firmPlan}>Plan: Advisor ($199/mo) • {clients.length}/10 Client Seats Used</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
              <Text style={styles.addBtnText}>{showAdd ? "Cancel" : "+ Add Client"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Client Form */}
        {showAdd && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>New Client Workspace Intake</Text>
            <TextInput
              style={styles.input}
              placeholder="Business Name (e.g. Acme Health Corp)"
              placeholderTextColor="#888"
              value={newBizName}
              onChangeText={setNewBizName}
            />
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Industry (e.g. BioTech)"
                placeholderTextColor="#888"
                value={newIndustry}
                onChangeText={setNewIndustry}
              />
              <TextInput
                style={[styles.input, { width: 80 }]}
                placeholder="State (e.g. MA)"
                placeholderTextColor="#888"
                value={newState}
                onChangeText={setNewState}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddClient}>
              <Text style={styles.saveBtnText}>Create Client Workspace</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Client List */}
        <Text style={styles.sectionHeader}>Active Client Workspaces</Text>
        {clients.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.clientCard}
            onPress={() => handleSelectClient(item)}
          >
            <View style={styles.clientTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.businessName.charAt(0)}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.businessName}</Text>
                <Text style={styles.clientMeta}>{item.industry} • {item.state} ({item.entityType})</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.clientFooter}>
              <Text style={styles.footerText}>SAM.gov / UEI: {item.uei || "Unverified ⚠️"}</Text>
              <Text style={styles.matchLink}>Select Workspace →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: 20 },
  headerBox: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  firmCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  firmHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  firmName: { color: COLORS.accent, fontSize: 16, fontWeight: "700" },
  firmPlan: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  addBtn: { backgroundColor: COLORS.blue, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  addForm: { backgroundColor: "#141C33", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accent, marginBottom: 20, gap: 10 },
  formTitle: { color: COLORS.accent, fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, fontSize: 14 },
  formRow: { flexDirection: "row", gap: 10 },
  saveBtn: { backgroundColor: COLORS.green, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sectionHeader: { color: COLORS.accent, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  clientCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, marginBottom: 12 },
  clientTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.border, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: COLORS.accent, fontWeight: "bold", fontSize: 18 },
  clientInfo: { flex: 1 },
  clientName: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  clientMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: "#2ecc7122", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.green },
  badgeText: { color: COLORS.green, fontSize: 11, fontWeight: "bold" },
  clientFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerText: { color: COLORS.muted, fontSize: 11 },
  matchLink: { color: COLORS.accent, fontSize: 12, fontWeight: "bold" },
});
