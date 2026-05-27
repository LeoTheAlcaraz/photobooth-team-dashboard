// Firebase initializer (compat). Initializes firebase and exposes globals: firebaseApp, firebaseAuth, firebaseDb
(function () {
  if (typeof firebase === 'undefined') return;

  // Prefer an externally provided config object to avoid committing secrets.
  // Create a file `assets/js/firebase-config.js` that sets window.__FIREBASE_CONFIG
  // e.g. window.__FIREBASE_CONFIG = { apiKey: '...', authDomain: '...', projectId: '...' };
  const firebaseConfig = (window && window.__FIREBASE_CONFIG) ? window.__FIREBASE_CONFIG : null;

  if (!firebaseConfig) {
    console.warn('No Firebase config found. Create assets/js/firebase-config.js from firebase-config.example.js and set window.__FIREBASE_CONFIG');
    return;
  }

  try {
    const app = firebase.initializeApp(firebaseConfig);
    window.firebaseApp = app;
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    // Optional: enable persistence for offline support (silent failure if not supported)
    try {
      if (window.firebaseDb && window.firebaseDb.enablePersistence) {
        window.firebaseDb.enablePersistence().catch(() => {});
      }
    } catch (e) {}
  } catch (err) {
    // Initialization error should not break the app; fall back to local storage.
    console.warn('Firebase init failed', err);
  }
})();
