const fs = require('fs');
let content = fs.readFileSync('screens/ProposalEditorScreen.js', 'utf8');

const searchMarker = 'const downloadPDF = () => {';
const newPdfFunc = `const downloadPDF = () => {
    if (!isPro) {
      navigation.navigate("Subscription");
      return;
    }

    if (Platform.OS === "web") {
      const clientName = orgContext?.businessName || "Client Business Workspace";
      const htmlContent = \`
        <html>
          <head>
            <title>Advisor Pursuit Brief - \${grant?.name || "Draft"}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #222; line-height: 1.6; }
              .header { border-bottom: 3px solid #E2B96F; padding-bottom: 15px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #16213E; font-size: 24px; }
              .header .meta { font-size: 13px; color: #666; margin-top: 5px; }
              .badge { display: inline-block; background: #e8f8f5; border: 1px solid #117a65; color: #117a65; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 4px; margin-bottom: 8px; }
              h2 { color: #16213E; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 30px; font-size: 18px; }
              p { margin-bottom: 15px; white-space: pre-wrap; font-size: 14px; }
              .notice { margin-top: 50px; border-top: 1px solid #eee; padding-top: 15px; font-size: 10px; color: #888; font-style: italic; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="badge">VERIFIED ADVISOR PURSUIT BRIEF</div>
              <h1>\${grant?.name || "Grant Application Proposal"}</h1>
              <div class="meta">
                <strong>Client Workspace:</strong> \${clientName} • <strong>State:</strong> \${orgContext?.state || "US"} • <strong>Generated:</strong> \${new Date().toLocaleDateString()}<br/>
                <strong>Funding Opportunity:</strong> \${grant?.agency || "Federal Agency"} (\${grant?.source || "Grants.gov"})
              </div>
            </div>

            <h2>1. Evidence-Backed Eligibility Assessment</h2>
            <p>✔ Applicant Legal Entity: PASS (Verified \${orgContext?.entityType || "LLC"})\n✔ Geographic Jurisdiction: PASS (\${orgContext?.state || "US"})\n⚠ SAM.gov UEI Registration: VERIFICATION REQUIRED</p>

            \${currentSections.map(s => \`<h2>\${s}</h2><p>\${sections[s] || "(Section narrative pending advisor review)"}</p>\`).join("")}

            <div class="notice">
              Notice: This report was generated using GrantFlow Advisory Platform. Grant opportunity data retrieved from public sources (Grants.gov / SBIR.gov). This product is not endorsed, certified, or sponsored by HHS or any federal agency.
            </div>
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

// Replace from downloadPDF up to the end of the old function
const parts = content.split(searchMarker);
if (parts.length > 1) {
  const rest = parts[1].substring(parts[1].indexOf('};') + 2);
  content = parts[0] + newPdfFunc + rest;
  fs.writeFileSync('screens/ProposalEditorScreen.js', content);
  console.log('Successfully updated ProposalEditorScreen downloadPDF');
}
