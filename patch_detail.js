const fs = require('fs');
let content = fs.readFileSync('screens/GrantDetailScreen.js', 'utf8');

// Add import
if (!content.includes('EligibilityMatrixCard')) {
  content = content.replace(
    'import AppHeader from "../components/AppHeader";',
    'import AppHeader from "../components/AppHeader";\nimport EligibilityMatrixCard from "../components/EligibilityMatrixCard";\nimport { calculatePursuitEconomics } from "../services/eligibilityEngine";'
  );
}

// Inject economics calculation inside component
const targetPoint = '  const grant = route?.params?.grant ?? {};';
const injection = `  const grant = route?.params?.grant ?? {};
  const { businessProfile } = route?.params ?? {};
  const economics = calculatePursuitEconomics(businessProfile || {}, grant);`;

content = content.replace(targetPoint, injection);

// Upgrade Eligibility Tab Rendering
const oldEligibilityTab = `{activeTab === "Eligibility" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Who Can Apply?</Text>
              {grant.eligibility?.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          )}`;

const newEligibilityTab = `{activeTab === "Eligibility" && (
            <View>
              <EligibilityMatrixCard 
                economics={economics} 
                onAssignUnknown={(rule) => {
                  alert(\`Assigned unknown item '\${rule.name}' to client question queue.\`);
                }}
              />
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Solicitation Requirements</Text>
                {grant.eligibility?.map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}`;

content = content.replace(oldEligibilityTab, newEligibilityTab);
fs.writeFileSync('screens/GrantDetailScreen.js', content);
console.log('GrantDetailScreen patched with Eligibility Matrix');
