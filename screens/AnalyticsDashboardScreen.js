// screens/AnalyticsDashboardScreen.js
// User analytics: grant stats, urgency breakdown, activity feed
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import AppHeader from "../components/AppHeader";

const COLORS = {
  bg: "#1A1A2E",
  card: "#16213E",
  cardBorder: "#2A2A44",
  accent: "#E2B96F",
  text: "#FFFFFF",
  muted: "#A0A0B0",
  green: "#2ecc71",
  red: "#e74c3c",
  blue: "#3498db",
  purple: "#9b59b6",
};

function StatCard({ icon, label, value, color, subtitle }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function UrgencyBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.urgencyRow}>
      <Text style={styles.urgencyLabel}>{label}</Text>
      <View style={styles.urgencyBarBg}>
        <View style={[styles.urgencyBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.urgencyCount, { color }]}>{count}</Text>
    </View>
  );
}

function getDaysRemaining(ts) {
  if (!ts?.toDate) return null;
  return Math.ceil((ts.toDate() - new Date()) / (1000 * 60 * 60 * 24));
}

export default function AnalyticsDashboardScreen({ navigation }) {
  const [loading, setLoading]       = useState(true);
  const [savedGrants, setSavedGrants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [proposals, setProposals]   = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const unsubSaved = onSnapshot(
      collection(db, "users", uid, "savedGrants"),
      snap => setSavedGrants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubApps = onSnapshot(
      query(collection(db, "applications"), where("userId", "==", uid)),
      snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubProps = onSnapshot(
      query(collection(db, "proposals"), where("userId", "==", uid)),
      snap => setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Real-time grants for deadline urgency
    const unsubGrants = onSnapshot(
      query(collection(db, "grants"), where("savedBy", "array-contains", uid)),
      snap => {
        const grants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecentActivity(grants.slice(0, 6).map(g => ({
          type: "grant",
          label: g.name || "Grant",
          sub: g.deadline?.toDate
            ? `Deadline: ${g.deadline.toDate().toLocaleDateString()}`
            : "No deadline",
          icon: "🏛️",
          ts: g.deadline?.toMillis?.() || 0,
        })));
        setLoading(false);
      }
    );

    return () => { unsubSaved(); unsubApps(); unsubProps(); unsubGrants(); };
  }, [uid]);

  // Urgency breakdown from saved grants
  const urgencyBreakdown = { critical: 0, warning: 0, safe: 0, expired: 0, none: 0 };
  // We compute from applications since we don't have deadline data directly on savedGrants
  // This is a simplified view; in production, join with grants collection
  const totalDeadlines = applications.length;

  // Proposal status breakdown
  const draftCount     = proposals.filter(p => p.status === "draft").length;
  const submittedCount = proposals.filter(p => p.status === "submitted").length;
  const awardedCount   = proposals.filter(p => p.status === "awarded").length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Dashboard" navigation={navigation} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Dashboard" navigation={navigation} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>

        {/* Header */}
        <Text style={styles.heading}>Your Grant Journey</Text>
        <Text style={styles.subheading}>
          {uid ? `Signed in as ${auth.currentUser?.email}` : "Sign in to see your data"}
        </Text>

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          <StatCard icon="🔖" label="Grants Saved"    value={savedGrants.length}  color={COLORS.accent} />
          <StatCard icon="📝" label="Proposals"        value={proposals.length}    color={COLORS.blue} />
          <StatCard icon="📬" label="Applications"     value={applications.length} color={COLORS.green} />
          <StatCard icon="🏆" label="Awards"           value={awardedCount}        color={COLORS.purple} />
        </View>

        {/* Proposal pipeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Proposal Pipeline</Text>
          {proposals.length === 0 ? (
            <Text style={styles.emptyCardText}>No proposals yet. Start one from a grant detail page.</Text>
          ) : (
            <>
              <UrgencyBar label="Drafts"     count={draftCount}     total={proposals.length} color={COLORS.muted} />
              <UrgencyBar label="Submitted"  count={submittedCount} total={proposals.length} color={COLORS.blue} />
              <UrgencyBar label="Awarded"    count={awardedCount}   total={proposals.length} color={COLORS.green} />
            </>
          )}
        </View>

        {/* Application status */}
        {applications.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📬 Applications</Text>
            {applications.slice(0, 5).map((app, i) => (
              <View key={app.id} style={[styles.activityItem, i > 0 && styles.activityItemBorder]}>
                <Text style={styles.activityIcon}>📄</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel} numberOfLines={1}>{app.grantName || "Grant Application"}</Text>
                  <Text style={styles.activitySub}>{app.status} · {app.appliedAt?.toDate?.()?.toLocaleDateString?.() || ""}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: app.status === "submitted" ? COLORS.blue + "33" : COLORS.green + "33" }]}>
                  <Text style={[styles.statusPillText, { color: app.status === "submitted" ? COLORS.blue : COLORS.green }]}>
                    {app.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent saved grants */}
        {recentActivity.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱️ Saved Grant Deadlines</Text>
            {recentActivity.map((item, i) => (
              <View key={i} style={[styles.activityItem, i > 0 && styles.activityItemBorder]}>
                <Text style={styles.activityIcon}>{item.icon}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.activitySub}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("GrantSearch")}>
              <Text style={styles.quickBtnIcon}>🔍</Text>
              <Text style={styles.quickBtnText}>Find Grants</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("DeadlineTracker")}>
              <Text style={styles.quickBtnIcon}>📅</Text>
              <Text style={styles.quickBtnText}>Deadlines</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("AIChat")}>
              <Text style={styles.quickBtnIcon}>🤖</Text>
              <Text style={styles.quickBtnText}>AI Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty state */}
        {savedGrants.length === 0 && applications.length === 0 && proposals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚀</Text>
            <Text style={styles.emptyTitle}>Start Your Grant Journey</Text>
            <Text style={styles.emptyBody}>
              Save grants, write proposals, and track applications — it all shows up here.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate("GrantSearch")}>
              <Text style={styles.startBtnText}>Find My First Grant →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { padding: 16, paddingBottom: 48 },
  loader:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText:   { color: COLORS.muted, fontSize: 15 },

  heading:      { fontSize: 26, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  subheading:   { fontSize: 13, color: COLORS.muted, marginBottom: 20 },

  statsGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard:     { flex: 1, minWidth: "45%", backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, borderLeftWidth: 3, gap: 4 },
  statIcon:     { fontSize: 22, marginBottom: 4 },
  statValue:    { fontSize: 28, fontWeight: "800" },
  statLabel:    { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  statSubtitle: { fontSize: 11, color: COLORS.muted },

  card:         { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 16 },
  cardTitle:    { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 14 },
  emptyCardText: { color: COLORS.muted, fontSize: 13, textAlign: "center", paddingVertical: 8 },

  urgencyRow:   { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  urgencyLabel: { color: COLORS.muted, fontSize: 13, width: 80 },
  urgencyBarBg: { flex: 1, height: 8, backgroundColor: "#22223B", borderRadius: 4, overflow: "hidden" },
  urgencyBarFill: { height: 8, borderRadius: 4 },
  urgencyCount: { fontSize: 13, fontWeight: "700", width: 24, textAlign: "right" },

  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  activityItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  activityIcon: { fontSize: 20 },
  activityInfo: { flex: 1 },
  activityLabel: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  activitySub:  { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  statusPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  quickActions: { flexDirection: "row", gap: 10 },
  quickBtn:     { flex: 1, backgroundColor: "#22223B", borderRadius: 10, padding: 14, alignItems: "center", gap: 6 },
  quickBtnIcon: { fontSize: 22 },
  quickBtnText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },

  emptyState:   { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyIcon:    { fontSize: 48 },
  emptyTitle:   { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  emptyBody:    { color: COLORS.muted, fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },
  startBtn:     { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  startBtnText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
});
