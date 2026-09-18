// screens/DeadlineTrackerScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase"; // ✅ Fixed: correct root-level import path

/**
 * Returns days remaining until a Firestore Timestamp deadline.
 * Negative values mean the deadline has passed.
 * Returns null when no deadline is set.
 */
function getDaysRemaining(deadlineTimestamp) {
  if (!deadlineTimestamp?.toDate) return null;
  const diffMs = deadlineTimestamp.toDate() - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Three-tier urgency system:
 *   Expired  → grey   (past deadline)
 *   Critical → red    (< 7 days)
 *   Warning  → amber  (7–13 days)
 *   Safe     → green  (≥ 14 days or no deadline)
 */
function getUrgencyStyle(daysLeft) {
  if (daysLeft === null)  return { badge: styles.badgeNone,     label: "No deadline"         };
  if (daysLeft < 0)       return { badge: styles.badgeExpired,  label: "Expired"             };
  if (daysLeft < 7)       return { badge: styles.badgeCritical, label: `${daysLeft}d left`   };
  if (daysLeft < 14)      return { badge: styles.badgeWarning,  label: `${daysLeft}d left`   };
  return                         { badge: styles.badgeSafe,     label: `${daysLeft}d left`   };
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No saved grants yet</Text>
      <Text style={styles.emptyBody}>
        Save grants from the Grant Search screen to track their deadlines here.
      </Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
const DeadlineTrackerScreen = ({ navigation }) => {
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    // ✅ Fixed: always derive uid from verified auth session — never from route.params
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "grants"),
      where("savedBy", "array-contains", currentUser.uid) // uid is now auth-sourced
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grantsList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort: upcoming deadlines first, no-deadline grants last
      grantsList.sort((a, b) => {
        const aMs = a.deadline?.toMillis?.() ?? Infinity;
        const bMs = b.deadline?.toMillis?.() ?? Infinity;
        return aMs - bMs;
      });

      setDeadlines(grantsList);
    });

    return () => unsubscribe();
  }, []); // auth.currentUser is stable for the lifetime of this screen

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Grant Deadlines</Text>
      <Text style={styles.subtitle}>
        Active countdowns for your saved funding opportunities.
      </Text>

      <FlatList
        data={deadlines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={deadlines.length === 0 && styles.emptyList}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => {
          const daysLeft = getDaysRemaining(item.deadline);
          const { badge, label } = getUrgencyStyle(daysLeft);

          // ✅ Fixed: $ only shown for real numeric amounts
          const amountLabel =
            item.amount && item.amount > 0
              ? `$${item.amount.toLocaleString()}`
              : "TBD";

          return (
            <TouchableOpacity
              style={[styles.card, daysLeft !== null && daysLeft < 0 && styles.cardExpired]}
              onPress={() =>
                // ✅ Fixed: userId dropped from nav params — GrantDetailScreen reads from auth
                navigation.navigate("GrantDetail", { grant: item })
              }
              activeOpacity={0.8}
            >
              <View style={styles.row}>
                <Text style={styles.grantTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[styles.urgencyBadge, badge]}>
                  <Text style={[styles.urgencyText, badge]}>{label}</Text>
                </View>
              </View>
              <Text style={styles.amount}>{amountLabel}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title:      { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 4 },
  subtitle:   { fontSize: 14, color: "#666", marginBottom: 20 },

  // ── Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardExpired: { opacity: 0.55 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  grantTitle: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1, marginRight: 8 },
  amount:     { fontSize: 14, fontWeight: "600", color: "#2980b9" },

  // ── Urgency badges
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  urgencyText:  { fontSize: 12, fontWeight: "bold" },

  badgeCritical: { backgroundColor: "#fdf2f2", color: "#c0392b" },
  badgeWarning:  { backgroundColor: "#fef9e7", color: "#d4ac0d" },
  badgeSafe:     { backgroundColor: "#e8f8f5", color: "#27ae60" },
  badgeExpired:  { backgroundColor: "#f0f0f0", color: "#999"    },
  badgeNone:     { backgroundColor: "#f0f0f0", color: "#aaa"    },

  // ── Empty state
  emptyList:      { flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  emptyIcon:      { fontSize: 48 },
  emptyTitle:     { fontSize: 18, fontWeight: "bold", color: "#333" },
  emptyBody:      { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
});

export default DeadlineTrackerScreen;
