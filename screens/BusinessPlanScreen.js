// screens/BusinessPlanScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateBusinessPlan } from "../services/businessPlanService";
import { db, auth } from "../firebase"; // ✅ Fixed: firebase.js is at the root, not in /services

const BusinessPlanScreen = ({ navigation, route }) => {
  const businessData = route.params;
  const [planText, setPlanText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // useRef prevents the effect from re-running if the parent re-renders
  // and produces a new route.params object reference
  const businessDataRef = useRef(businessData);

  useEffect(() => {
    let isMounted = true;

    const fetchPlan = async () => {
      try {
        const plan = await generateBusinessPlan(businessDataRef.current);
        if (isMounted) setPlanText(plan);
      } catch (error) {
        if (isMounted) {
          setPlanText("Could not load business plan at this time.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, []); // ✅ Empty deps: businessData from route.params is stable across renders

  const handleSaveAndContinue = async () => {
    const currentUser = auth.currentUser;

    // Guard: user must be authenticated before we write to Firestore
    if (!currentUser) {
      Alert.alert("Session Expired", "Please sign in again to continue.");
      return;
    }

    setIsSaving(true);
    try {
      // ✅ Fixed: include userId so Firestore security rules allow the write
      // ✅ Fixed: ownerSSN removed — never store or pass SSNs through the client
      const { ownerSSN: _removed, ...safeBusinessData } = businessData ?? {};

      await addDoc(collection(db, "businesses"), {
        ...safeBusinessData,
        userId: currentUser.uid,   // required by firestore.rules ownership check
        businessPlan: planText,
        createdAt: serverTimestamp(),
      });

      navigation.navigate("GrantSearch");
    } catch (error) {
      console.error("Error saving business profile:", error);
      Alert.alert("Save Failed", "Could not save your business profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your AI Business Plan</Text>
      <Text style={styles.subtitle}>
        Review your custom summary generated for {businessData?.name}.
      </Text>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loaderText}>Drafting your business roadmap...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.planContainer}
          contentContainerStyle={styles.planContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.planText}>{planText}</Text>
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.button, (isLoading || isSaving) && styles.disabledButton]}
        onPress={handleSaveAndContinue}
        disabled={isLoading || isSaving}
      >
        <Text style={styles.buttonText}>
          {isSaving ? "Saving Profile..." : "Save & Proceed to Grants"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#666", fontSize: 16 },
  planContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  planContent: { padding: 16 },
  planText: { fontSize: 15, color: "#333", lineHeight: 22 },
  button: { backgroundColor: "#2ecc71", padding: 16, borderRadius: 12, alignItems: "center" },
  disabledButton: { backgroundColor: "#95a5a6" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default BusinessPlanScreen;
