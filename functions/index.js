// functions/index.js — Cloud Functions entry point
// Export all functions from their respective modules here.
const { ingestGrantPDF } = require("./ingestGrants");

exports.ingestGrantPDF = ingestGrantPDF;
