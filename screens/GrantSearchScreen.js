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
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import GrantCard from "../components/GrantCard";
import { evaluateGrantFinancialFit } from "../services/financialMatchService";
import AppHeader from "../components/AppHeader";

export default function GrantSearchScreen({ navigation, route }) {
  const { businessProfile } = route?.params ?? {};
  const [grants, setGrants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [scoringId, setScoringId] = useState(null); // which card is being scored

  // ── Real-time grants feed ─────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "grants"), async (snapshot) => {
      const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Score all grants against the current user's financial profile in parallel
      const scored = await Promise.all(
        raw.map(async (grant) => {
          try {
            const fit = await evaluateGrantFinancialFit({
              maxRevenue: grant.maxRevenue,
              minRunwayMonths: grant.minRunwayMonths,
            });
            return { ...grant, matchScore: fit.liquidityScore, financiallyEligible: fit.financiallyEligible };
          } catch {
            return { ...grant, matchScore: null, financiallyEligible: null };
          }
        })
      );

      // Sort: eligible first, then by score descending
      scored.sort((a, b) => {
        if (a.financiallyEligible !== b.financiallyEligible) {
          return a.financiallyEligible ? -1 : 1;
        }
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      });

      setGrants(scored);
      setFiltered(scored);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Search filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      q
        ? grants.filter(
            (g) =>
              g.name?.toLowerCase().includes(q) ||
              g.description?.toLowerCase().includes(q)
          )
        : grants
    );
  }, [query, grants]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleSave(grant) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    // Track saved grant under the user's savedGrants sub-collection
    await setDoc(
      doc(db, "users", uid, "savedGrants", grant.id),
      { grantId: grant.id, savedAt: serverTimestamp() }
    );
  }

  function handleDiscard(grant) {
    setFiltered((prev) => prev.filter((g) => g.id !== grant.id));
  }

  function handlePress(grant) {
    navigation.navigate("GrantDetail", { grant });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Grant Search"
        navigation={navigation}
        rightElement={
          <TouchableOpacity
            style={styles.aiNavBtn}
            onPress={() => navigation.navigate("AIChat")}
          >
            <Text style={styles.aiNavText}>✦ AI Chat</Text>
          </TouchableOpacity>
        }
      />
      <Text style={styles.title}>Find Grants</Text>
      <Text style={styles.subtitle}>
        {businessProfile?.name
          ? `Matched funding for ${businessProfile.name} (${businessProfile.state})`
          : "Opportunities matched to your business profile."}
      </Text>

      {businessProfile?.name && (
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>
            🏢 {businessProfile.name} • {businessProfile.state} • {businessProfile.entityType || "LLC"}
          </Text>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or keyword..."
        placeholderTextColor="#aaa"
        value={query}
        onChangeText={setQuery}
        clearButtonMode="while-editing"
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loaderText}>Loading & scoring grants...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No grants match your search.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GrantCard
              grant={item}
              onPress={() => handlePress(item)}
              onSave={() => handleSave(item)}
              onDiscard={() => handleDiscard(item)}
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
  aiNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#22223B",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2B96F44",
  },
  aiNavText: {
    color: "#E2B96F",
    fontSize: 12,
    fontWeight: "700",
  },
  profileBadge: {
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E2B96F15",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2B96F44",
    alignSelf: "flex-start",
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C3E50",
  },
  searchInput: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  flatList:    { flex: 1 },
  list:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  loader:      { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText:  { color: "#666", fontSize: 15 },
  empty:       { alignItems: "center", marginTop: 60, gap: 8 },
  emptyIcon:   { fontSize: 40 },
  emptyText:   { fontSize: 15, color: "#888" },
});
