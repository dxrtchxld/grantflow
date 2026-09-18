// App.js
import 'react-native-gesture-handler';
import React, { useEffect, useState, Component } from "react";
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context"; // ✅ Required by every SafeAreaView
import { onAuthStateChanged } from "@firebase/auth/dist/rn/index.js";
import { auth } from "./firebase";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1A1A2E", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: "#E2B96F", fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>GrantFlow Notice</Text>
          <Text style={{ color: "#ffffff", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: "#E2B96F", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: "#1A1A2E", fontWeight: "bold" }}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

// ── Auth screens ──────────────────────────────────────────────────────────────
import LoginScreen    from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen"; // ✅ Restored: needed by Login's "Sign up" link

// ── Onboarding ────────────────────────────────────────────────────────────────
import BusinessTypeScreen    from "./screens/BusinessTypeScreen";
import BusinessDetailsScreen from "./screens/BusinessDetailsScreen";
import BusinessNameScreen    from "./screens/BusinessNameScreen";
import LLCFormationScreen    from "./screens/LLCFormationScreen";
import BusinessPlanScreen    from "./screens/BusinessPlanScreen"; // ✅ Restored: navigated to from LLCFormationScreen

// ── Grant flow ────────────────────────────────────────────────────────────────
import GrantSearchScreen     from "./screens/GrantSearchScreen";
import GrantDetailScreen     from "./screens/GrantDetailScreen";
import DeadlineTrackerScreen from "./screens/DeadlineTrackerScreen";

// ── AI & compliance ───────────────────────────────────────────────────────────
import AIChatScreen           from "./screens/AIChatScreen";
import ComplianceReportScreen from "./screens/ComplianceReportScreen";

const Stack = createStackNavigator();

// ── Unified Navigator ─────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = auth state still resolving

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E2B96F" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={user ? "BusinessType" : "Login"}
            screenOptions={{ headerShown: false }}
          >
            {/* Auth & onboarding */}
            <Stack.Screen name="Login"            component={LoginScreen}            />
            <Stack.Screen name="Register"         component={RegisterScreen}         />
            <Stack.Screen name="BusinessType"     component={BusinessTypeScreen}     />
            <Stack.Screen name="BusinessDetails"  component={BusinessDetailsScreen}  />
            <Stack.Screen name="BusinessName"     component={BusinessNameScreen}     />
            <Stack.Screen name="LLCFormation"     component={LLCFormationScreen}     />
            <Stack.Screen name="BusinessPlan"     component={BusinessPlanScreen}     />

            {/* Grant flow */}
            <Stack.Screen name="GrantSearch"      component={GrantSearchScreen}      />
            <Stack.Screen name="GrantDetail"      component={GrantDetailScreen}      />
            <Stack.Screen name="DeadlineTracker"  component={DeadlineTrackerScreen}  />

            {/* AI & compliance */}
            <Stack.Screen name="AIChat"           component={AIChatScreen}           />
            <Stack.Screen name="ComplianceReport" component={ComplianceReportScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1A2E" },
});
