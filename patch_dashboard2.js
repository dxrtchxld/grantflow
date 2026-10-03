const fs = require('fs');
let content = fs.readFileSync('screens/AnalyticsDashboardScreen.js', 'utf8');

const searchStr = '<ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>';
const insertStr = `
        <View style={{flexDirection: "row", gap: 10, marginBottom: 16}}>
          <TouchableOpacity 
            style={[styles.card, {flex: 1, padding: 12, alignItems: "center"}]}
            onPress={() => navigation.navigate("DocumentVault")}
          >
            <Text style={{fontSize: 24, marginBottom: 4}}>🗄️</Text>
            <Text style={{color: "#fff", fontWeight: "bold", fontSize: 13}}>Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, {flex: 1, padding: 12, alignItems: "center"}]}
            onPress={() => navigation.navigate("TeamSettings")}
          >
            <Text style={{fontSize: 24, marginBottom: 4}}>👥</Text>
            <Text style={{color: "#fff", fontWeight: "bold", fontSize: 13}}>Team</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, {flex: 1, padding: 12, alignItems: "center", borderColor: "#E2B96F", borderWidth: 1}]}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={{fontSize: 24, marginBottom: 4}}>⭐</Text>
            <Text style={{color: "#E2B96F", fontWeight: "bold", fontSize: 13}}>Upgrade</Text>
          </TouchableOpacity>
        </View>
`;

if (!content.includes('🗄️')) {
  content = content.replace(searchStr, searchStr + insertStr);
  fs.writeFileSync('screens/AnalyticsDashboardScreen.js', content);
}
