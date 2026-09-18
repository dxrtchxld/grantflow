// components/GrantGuideMascot.js
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function GrantGuideMascot({
  message = "Hi there! I'm Barnaby, your GrantFlow guide. Where are you on your business & grant journey today?",
  subtitle = "Choose an option below and I'll take care of the rest!",
}) {
  return (
    <View style={styles.container}>
      <View style={styles.mascotRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={require("../assets/grant_guide_mascot.jpg")}
            style={styles.avatarImage}
            resizeMode="cover"
          />
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.bubbleContainer}>
          <View style={styles.bubbleArrow} />
          <View style={styles.speechBubble}>
            <View style={styles.guideBadge}>
              <Text style={styles.guideBadgeText}>✦ BARNABY • GRANT GUIDE</Text>
            </View>
            <Text style={styles.bubbleMessage}>{message}</Text>
            {subtitle ? <Text style={styles.bubbleSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const COLORS = {
  bg: "#1A1A2E",
  bubbleBg: "#22223B",
  border: "#E2B96F44",
  accent: "#E2B96F",
  text: "#FFFFFF",
  muted: "#C0C0D0",
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  mascotRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarWrapper: {
    position: "relative",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: COLORS.accent,
    overflow: "visible",
    backgroundColor: "#111122",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2ecc71",
    borderWidth: 2.5,
    borderColor: COLORS.bg,
  },
  bubbleContainer: {
    flex: 1,
    position: "relative",
  },
  bubbleArrow: {
    position: "absolute",
    top: 24,
    left: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderRightWidth: 10,
    borderRightColor: COLORS.bubbleBg,
    zIndex: 2,
  },
  speechBubble: {
    backgroundColor: COLORS.bubbleBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  guideBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E2B96F22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2B96F44",
  },
  guideBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 0.8,
  },
  bubbleMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },
  bubbleSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 16,
  },
});
