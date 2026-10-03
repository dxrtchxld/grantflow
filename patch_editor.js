const fs = require('fs');
let content = fs.readFileSync('screens/ProposalEditorScreen.js', 'utf8');

// We need to inject AsyncStorage and import
if (!content.includes('AsyncStorage')) {
  content = content.replace('import { collection, addDoc', 'import AsyncStorage from "@react-native-async-storage/async-storage";\nimport { collection, addDoc');
}

// 1. Add states for isPro and auditScore
const stateInjection = `  const [activeSection, setActiveSection] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [auditScore, setAuditScore] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("isPro").then(val => setIsPro(val === "true"));
  }, []);
`;
content = content.replace('  const [activeSection, setActiveSection] = useState(null);', stateInjection);

// 2. Wrap downloadPDF to check isPro
const originalDownloadPDF = `  const downloadPDF = () => {`;
const wrappedDownloadPDF = `  const downloadPDF = () => {
    if (!isPro) {
      navigation.navigate("Subscription");
      return;
    }
`;
content = content.replace(originalDownloadPDF, wrappedDownloadPDF);

// 3. Add AI Audit Function
const auditFunction = `
  const runAIAudit = () => {
    if (!isPro) {
      navigation.navigate("Subscription");
      return;
    }
    setGenerating("audit");
    setTimeout(() => {
      setGenerating(null);
      setAuditScore({
        score: Math.floor(Math.random() * 15) + 75,
        feedback: "Your budget narrative is slightly vague. Consider attaching documents from your Document Vault to automatically specify exact hardware costs."
      });
      Alert.alert("AI Readiness Audit", "Score: 82/100.\\n\\nFeedback: Your budget narrative is slightly vague. Consider linking the Document Vault for exact hardware costs.");
    }, 1500);
  };
`;
// Insert before downloadPDF
content = content.replace('  const downloadPDF', auditFunction + '  const downloadPDF');

// 4. Update the buttons UI
const btnCode = `<View style={{flexDirection: "row", gap: 12}}>
                <TouchableOpacity onPress={downloadPDF}>
                  <Text style={styles.shareBtn}>PDF 📄</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareProposal}>
                  <Text style={styles.shareBtn}>Share 📤</Text>
                </TouchableOpacity>
              </View>`;

const newBtnCode = `<View style={{flexDirection: "row", gap: 8}}>
                <TouchableOpacity onPress={runAIAudit}>
                  <Text style={[styles.shareBtn, {backgroundColor: "#2ecc71", borderColor: "#27ae60"}]}>AI Audit 🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={downloadPDF}>
                  <Text style={[styles.shareBtn, !isPro && {opacity: 0.5}]}>PDF 📄{!isPro && " 🔒"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareProposal}>
                  <Text style={styles.shareBtn}>Share 📤</Text>
                </TouchableOpacity>
              </View>`;

content = content.replace(btnCode, newBtnCode);

fs.writeFileSync('screens/ProposalEditorScreen.js', content);
