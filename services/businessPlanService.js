// services/businessPlanService.js
import { chat } from "./aiService";

/**
 * Generate a professional 1-page business plan summary using Mistral AI.
 *
 * @param {object} businessDetails
 * @param {string} businessDetails.name     - Business name
 * @param {string} businessDetails.industry - Industry / sector
 * @param {string} businessDetails.city     - City of operation
 * @param {string} businessDetails.state    - State of formation
 * @param {string} businessDetails.type     - Business structure (LLC, Corp, etc.)
 * @returns {Promise<string>} - Formatted business plan text
 */
export const generateBusinessPlan = async (businessDetails) => {
  const { name, industry, city, state, type } = businessDetails;

  const systemPrompt = `You are an expert business consultant who writes concise, 
professional 1-page business plan summaries. Format your response with clear 
section headers and keep the total length under 500 words.`;

  const userPrompt = `Generate a professional 1-page business plan summary for a 
new business with the following details:
- Business Name: ${name}
- Industry: ${industry}
- Location: ${city}, ${state}
- Structure: ${type}

Include these sections:
1. Executive Summary
2. Market Analysis (target market in ${city})
3. Products & Services
4. Financial Projections Overview`;

  try {
    return await chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      "mistral-small-latest" // mistral-small is now versioned as mistral-small-latest
    );
  } catch (error) {
    console.error("Error generating business plan:", error);
    throw new Error("Failed to generate AI business plan. Please try again.");
  }
};
