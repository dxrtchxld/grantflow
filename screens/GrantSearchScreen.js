// screens/GrantSearchScreen.js (Dummy Data Version)
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TextInput, TouchableOpacity,
} from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import GrantCard from "../components/GrantCard";
import AppHeader from "../components/AppHeader";

const MOCK_GRANTS = [
  {
    id: "mock_1", name: "SBIR Phase I: AI Innovations in Healthcare",
    agency: "National Institutes of Health (NIH)", source: "SBIR.gov",
    amount: 275000, deadline: "2024-10-15",
    description: "Funding for small businesses developing novel AI/ML solutions to improve patient outcomes and healthcare delivery.",
    matchScore: 92, eligibility: ["For-profit small business", "Under 500 employees", "US-based"]
  },
  {
    id: "mock_2", name: "Community Revitalization & Small Business Grant",
    agency: "Economic Development Administration", source: "Grants.gov",
    amount: 50000, deadline: "2024-11-01",
    description: "Aimed at helping main street businesses upgrade their digital infrastructure and expand local hiring.",
    matchScore: 78, eligibility: ["Registered LLC or Corp", "Targeted revitalization zones"]
  },
  {
    id: "mock_3", name: "Green Energy Tech Seed Fund",
    agency: "Department of Energy", source: "Grants.gov",
    amount: 150000, deadline: "2024-12-05",
    description: "Seed funding for startups building sustainable energy, battery tech, or energy efficiency software.",
    matchScore: 65, eligibility: ["Technology startup", "Proposing measurable emissions reduction"]
  },
  {
    id: "mock_4", name: "Local Arts & Culture Initiative",
    agency: "National Endowment for the Arts", source: "Grants.gov",
    amount: 25000, deadline: "2024-09-30",
    description: "Grants for local organizations producing community-driven art projects, festivals, or educational programs.",
    matchScore: 42, eligibility: ["501(c)(3) Nonprofit", "Minimum 3 years of operation"]
  },
  {
    id: "mock_5", name: "Rural AgTech Innovation Challenge",
    agency: "USDA", source: "Grants.gov",
    amount: 100000, deadline: "2025-01-15",
    description: "Support for businesses creating hardware or software to improve crop yields or agricultural supply chains.",
    matchScore: 55, eligibility: ["Operating in rural county", "Ag-focused business plan"]
  }
];

export default function GrantSearchScreen({ navigation, route }) {
  const { businessProfile } = route?.params ?? {};
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(MOCK_GRANTS);

  const handleSearch = () => {
    const q = query.toLowerCase();
    setFiltered(q ? MOCK_GRANTS.filter(g => 
      g.name.toLowerCase().includes(q) || 
      g.description.toLowerCase().includes(q)
    ) : MOCK_GRANTS);
  };

  async function handleSave(grant) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "savedGrants", grant.id), {
      grantId: grant.id, name: grant.name, amount: grant.amount,
      deadline: grant.deadline, savedAt: serverTimestamp()
    });
  }

  function handleDiscard(grant) {
    setFiltered(prev => prev.filter(g => g.id !== grant.id));
  }

  function handlePress(grant) {
    navigation.navigate("GrantDetail", { grant });
  }

  function handleStartProposal(grant) {
    navigation.navigate("ProposalEditor", { grant, orgContext: businessProfile || {} });
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Grant Search"
        navigation={navigation}
        rightElement={
          <TouchableOpacity style={styles.aiNavBtn} onPress={() => navigation.navigate("AIChat")}>
            <Text style={styles.aiNavText}>✦ AI Chat</Text>
          </TouchableOpacity>
        }
      />
      <Text style={styles.title}>Find Grants</Text>
      <Text style={styles.subtitle}>
        {businessProfile?.name ? `Matched funding for ${businessProfile.name}` : "Showing sample grants (Demo Mode)"}
      </Text>

      <View style={styles.demoBanner}>
        <Text style={styles.demoText}>ℹ️ Demo Mode: Showing realistic dummy grants.</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search sample grants..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.flatList}
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No sample grants match your search.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <GrantCard
            grant={item}
            onPress={() => handlePress(item)}
            onSave={() => handleSave(item)}
            onDiscard={() => handleDiscard(item)}
            onStartProposal={() => handleStartProposal(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#f8f9fa" },
  title:       { fontSize: 24, fontWeight: "bold", color: "#333", paddingHorizontal: 20, paddingTop: 12, marginBottom: 2 },
  subtitle:    { fontSize: 14, color: "#666", paddingHorizontal: 20, marginBottom: 12 },
  aiNavBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#22223B", borderRadius: 6, borderWidth: 1, borderColor: "#E2B96F44" },
  aiNavText: { color: "#E2B96F", fontSize: 12, fontWeight: "700" },
  demoBanner: { backgroundColor: "#e8f8f5", padding: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: "#a3e4d7" },
  demoText: { color: "#117a65", fontSize: 12, fontWeight: "600", textAlign: "center" },
  searchRow: { flexDirection: "row", marginHorizontal: 20, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e0e0e0", paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#333" },
  searchBtn: { backgroundColor: "#3498db", justifyContent: "center", paddingHorizontal: 20, borderRadius: 10 },
  searchBtnText: { color: "#fff", fontWeight: "bold" },
  flatList:    { flex: 1 },
  list:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  empty:       { alignItems: "center", marginTop: 60, gap: 8 },
  emptyIcon:   { fontSize: 40 },
  emptyText:   { fontSize: 15, color: "#888" },
});
