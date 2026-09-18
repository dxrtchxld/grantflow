// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: [
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID',
            'MISTRAL_API_KEY',
            'STRIPE_PUBLISHABLE_KEY',
            'BACKEND_URL',
          ],
          safe: true,
          allowUndefined: false,
        },
      ],
    ],
  };
};
