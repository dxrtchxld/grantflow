// services/aiService.js — Mistral AI integration for GrantFlow
import axios from "axios";
import env from "../env";

const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
const DEFAULT_MODEL = "mistral-large-latest";

const mistralClient = axios.create({
  baseURL: MISTRAL_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.mistralApiKey}`,
  },
});

/**
 * Send a chat completion request to Mistral AI.
 *
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} [model] - Mistral model identifier
 * @returns {Promise<string>} - The assistant's reply text
 */
export async function chat(messages, model = DEFAULT_MODEL) {
  const response = await mistralClient.post("/chat/completions", {
    model,
    messages,
  });
  return response.data.choices[0].message.content;
}

/**
 * Generate a grant proposal draft based on a project description.
 *
 * @param {string} projectDescription - Short description of the project/idea
 * @param {string} grantType - e.g. "SBIR", "NEA", "local government"
 * @returns {Promise<string>} - AI-generated grant proposal draft
 */
export async function generateGrantProposal(projectDescription, grantType) {
  const systemPrompt = `You are an expert grant writer specializing in ${grantType} grants.
Write a compelling, structured grant proposal based on the user's project description.
Include: Executive Summary, Problem Statement, Project Description, Goals & Objectives,
Evaluation Plan, and Budget Justification sections.`;

  return chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: projectDescription },
  ]);
}

/**
 * Summarize a grant opportunity from its raw text or URL content.
 *
 * @param {string} grantText - Raw text of the grant announcement / RFP
 * @returns {Promise<string>} - A concise eligibility & deadline summary
 */
export async function summarizeGrantOpportunity(grantText) {
  return chat([
    {
      role: "system",
      content:
        "You are a grant research assistant. Summarize the key eligibility requirements, deadlines, funding amounts, and application steps from the provided grant opportunity text.",
    },
    { role: "user", content: grantText },
  ]);
}

/**
 * Score how well an organization matches a specific grant opportunity.
 *
 * @param {object} orgProfile - { name, mission, size, sector, location }
 * @param {string} grantDescription - Grant opportunity description
 * @returns {Promise<{score: number, reasoning: string}>}
 */
export async function scoreGrantEligibility(orgProfile, grantDescription) {
  const raw = await chat([
    {
      role: "system",
      content:
        "You are a grant eligibility analyst. Given an organization profile and a grant description, respond with a JSON object: { score: <0–100>, reasoning: <string> }. Only output valid JSON.",
    },
    {
      role: "user",
      content: `Organization: ${JSON.stringify(orgProfile)}\n\nGrant: ${grantDescription}`,
    },
  ]);
  try {
    return JSON.parse(raw);
  } catch {
    return { score: 0, reasoning: raw };
  }
}
