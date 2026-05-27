(function () {
  const EOD = window.EOD = window.EOD || {};
  const ns = 'photobooth-feed';
  const key = (name) => `${ns}.${name}.v2`;
  const syncChannelName = `${ns}.sync.v1`;

  const roles = ['Frontend Dev', 'Backend Dev', 'QA', 'UI/UX', 'PM', 'Intern'];
  const defaultSession = { username: '', role: '', createdAt: '', authenticated: false };
  const defaultSettings = {
    theme: 'dark',
    compact: false,
    notifications: true,
    profile: {
      displayName: '',
      title: '',
      team: ''
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadJSON(storageKey, fallback) {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function saveJSON(storageKey, value) {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  function seedState() {
    return {
      revision: 0,
      updatedAt: '',
      accounts: [],
      reports: [],
      bugs: [],
      activity: [],
      notifications: [],
      drafts: { report: null, bug: null },
      settings: clone(defaultSettings),
      team: []
    };
  }

  EOD.roles = roles;
  EOD.keys = {
    state: key('state'),
    session: key('session'),
    sessionTemp: key('session-temp'),
    theme: key('theme'),
    compact: key('compact'),
    sidebarCollapsed: key('sidebar-collapsed')
  };
  EOD.state = null;
  EOD.clientId = EOD.clientId || `client-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

  let syncChannel = null;
  const stateListeners = new Set();
  let firestoreSyncStarted = false;

  function normalizeState(source) {
    const state = source || seedState();
    state.revision = Number(state.revision || 0);
    state.updatedAt = String(state.updatedAt || '');
    state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
    state.settings = Object.assign({}, clone(defaultSettings), state.settings || {});
    state.drafts = Object.assign({ report: null, bug: null }, state.drafts || {});
    state.team = Array.isArray(state.team) ? state.team : [];
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.reports = Array.isArray(state.reports) ? state.reports : [];
    state.bugs = Array.isArray(state.bugs) ? state.bugs : [];
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
    return state;
  }

  function emitStateChange(reason, payload) {
    stateListeners.forEach((listener) => {
      try {
        listener(EOD.state, { reason, payload });
      } catch (error) {
        // Listener failures should not break state updates.
      }
    });
  }

  function acceptExternalState(nextState, reason) {
    if (!nextState) return false;
    const currentRevision = Number(EOD.state && EOD.state.revision || 0);
    const incomingRevision = Number(nextState.revision || 0);
    if (!EOD.state || incomingRevision > currentRevision) {
      EOD.state = normalizeState(clone(nextState));
      emitStateChange(reason || 'remote', { revision: incomingRevision });
      return true;
    }
    return false;
  }

  function loadExternalState() {
    const stored = loadJSON(EOD.keys.state, null);
    if (stored) acceptExternalState(stored, 'storage');
  }

  function startFirestoreSync() {
    if (firestoreSyncStarted) return;
    const db = window.firebaseDb;
    if (!db) return;
    firestoreSyncStarted = true;

    // Reports
    try {
      db.collection('reports').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        const arr = snap.docs.map((doc) => {
          const data = doc.data() || {};
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate().toISOString();
          return Object.assign({ id: doc.id }, data, { createdAt: createdAt || '' });
        });
        EOD.initStorage();
        EOD.state.reports = arr;
        emitStateChange('firestore-reports');
      });
    } catch (e) {}

    // Bugs
    try {
      db.collection('bugs').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        const arr = snap.docs.map((doc) => {
          const data = doc.data() || {};
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate().toISOString();
          return Object.assign({ id: doc.id }, data, { createdAt: createdAt || '' });
        });
        EOD.initStorage();
        EOD.state.bugs = arr;
        emitStateChange('firestore-bugs');
      });
    } catch (e) {}

    // Activity
    try {
      db.collection('activity').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        const arr = snap.docs.map((doc) => {
          const data = doc.data() || {};
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate().toISOString();
          return Object.assign({ id: doc.id }, data, { createdAt: createdAt || '' });
        });
        EOD.initStorage();
        EOD.state.activity = arr;
        emitStateChange('firestore-activity');
      });
    } catch (e) {}

    // Notifications
    try {
      db.collection('notifications').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        const arr = snap.docs.map((doc) => {
          const data = doc.data() || {};
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate().toISOString();
          return Object.assign({ id: doc.id }, data, { createdAt: createdAt || '' });
        });
        EOD.initStorage();
        EOD.state.notifications = arr.slice(0, 50);
        emitStateChange('firestore-notifications');
      });
    } catch (e) {}

    // Team
    try {
      db.collection('team').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        const arr = snap.docs.map((doc) => {
          const data = doc.data() || {};
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate().toISOString();
          return Object.assign({ id: doc.id }, data, { createdAt: createdAt || '' });
        });
        EOD.initStorage();
        EOD.state.team = arr;
        emitStateChange('firestore-team');
      });
    } catch (e) {}
  }

  function setupSync() {
    if (syncChannel || !EOD.state) return;
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel(syncChannelName);
      syncChannel.onmessage = (event) => {
        const message = event.data || {};
        if (message.source === EOD.clientId) return;
        if (message.type === 'state-sync') loadExternalState();
      };
    }

    window.addEventListener('storage', (event) => {
      if (event.key !== EOD.keys.state || !event.newValue) return;
      loadExternalState();
    });
  }

  function publishSync() {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'state-sync', source: EOD.clientId });
    }
  }

  EOD.initStorage = function () {
    if (EOD.state) return EOD.state;
    const stored = loadJSON(EOD.keys.state, null);
    EOD.state = normalizeState(stored || seedState());
    if (!EOD.state.accounts.length) {
      EOD.state.accounts = [
        {
          id: 'acct-leo',
          username: 'Leo',
          password: 'LeoPhotobooth',
          displayName: 'Leo',
          role: 'Workspace Access',
          team: 'Photobooth-io',
          createdAt: new Date().toISOString()
        }
      ];
      EOD.saveState('accounts-seeded');
    }
    setupSync();
    // If firebase is initialized, start syncing reports/bugs from Firestore
    try { startFirestoreSync(); } catch (e) {}
    return EOD.state;
  };

  EOD.saveState = function (reason = 'local', payload) {
    if (!EOD.state) return;
    EOD.state.revision = Number(EOD.state.revision || 0) + 1;
    EOD.state.updatedAt = new Date().toISOString();
    saveJSON(EOD.keys.state, EOD.state);
    publishSync();
    emitStateChange(reason, payload);
  };

  EOD.subscribeState = function (listener) {
    if (typeof listener !== 'function') return () => {};
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
  };

  EOD.getSession = function () {
    // If Firebase Auth is present and a user is signed-in, prefer that session
    try {
      const fb = window.firebaseAuth;
      if (fb && fb.currentUser) {
        const u = fb.currentUser;
        return {
          username: u.email || '',
          displayName: u.displayName || (u.email ? u.email.split('@')[0] : ''),
          accountId: u.uid,
          authenticated: true,
          createdAt: ''
        };
      }
    } catch (e) {}
    return loadJSON(EOD.keys.session, null) || loadJSON(EOD.keys.sessionTemp, null);
  };

  EOD.isAuthenticated = function () {
    const session = EOD.getSession();
    return Boolean(session && session.authenticated);
  };

  EOD.getAccounts = function () {
    return EOD.initStorage().accounts.slice();
  };

  EOD.findAccount = function (username) {
    return EOD.getAccounts().find((account) => String(account.username).toLowerCase() === String(username || '').toLowerCase()) || null;
  };

  EOD.createAccount = function (account) {
    EOD.initStorage();
    const username = String(account && account.username || '').trim();
    const password = String(account && account.password || '').trim();
    if (!username || !password) {
      return { ok: false, error: 'Username and password are required.' };
    }
    if (EOD.findAccount(username)) {
      return { ok: false, error: 'That username already exists.' };
    }

    const item = {
      id: EOD.uid('acct'),
      username,
      password,
      displayName: String(account.displayName || username).trim(),
      role: String(account.role || 'Workspace Access').trim(),
      team: String(account.team || 'Photobooth-io').trim(),
      createdAt: new Date().toISOString()
    };

    EOD.state.accounts.unshift(item);
    EOD.saveState('account-created', { username: item.username });
    return { ok: true, account: item };
  };

  EOD.authenticate = function (username, password) {
    const account = EOD.findAccount(username);
    if (!account || account.password !== String(password || '')) return null;
    return account;
  };

  EOD.setSession = function (session, remember = true) {
    const payload = Object.assign({}, defaultSession, session, { createdAt: new Date().toISOString(), authenticated: true });
    if (remember) {
      saveJSON(EOD.keys.session, payload);
      localStorage.removeItem(EOD.keys.sessionTemp);
    } else {
      saveJSON(EOD.keys.sessionTemp, payload);
      localStorage.removeItem(EOD.keys.session);
    }
  };

  EOD.clearSession = function () {
    localStorage.removeItem(EOD.keys.session);
    localStorage.removeItem(EOD.keys.sessionTemp);
  };

  EOD.getSettings = function () {
    return EOD.initStorage().settings;
  };

  EOD.updateSettings = function (patch) {
    EOD.initStorage();
    EOD.state.settings = Object.assign({}, EOD.state.settings, patch, {
      profile: Object.assign({}, EOD.state.settings.profile || {}, patch.profile || {})
    });
    EOD.saveState('settings-updated');
    return EOD.state.settings;
  };

  EOD.getReports = function () {
    return EOD.initStorage().reports.slice().sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  };

  EOD.getBugs = function () {
    return EOD.initStorage().bugs.slice().sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  };

  EOD.getActivity = function () {
    return EOD.initStorage().activity.slice().sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  };

  EOD.getTeam = function () {
    return EOD.initStorage().team.slice();
  };

  EOD.getDraft = function (kind) {
    return EOD.initStorage().drafts[kind] || null;
  };

  EOD.saveDraft = function (kind, payload) {
    EOD.initStorage();
    EOD.state.drafts[kind] = Object.assign({}, payload, { updatedAt: new Date().toISOString() });
    EOD.saveState('draft-updated', { kind });
  };

  EOD.clearDraft = function (kind) {
    EOD.initStorage();
    EOD.state.drafts[kind] = null;
    EOD.saveState('draft-cleared', { kind });
  };

  function queueNotification(notification) {
    const item = Object.assign({
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      readAt: '',
      audience: 'all'
    }, notification);
    EOD.state.notifications.unshift(item);
    EOD.state.notifications = EOD.state.notifications.slice(0, 50);
    // Persist notification to Firestore if available
    try {
      const db = window.firebaseDb;
      if (db) {
        const data = Object.assign({}, item);
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('notifications').doc(item.id).set(data).catch(() => {});
      }
    } catch (e) {}
    return item;
  }

  EOD.addReport = function (report) {
    EOD.initStorage();
    const item = Object.assign({ id: `rep-${Date.now()}`, createdAt: new Date().toISOString() }, report);
    // Local optimistic update
    EOD.state.reports.unshift(item);
    EOD.state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'report',
      title: `${item.employee} submitted ${item.status} report`,
      body: item.accomplishments,
      role: item.role,
      priority: item.priority,
      createdAt: item.createdAt
    });
    queueNotification({
      kind: 'report',
      title: `${item.employee} posted a report`,
      body: `${item.project} · ${item.status} · ${item.priority}`,
      tone: item.status === 'blocked' ? 'warning' : 'success',
      link: 'reports.html',
      sourceId: item.id
    });
    EOD.saveState('report-added', { id: item.id });

    // Persist to Firestore if available (use client-generated id)
    try {
      const db = window.firebaseDb;
      if (db) {
        const data = Object.assign({}, item);
        // Use server timestamp for createdAt
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('reports').doc(item.id).set(data).catch(() => {});
      }
    } catch (e) {}

    return item;
  };

  EOD.addBug = function (bug) {
    EOD.initStorage();
    const item = Object.assign({ id: `bug-${Date.now()}`, createdAt: new Date().toISOString() }, bug);
    // Local optimistic update
    EOD.state.bugs.unshift(item);
    EOD.state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'bug',
      title: bug.title,
      body: bug.description,
      role: bug.role,
      priority: bug.priority,
      severity: bug.severity,
      createdAt: item.createdAt
    });
    queueNotification({
      kind: 'bug',
      title: `${item.title}`,
      body: `${item.severity} · ${item.reporter} · ${item.affectedUrl}`,
      tone: item.severity === 'critical' ? 'danger' : 'warning',
      link: 'bugs.html',
      sourceId: item.id
    });
    EOD.saveState('bug-added', { id: item.id });

    // Persist to Firestore if available
    try {
      const db = window.firebaseDb;
      if (db) {
        const data = Object.assign({}, item);
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('bugs').doc(item.id).set(data).catch(() => {});
      }
    } catch (e) {}

    return item;
  };

  EOD.pushNotification = function (notification) {
    EOD.initStorage();
    const item = queueNotification(notification);
    EOD.saveState('notification-added', { id: item.id });
    return item;
  };

  // Persist team member (local + Firestore)
  EOD.addTeamMember = function (member) {
    EOD.initStorage();
    const item = Object.assign({ id: `team-${Date.now()}`, createdAt: new Date().toISOString() }, member);
    EOD.state.team.unshift(item);
    EOD.saveState('team-member-added', { id: item.id });
    try {
      const db = window.firebaseDb;
      if (db) {
        const data = Object.assign({}, item);
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('team').doc(item.id).set(data).catch(() => {});
      }
    } catch (e) {}
    return item;
  };

  EOD.getNotifications = function () {
    return EOD.initStorage().notifications.slice();
  };

  EOD.getUnreadNotifications = function () {
    const session = EOD.getSession() || {};
    return EOD.getNotifications().filter((item) => {
      if (item.readAt) return false;
      if (item.audience === 'all') return true;
      if (item.recipient && item.recipient === session.username) return true;
      return !item.recipient;
    });
  };

  EOD.markNotificationRead = function (id) {
    EOD.initStorage();
    const item = EOD.state.notifications.find((entry) => entry.id === id);
    if (!item || item.readAt) return item || null;
    item.readAt = new Date().toISOString();
    EOD.saveState('notification-read', { id });
    return item;
  };

  EOD.markAllNotificationsRead = function () {
    EOD.initStorage();
    const stamp = new Date().toISOString();
    let changed = false;
    EOD.state.notifications.forEach((item) => {
      if (!item.readAt) {
        item.readAt = stamp;
        changed = true;
      }
    });
    if (changed) EOD.saveState('notifications-read-all');
    return EOD.getNotifications();
  };

  EOD.removeAccount = function (username) {
    EOD.initStorage();
    const nextAccounts = EOD.state.accounts.filter((account) => String(account.username).toLowerCase() !== String(username || '').toLowerCase());
    if (nextAccounts.length === EOD.state.accounts.length) return false;
    EOD.state.accounts = nextAccounts;
    EOD.saveState('account-removed', { username });
    return true;
  };

  EOD.uid = function (prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
  };

  EOD.clone = clone;
})();
