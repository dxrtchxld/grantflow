const fs = require('fs');
let content = fs.readFileSync('screens/AnalyticsDashboardScreen.js', 'utf8');
const searchStr = '<View style={styles.content}>';
const insertStr = `
        <View style={styles.card}>
          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
            <View>
              <Text style={styles.cardTitle}>👥 Team Workspace</Text>
              <Text style={styles.emptyCardText}>Collaborate with your team</Text>
            </View>
            <TouchableOpacity 
              style={{backgroundColor: "#3498db", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6}}
              onPress={() => navigation.navigate("TeamSettings")}
            >
              <Text style={{color: "#fff", fontWeight: "bold"}}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>
`;
content = content.replace(searchStr, searchStr + insertStr);
fs.writeFileSync('screens/AnalyticsDashboardScreen.js', content);
