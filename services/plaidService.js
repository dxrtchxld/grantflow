// services/plaidService.js
// All Plaid calls are proxied through your backend — the Plaid secret key
// never touches the mobile client. The backend verifies the caller's identity
// via the Firebase ID token in the Authorization header, so no userId needs
// to be passed in the request body (where it could be spoofed).
import axios from 'axios';
import { auth } from '../firebase';
import env from '../env';

/**
 * Returns an Authorization header containing the current user's Firebase ID
 * token. The backend verifies this with the Firebase Admin SDK, then uses
 * token.uid as the authoritative user identity — never a client-supplied value.
 *
 * @throws if the user is not authenticated
 */
async function getAuthHeader() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User is not authenticated.');
  const idToken = await currentUser.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}

/**
 * Creates a Plaid Link token by calling your backend.
 * The backend associates the token with the authenticated user
 * using the verified Firebase ID token — not a client-supplied userId.
 *
 * @returns {Promise<string>} Plaid link_token
 */
export const createLinkToken = async () => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${env.backendUrl}/api/plaid/create-link-token`,
      {},   // ✅ no userId in body — backend reads uid from the verified token
      { headers, timeout: 10_000 }
    );
    return response.data.link_token;
  } catch (error) {
    // ✅ log only a safe message — not the raw error which may contain account metadata
    console.error('createLinkToken failed:', error.message);
    throw new Error('Failed to initialize secure bank connection.');
  }
};

/**
 * Exchanges a Plaid public token for a persistent access token on your backend.
 * The backend stores the access token server-side; the client only receives
 * a sanitized account health overview.
 *
 * @param {string} publicToken - Short-lived token from Plaid Link onSuccess callback
 * @returns {Promise<object>} Account health overview (no raw access token)
 */
export const exchangePublicToken = async (publicToken) => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${env.backendUrl}/api/plaid/exchange-public-token`,
      { public_token: publicToken }, // ✅ only the Plaid token — uid comes from auth header
      { headers, timeout: 10_000 }
    );
    return response.data;
  } catch (error) {
    console.error('exchangePublicToken failed:', error.message);
    throw new Error('Bank account authentication failed.');
  }
};
