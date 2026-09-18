// components/AppHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function AppHeader({ title, navigation, onBack, rightElement, showBack = true, style }) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate("WelcomeGuide");
    }
  };

  return (
    <View style={[styles.header, style]}>
      {showBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          accessibilityLabel="Go back to prior page"
          accessibilityRole="button"
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {rightElement ? (
        <View style={styles.right}>{rightElement}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1A1A2E",
    borderBottomWidth: 1,
    borderBottomColor: "#25253D",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#22223B",
    borderWidth: 1,
    borderColor: "#E2B96F33",
  },
  backArrow: {
    fontSize: 16,
    color: "#E2B96F",
    fontWeight: "bold",
    marginRight: 6,
  },
  backText: {
    fontSize: 14,
    color: "#E2B96F",
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  placeholder: {
    width: 60,
  },
  right: {
    minWidth: 60,
    alignItems: "flex-end",
  },
});
