const fs = require('fs');
let content = fs.readFileSync('screens/ProposalEditorScreen.js', 'utf8');

const shareCode = `  const shareProposal = async () => {
    const text = currentSections
      .map(s => \`## \${s}\\n\\n\${sections[s] || "(empty)"}\`)
      .join("\\n\\n---\\n\\n");
    await Share.share({ message: \`\${grant?.name || "Grant Proposal"}\\n\\n\${text}\` });
  };`;

const newCode = `  const shareProposal = async () => {
    const text = currentSections
      .map(s => \`## \${s}\\n\\n\${sections[s] || "(empty)"}\`)
      .join("\\n\\n---\\n\\n");
    await Share.share({ message: \`\${grant?.name || "Grant Proposal"}\\n\\n\${text}\` });
  };

  const downloadPDF = () => {
    if (Platform.OS === "web") {
      const htmlContent = \`
        <html>
          <head>
            <title>Proposal - \${grant?.name || "Draft"}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              h1 { color: #16213E; border-bottom: 2px solid #E2B96F; padding-bottom: 10px; margin-bottom: 30px; }
              h2 { color: #3498db; margin-top: 30px; }
              p { margin-bottom: 15px; white-space: pre-wrap; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>\${grant?.name || "Grant Proposal Draft"}</h1>
            \${currentSections.map(s => \`<h2>\${s}</h2><p>\${sections[s] || "(Not written yet)"}</p>\`).join("")}
          </body>
        </html>
      \`;
      const printWindow = window.open('', '', 'height=800,width=800');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      Alert.alert("Coming soon", "PDF generation on mobile is coming in the next update!");
    }
  };`;

content = content.replace(shareCode, newCode);

const btnCode = `<TouchableOpacity onPress={shareProposal}>
                <Text style={styles.shareBtn}>Share 📤</Text>
              </TouchableOpacity>`;

const newBtnCode = `<View style={{flexDirection: "row", gap: 12}}>
                <TouchableOpacity onPress={downloadPDF}>
                  <Text style={styles.shareBtn}>PDF 📄</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareProposal}>
                  <Text style={styles.shareBtn}>Share 📤</Text>
                </TouchableOpacity>
              </View>`;

content = content.replace(btnCode, newBtnCode);
fs.writeFileSync('screens/ProposalEditorScreen.js', content);
