const fs = require('fs');
let content = fs.readFileSync('screens/ProposalEditorScreen.js', 'utf8');

const oldAudit = `  const runAIAudit = () => {
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
  };`;

const newAudit = `  const runAIAudit = () => {
    if (!isPro) {
      navigation.navigate("Subscription");
      return;
    }
    setGenerating("audit");

    setTimeout(() => {
      setGenerating(null);
      // Deterministic Quality Check
      const issues = [];
      let score = 100;

      const writtenCount = currentSections.filter(s => (sections[s] || "").trim().length > 20).length;
      const totalSections = currentSections.length;
      const incompleteCount = totalSections - writtenCount;

      if (incompleteCount > 0) {
        const penalty = Math.round((incompleteCount / totalSections) * 50);
        score -= penalty;
        issues.push(\`\${incompleteCount} of \${totalSections} required sections are missing or incomplete.\`);
      }

      currentSections.forEach(s => {
        const text = (sections[s] || "").trim();
        if (text.length > 0 && text.length < 150) {
          score -= 5;
          issues.push(\`Section '\${s}' is under 150 characters and lacks detail.\`);
        }
      });

      if (!budget || !budget.line_items || budget.line_items.length === 0) {
        score -= 15;
        issues.push("No structured budget attached to this proposal.");
      }

      score = Math.max(10, Math.min(100, score));

      const feedback = issues.length > 0
        ? issues.map((iss, i) => \`\${i + 1}. \${iss}\`).join("\\n\\n")
        : "All required sections meet length criteria and budget breakdown is attached!";

      setAuditScore({ score, feedback });
      Alert.alert(
        \`Quality Check (\${score}/100)\`,
        \`Score: \${score}/100\\n\\nDeterministic Audit Findings:\\n\${feedback}\`
      );
    }, 800);
  };`;

content = content.replace(oldAudit, newAudit);
fs.writeFileSync('screens/ProposalEditorScreen.js', content);
console.log('ProposalEditorScreen updated with deterministic audit');
