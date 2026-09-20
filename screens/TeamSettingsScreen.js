import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import AppHeader from "../components/AppHeader";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", cardBorder: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  green: "#2ecc71", blue: "#3498db"
};

export default function TeamSettingsScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState([
    { id: "1", email: "you@example.com", role: "Owner" }
  ]);

  const handleInvite = () => {
    if (!email.includes("@")) return;
    setMembers([...members, { id: Date.now().toString(), email, role: "Editor" }]);
    Alert.alert("Invite Sent!", `An invitation has been sent to ${email}.`);
    setEmail("");
  };

  const removeMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Team Workspace" navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.title}>Manage Team</Text>
        <Text style={styles.subtitle}>
          Invite co-founders, grant writers, or accountants to collaborate on your proposals in real-time.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite Member</Text>
          <View style={styles.inviteRow}>
            <TextInput
              style={styles.input}
              placeholder="colleague@company.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
              <Text style={styles.inviteBtnText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Workspace Members</Text>
        <FlatList
          data={members}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.email.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberEmail}>{item.email}</Text>
                <Text style={styles.memberRole}>{item.role}</Text>
              </View>
              {item.role !== "Owner" && (
                <TouchableOpacity onPress={() => removeMember(item.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
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
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 24, lineHeight: 20 },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 24 },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginBottom: 12 },
  inviteRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8, paddingHorizontal: 12, color: COLORS.text },
  inviteBtn: { backgroundColor: COLORS.blue, justifyContent: "center", paddingHorizontal: 16, borderRadius: 8 },
  inviteBtnText: { color: "#fff", fontWeight: "bold" },
  sectionHeader: { color: COLORS.accent, fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardBorder, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: COLORS.text, fontWeight: "bold", fontSize: 16 },
  memberInfo: { flex: 1 },
  memberEmail: { color: COLORS.text, fontSize: 15, fontWeight: "500" },
  memberRole: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  removeText: { color: COLORS.red, fontSize: 13, fontWeight: "500" }
});
