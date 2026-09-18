// screens/WelcomeGuideScreen.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import AppHeader from "../components/AppHeader";
import GrantGuideMascot from "../components/GrantGuideMascot";

export default function WelcomeGuideScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Your Grant Journey"
        navigation={navigation}
        onBack={() => navigation.navigate("Login")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <GrantGuideMascot
          message="Welcome! Whether you're an established business or just exploring ideas, I'll guide you to the right funding."
          subtitle="Select where you'd like to begin below:"
        />

        <View style={styles.cardsContainer}>
          {/* Option 1: Existing Business */}
          <TouchableOpacity
            style={[styles.card, styles.cardHighlighted]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ExistingBusiness")}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>🏢</Text>
              </View>
              <View style={styles.badgePopular}>
                <Text style={styles.badgePopularText}>FAST-TRACK</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>I already have an LLC / Business</Text>
            <Text style={styles.cardDesc}>
              Already registered? Enter your company details once to jump directly to qualified grant matches.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardActionText}>Find Grants For My Business →</Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Explore Grants First */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("GrantSearch")}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>🔍</Text>
              </View>
              <View style={styles.badgeNoRisk}>
                <Text style={styles.badgeNoRiskText}>NO COMMITMENT</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Explore grants before deciding</Text>
            <Text style={styles.cardDesc}>
              Want to see what's out there first? Browse open funding pools, deadlines, and eligibility criteria with zero friction.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardActionText}>Browse Available Grants →</Text>
            </View>
          </TouchableOpacity>

          {/* Option 3: Form a New Business */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("BusinessType")}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Text style={styles.cardIcon}>🚀</Text>
              </View>
              <View style={styles.badgeFormation}>
                <Text style={styles.badgeFormationText}>FULL ROADMAP</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Start & form a new business</Text>
            <Text style={styles.cardDesc}>
              Choose LLC, Corp, or Nonprofit. Get AI naming help, file formation paperwork, and generate a grant-ready business plan.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardActionText}>Start Business Formation →</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#1A1A2E",
  card: "#16213E",
  cardBorder: "#25253D",
  accent: "#E2B96F",
  text: "#FFFFFF",
  muted: "#A0A0B0",
  green: "#2ecc71",
  blue: "#3498db",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  cardsContainer: {
    marginTop: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHighlighted: {
    borderColor: COLORS.accent,
    backgroundColor: "#1E223D",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#22223B",
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 22,
  },
  badgePopular: {
    backgroundColor: "#E2B96F22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2B96F66",
  },
  badgePopularText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 0.8,
  },
  badgeNoRisk: {
    backgroundColor: "#2ecc7122",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2ecc7166",
  },
  badgeNoRiskText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.green,
    letterSpacing: 0.8,
  },
  badgeFormation: {
    backgroundColor: "#3498db22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3498db66",
  },
  badgeFormationText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.blue,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2A2A44",
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
});
