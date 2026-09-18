# GrantFlow 🚀

> Intelligent grant discovery, LLC formation, financial matching, and compliance automation for small businesses.

Built with **React Native / Expo SDK 57**, **Firebase**, **Mistral AI**, **Stripe Atlas**, and **Plaid**.

---

## 🛠 Tech Stack

- **Framework**: React Native with Expo (SDK 57, React 19)
- **Navigation**: React Navigation (Stack)
- **Backend & Database**: Firebase Authentication, Cloud Firestore, Cloud Functions
- **AI & Reasoning**: Mistral AI (`/v1/chat/completions`)
- **Banking & Verification**: Plaid API (via authenticated backend proxy)
- **Business Formation**: Stripe Atlas integration

---

## 📁 Project Structure

```
grantflow/
├── App.js                   # Root navigator with Auth gate & SafeAreaProvider
├── app.json                 # Expo configuration & plugins
├── babel.config.js          # Dotenv plugin configuration
├── components/
│   └── GrantCard.js         # Interactive grant card with match scoring & gestures
├── screens/
│   ├── LoginScreen.js       # Google PKCE & Apple OAuth + Demo mode
│   ├── RegisterScreen.js    # Firebase email/password account creation
│   ├── BusinessTypeScreen.js
│   ├── BusinessDetailsScreen.js
│   ├── BusinessNameScreen.js
│   ├── LLCFormationScreen.js
│   ├── BusinessPlanScreen.js
│   ├── GrantSearchScreen.js
│   ├── GrantDetailScreen.js
│   ├── GrantComplianceWarningModal.js
│   ├── DeadlineTrackerScreen.js
│   ├── AIChatScreen.js
│   └── ComplianceReportScreen.js
├── services/
│   ├── aiService.js         # Central Mistral AI client
│   ├── businessPlanService.js
│   ├── financialMatchService.js # Runway-based liquidity scoring
│   ├── complianceMonitorService.js
│   ├── validationGateService.js # Deterministic submission validation
│   ├── plaidService.js      # Plaid link & exchange via backend proxy
│   └── stripeAtlas.js       # Stripe Atlas formation client
└── functions/               # Firebase Cloud Functions (PDF ingestion & RAG)
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your API keys:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
# Start Expo development server (Tunnel mode for physical devices)
npx expo start --tunnel
```
