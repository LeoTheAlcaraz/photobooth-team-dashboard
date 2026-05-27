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
      release: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19h14"/><path d="M12 5v10"/><path d="m8 9 4-4 4 4"/></svg>'
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

  function renderDashboard(root) {
    const reports = EOD.getReports();
    const bugs = EOD.getBugs();
    const activity = EOD.getActivity();
    const team = EOD.getTeam();
    const notifications = EOD.getNotifications();
    const unreadNotifications = EOD.getUnreadNotifications ? EOD.getUnreadNotifications() : notifications.filter((item) => !item.readAt);
    const hasData = reports.length || bugs.length || activity.length || team.length;

    root.innerHTML = `
      <div class="page-stack dashboard-hero fade-up">
        <section class="premium-glass-card update-card">
          <div class="hero-card__grid">
            <div class="workspace-header-block">
              <span class="badge-tag">Workspace Overview</span>
              <h2 class="workspace-title">Developer Team Dashboard</h2>
              <p class="workspace-description">A high-level view of current reports, tasks, and system activity status.</p>
              <div class="hero-actions" style="margin-top:18px;">
                <button class="button-primary" type="button" data-open-report-modal>New report</button>
                <button class="button-soft" type="button" data-open-bug-modal>Log bug</button>
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
              <h3>Team inbox</h3>
              <p>Unread reports and bugs show up here first.</p>
            </div>
            <button class="button-ghost" type="button" data-mark-all-notifications ${unreadNotifications.length ? '' : 'disabled'}>Mark all read</button>
          </div>
          <div class="meta-row" style="margin-bottom:14px;">
            <span class="badge is-brand">${unreadNotifications.length} unread</span>
            <span class="pill">${notifications.length} total</span>
          </div>
          <div class="feed-list timeline-list" data-dashboard-notifications></div>
        </section>

        ${hasData ? `
          <section class="bento-card-grid stagger">
            <div class="span-3">${statCard('Reports', reports.length, 'Saved submissions')}</div>
            <div class="span-3">${statCard('In progress', reports.filter((item) => String(item.inProgress || '').trim()).length, 'Active work items')}</div>
            <div class="span-3">${statCard('High bugs', bugs.filter((bug) => ['high', 'critical'].includes(String(bug.severity).toLowerCase())).length, 'Priority issues')}</div>
            <div class="span-3">${statCard('Updates', reports.filter((item) => String(item.deploymentUpdates || '').trim()).length, 'Recent deployment notes')}</div>
          </section>
        ` : `
          <section class="bento-card-grid stagger">
            <div class="premium-glass-card col-4">${emptyCard('No reports yet', 'Recent submissions will appear here once the team starts posting.', 'report', '<button class="button-soft" type="button" data-open-report-modal>Write the first report</button>')}</div>
            <div class="premium-glass-card col-4">${emptyCard('No active work items', 'Work items assigned to your team will appear here.', 'work')}</div>
            <div class="premium-glass-card col-4">${emptyCard('No activity yet', 'Recent reports and updates will populate this section automatically.', 'activity')}</div>
          </section>
        `}

        <section class="bento-card-grid">
          <article class="timeline-card activity-timeline-container span-12">
              <div class="section-heading timeline-header-group">
              <div><h3>Activity timeline</h3><p>${hasData ? 'Latest reports, bugs, and release notes.' : 'Recent workspace activity will populate automatically.'}</p></div>
              <button class="button-ghost" type="button" data-open-search>Search</button>
            </div>
            ${hasData ? `<div class="feed-filters timeline-filter-bar">
              <label class="field" style="min-width:180px;"><span>Role</span><select data-dashboard-role><option value="">All roles</option>${EOD.roles.map((role) => `<option value="${role}">${role}</option>`).join('')}</select></label>
              <label class="field" style="min-width:180px;"><span>Priority</span><select data-dashboard-priority><option value="">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label class="field" style="min-width:220px;"><span>Search</span><input data-dashboard-query placeholder="Search reports, bugs, priorities"></label>
            </div>` : ''}
            <div class="timeline-feed-wrapper">
              <div class="feed-list timeline-list" data-dashboard-feed></div>
            </div>
          </article>

            <article class="list-card span-4">
              <div class="section-heading"><div><h3>Team progress</h3><p>Shows tracked work across the team.</p></div></div>
              ${team.length ? `
                <div class="progress-list">
                  ${team.map((member) => `
                    <div class="progress-item">
                      <div class="progress-item__head"><strong>${EOD.escapeHtml(member.name)}</strong><span>${EOD.escapeHtml(member.status)}</span></div>
                      <div class="meta-row"><span class="pill">${EOD.escapeHtml(member.role)}</span><span class="pill">${member.progress}%</span></div>
                      <div class="progress"><span style="width:${member.progress}%"></span></div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                  <div class="empty-state archive-empty">
                  <div class="icon-vector-container" data-empty-icon data-icon-kind="team" aria-hidden="true"></div>
                  <strong>No team activity yet</strong>
                  <span>Team progress appears after reports and bug updates are added.</span>
                </div>
              `}
            </article>

            <article class="list-card span-4">
              <div class="section-heading"><div><h3>Deployment updates</h3><p>Shown when reports include release notes.</p></div></div>
              ${reports.filter((item) => String(item.deploymentUpdates || '').trim()).length ? `
                <div class="timeline">
                  ${reports.filter((item) => item.deploymentUpdates).slice(0, 4).map((item) => `
                    <div class="timeline-item">
                      <div class="timeline-dot"></div>
                      <div>
                        <strong>${EOD.escapeHtml(item.project)}</strong>
                        <p>${EOD.escapeHtml(item.deploymentUpdates)}</p>
                        <div class="meta-row" style="margin-top:8px;"><span class="role-pill">${EOD.escapeHtml(item.role)}</span><span class="pill">${EOD.formatDate(item.date)}</span></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="empty-state archive-empty">
                  <div class="icon-vector-container" data-empty-icon data-icon-kind="release" aria-hidden="true"></div>
                  <strong>No deployment updates</strong>
                  <span>Release notes from reports will surface here.</span>
                </div>
              `}
            </article>
        </section>

        <section class="dashboard-grid">
          <article class="span-6 list-card">
            <div class="section-heading"><div><h3>Recent reports</h3><p>Newest team submissions.</p></div></div>
            <div class="report-list" data-dashboard-reports></div>
          </article>

          <article class="span-6 list-card">
            <div class="section-heading"><div><h3>High priority bugs</h3><p>Issues needing review.</p></div></div>
            <div class="bug-list" data-dashboard-bugs></div>
          </article>
        </section>

        <section class="dashboard-grid">
          <article class="span-12 list-card">
            <div class="section-heading"><div><h3>Full activity feed</h3><p>Chronological workspace activity.</p></div></div>
            <div class="feed-list" data-dashboard-mini-feed></div>
          </article>
        </section>
      </div>
    `;

    const feed = EOD.qs('[data-dashboard-feed]');
    const miniFeed = EOD.qs('[data-dashboard-mini-feed]');
    const reportsList = EOD.qs('[data-dashboard-reports]');
    const bugsList = EOD.qs('[data-dashboard-bugs]');
    const notificationsList = EOD.qs('[data-dashboard-notifications]');
    const roleSelect = EOD.qs('[data-dashboard-role]');
    const prioritySelect = EOD.qs('[data-dashboard-priority]');
    const queryInput = EOD.qs('[data-dashboard-query]');

    function renderFeed(target, maxItems) {
      const items = EOD.filterActivity(activity, {
        query: queryInput?.value || '',
        role: roleSelect?.value || '',
        priority: prioritySelect?.value || ''
      }).slice(0, maxItems);

      target.innerHTML = items.length ? items.map((item) => `
        <article class="feed-item fade-up">
          <div class="feed-item__top">
            <div>
              <strong>${EOD.escapeHtml(item.title)}</strong>
              <p>${EOD.escapeHtml(item.body)}</p>
            </div>
            <div class="meta-row" style="justify-content:flex-end;">
              <span class="role-pill">${EOD.escapeHtml(item.role || 'Team')}</span>
              ${item.severity ? `<span class="severity-pill is-${String(item.severity).toLowerCase()}">${EOD.escapeHtml(item.severity)}</span>` : ''}
              <span class="priority-pill is-${String(item.priority || 'medium').toLowerCase()}">${EOD.escapeHtml(item.priority || 'medium')}</span>
            </div>
          </div>
          <div class="feed-item__body">${EOD.timeAgo(item.createdAt)} · ${EOD.formatDate(item.createdAt)}</div>
        </article>
      `).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${emptyIcon('activity')}</div><strong>No activity found for the selected filters.</strong><span>Try another filter or query.</span></div>`;
    }

    function renderNotifications(target) {
      const items = notifications.slice(0, 6);
      target.innerHTML = items.length ? items.map((item) => `
        <article class="feed-item fade-up ${item.readAt ? '' : 'is-unread'}" data-notification-id="${EOD.escapeHtml(item.id)}">
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
            <span>${item.readAt ? 'Seen by the team' : 'Unread by the team'}</span>
            <button class="button-ghost" type="button" data-mark-notification="${EOD.escapeHtml(item.id)}">${item.readAt ? 'Read' : 'Mark read'}</button>
          </div>
        </article>
      `).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${emptyIcon('activity')}</div><strong>No inbox items yet</strong><span>New reports and bugs will appear here automatically.</span></div>`;
    }

    function renderReports(target) {
      const items = reports.slice(0, 4);
      target.innerHTML = items.length ? items.map((item) => `
        <article class="report-item fade-up">
          <div class="report-item__top">
            <div>
              <strong>${EOD.escapeHtml(item.employee)}</strong>
              <p>${EOD.escapeHtml(item.project)} · ${EOD.formatDate(item.date)} · ${EOD.escapeHtml(item.role)}</p>
            </div>
            <span class="status-pill ${String(item.status).includes('blocked') ? 'is-blocked' : ''}">${EOD.escapeHtml(item.status)}</span>
          </div>
          <p>${EOD.escapeHtml(item.accomplishments)}</p>
          <div class="meta-row"><span class="role-pill">${EOD.escapeHtml(item.role)}</span><span class="priority-pill is-${String(item.priority).toLowerCase()}">${EOD.escapeHtml(item.priority)}</span></div>
        </article>
      `).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${emptyIcon('report')}</div><strong>No reports yet</strong><span>Write the first report to populate this section.</span></div>`;
    }

    function renderBugs(target) {
      const items = bugs.filter((bug) => ['high', 'critical'].includes(String(bug.severity).toLowerCase())).slice(0, 4);
      target.innerHTML = items.length ? items.map((bug) => `
        <article class="bug-item fade-up">
          <div class="bug-item__top">
            <div>
              <strong>${EOD.escapeHtml(bug.title)}</strong>
              <p>${EOD.escapeHtml(bug.reporter)} · ${EOD.escapeHtml(bug.browser)}</p>
            </div>
            <span class="severity-pill is-${String(bug.severity).toLowerCase()}">${EOD.escapeHtml(bug.severity)}</span>
          </div>
          <p>${EOD.escapeHtml(bug.description)}</p>
          <div class="meta-row"><span class="pill">${EOD.escapeHtml(bug.affectedUrl)}</span><span class="priority-pill is-${String(bug.priority || bug.severity).toLowerCase()}">${EOD.escapeHtml(bug.priority || bug.severity)}</span></div>
        </article>
      `).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${emptyIcon('work')}</div><strong>No active bugs</strong><span>High and critical bugs will appear here.</span></div>`;
    }

    renderFeed(feed, 10);
    renderFeed(miniFeed, 6);
    renderReports(reportsList);
    renderBugs(bugsList);
    renderNotifications(notificationsList);
    hydrateEmptyIcons(root);

    [queryInput, roleSelect, prioritySelect].forEach((node) => node?.addEventListener('input', () => renderFeed(feed, 10)));

    EOD.qs('[data-open-search]')?.addEventListener('click', EOD.openSearch);
    EOD.qs('[data-open-report-modal]')?.addEventListener('click', () => EOD.openReportModal && EOD.openReportModal());
    EOD.qs('[data-open-bug-modal]')?.addEventListener('click', () => EOD.openBugModal && EOD.openBugModal());
    EOD.qs('[data-mark-all-notifications]')?.addEventListener('click', () => {
      EOD.markAllNotificationsRead && EOD.markAllNotificationsRead();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });

    root.addEventListener('click', (event) => {
      const mark = event.target.closest('[data-mark-notification]');
      if (!mark) return;
      const id = mark.getAttribute('data-mark-notification');
      if (id) {
        EOD.markNotificationRead && EOD.markNotificationRead(id);
        EOD.renderCurrentPage && EOD.renderCurrentPage();
      }
    });
  }

  EOD.initDashboardPage = function (root) {
    if (!root) return;
    EOD.setPageMeta('Dashboard', 'Daily execution feed for Photobooth-io.');
    renderDashboard(root);
  };
})();