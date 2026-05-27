(function () {
  const EOD = window.EOD = window.EOD || {};

  const ICONS = {
    report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
  };

  function getDraft() {
    return EOD.getDraft('report') || {};
  }

  function formData(form) {
    const data = new FormData(form);
    return {
      date: String(data.get('date') || ''),
      employee: String(data.get('employee') || '').trim(),
      role: String(data.get('role') || '').trim(),
      project: String(data.get('project') || '').trim(),
      accomplishments: String(data.get('accomplishments') || '').trim(),
      inProgress: String(data.get('inProgress') || '').trim(),
      deploymentUpdates: String(data.get('deploymentUpdates') || '').trim(),
      urls: String(data.get('urls') || '').trim(),
      tomorrowPlan: String(data.get('tomorrowPlan') || '').trim(),
      priority: String(data.get('priority') || 'medium'),
      status: String(data.get('status') || 'in progress')
    };
  }

  function renderReportPreview(payload) {
    return `
      <div class="preview-body markdown">
        <div class="meta-row">
          <span class="pill">${EOD.escapeHtml(payload.date || EOD.formatDate(new Date()))}</span>
          <span class="role-pill">${EOD.escapeHtml(payload.role || 'Role')}</span>
          <span class="priority-pill is-${String(payload.priority || 'medium').toLowerCase()}">${EOD.escapeHtml(payload.priority || 'medium')}</span>
        </div>
        <h3>${EOD.escapeHtml(payload.project || 'Untitled project')}</h3>
        <p><strong>Accomplishments</strong><br>${EOD.escapeHtml(payload.accomplishments || 'No accomplishments entered yet.')}</p>
        <p><strong>In progress</strong><br>${EOD.escapeHtml(payload.inProgress || 'No in progress notes entered yet.')}</p>
        <p><strong>Deployment updates</strong><br>${EOD.escapeHtml(payload.deploymentUpdates || 'No deployment updates entered yet.')}</p>
        <p><strong>Tomorrow</strong><br>${EOD.escapeHtml(payload.tomorrowPlan || 'TBD')}</p>
      </div>
    `;
  }

  function renderDraftSummary(payload) {
    const fields = [
      { label: 'Project', raw: payload.project, value: payload.project || 'Untitled project' },
      { label: 'Employee', raw: payload.employee, value: payload.employee || 'User' },
      { label: 'Role', raw: payload.role, value: payload.role || 'Role' },
      { label: 'Priority', raw: payload.priority, value: payload.priority || 'medium' }
    ];
    const filled = fields.filter((field) => String(field.raw || '').trim()).length;
    return `
      <div class="preview-summary">
        <div class="preview-summary__top">
          <div>
            <strong>Draft summary</strong>
            <p>${filled}/4 key fields set</p>
          </div>
          <span class="pill">Autosaved</span>
        </div>
        <div class="preview-summary__grid">
          ${fields.map((field) => `
            <div class="preview-summary__item">
              <span>${EOD.escapeHtml(field.label)}</span>
              <strong>${EOD.escapeHtml(field.value)}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderReportsList(root, reports, query = '') {
    const filtered = EOD.filterReports(reports, { query });
    root.innerHTML = filtered.length ? filtered.map((item) => `
      <article class="report-item fade-up">
        <div class="report-item__top">
          <div>
            <strong>${EOD.escapeHtml(item.employee)}</strong>
            <p>${EOD.escapeHtml(item.project)} · ${EOD.formatDate(item.date)} · ${EOD.escapeHtml(item.role)}</p>
          </div>
          <span class="status-pill ${String(item.status).includes('blocked') ? 'is-blocked' : ''}">${EOD.escapeHtml(item.status)}</span>
        </div>
        <p>${EOD.escapeHtml(item.accomplishments)}</p>
        <div class="meta-row">
          <span class="priority-pill is-${String(item.priority).toLowerCase()}">${EOD.escapeHtml(item.priority)}</span>
          <span class="pill">${EOD.escapeHtml(item.project)}</span>
          <span class="pill">${EOD.escapeHtml(item.urls)}</span>
        </div>
      </article>
    `).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${ICONS.report}</div><strong>No reports yet</strong><span>Saved reports will appear here after submission.</span></div>`;
  }

  function openReportModal(prefill) {
    const draft = Object.assign({}, getDraft(), prefill || {});
    const session = EOD.getSession() || {};
    const payload = Object.assign({
      date: new Date().toISOString().slice(0, 10),
      employee: session.username || EOD.getSettings().profile.displayName,
      role: session.role || EOD.getSettings().profile.title,
      project: EOD.getSettings().profile.team,
      priority: 'medium',
      status: 'in progress'
    }, draft);

    const body = EOD.createElement('div', 'report-layout');
    body.innerHTML = `
      <form class="stack" data-report-form>
        <div class="draft-strip">
          <div>
            <strong>Autosave on</strong>
            <div class="helper">Your draft is stored locally while you work.</div>
          </div>
          <span class="pill">Restores on refresh</span>
        </div>

        <div class="mini-grid">
          <label class="field"><span>Date</span><input type="date" name="date" value="${payload.date}"></label>
          <label class="field"><span>Employee</span><input name="employee" value="${EOD.escapeHtml(payload.employee)}"></label>
          <label class="field"><span>Role</span><select name="role">${EOD.roles.map((role) => `<option value="${role}" ${role === payload.role ? 'selected' : ''}>${role}</option>`).join('')}</select></label>
          <label class="field"><span>Project</span><input name="project" value="${EOD.escapeHtml(payload.project)}"></label>
          <label class="field"><span>Status</span><select name="status"><option ${payload.status === 'completed' ? 'selected' : ''}>completed</option><option ${payload.status === 'in progress' ? 'selected' : ''}>in progress</option><option ${payload.status === 'blocked' ? 'selected' : ''}>blocked</option><option ${payload.status === 'delayed' ? 'selected' : ''}>delayed</option></select></label>
          <label class="field"><span>Priority</span><select name="priority"><option value="low" ${payload.priority === 'low' ? 'selected' : ''}>Low</option><option value="medium" ${payload.priority === 'medium' ? 'selected' : ''}>Medium</option><option value="high" ${payload.priority === 'high' ? 'selected' : ''}>High</option><option value="urgent" ${payload.priority === 'urgent' ? 'selected' : ''}>Urgent</option></select></label>
        </div>

        <label class="field"><span>Accomplishments <span class="character-count" data-count-accomplishments>0</span></span><textarea name="accomplishments" data-preview-source="accomplishments" maxlength="1800">${EOD.escapeHtml(payload.accomplishments || '')}</textarea><span class="helper">Keep it concrete and readable.</span></label>
        <label class="field"><span>In progress <span class="character-count" data-count-inProgress>0</span></span><textarea name="inProgress" data-preview-source="inProgress" maxlength="1200">${EOD.escapeHtml(payload.inProgress || '')}</textarea></label>
        <label class="field"><span>Deployment updates</span><textarea name="deploymentUpdates" data-preview-source="deploymentUpdates" maxlength="1200">${EOD.escapeHtml(payload.deploymentUpdates || '')}</textarea></label>
        <label class="field"><span>URLs worked on</span><input name="urls" value="${EOD.escapeHtml(payload.urls || '')}" placeholder="dashboard.html, reports.html"></label>
        <label class="field"><span>Tomorrow plan</span><textarea name="tomorrowPlan" data-preview-source="tomorrowPlan" maxlength="1200">${EOD.escapeHtml(payload.tomorrowPlan || '')}</textarea></label>

        <div class="button-row">
          <button type="submit" class="button-primary">Save report</button>
          <button type="button" class="button-ghost" data-clear-draft>Clear draft</button>
        </div>
      </form>

      <aside class="preview-panel card">
        <div class="section-heading"><div><h3>Live preview</h3><p>Matches the submitted report card.</p></div></div>
        <div class="stack">
          ${renderDraftSummary(payload)}
          <div data-report-preview>${renderReportPreview(payload)}</div>
        </div>
      </aside>
    `;

    EOD.openModal({
      label: 'Development feed',
      title: 'Submit report',
      subtitle: 'Drafts save locally and restore on return.',
      wide: true,
      body
    });

    const modal = EOD.qs('.modal__panel');
    const form = EOD.qs('[data-report-form]');
    const preview = EOD.qs('[data-report-preview]');

    function updatePreview() {
      const data = formData(form);
      preview.innerHTML = renderReportPreview(data);
      EOD.qsa('[data-preview-source]', form).forEach((field) => {
        const count = EOD.qs(`[data-count-${field.name}]`, form);
        if (count) count.textContent = `${String(field.value || '').length}/${field.getAttribute('maxlength') || '∞'}`;
      });
      EOD.saveDraft('report', data);
    }

    EOD.qsa('[data-preview-source]', form).forEach((field) => {
      field.addEventListener('input', updatePreview);
    });

    EOD.qs('[data-clear-draft]', form)?.addEventListener('click', () => {
      EOD.clearDraft('report');
      form.reset();
      updatePreview();
      EOD.notify('Draft cleared.', 'brand', 'Report draft');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = formData(form);
      if (!data.employee || !data.project || !data.accomplishments) {
        EOD.notify('Fill in employee, project, and accomplishments before saving.', 'warning', 'Validation');
        return;
      }
      const report = EOD.addReport(data);
      EOD.clearDraft('report');
      EOD.notify(`Report saved for ${report.project}.`, 'success', 'Report submitted');
      EOD.closeModal();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });

    updatePreview();
  }

  function renderReportsPage(root) {
    const reports = EOD.getReports();
    const draft = EOD.getDraft('report');
    root.innerHTML = `
      <div class="page-stack fade-up">
        <section class="hero-card">
          <div class="hero-card__grid">
            <div class="workspace-header-block">
              <span class="badge-tag">Logs &amp; Updates</span>
              <h2 class="workspace-title">Daily Standup Reports</h2>
              <p class="workspace-description">Track team progress logs, continuous documentation, and day-to-day standups.</p>
              <div class="hero-actions" style="margin-top:18px;">
                <button class="button-primary" type="button" data-open-report-modal>New report</button>
                <button class="button-soft" type="button" data-open-search>Search history</button>
              </div>
            </div>
            <div class="premium-glass-card hero-aside">
              ${reports.length ? `
                <div class="stack tight">
                  <span class="badge is-brand">${reports.length} saved reports</span>
                  <div class="helper">${draft ? 'Draft restored from local storage.' : 'No active draft.'}</div>
                  <div class="progress"><span style="width:${Math.min(reports.length * 10, 100)}%"></span></div>
                </div>
              ` : `
                <div class="empty-state" style="min-height: 180px;">
                  <div class="empty-state__icon">${ICONS.activity}</div>
                  <strong>No reports yet</strong>
                  <span>Start with the first report and it will be saved here.</span>
                </div>
              `}
            </div>
          </div>
        </section>

        <section class="report-layout">
          <article class="list-card">
            <div class="section-heading"><div><h3>Report form</h3><p>Enter the current day’s update.</p></div></div>
            <button class="button-soft" type="button" data-open-report-modal>Open full editor</button>
            <div class="stack" style="margin-top:14px;">
              <div class="draft-strip"><div><strong>Autosave draft</strong><div class="helper">Saved locally while you work.</div></div><span class="pill">Live draft</span></div>
              <div class="report-timeline">
                <div class="timeline-item"><div class="timeline-dot"></div><div><strong>Submission checklist</strong><p>Accomplishments, in progress notes, deployment updates, and tomorrow’s plan.</p></div></div>
                <div class="timeline-item"><div class="timeline-dot"></div><div><strong>Preview</strong><p>The preview panel stays synced to the current draft.</p></div></div>
                <div class="timeline-item"><div class="timeline-dot"></div><div><strong>Validation</strong><p>Employee, project, and accomplishments are required.</p></div></div>
              </div>
            </div>
          </article>

          <aside class="report-preview list-card">
            <div class="section-heading"><div><h3>Draft preview</h3><p>Current draft snapshot.</p></div></div>
            <div class="stack">
              ${renderDraftSummary(draft || {})}
              <div class="preview-body markdown">${draft ? renderReportPreview(draft) : '<p class="subtle">Open the editor to start a draft.</p>'}</div>
            </div>
          </aside>
        </section>

        <section class="list-card">
          <div class="section-heading"><div><h3>Recent reports</h3><p>Searchable history of updates.</p></div></div>
          <label class="search-field" style="width:min(560px,100%);"><span aria-hidden="true">⌕</span><input data-report-query placeholder="Filter reports by employee, project, update, or status"></label>
          <div class="report-list" data-report-list></div>
        </section>
      </div>
    `;

    const queryInput = EOD.qs('[data-report-query]');
    const list = EOD.qs('[data-report-list]');
    renderReportsList(list, reports, '');
    queryInput?.addEventListener('input', () => renderReportsList(list, reports, queryInput.value));
    EOD.qs('[data-open-report-modal]')?.addEventListener('click', () => openReportModal());
    EOD.qs('[data-open-search]')?.addEventListener('click', EOD.openSearch);
  }

  EOD.openReportModal = openReportModal;
  EOD.initReportsPage = function (root) {
    if (!root) return;
    EOD.setPageMeta('Reports', 'Compose and review daily updates.');
    renderReportsPage(root);
  };
})();
