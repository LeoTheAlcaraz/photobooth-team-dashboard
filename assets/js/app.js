(function () {
  const EOD = window.EOD = window.EOD || {};

  function setSidebarLabels() {
    const session = EOD.getSession();
    const name = session?.displayName || session?.username || EOD.getSettings().profile.displayName || 'User';
    const role = session?.role || EOD.getSettings().profile.title || 'Development Feed';
    const userName = EOD.qs('[data-user-name]');
    const userRole = EOD.qs('[data-user-role]');
    const userAvatar = EOD.qs('[data-user-avatar]');
    if (userName) userName.textContent = name;
    if (userRole) userRole.textContent = role;
    if (userAvatar) userAvatar.textContent = EOD.escapeHtml(name).slice(0, 2).toUpperCase();
  }

  function bindShell() {
    const shell = EOD.qs('.app-shell');
    const sidebar = EOD.qs('[data-sidebar]');
    const searchLauncher = EOD.qs('[data-global-search]');
    const sidebarToggle = EOD.qs('[data-sidebar-toggle]');
    const themeToggle = EOD.qs('[data-theme-toggle]');
    const logoutButton = EOD.qs('[data-logout]');
    const page = document.body.dataset.page;

    function syncThemeClass(theme) {
      const bodyClasses = new Set(String(document.body.className || '').split(/\s+/).filter(Boolean).filter((name) => name !== 'light-theme'));
      const rootClasses = new Set(String(document.documentElement.className || '').split(/\s+/).filter(Boolean).filter((name) => name !== 'light-theme'));
      if (theme === 'light') {
        bodyClasses.add('light-theme');
        rootClasses.add('light-theme');
      }
      document.body.className = Array.from(bodyClasses).join(' ');
      document.documentElement.className = Array.from(rootClasses).join(' ');
    }

    EOD.setShellCollapsed(false);
    EOD.setTheme(EOD.getSettings().theme || EOD.getTheme());

    if (window.matchMedia('(max-width: 980px)').matches) {
      EOD.setSidebarOpen(false);
    }

    shell?.classList.remove('sidebar-collapsed');

    sidebarToggle?.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 980px)').matches) {
        const opening = !sidebar?.classList.contains('is-open');
        if (opening) EOD.setShellCollapsed(false);
        EOD.setSidebarOpen(!sidebar?.classList.contains('is-open'));
        return;
      }
      EOD.setShellCollapsed(!shell?.classList.contains('sidebar-collapsed'));
    });

    searchLauncher?.addEventListener('click', EOD.openSearch);

    themeToggle?.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      EOD.setTheme(next);
      syncThemeClass(next);
      EOD.updateSettings({ theme: next });
      EOD.notify(`Switched to ${next} mode.`, 'success', 'Theme updated');
    });

    logoutButton?.addEventListener('click', () => {
      EOD.clearSession();
      window.location.href = 'index.html';
    });

    EOD.qsa('[data-nav-link]').forEach((link) => {
      const target = link.getAttribute('href');
      const active = page + '.html';
      if (target && target.includes(active)) link.classList.add('is-active');
    });

    document.addEventListener('click', (event) => {
      const reportTrigger = event.target.closest('[data-open-report-modal]');
      const bugTrigger = event.target.closest('[data-open-bug-modal]');
      const searchTrigger = event.target.closest('[data-open-search]');
      const themeTrigger = event.target.closest('[data-theme-toggle]');
      const notifyTrigger = event.target.closest('[data-notify-permission]');
      const saveSettings = event.target.closest('[data-save-settings]');
      const resetSession = event.target.closest('[data-reset-session]');

      if (reportTrigger) EOD.openReportModal && EOD.openReportModal();
      if (bugTrigger) EOD.openBugModal && EOD.openBugModal();
      if (searchTrigger) EOD.openSearch();
      if (themeTrigger && !themeToggle?.contains(event.target)) {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        EOD.setTheme(next);
        syncThemeClass(next);
        EOD.updateSettings({ theme: next });
        EOD.notify(`Switched to ${next} mode.`, 'success', 'Theme updated');
      }
      if (notifyTrigger) {
        EOD.requestBrowserPermission()?.then((result) => {
          EOD.notify(`Notification permission: ${result}.`, 'brand', 'Notifications');
        });
      }
      if (saveSettings) {
        const title = String(EOD.qs('[name="title"]')?.value || '').trim();
        if (!title) {
          EOD.notify('Select your role before saving preferences.', 'warning', 'Settings');
          return;
        }
        EOD.updateSettings({
          profile: {
            displayName: String(EOD.qs('[name="displayName"]')?.value || '').trim(),
            title,
            team: String(EOD.qs('[name="team"]')?.value || '').trim()
          },
          notifications: EOD.qs('[name="notifications"]')?.value === '1'
        });
        EOD.notify('Profile and preference settings saved.', 'success', 'Settings');
        setSidebarLabels();
      }
      if (resetSession) {
        EOD.clearSession();
        window.location.href = 'index.html';
      }
    });

    if (window.matchMedia('(max-width: 980px)').matches) {
      document.addEventListener('click', (event) => {
        if (!sidebar?.contains(event.target) && !sidebarToggle?.contains(event.target)) EOD.setSidebarOpen(false);
      });
    }
  }

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.key === '/' && !/input|textarea|select/i.test(event.target.tagName)) {
        event.preventDefault();
        EOD.openSearch();
      }
      if ((event.key === 'n' || event.key === 'N') && !/input|textarea|select/i.test(event.target.tagName)) {
        event.preventDefault();
        EOD.openReportModal && EOD.openReportModal();
      }
      if (event.key === 'Escape') {
        EOD.closeModal();
        EOD.setSidebarOpen(false);
      }
    });
  }

  function renderCurrentPage(page, root) {
    if (!root) return;
    if (page === 'dashboard' && EOD.initDashboardPage) EOD.initDashboardPage(root);
    if (page === 'reports' && EOD.initReportsPage) EOD.initReportsPage(root);
    if (page === 'bugs' && EOD.initBugsPage) EOD.initBugsPage(root);
    if (page === 'archive' && EOD.initArchivePage) EOD.initArchivePage(root);
    if (page === 'settings') renderSettingsPage(root);
  }

  function renderSettingsPage(root) {
    const settings = EOD.getSettings();
    const roleSelect = `
      <select name="title" required>
        <option value="" disabled ${settings.profile.title ? '' : 'selected'}>Select your role</option>
        ${EOD.roles.map((role) => `<option value="${role}" ${settings.profile.title === role ? 'selected' : ''}>${role}</option>`).join('')}
      </select>
    `;
    root.innerHTML = `
      <div class="page-stack fade-up">
        <div class="workspace-header-block">
          <span class="badge-tag">Configuration</span>
          <h2 class="workspace-title">Account &amp; Preferences</h2>
          <p class="workspace-description">Manage your profile visibility settings, display parameters, and interface themes.</p>
        </div>

        <section class="premium-glass-card">
          <div class="section-heading">
            <div><h3>Preferences</h3><p>Theme, density, and notification controls.</p></div>
          </div>
          <div class="mini-grid">
            <button class="button-soft" type="button" data-theme-toggle>Toggle dark mode</button>
            <button class="button-soft" type="button" data-notify-permission>Enable browser notifications</button>
          </div>
          <form class="preferences-form-layout" onsubmit="return false;">
            <div class="form-field-group">
              <label>Display Name</label>
              <input name="displayName" value="${EOD.escapeHtml(settings.profile.displayName)}">
            </div>
            <div class="form-field-group">
              <label>Role / Title</label>
              ${roleSelect}
            </div>
            <div class="form-field-group">
              <label>Team</label>
              <input name="team" value="${EOD.escapeHtml(settings.profile.team)}">
            </div>
            <div class="form-field-group">
              <label>Notifications</label>
              <select name="notifications"><option value="1" ${settings.notifications ? 'selected' : ''}>On</option><option value="0" ${!settings.notifications ? 'selected' : ''}>Off</option></select>
            </div>
          </form>
          <div class="button-row" style="margin-top:14px;">
            <button class="button-primary" type="button" data-save-settings>Save preferences</button>
            <button class="button-ghost" type="button" data-reset-session>Reset session</button>
          </div>
        </section>
      </div>
    `;

  }

  function openSearch() {
    const queryRoot = EOD.createElement('div', 'command-panel');
    queryRoot.innerHTML = `
      <label class="search-field" style="width:100%; margin:0;">
        <span aria-hidden="true">⌘</span>
        <input data-command-search placeholder="Search reports, bugs, people, updates..." autocomplete="off">
      </label>
      <div class="command-panel__list" data-command-results></div>
    `;

    EOD.openModal({
      label: 'Command search',
      title: 'Find anything in the workspace',
      subtitle: 'Search reports, bugs, activity, and the current team surface.',
      wide: false,
      body: queryRoot.outerHTML
    });

    const input = EOD.qs('[data-command-search]');
    const results = EOD.qs('[data-command-results]');

    function render(value) {
      const reports = EOD.filterReports(EOD.getReports(), { query: value });
      const bugs = EOD.filterBugs(EOD.getBugs(), { query: value });
      const activity = EOD.filterActivity(EOD.getActivity(), { query: value });
      const notifications = EOD.getNotifications ? EOD.getNotifications() : [];
      const items = [
        ...reports.slice(0, 5).map((item) => ({ title: item.project, body: `${item.employee} · ${item.status} · ${EOD.formatDate(item.date)}`, href: 'reports.html' })),
        ...bugs.slice(0, 4).map((item) => ({ title: item.title, body: `${item.severity} · ${item.reporter}`, href: 'bugs.html' })),
        ...activity.slice(0, 4).map((item) => ({ title: item.title, body: `${item.role} · ${EOD.timeAgo(item.createdAt)}`, href: 'dashboard.html' })),
        ...notifications.slice(0, 4).map((item) => ({ title: item.title, body: `${item.tone || 'update'} · ${EOD.timeAgo(item.createdAt)}`, href: item.link || 'dashboard.html' }))
      ];
      results.innerHTML = items.length ? items.map((item) => `
        <a class="command-item" href="${item.href}">
          <div><strong>${EOD.escapeHtml(item.title)}</strong><span>${EOD.escapeHtml(item.body)}</span></div>
          <span class="command-key">open</span>
        </a>
      `).join('') : '<div class="empty-state"><div class="empty-state__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M6 17h12V5H6z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg></div><strong>No matches</strong><span>Try a different name, project, or blocker.</span></div>';
    }

    input?.focus();
    render('');
    input?.addEventListener('input', () => render(input.value));
  }

  EOD.openSearch = openSearch;

  function initApp() {
    EOD.initStorage();
    const page = document.body.dataset.page;
    const root = EOD.qs('#page-root');
    EOD.currentPage = page;
    EOD.currentPageRoot = root;

    EOD.renderCurrentPage = function () {
      renderCurrentPage(EOD.currentPage, EOD.currentPageRoot);
    };

    EOD.subscribeState?.((_state, meta) => {
      if (!meta || meta.reason !== 'storage') return;
      setSidebarLabels();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
      EOD.notify('New workspace updates synced from another tab.', 'brand', 'Live sync');
    });

    window.addEventListener('online', () => {
      EOD.notify('Connection restored.', 'success', 'Online');
    });

    window.addEventListener('offline', () => {
      EOD.notify('You are offline. Updates will stay on this device until reconnect.', 'warning', 'Offline mode');
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }

    if (page === 'index') {
      EOD.initAuthPage && EOD.initAuthPage();
      return;
    }

    if (!EOD.isAuthenticated()) {
      window.location.replace('index.html');
      return;
    }
    setSidebarLabels();
    bindShell();
    bindKeyboardShortcuts();

    EOD.setPageMeta(document.body.dataset.title || 'Workspace', document.body.dataset.subtitle || '');
    renderCurrentPage(page, root);
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
