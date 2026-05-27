// Utility to create test users via Firebase Auth. Run manually in the browser console.
(function () {
  window.createTestUsers = async function (users) {
    if (!window.firebaseAuth) {
      console.warn('Firebase Auth not initialized. Enable Auth and include firebase-init.js');
      return;
    }
    // Default user list can be overridden by passing an array to createTestUsers(users)
    const list = users || [
        { email: 'Judie@photobooth.local', password: 'Judie-PB#2026', displayName: 'Judie' },
        { email: 'Bianca@photobooth.local', password: 'BiancaPB!2026', displayName: 'Bianca' },
        { email: 'Eric@photobooth.local', password: 'Eric_PB2026$', displayName: 'Eric' },
        { email: 'Leo@photobooth.local', password: 'LeoPhotobooth2026', displayName: 'Leo' }
      ];

    for (const u of list) {
      try {
        // createUserWithEmailAndPassword will sign in as that user; sign out after
        await window.firebaseAuth.createUserWithEmailAndPassword(u.email, u.password);
        const current = window.firebaseAuth.currentUser;
        if (current && current.updateProfile) {
          await current.updateProfile({ displayName: u.displayName });
        }
        console.log('Created user:', u.email, 'password:', u.password);
      } catch (err) {
        console.warn('Could not create', u.email, err && err.message ? err.message : err);
      } finally {
        try { await window.firebaseAuth.signOut(); } catch (e) {}
      }
    }
    console.log('User creation script finished. Verify in Firebase Console → Authentication → Users.');
  };
})();
