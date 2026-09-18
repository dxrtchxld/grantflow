// screens/GrantSearchScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import GrantCard from "../components/GrantCard";
import AppHeader from "../components/AppHeader";
import { searchGrantsFromAPI } from "../services/proposalService";
import env from "../env";

export default function GrantSearchScreen({ navigation, route }) {
  const { businessProfile } = route?.params ?? {};
  const [grants, setGrants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load from Firestore as a fallback / initial state
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "grants"), (snapshot) => {
      const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (raw.length > 0 && grants.length === 0) {
        setGrants(raw);
        setFiltered(raw);
      }
    });
    return () => unsubscribe();
  }, []);

  // Search live Grants.gov API
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Call our new Python backend
      const results = await searchGrantsFromAPI(query);
      if (results && results.length > 0) {
        setGrants(results);
        setFiltered(results);
      } else {
        setFiltered([]);
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("BACKEND_URL not set")) {
        setErrorMsg("Backend not connected! Please deploy your Python functions and set BACKEND_URL in .env.");
      } else {
        setErrorMsg("Failed to search grants. Make sure your backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleSave(grant) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "savedGrants", grant.id || grant.name), {
      grantId: grant.id || grant.name,
      name: grant.name,
      amount: grant.amount,
      deadline: grant.deadline,
      savedAt: serverTimestamp()
    });
  }

  function handleDiscard(grant) {
    setFiltered((prev) => prev.filter((g) => g.id !== grant.id && g.name !== grant.name));
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
        {businessProfile?.name
          ? `Matched funding for ${businessProfile.name} (${businessProfile.state})`
          : "Search live federal & private grants."}
      </Text>

      {!env.backendUrl && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠️ Live scraping is offline. Deploy backend to enable.</Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or keyword..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loaderText}>Scraping live grants...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={filtered}
          keyExtractor={(item, index) => item.id || String(index)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No grants found. Try a different keyword.</Text>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#f8f9fa" },
  title:       { fontSize: 24, fontWeight: "bold", color: "#333", paddingHorizontal: 20, paddingTop: 12, marginBottom: 2 },
  subtitle:    { fontSize: 14, color: "#666", paddingHorizontal: 20, marginBottom: 12 },
  aiNavBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#22223B", borderRadius: 6, borderWidth: 1, borderColor: "#E2B96F44" },
  aiNavText: { color: "#E2B96F", fontSize: 12, fontWeight: "700" },
  warningBanner: { backgroundColor: "#fdf2f2", padding: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: "#fadbd8" },
  warningText: { color: "#c0392b", fontSize: 12, fontWeight: "600", textAlign: "center" },
  searchRow: { flexDirection: "row", marginHorizontal: 20, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e0e0e0", paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#333" },
  searchBtn: { backgroundColor: "#3498db", justifyContent: "center", paddingHorizontal: 20, borderRadius: 10 },
  searchBtnText: { color: "#fff", fontWeight: "bold" },
  errorBox: { marginHorizontal: 20, marginBottom: 10, padding: 12, backgroundColor: "#fdf2f2", borderRadius: 8, borderWidth: 1, borderColor: "#fadbd8" },
  errorText: { color: "#c0392b", fontSize: 13, textAlign: "center" },
  flatList:    { flex: 1 },
  list:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  loader:      { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText:  { color: "#666", fontSize: 15 },
  empty:       { alignItems: "center", marginTop: 60, gap: 8 },
  emptyIcon:   { fontSize: 40 },
  emptyText:   { fontSize: 15, color: "#888" },
});
