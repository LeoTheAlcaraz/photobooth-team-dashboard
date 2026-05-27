(function () {
  const EOD = window.EOD = window.EOD || {};

  function initAuthPage() {
    const form = EOD.qs('[data-auth-form]');
    const nameField = EOD.qs('[name="username"]');
    const passwordField = EOD.qs('[name="password"]');
    const rememberField = EOD.qs('[name="remember"]');
    const errorNode = EOD.qs('[data-auth-error]');

    if (EOD.isAuthenticated()) {
      setTimeout(() => {
        window.location.replace('dashboard.html');
      }, 450);
      return;
    }

    function shake(message) {
      if (errorNode) errorNode.textContent = message;
      form?.classList.remove('is-shake');
      void form?.offsetWidth;
      form?.classList.add('is-shake');
    }

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = String(nameField?.value || '').trim();
      const password = String(passwordField?.value || '');
      // If Firebase Auth is available, use it (username should be email)
      if (window.firebaseAuth) {
        // Allow shorthand usernames (e.g., 'alice') by appending an internal domain
        // so the team doesn't need to use personal emails. Example: 'alice' -> 'alice@photobooth.local'
        let usernameForAuth = username;
        if (username && username.indexOf('@') === -1) {
          usernameForAuth = `${username}@photobooth.local`;
        }
        window.firebaseAuth.signInWithEmailAndPassword(usernameForAuth, password)
          .then((cred) => {
            const user = cred.user;
            EOD.setSession({
              username: user.email || username,
              role: 'Workspace Access',
              displayName: user.displayName || (user.email ? user.email.split('@')[0] : username),
              team: 'Photobooth-io',
              accountId: user.uid
            }, Boolean(rememberField?.checked));
            EOD.updateSettings({ profile: { displayName: user.displayName || (user.email ? user.email.split('@')[0] : username), title: 'Workspace Access', team: 'Photobooth-io' } });
            EOD.notify(`Welcome back, ${username}.`, 'success', 'Signed in');
            window.location.href = 'dashboard.html';
          })
          .catch((err) => {
            shake('Invalid credentials. Check your email and password.');
            nameField?.focus();
          });
        return;
      }

      // Fallback to local accounts
      const account = EOD.authenticate(username, password);
      if (!account) {
        shake('Invalid credentials. Check your username and password.');
        nameField?.focus();
        return;
      }

      EOD.setSession({
        username: account.username,
        role: account.role,
        displayName: account.displayName,
        team: account.team,
        accountId: account.id
      }, Boolean(rememberField?.checked));
      EOD.updateSettings({ profile: { displayName: account.displayName || account.username, title: account.role, team: account.team } });
      EOD.notify(`Welcome back, ${username}.`, 'success', 'Signed in');
      window.location.href = 'dashboard.html';
    });
  }

  EOD.initAuthPage = initAuthPage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthPage, { once: true });
  } else {
    initAuthPage();
  }
})();
