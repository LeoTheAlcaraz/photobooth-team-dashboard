(function () {
  const EOD = window.EOD = window.EOD || {};

  const ICONS = {
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14v14H5z"/><path d="M9 9h6"/></svg>'
  };

  function renderArchiveItems(items) {
    return items.map((item) => `
      <article class="archive-item fade-up">
        <div class="archive-item__top">
          <div>
            <strong>${EOD.escapeHtml(item.title || item.project || item.employee)}</strong>
            <p>${EOD.escapeHtml(item.employee || item.reporter || item.role || '')} · ${EOD.formatDate(item.date || item.createdAt)}</p>
          </div>
          <div class="meta-row" style="justify-content:flex-end;">
            ${item.status ? `<span class="status-pill ${String(item.status).includes('blocked') ? 'is-blocked' : ''}">${EOD.escapeHtml(item.status)}</span>` : ''}
            ${item.severity ? `<span class="severity-pill is-${String(item.severity).toLowerCase()}">${EOD.escapeHtml(item.severity)}</span>` : ''}
            <span class="priority-pill is-${String(item.priority || item.severity || 'medium').toLowerCase()}">${EOD.escapeHtml(item.priority || item.severity || 'medium')}</span>
          </div>
        </div>
        <div class="archive-item__body">${EOD.escapeHtml(item.accomplishments || item.description || item.body || '')}</div>
      </article>
    `).join('');
  }

  function initArchivePage(root) {
    const reports = EOD.getReports();
    const bugs = EOD.getBugs();
    root.innerHTML = `
      <div class="page-stack fade-up">
        <section class="hero-card">
          <div class="hero-card__grid">
            <div class="workspace-header-block">
              <span class="badge-tag">History</span>
              <h2 class="workspace-title">Historical Logs</h2>
              <p class="workspace-description">Review closed sprints, resolved reports, and past operational timelines.</p>
            </div>
            <div class="premium-glass-card hero-aside">
              ${reports.length || bugs.length ? `
                <div class="stack tight">
                  <span class="badge is-brand">${reports.length} reports · ${bugs.length} bugs</span>
                  <div class="helper">JSON export uses the current filtered result set.</div>
                  <div class="button-row">
                    <button class="button-primary" type="button" data-export-archive>Export JSON</button>
                    <button class="button-ghost" type="button" data-open-search>Search workspace</button>
                  </div>
                </div>
              ` : `
                <div class="empty-state" style="min-height: 180px;">
                  <div class="empty-state__icon">${ICONS.archive}</div>
                  <strong>No archive entries yet</strong>
                  <span>Saved reports and bugs will appear here automatically.</span>
                </div>
              `}
            </div>
          </div>
        </section>

        <section class="list-card archive-layout">
          <div class="section-heading"><div><h3>Filters</h3><p>Find reports and bugs quickly.</p></div></div>
          <div class="archive-toolbar">
            <label class="field"><span>Query</span><input data-archive-query placeholder="Employee, title, or browser"></label>
            <label class="field"><span>Employee</span><input data-archive-employee placeholder="User"></label>
            <label class="field"><span>Date</span><input type="date" data-archive-date></label>
            <label class="field"><span>Priority</span><select data-archive-priority><option value="">All</option><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label>
          </div>
          <div class="tab-row">
            <button class="tab is-active" type="button" data-archive-tab="reports">Reports</button>
            <button class="tab" type="button" data-archive-tab="bugs">Bugs</button>
            <button class="tab" type="button" data-archive-tab="all">All</button>
          </div>
        </section>

        <section class="list-card">
          <div class="section-heading"><div><h3>Results</h3><p>Sorted by newest first.</p></div></div>
          <div class="archive-grid" data-archive-results></div>
        </section>
      </div>
    `;

    const query = EOD.qs('[data-archive-query]');
    const employee = EOD.qs('[data-archive-employee]');
    const date = EOD.qs('[data-archive-date]');
    const priority = EOD.qs('[data-archive-priority]');
    const results = EOD.qs('[data-archive-results]');
    const tabs = EOD.qsa('[data-archive-tab]');
    let activeTab = 'reports';

    function currentItems() {
      const filters = { query: query.value, date: date.value, priority: priority.value };
      const reportItems = EOD.filterReports(reports, Object.assign({}, filters, { query: `${filters.query} ${employee.value}` }));
      const bugItems = EOD.filterBugs(bugs, Object.assign({}, filters, { query: `${filters.query} ${employee.value}` }));
      if (activeTab === 'reports') return reportItems;
      if (activeTab === 'bugs') return bugItems;
      return [...reportItems, ...bugItems].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    }

    function render() {
      const items = currentItems();
      results.innerHTML = items.length ? renderArchiveItems(items) : `<div class="empty-state archive-empty"><div class="empty-state__icon">${ICONS.archive}</div><strong>No records found for the selected filters.</strong><span>Clear filters or change tab.</span></div>`;
    }

    [query, employee, date, priority].forEach((node) => node.addEventListener('input', render));
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((node) => node.classList.remove('is-active'));
      tab.classList.add('is-active');
      activeTab = tab.getAttribute('data-archive-tab');
      render();
    }));

    EOD.qs('[data-export-archive]')?.addEventListener('click', () => {
      EOD.downloadJSON('eod-archive.json', currentItems());
      EOD.notify('Archive exported as JSON.', 'success', 'Export');
    });

    EOD.qs('[data-open-search]')?.addEventListener('click', EOD.openSearch);
    render();
  }

  EOD.initArchivePage = initArchivePage;
})();
