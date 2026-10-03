const fs = require('fs');
let content = fs.readFileSync('screens/AnalyticsDashboardScreen.js', 'utf8');

const searchStr = '<Text style={styles.emptyCardText}>Collaborate with your team</Text>';
const replacementStr = `<Text style={styles.emptyCardText}>Collaborate with your team</Text>
            </View>
            <TouchableOpacity 
              style={{backgroundColor: "#3498db", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6}}
              onPress={() => navigation.navigate("TeamSettings")}
            >
              <Text style={{color: "#fff", fontWeight: "bold"}}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
            <View>
              <Text style={styles.cardTitle}>🗄️ Document Vault</Text>
              <Text style={styles.emptyCardText}>Tax forms & resumes for 1-click apply</Text>
            </View>
            <TouchableOpacity 
              style={{backgroundColor: "#2ecc71", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6}}
              onPress={() => navigation.navigate("DocumentVault")}
            >
              <Text style={{color: "#fff", fontWeight: "bold"}}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, {borderColor: "#E2B96F", borderWidth: 2}]}>
          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
            <View>
              <Text style={styles.cardTitle}>⭐ GrantFlow Pro</Text>
              <Text style={styles.emptyCardText}>PDF Exports & AI Quality Audits</Text>`;

// Wait, I need to be careful with the exact replacement. Let's look at AnalyticsDashboardScreen.js first.
