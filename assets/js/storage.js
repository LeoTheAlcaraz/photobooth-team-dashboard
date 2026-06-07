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

  function currentActor() {
    const session = EOD.getSession ? EOD.getSession() : {};
    return {
      id: String(session.accountId || session.username || 'anonymous'),
      name: String(session.displayName || session.username || (EOD.getSettings && EOD.getSettings().profile.displayName) || 'User')
    };
  }

  function syncFirestoreDoc(collectionName, id, data) {
    try {
      const db = window.firebaseDb;
      if (!db || !collectionName || !id) return;
      db.collection(collectionName).doc(id).set(Object.assign({}, data), { merge: true }).catch(() => {});
    } catch (error) {}
  }

  function purgeFirestoreBySourceId(sourceId) {
    try {
      const db = window.firebaseDb;
      if (!db || !sourceId) return;
      ['notifications', 'activity'].forEach((collectionName) => {
        db.collection(collectionName).where('sourceId', '==', sourceId).get()
          .then((snap) => {
            if (snap.empty) return;
            const batch = db.batch();
            snap.forEach((doc) => batch.delete(doc.ref));
            return batch.commit();
          })
          .catch(() => {});
      });
    } catch (error) {}
  }

  function formatShortDate(d) {
    const date = d ? new Date(d) : new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm} ${dd} ${yy}`;
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
            id: 'acct-user',
            username: 'User',
            password: 'UserPhotobooth',
            displayName: 'User',
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
      clearedAt: '',
      audience: 'all'
    }, notification);
    EOD.state.notifications.unshift(item);
    EOD.state.notifications = EOD.state.notifications.slice(0, 50);
    // Persist notification to Firestore if available
    syncFirestoreDoc('notifications', item.id, item);
    return item;
  }

  EOD.addReport = function (report) {
    EOD.initStorage();
    const item = Object.assign({ id: `rep-${Date.now()}`, createdAt: new Date().toISOString() }, report);
    // Local optimistic update
    EOD.state.reports.unshift(item);
    const activityItem = {
      id: `act-${Date.now()}`,
      type: 'report',
      sourceId: item.id,
      title: `${item.employee} submitted ${item.status} report`,
      body: item.accomplishments,
      role: item.role,
      priority: item.priority,
      createdAt: item.createdAt
    };
    EOD.state.activity.unshift(activityItem);
    syncFirestoreDoc('activity', activityItem.id, activityItem);
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
    const activityItem = {
      id: `act-${Date.now()}`,
      type: 'bug',
      sourceId: item.id,
      title: bug.title,
      body: bug.description,
      role: bug.role,
      priority: bug.priority,
      severity: bug.severity,
      createdAt: item.createdAt
    };
    EOD.state.activity.unshift(activityItem);
    syncFirestoreDoc('activity', activityItem.id, activityItem);
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
    syncFirestoreDoc('bugs', item.id, item);

    return item;
  };

  EOD.getReportById = function (id) {
    return EOD.getReports().find((report) => String(report.id) === String(id || '')) || null;
  };

  EOD.getBugById = function (id) {
    return EOD.getBugs().find((bug) => String(bug.id) === String(id || '')) || null;
  };

  EOD.getEodTemplate = function () {
    const date = formatShortDate(new Date());
    const body = `EOD SUMMARY | ${date}\n\nDone:\n- \n- \n\nIn Progress / Updates:\n- \n- \n\nIssues Encountered (if any):\n- \n`;
    return {
      date: new Date().toISOString().slice(0, 10),
      accomplishments: body,
      inProgress: '',
      deploymentUpdates: '',
      tomorrowPlan: '',
      priority: 'medium',
      status: 'in progress'
    };
  };

  EOD.sendEodReminder = function (opts) {
    EOD.initStorage();
    const actor = currentActor();
    const date = formatShortDate(new Date());
    const title = 'EOD Reminder';
    const body = `Good morning team!\n\nPlease submit your EOD SUMMARY for ${date} in the Reports section.\n\nFormat:\nEOD SUMMARY | ${date}\n\nDone:\n- *add task here*\n\nIn Progress / Updates:\n- *add task here*\n\nIssues Encountered (if any):\n- *add notes here*\n\nPM ${actor.name} for account details.`;
    const notification = EOD.pushNotification({
      kind: 'eod-reminder',
      title,
      body,
      audience: 'all',
      link: 'reports.html'
    });
    EOD.browserNotify && EOD.browserNotify(title, `Please submit your EOD for ${date}`);
    return notification;
  };

  EOD.openEodReport = function () {
    if (!EOD.openReportModal) return EOD.notify('Report editor not available.', 'warning', 'EOD');
    const template = EOD.getEodTemplate();
    EOD.openReportModal(Object.assign({}, template));
  };

  EOD.openNotification = function (id) {
    EOD.initStorage();
    const note = EOD.state.notifications.find((item) => String(item.id) === String(id || ''));
    if (!note) {
      EOD.notify('Notification not found.', 'warning', 'Inbox');
      return null;
    }
    const body = EOD.createElement('div', 'notification-modal');
    body.innerHTML = `
      <div class="stack">
        <div>
          <strong>${EOD.escapeHtml(note.title)}</strong>
          <p class="subtle" style="margin:8px 0 0; white-space:pre-line;">${EOD.escapeHtml(note.body)}</p>
        </div>
        <div class="button-row" style="margin:0; justify-content:flex-end;">
          ${note.link === 'reports.html' ? '<button class="button-primary" type="button" data-fill-eod>Fill EOD Report Now</button>' : ''}
          <button class="button-ghost" type="button" data-copy-note>Copy</button>
          <button class="button-soft" type="button" data-close-modal>Close</button>
        </div>
      </div>
    `;

    const modal = EOD.openModal({
      label: 'Inbox item',
      title: note.title,
      subtitle: note.kind || 'Notification',
      wide: true,
      body
    });

    modal.querySelector('[data-fill-eod]')?.addEventListener('click', () => {
      EOD.openEodReport && EOD.openEodReport();
      EOD.closeModal();
    });
    modal.querySelector('[data-copy-note]')?.addEventListener('click', () => {
      EOD.copyText(note.body || '');
      EOD.notify('Copied notification text.', 'success', 'Copied');
    });
    return note;
  };

  EOD.updateReport = function (id, patch) {
    EOD.initStorage();
    const report = EOD.state.reports.find((item) => String(item.id) === String(id || ''));
    if (!report) return null;
    const actor = currentActor();
    Object.assign(report, patch || {}, {
      updatedAt: new Date().toISOString(),
      updatedBy: actor.id,
      updatedByName: actor.name
    });
    const notification = EOD.state.notifications.find((item) => String(item.sourceId) === String(report.id));
    if (notification) {
      notification.body = `${report.project} · ${report.status} · ${report.priority}`;
      notification.updatedAt = report.updatedAt;
      notification.updatedBy = actor.id;
      notification.updatedByName = actor.name;
    }
    EOD.saveState('report-updated', { id: report.id, patch: Object.assign({}, patch) });
    syncFirestoreDoc('reports', report.id, report);
    if (notification) syncFirestoreDoc('notifications', notification.id, notification);
    return report;
  };

  EOD.updateBug = function (id, patch) {
    EOD.initStorage();
    const bug = EOD.state.bugs.find((item) => String(item.id) === String(id || ''));
    if (!bug) return null;
    const actor = currentActor();
    Object.assign(bug, patch || {}, {
      updatedAt: new Date().toISOString(),
      updatedBy: actor.id,
      updatedByName: actor.name
    });
    const notification = EOD.state.notifications.find((item) => String(item.sourceId) === String(bug.id));
    if (notification) {
      notification.body = `${bug.severity} · ${bug.reporter} · ${bug.affectedUrl}`;
      notification.updatedAt = bug.updatedAt;
      notification.updatedBy = actor.id;
      notification.updatedByName = actor.name;
    }
    EOD.saveState('bug-updated', { id: bug.id, patch: Object.assign({}, patch) });
    syncFirestoreDoc('bugs', bug.id, bug);
    if (notification) syncFirestoreDoc('notifications', notification.id, notification);
    return bug;
  };

  EOD.deleteReport = function (id) {
    EOD.initStorage();
    const index = EOD.state.reports.findIndex((item) => String(item.id) === String(id || ''));
    if (index === -1) return false;
    EOD.state.reports.splice(index, 1);
    
    // Also remove notifications related to it
    EOD.state.notifications = EOD.state.notifications.filter(n => String(n.sourceId) !== String(id));
    // Also remove activity related to it
    EOD.state.activity = EOD.state.activity.filter(a => String(a.sourceId) !== String(id));
    
    EOD.saveState('report-deleted', { id });
    try {
      const db = window.firebaseDb;
      if (db) {
        db.collection('reports').doc(id).delete().catch(() => {});
      }
    } catch (e) {}
    purgeFirestoreBySourceId(id);
    return true;
  };

  EOD.deleteBug = function (id) {
    EOD.initStorage();
    const index = EOD.state.bugs.findIndex((item) => String(item.id) === String(id || ''));
    if (index === -1) return false;
    EOD.state.bugs.splice(index, 1);
    
    // Also remove notifications related to it
    EOD.state.notifications = EOD.state.notifications.filter(n => String(n.sourceId) !== String(id));
    // Also remove activity related to it
    EOD.state.activity = EOD.state.activity.filter(a => String(a.sourceId) !== String(id));

    EOD.saveState('bug-deleted', { id });
    try {
      const db = window.firebaseDb;
      if (db) {
        db.collection('bugs').doc(id).delete().catch(() => {});
      }
    } catch (e) {}
    purgeFirestoreBySourceId(id);
    return true;
  };

  EOD.clearNotification = function (id, reason) {
    EOD.initStorage();
    const notification = EOD.state.notifications.find((item) => String(item.id) === String(id || ''));
    if (!notification || notification.clearedAt) return notification || null;
    const actor = currentActor();
    const stamp = new Date().toISOString();
    notification.clearedAt = stamp;
    notification.clearedBy = actor.id;
    notification.clearedByName = actor.name;
    notification.clearedReason = String(reason || '').trim();
    notification.readAt = notification.readAt || stamp;
    EOD.saveState('notification-cleared', { id: notification.id });
    syncFirestoreDoc('notifications', notification.id, notification);
    return notification;
  };

  EOD.clearAllNotifications = function () {
    EOD.initStorage();
    const actor = currentActor();
    const stamp = new Date().toISOString();
    let changed = false;
    EOD.state.notifications.forEach((notification) => {
      if (notification.clearedAt) return;
      notification.clearedAt = stamp;
      notification.clearedBy = actor.id;
      notification.clearedByName = actor.name;
      notification.readAt = notification.readAt || stamp;
      changed = true;
      syncFirestoreDoc('notifications', notification.id, notification);
    });
    if (changed) EOD.saveState('notifications-cleared-all');
    return EOD.getNotifications();
  };

  EOD.clearReportInbox = function (id, reason) {
    EOD.initStorage();
    const report = EOD.state.reports.find((item) => String(item.id) === String(id || ''));
    if (!report) return null;
    const actor = currentActor();
    const stamp = new Date().toISOString();
    report.clearedAt = stamp;
    report.clearedBy = actor.id;
    report.clearedByName = actor.name;
    report.clearedReason = String(reason || '').trim();
    report.updatedAt = stamp;
    report.updatedBy = actor.id;
    report.updatedByName = actor.name;
    EOD.state.notifications.forEach((notification) => {
      if (String(notification.sourceId) !== String(report.id)) return;
      notification.clearedAt = stamp;
      notification.clearedBy = actor.id;
      notification.clearedByName = actor.name;
      notification.clearedReason = String(reason || '').trim();
      notification.readAt = notification.readAt || stamp;
      syncFirestoreDoc('notifications', notification.id, notification);
    });
    EOD.saveState('report-cleared', { id: report.id });
    syncFirestoreDoc('reports', report.id, report);
    return report;
  };

  EOD.clearBugInbox = function (id, reason) {
    EOD.initStorage();
    const bug = EOD.state.bugs.find((item) => String(item.id) === String(id || ''));
    if (!bug) return null;
    const actor = currentActor();
    const stamp = new Date().toISOString();
    bug.clearedAt = stamp;
    bug.clearedBy = actor.id;
    bug.clearedByName = actor.name;
    bug.clearedReason = String(reason || '').trim();
    bug.updatedAt = stamp;
    bug.updatedBy = actor.id;
    bug.updatedByName = actor.name;
    EOD.state.notifications.forEach((notification) => {
      if (String(notification.sourceId) !== String(bug.id)) return;
      notification.clearedAt = stamp;
      notification.clearedBy = actor.id;
      notification.clearedByName = actor.name;
      notification.clearedReason = String(reason || '').trim();
      notification.readAt = notification.readAt || stamp;
      syncFirestoreDoc('notifications', notification.id, notification);
    });
    EOD.saveState('bug-cleared', { id: bug.id });
    syncFirestoreDoc('bugs', bug.id, bug);
    return bug;
  };

  EOD.unclearReportInbox = function (id) {
    EOD.initStorage();
    const report = EOD.state.reports.find((item) => String(item.id) === String(id || ''));
    if (!report || !report.clearedAt) return null;
    
    report.clearedAt = '';
    report.clearedBy = '';
    report.clearedByName = '';
    report.clearedReason = '';
    
    EOD.state.notifications.forEach((notification) => {
      if (String(notification.sourceId) !== String(report.id)) return;
      notification.clearedAt = '';
      notification.clearedBy = '';
      notification.clearedByName = '';
      notification.clearedReason = '';
      syncFirestoreDoc('notifications', notification.id, notification);
    });
    
    EOD.saveState('report-uncleared', { id: report.id });
    syncFirestoreDoc('reports', report.id, report);
    return report;
  };

  EOD.unclearBugInbox = function (id) {
    EOD.initStorage();
    const bug = EOD.state.bugs.find((item) => String(item.id) === String(id || ''));
    if (!bug || !bug.clearedAt) return null;
    
    bug.clearedAt = '';
    bug.clearedBy = '';
    bug.clearedByName = '';
    bug.clearedReason = '';
    
    EOD.state.notifications.forEach((notification) => {
      if (String(notification.sourceId) !== String(bug.id)) return;
      notification.clearedAt = '';
      notification.clearedBy = '';
      notification.clearedByName = '';
      notification.clearedReason = '';
      syncFirestoreDoc('notifications', notification.id, notification);
    });
    
    EOD.saveState('bug-uncleared', { id: bug.id });
    syncFirestoreDoc('bugs', bug.id, bug);
    return bug;
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
    return EOD.initStorage().notifications.filter((item) => !item.clearedAt).slice();
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
