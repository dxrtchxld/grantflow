const fs = require('fs');
let content = fs.readFileSync('screens/AnalyticsDashboardScreen.js', 'utf8');

// Ensure route params are read
if (!content.includes('activeClient')) {
  content = content.replace(
    'export default function AnalyticsDashboardScreen({ navigation }) {',
    'export default function AnalyticsDashboardScreen({ navigation, route }) {\n  const activeClient = route?.params?.activeClient;'
  );
}

// Add Client Banner to top of dashboard if activeClient present
const topBarSearch = '<View style={{flexDirection: "row", gap: 10, marginBottom: 16}}>';
const topBarInsert = `
        {/* Active Client Workspace Header */}
        <TouchableOpacity 
          style={{backgroundColor: "#16213E", borderWidth: 1, borderColor: "#E2B96F", borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}
          onPress={() => navigation.navigate("ClientManagement")}
        >
          <View>
            <Text style={{color: "#E2B96F", fontSize: 10, fontWeight: "800", letterSpacing: 1}}>ACTIVE CLIENT WORKSPACE</Text>
            <Text style={{color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 2}}>
              {activeClient ? activeClient.businessName : "Apex BioTech Solutions (Client Workspace)"}
            </Text>
            <Text style={{color: "#A0A0B0", fontSize: 11, marginTop: 2}}>
              {activeClient ? \`\${activeClient.industry} • \${activeClient.state}\` : "Healthcare / Life Sciences • MA"}
            </Text>
          </View>
          <View style={{backgroundColor: "#22223B", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#E2B96F44"}}>
            <Text style={{color: "#E2B96F", fontSize: 11, fontWeight: "bold"}}>Switch 🔀</Text>
          </View>
        </TouchableOpacity>
`;

if (!content.includes('ACTIVE CLIENT WORKSPACE')) {
  content = content.replace(topBarSearch, topBarInsert + topBarSearch);
  fs.writeFileSync('screens/AnalyticsDashboardScreen.js', content);
  console.log('AnalyticsDashboardScreen upgraded to Consultant Command Center');
}
