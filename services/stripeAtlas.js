// services/stripeAtlas.js — Stripe Atlas LLC formation & payment integrations
// NOTE: stripePublishableKey is safe for client-side use (identifies your account).
// The SECRET key must NEVER leave your backend (Cloud Function / Express proxy).
import axios from "axios";
import env from "../env";

const STRIPE_BASE_URL = "https://api.stripe.com/v1";

// Public-key client — safe for mobile; used for tokenizing card data only.
// Any call that requires the secret key must go through your backend proxy.
const stripePublicClient = axios.create({
  baseURL: STRIPE_BASE_URL,
  auth: { username: env.stripePublishableKey, password: "" },
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

/** Serialize a plain object into URL-encoded form data (Stripe API format). */
function toFormData(obj, prefix = "") {
  return Object.entries(obj)
    .flatMap(([key, val]) => {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (val && typeof val === "object") return toFormData(val, fullKey).split("&");
      return [`${encodeURIComponent(fullKey)}=${encodeURIComponent(val)}`];
    })
    .join("&");
}

// ─── Stripe Atlas (proxied through your backend) ──────────────────────────
// These endpoints require the secret key and MUST be called via a Cloud
// Function or Express route — not directly from the mobile app.

/**
 * Submit an LLC formation order.
 * Calls your backend proxy at /api/atlas/orders, which holds the secret key.
 *
 * @param {object} params
 * @param {string} params.companyName
 * @param {string} params.email
 * @param {string} params.country - ISO 3166-1 alpha-2 (e.g. "US")
 * @param {string} params.state   - US state abbreviation
 * @returns {Promise<object>} - Stripe Atlas order object
 */
export async function createAtlasOrder({ companyName, email, country, state }) {
  // TODO: replace with your deployed backend URL
  const BACKEND_URL = "https://your-backend.example.com";
  const response = await axios.post(`${BACKEND_URL}/api/atlas/orders`, {
    companyName,
    email,
    country,
    state,
  });
  return response.data;
}

/**
 * Retrieve an existing Atlas order by ID (via backend proxy).
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export async function getAtlasOrder(orderId) {
  const BACKEND_URL = "https://your-backend.example.com";
  const response = await axios.get(`${BACKEND_URL}/api/atlas/orders/${orderId}`);
  return response.data;
}

// ─── Payments (client-safe with publishable key) ──────────────────────────

/**
 * Create a Stripe Payment Method from raw card details.
 * Safe to call client-side with the publishable key.
 *
 * @param {object} card - { number, exp_month, exp_year, cvc }
 * @returns {Promise<object>} - Stripe PaymentMethod object
 */
export async function createPaymentMethod(card) {
  const body = toFormData({
    type: "card",
    "card[number]": card.number,
    "card[exp_month]": card.exp_month,
    "card[exp_year]": card.exp_year,
    "card[cvc]": card.cvc,
  });
  const response = await stripePublicClient.post("/payment_methods", body);
  return response.data;
}

/**
 * Confirm a PaymentIntent on the client using its client_secret.
 * The PaymentIntent itself must be created server-side.
 *
 * @param {string} clientSecret - From your backend's createPaymentIntent call
 * @param {string} paymentMethodId - From createPaymentMethod()
 * @returns {Promise<object>} - Confirmed PaymentIntent object
 */
export async function confirmPaymentIntent(clientSecret, paymentMethodId) {
  const [intentId] = clientSecret.split("_secret_");
  const body = toFormData({ payment_method: paymentMethodId });
  const response = await stripePublicClient.post(
    `/payment_intents/${intentId}/confirm`,
    body
  );
  return response.data;
}
