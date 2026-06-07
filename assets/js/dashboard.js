(function () {
  const EOD = window.EOD = window.EOD || {};

  function emptyCard(title, copy, icon, action) {
    return `
      <article class="empty-state empty-state-wrapper fade-up">
        <div class="icon-vector-container" data-empty-icon data-icon-kind="${EOD.escapeHtml(icon)}" aria-hidden="true"></div>
        <strong>${EOD.escapeHtml(title)}</strong>
        <span>${EOD.escapeHtml(copy)}</span>
        ${action || ''}
      </article>
    `;
  }

  const ICONS = {
      status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c2.2-5 6-7.5 9-7.5S18.8 7 21 12c-2.2 5-6 7.5-9 7.5S5.2 17 3 12Z"/><path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>',
      report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
      work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2Z"/><path d="M7 6h10"/></svg>',
      activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx="10" cy="8" r="3"/><path d="M22 18v-1a4 4 0 0 0-3-3.87"/><path d="M16 5.13a3 3 0 0 1 0 5.74"/></svg>',
      release: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19h14"/><path d="M12 5v10"/><path d="m8 9 4-4 4 4"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  function emptyIcon(kind) {
    return ICONS[kind] || ICONS.activity;
  }

  function hydrateEmptyIcons(root) {
    const iconTargets = root.querySelectorAll('[data-empty-icon]');
    iconTargets.forEach((node) => {
      const kind = node.dataset.icon || node.getAttribute('data-icon-kind') || 'activity';
      node.innerHTML = emptyIcon(kind);
    });

    const statusIcon = root.querySelector('[data-status-icon]');
    if (statusIcon) {
      statusIcon.innerHTML = emptyIcon('status');
    }
  }

  function statCard(label, value, foot) {
    return `
      <article class="stat-card fade-up">
        <div class="stat-card__label">${EOD.escapeHtml(label)}</div>
        <div class="stat-card__value">${EOD.escapeHtml(value)}</div>
        <div class="stat-card__foot"><span>${EOD.escapeHtml(foot)}</span></div>
      </article>
    `;
  }

  /* ─── Determine if the current session user owns an item ─── */
  function isCurrentUserItem(item) {
    const session = EOD.getSession ? EOD.getSession() : {};
    if (!session) return false;
    const sessionUser = String(session.username || session.displayName || '').toLowerCase().trim();
    if (!sessionUser) return false;
    const itemOwner = String(item.employee || item.reporter || item.title || '').toLowerCase().trim();
    return itemOwner.includes(sessionUser) || sessionUser.includes(itemOwner);
  }

  function getFeedItemSourceId(item) {
    return item.sourceReportId || item.sourceBugId || item.id || '';
  }

  function openFeedItemDetail(id) {
    if (!id) return;
    if (EOD.getBugById && EOD.getBugById(id)) {
      EOD.openBugDetail && EOD.openBugDetail(id);
      return;
    }
    EOD.openReportDetail && EOD.openReportDetail(id);
  }

  /* ─── Action buttons for each feed card ─── */
  function renderCardActions(item, isOwner) {
    const sourceId = getFeedItemSourceId(item);
    const editLabel = item.type === 'bug' ? 'Edit' : 'Edit Progress';
    const acknowledgedClass = item.acknowledged ? ' is-acknowledged' : '';
    const acknowledgedLabel = item.acknowledged ? 'Acknowledged' : 'Acknowledge';
    const acknowledgedIcon = item.acknowledged
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';

    return `
      <div class="card-actions">
        <button class="card-action-btn" type="button" data-action-view="${EOD.escapeHtml(sourceId)}" title="View details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M3 12c2.2-5 6-7.5 9-7.5S18.8 7 21 12c-2.2 5-6 7.5-9 7.5S5.2 17 3 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
          <span>View</span>
        </button>
        ${isOwner ? `
        <button class="card-action-btn is-edit" type="button" data-action-edit="${EOD.escapeHtml(sourceId)}" title="${editLabel}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/></svg>
          <span>${editLabel}</span>
        </button>
        <button class="card-action-btn is-delete" type="button" data-action-delete="${EOD.escapeHtml(sourceId)}" title="Delete item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>Delete</span>
        </button>` : ''}
        <button class="card-action-btn is-acknowledge${acknowledgedClass}" type="button" data-action-acknowledge="${EOD.escapeHtml(sourceId)}" title="${acknowledgedLabel}">
          ${acknowledgedIcon}
          <span>${acknowledgedLabel}</span>
        </button>
      </div>
    `;
  }

  /* ─── Build a single unified activity entry ─── */
  function buildUnifiedFeedItems(reports, bugs, activity) {
    const items = [];

    // Merge reports into the feed
    reports.forEach((item) => {
      items.push({
        id: item.id,
        type: 'report',
        sourceReportId: item.id,
        title: `${item.employee || 'User'} submitted ${item.status || 'in progress'} report`,
        body: item.accomplishments || '',
        employee: item.employee || '',
        role: item.role || '',
        priority: item.priority || 'medium',
        severity: null,
        status: item.status || 'in progress',
        project: item.project || '',
        createdAt: item.createdAt || item.date || '',
        acknowledged: Boolean(item.clearedAt),
        clearedByName: item.clearedByName || item.clearedBy || '',
        deploymentUpdates: item.deploymentUpdates || '',
        inProgress: item.inProgress || '',
        raw: item
      });
    });

    // Merge bugs into the feed
    bugs.forEach((bug) => {
      items.push({
        id: bug.id,
        type: 'bug',
        sourceBugId: bug.id,
        title: bug.title || 'Untitled bug',
        body: bug.description || '',
        employee: bug.reporter || '',
        role: bug.role || '',
        priority: bug.priority || bug.severity || 'medium',
        severity: bug.severity || '',
        status: bug.status || 'open',
        project: bug.affectedUrl || '',
        createdAt: bug.createdAt || '',
        acknowledged: Boolean(bug.clearedAt),
        clearedByName: bug.clearedByName || bug.clearedBy || '',
        raw: bug
      });
    });

    // Include raw activity items that aren't already covered
    const coveredIds = new Set();
    reports.forEach(r => coveredIds.add(r.id));
    bugs.forEach(b => coveredIds.add(b.id));

    activity.forEach((act) => {
      // Skip activity if its source report/bug is already in the list
      if (act.sourceId && coveredIds.has(act.sourceId)) return;
      // Also skip legacy orphaned activities of type report/bug without a sourceId
      if (!act.sourceId && (act.type === 'report' || act.type === 'bug')) return;
      
      items.push({
        id: act.id,
        type: act.type || 'activity',
        sourceReportId: act.type === 'report' ? (act.sourceId || act.id) : '',
        sourceBugId: act.type === 'bug' ? (act.sourceId || act.id) : '',
        title: act.title || '',
        body: act.body || '',
        employee: '',
        role: act.role || '',
        priority: act.priority || 'medium',
        severity: act.severity || null,
        status: '',
        project: '',
        createdAt: act.createdAt || '',
        acknowledged: false,
        raw: act
      });
    });

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return items;
  }

  function renderDashboard(root) {
    const reports = EOD.getReports();
    const bugs = EOD.getBugs();
    const activity = EOD.getActivity();
    const team = EOD.getTeam();
    const notifications = EOD.getNotifications();
    const activeNotifications = notifications.filter((item) => !item.clearedAt);
    const hasData = reports.length || bugs.length || activity.length || team.length;

    // Build unified feed
    const unifiedItems = buildUnifiedFeedItems(reports, bugs, activity);
    const highPriorityItems = unifiedItems.filter((item) => {
      const p = String(item.priority || '').toLowerCase();
      const s = String(item.severity || '').toLowerCase();
      return ['high', 'urgent', 'critical'].includes(p) || ['high', 'critical'].includes(s);
    });

    root.innerHTML = `
      <div class="page-stack dashboard-hero fade-up">
        <section class="premium-glass-card update-card">
          <div class="hero-card__grid">
            <div class="workspace-header-block">
              <span class="badge-tag">Workspace Overview</span>
              <h2 class="workspace-title">Developer Team Dashboard</h2>
              <p class="workspace-description">Monitor team activity here. Submit updates from Reports or log issues from Bugs.</p>
              <div class="hero-actions" style="margin-top:18px;">
                <a class="button-primary" href="reports.html?create=report" style="text-decoration:none;">New report</a>
                <a class="button-soft" href="bugs.html?create=bug" style="text-decoration:none;">Log bug</a>
                <button class="button-ghost" type="button" data-open-search>Search workspace</button>
              </div>
            </div>
            <div class="workspace-status-card hero-aside">
              ${hasData ? `
                <div class="stack tight">
                  <strong style="font-size:1.05rem; letter-spacing:-0.03em;">Workspace status</strong>
                  <div class="helper">Reports, bugs, and activity are flowing through the feed.</div>
                  <div class="meta-row">
                    <span class="pill">Reports: ${reports.length}</span>
                    <span class="pill">Bugs: ${bugs.length}</span>
                    <span class="pill">Activity: ${activity.length}</span>
                  </div>
                </div>
              ` : `
                  <div class="empty-state empty-state-wrapper" style="min-height: 180px;">
                  <div class="icon-vector-container" data-status-icon aria-hidden="true"></div>
                  <strong>Workspace status</strong>
                  <span>Counts appear here as the team posts updates.</span>
                </div>
              `}
            </div>
          </div>
        </section>

        <section class="list-card">
          <div class="section-heading">
            <div>
              <h3>Review queue</h3>
              <p>New reports and bugs land here. Open an item to review it, then dismiss when your team has seen it.</p>
            </div>
            <button class="button-ghost" type="button" data-clear-all-notifications ${activeNotifications.length ? '' : 'disabled'} title="Mark every inbox item as reviewed">Dismiss all</button>
          </div>
          <div class="meta-row" style="margin-bottom:14px;">
            <span class="badge is-brand">${activeNotifications.length} awaiting review</span>
            <span class="pill">${notifications.length} total</span>
          </div>
          <div class="feed-list timeline-list" data-dashboard-notifications></div>
        </section>

        ${hasData ? `
          <section class="bento-card-grid stagger">
            <a href="reports.html" class="span-3" style="text-decoration:none; color:inherit; display:block;">${statCard('Reports', reports.length, 'Saved submissions')}</a>
            <a href="reports.html" class="span-3" style="text-decoration:none; color:inherit; display:block;">${statCard('In progress', reports.filter((item) => String(item.inProgress || '').trim()).length, 'Active work items')}</a>
            <a href="bugs.html" class="span-3" style="text-decoration:none; color:inherit; display:block;">${statCard('High bugs', bugs.filter((bug) => ['high', 'critical'].includes(String(bug.severity).toLowerCase())).length, 'Priority issues')}</a>
            <a href="reports.html" class="span-3" style="text-decoration:none; color:inherit; display:block;">${statCard('Updates', reports.filter((item) => String(item.deploymentUpdates || '').trim()).length, 'Recent deployment notes')}</a>
          </section>
        ` : `
          <section class="bento-card-grid stagger">
            <div class="premium-glass-card col-4">${emptyCard('No reports yet', 'Recent submissions will appear here once the team starts posting.', 'report', '<a class="button-soft" href="reports.html?create=report" style="text-decoration:none;">Write the first report</a>')}</div>
            <div class="premium-glass-card col-4">${emptyCard('No active work items', 'Work items assigned to your team will appear here.', 'work')}</div>
            <div class="premium-glass-card col-4">${emptyCard('No activity yet', 'Recent reports and updates will populate this section automatically.', 'activity')}</div>
          </section>
        `}

        <!-- ═══════════════════════════════════════════════════════════
             UNIFIED WORKSPACE ACTIVITY — replaces Activity timeline,
             Team progress, Deployment updates, Recent reports,
             High priority bugs, and Full activity feed sections.
             ═══════════════════════════════════════════════════════════ -->
        <section class="unified-workspace-section" id="unified-workspace-activity">
          <div class="unified-workspace-header">
            <div>
              <h3>Unified Workspace Activity</h3>
              <p>${hasData ? 'All reports, bugs, and system events in one place.' : 'Activity will appear here as the team begins posting.'}</p>
            </div>
          </div>

          ${hasData ? `<div class="unified-filter-bar">
            <label class="field"><span>Role</span><select data-dashboard-role><option value="">All roles</option>${EOD.roles.map((role) => `<option value="${role}">${role}</option>`).join('')}</select></label>
            <label class="field"><span>Priority</span><select data-dashboard-priority><option value="">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label class="field"><span>Search</span><input data-dashboard-query placeholder="Search reports, bugs, priorities"></label>
          </div>` : ''}

          <div class="unified-split-grid">
            <!-- LEFT PANEL (65%) — Team EOD & Progress Stream -->
            <div class="unified-panel-left">
              <div class="unified-panel-label">
                <span class="unified-panel-label__icon">${ICONS.report}</span>
                <span>Team EOD & Progress Stream</span>
              </div>
              <div class="feed-list timeline-list" data-dashboard-feed></div>
            </div>

            <!-- RIGHT PANEL (35%) — High Priority / System Blockers -->
            <div class="unified-panel-right">
              <div class="unified-panel-label">
                <span class="unified-panel-label__icon is-alert">${ICONS.alert}</span>
                <span>High Priority / System Blockers</span>
              </div>
              <div class="feed-list" data-dashboard-blockers></div>
            </div>
          </div>
        </section>
      </div>
    `;

    const feed = EOD.qs('[data-dashboard-feed]');
    const blockersFeed = EOD.qs('[data-dashboard-blockers]');
    const notificationsList = EOD.qs('[data-dashboard-notifications]');
    const roleSelect = EOD.qs('[data-dashboard-role]');
    const prioritySelect = EOD.qs('[data-dashboard-priority]');
    const queryInput = EOD.qs('[data-dashboard-query]');

    /* ─── Render the unified EOD & Progress Stream (left panel) ─── */
    function renderUnifiedFeed() {
      const queryVal = queryInput?.value || '';
      const roleVal = roleSelect?.value || '';
      const priorityVal = prioritySelect?.value || '';

      let filtered = unifiedItems.slice();

      // Apply filters
      if (queryVal.trim()) {
        const needle = queryVal.toLowerCase().trim();
        filtered = filtered.filter((item) =>
          item.title.toLowerCase().includes(needle) ||
          item.body.toLowerCase().includes(needle) ||
          item.role.toLowerCase().includes(needle) ||
          item.project.toLowerCase().includes(needle) ||
          item.employee.toLowerCase().includes(needle)
        );
      }
      if (roleVal) {
        filtered = filtered.filter((item) => item.role.toLowerCase() === roleVal.toLowerCase());
      }
      if (priorityVal) {
        filtered = filtered.filter((item) => item.priority.toLowerCase() === priorityVal.toLowerCase());
      }

      const displayItems = filtered.slice(0, 15);

      feed.innerHTML = displayItems.length ? displayItems.map((item) => {
        const isOwner = isCurrentUserItem(item);
        const typeLabel = item.type === 'report' ? 'Report' : item.type === 'bug' ? 'Bug' : 'Activity';
        const typeClass = item.type === 'report' ? 'is-report' : item.type === 'bug' ? 'is-bug' : 'is-activity';

        return `
        <article class="feed-item unified-feed-card fade-up" data-item-id="${EOD.escapeHtml(item.id)}">
          <div class="feed-item__top">
            <div>
              <div class="feed-card-type-row">
                <span class="feed-type-badge ${typeClass}">${typeLabel}</span>
                ${item.status ? `<span class="status-pill-sm ${String(item.status).includes('blocked') ? 'is-blocked' : ''}">${EOD.escapeHtml(item.status)}</span>` : ''}
              </div>
              <strong>${EOD.escapeHtml(item.title)}</strong>
              <p class="feed-card-body">${EOD.escapeHtml(item.body.length > 180 ? item.body.slice(0, 180) + '...' : item.body)}</p>
            </div>
            <div class="meta-row" style="justify-content:flex-end; flex-shrink:0;">
              <span class="role-pill">${EOD.escapeHtml(item.role || 'Team')}</span>
              ${item.severity ? `<span class="severity-pill is-${String(item.severity).toLowerCase()}">${EOD.escapeHtml(item.severity)}</span>` : ''}
              <span class="priority-pill is-${String(item.priority || 'medium').toLowerCase()}">${EOD.escapeHtml(item.priority || 'medium')}</span>
            </div>
          </div>
          <div class="feed-item__body feed-item__timestamp">${EOD.timeAgo(item.createdAt)} · ${EOD.formatDate(item.createdAt)}${item.acknowledged ? ` · <span class="ack-label">✓ Acknowledged${item.clearedByName ? ' by ' + EOD.escapeHtml(item.clearedByName) : ''}</span>` : ''}</div>
          ${renderCardActions(item, isOwner)}
        </article>
      `;
      }).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${emptyIcon('activity')}</div><strong>No activity found for the selected filters.</strong><span>Try another filter or query.</span></div>`;
    }

    /* ─── Render the High Priority / System Blockers (right panel) ─── */
    function renderBlockersFeed() {
      const displayItems = highPriorityItems.slice(0, 10);

      blockersFeed.innerHTML = displayItems.length ? displayItems.map((item) => {
        const severityLabel = item.severity ? String(item.severity).toUpperCase() : String(item.priority).toUpperCase();
        const severityClass = String(item.severity || item.priority || 'high').toLowerCase();

        return `
        <article class="feed-item blocker-card fade-up" data-item-id="${EOD.escapeHtml(item.id)}">
          <div class="blocker-card__header">
            <span class="blocker-severity is-${severityClass}">${severityLabel}</span>
            <span class="blocker-type">${item.type === 'bug' ? 'Bug' : 'Report'}</span>
          </div>
          <strong class="blocker-title">${EOD.escapeHtml(item.title)}</strong>
          <p class="blocker-body">${EOD.escapeHtml(item.body.length > 100 ? item.body.slice(0, 100) + '...' : item.body)}</p>
          <div class="blocker-meta">
            <span>${EOD.escapeHtml(item.role || 'Team')}</span>
            <span class="blocker-time">${EOD.timeAgo(item.createdAt)}</span>
          </div>
          <div class="card-actions card-actions--compact">
            <button class="card-action-btn" type="button" data-action-view="${EOD.escapeHtml(getFeedItemSourceId(item))}" title="View details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M3 12c2.2-5 6-7.5 9-7.5S18.8 7 21 12c-2.2 5-6 7.5-9 7.5S5.2 17 3 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
              <span>View</span>
            </button>
            <button class="card-action-btn is-acknowledge${item.acknowledged ? ' is-acknowledged' : ''}" type="button" data-action-acknowledge="${EOD.escapeHtml(getFeedItemSourceId(item))}" title="${item.acknowledged ? 'Acknowledged' : 'Acknowledge'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M20 6 9 17l-5-5"/></svg>
              <span>${item.acknowledged ? 'Done' : 'Ack'}</span>
            </button>
          </div>
        </article>
      `;
      }).join('') : `<div class="empty-state archive-empty blocker-empty"><div class="empty-state__icon">${emptyIcon('check')}</div><strong>No critical blockers</strong><span>High and critical priority items will surface here automatically.</span></div>`;
    }

    function renderNotifications(target) {
      const items = notifications.slice(0, 6);
      target.innerHTML = items.length ? items.map((item) => `
        <article class="feed-item fade-up ${item.readAt ? '' : 'is-unread'}" data-notification-id="${EOD.escapeHtml(item.id)}" data-open-report-detail="${EOD.escapeHtml(item.sourceId || '')}" role="button" tabindex="0">
          <div class="feed-item__top">
            <div>
              <strong>${EOD.escapeHtml(item.title)}</strong>
              <p>${EOD.escapeHtml(item.body)}</p>
            </div>
            <div class="meta-row" style="justify-content:flex-end;">
              <span class="role-pill">${EOD.escapeHtml(item.kind || 'update')}</span>
              <span class="pill">${EOD.timeAgo(item.createdAt)}</span>
            </div>
          </div>
          <div class="feed-item__body" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <span>${item.clearedAt ? `Reviewed by ${EOD.escapeHtml(item.clearedByName || item.clearedBy || 'Team')}` : 'Open to review. Dismiss when your team has seen it.'}</span>
            <div class="button-row" style="margin:0;">
              <button class="button-ghost" type="button" data-open-report-detail="${EOD.escapeHtml(item.sourceId || '')}">Open</button>
              <button class="button-soft" type="button" data-clear-notification="${EOD.escapeHtml(item.id)}" title="Mark this item as reviewed">Dismiss</button>
            </div>
          </div>
        </article>
      `).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${emptyIcon('activity')}</div><strong>No inbox items yet</strong><span>New reports and bugs will appear here automatically.</span></div>`;
    }

    renderUnifiedFeed();
    renderBlockersFeed();
    renderNotifications(notificationsList);
    hydrateEmptyIcons(root);

    // Bind filter inputs
    [queryInput, roleSelect, prioritySelect].forEach((node) => node?.addEventListener('input', () => renderUnifiedFeed()));

    EOD.qs('[data-open-search]')?.addEventListener('click', EOD.openSearch);
    EOD.qs('[data-clear-all-notifications]')?.addEventListener('click', () => {
      if (!activeNotifications.length) return;
      if (!confirm('Dismiss all items in the review queue? They will be marked as reviewed.')) return;
      EOD.clearAllNotifications && EOD.clearAllNotifications();
      EOD.notify('All inbox items marked as reviewed.', 'success', 'Review queue');
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });

    /* ─── Delegated event handling ─── */
    root.addEventListener('click', (event) => {
      // Clear notification
      const clear = event.target.closest('[data-clear-notification]');
      if (clear) {
        const id = clear.getAttribute('data-clear-notification');
        if (id) {
          EOD.clearNotification && EOD.clearNotification(id);
          EOD.renderCurrentPage && EOD.renderCurrentPage();
        }
        return;
      }

      // View action button
      const viewBtn = event.target.closest('[data-action-view]');
      if (viewBtn) {
        const id = viewBtn.getAttribute('data-action-view');
        if (id) openFeedItemDetail(id);
        return;
      }

      // Edit progress action button
      const editBtn = event.target.closest('[data-action-edit]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-action-edit');
        if (id) openFeedItemDetail(id);
        return;
      }

      // Acknowledge action button
      const ackBtn = event.target.closest('[data-action-acknowledge]');
      if (ackBtn) {
        const id = ackBtn.getAttribute('data-action-acknowledge');
        if (id) {
          const report = EOD.getReportById ? EOD.getReportById(id) : null;
          if (report) {
            if (report.clearedAt) {
              EOD.unclearReportInbox && EOD.unclearReportInbox(id);
              EOD.notify('Report acknowledgement reverted.', 'brand', 'Reverted');
            } else {
              EOD.clearReportInbox && EOD.clearReportInbox(id);
              EOD.notify('Report acknowledged and cleared.', 'success', 'Acknowledged');
            }
          } else {
            const bug = EOD.getBugById ? EOD.getBugById(id) : null;
            if (bug) {
              if (bug.clearedAt) {
                EOD.unclearBugInbox && EOD.unclearBugInbox(id);
                EOD.notify('Bug acknowledgement reverted.', 'brand', 'Reverted');
              } else {
                EOD.clearBugInbox && EOD.clearBugInbox(id);
                EOD.notify('Bug acknowledged and cleared.', 'success', 'Acknowledged');
              }
            }
          }
          EOD.renderCurrentPage && EOD.renderCurrentPage();
        }
        return;
      }

      // Delete action button
      const delBtn = event.target.closest('[data-action-delete]');
      if (delBtn) {
        const id = delBtn.getAttribute('data-action-delete');
        if (id && confirm('Are you sure you want to permanently delete this item?')) {
          if (id.startsWith('rep-') && EOD.deleteReport) {
            EOD.deleteReport(id);
            EOD.notify('Report permanently deleted.', 'brand', 'Deleted');
          } else if (id.startsWith('bug-') && EOD.deleteBug) {
            EOD.deleteBug(id);
            EOD.notify('Bug permanently deleted.', 'brand', 'Deleted');
          }
          EOD.renderCurrentPage && EOD.renderCurrentPage();
        }
        return;
      }

      // Open report detail (notifications, etc.)
      const open = event.target.closest('[data-open-report-detail]');
      if (open) {
        const notifId = open.getAttribute('data-notification-id');
        const id = open.getAttribute('data-open-report-detail');
        if (notifId && EOD.openNotification) {
          EOD.openNotification(notifId);
          return;
        }
        if (id) openFeedItemDetail(id);
        return;
      }

      const mark = event.target.closest('[data-mark-notification]');
      if (!mark) return;
      const id = mark.getAttribute('data-mark-notification');
      if (id) {
        EOD.markNotificationRead && EOD.markNotificationRead(id);
        EOD.renderCurrentPage && EOD.renderCurrentPage();
      }
    });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const open = event.target.closest('[data-open-report-detail]');
      if (!open) return;
      event.preventDefault();
      const notifId = open.getAttribute('data-notification-id');
      const id = open.getAttribute('data-open-report-detail');
      if (notifId && EOD.openNotification) {
        EOD.openNotification(notifId);
        return;
      }
      if (id) openFeedItemDetail(id);
    });
  }

  EOD.initDashboardPage = function (root) {
    if (!root) return;
    EOD.setPageMeta('Dashboard', 'Daily execution feed for Photobooth-io.');
    renderDashboard(root);
  };
})();