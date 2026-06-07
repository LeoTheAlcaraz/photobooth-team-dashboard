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
      <div class="preview-body report-preview-content">
        <div class="preview-header-card">
          <div class="preview-header-card__meta">
            <span class="pill">${EOD.escapeHtml(payload.date || EOD.formatDate(new Date()))}</span>
            <span class="role-pill">${EOD.escapeHtml(payload.role || 'Role')}</span>
            <span class="priority-pill is-${String(payload.priority || 'medium').toLowerCase()}">${EOD.escapeHtml(payload.priority || 'medium')}</span>
          </div>
          <h3>${EOD.escapeHtml(payload.project || 'Untitled project')}</h3>
          <p>${EOD.escapeHtml(payload.employee || 'User')} · ${EOD.escapeHtml(payload.status || 'in progress')}</p>
        </div>

        <div class="preview-section-grid">
          <section class="preview-section">
            <span class="preview-section__label">Accomplishments</span>
            <p>${EOD.escapeHtml(payload.accomplishments || 'No accomplishments entered yet.')}</p>
          </section>
          <section class="preview-section">
            <span class="preview-section__label">In progress</span>
            <p>${EOD.escapeHtml(payload.inProgress || 'No in progress notes entered yet.')}</p>
          </section>
          <section class="preview-section">
            <span class="preview-section__label">Deployment updates</span>
            <p>${EOD.escapeHtml(payload.deploymentUpdates || 'No deployment updates entered yet.')}</p>
          </section>
          <section class="preview-section">
            <span class="preview-section__label">Tomorrow</span>
            <p>${EOD.escapeHtml(payload.tomorrowPlan || 'TBD')}</p>
          </section>
        </div>
      </div>
    `;
  }

  function reportStatusOptions(status) {
    return ['completed', 'in progress', 'blocked', 'delayed'].map((item) => `<option value="${item}" ${String(status || 'in progress') === item ? 'selected' : ''}>${item}</option>`).join('');
  }

  function reportPriorityOptions(priority) {
    return ['low', 'medium', 'high', 'urgent'].map((item) => `<option value="${item}" ${String(priority || 'medium') === item ? 'selected' : ''}>${item.charAt(0).toUpperCase() + item.slice(1)}</option>`).join('');
  }

  function openReportDetail(reportOrId) {
    const report = typeof reportOrId === 'object' ? reportOrId : EOD.getReportById(reportOrId);
    if (!report) {
      EOD.notify('That report could not be found.', 'warning', 'Report');
      return;
    }

    const session = EOD.getSession ? EOD.getSession() : {};
    const sessionUser = String(session.username || session.displayName || '').toLowerCase().trim();
    const itemOwner = String(report.employee || '').toLowerCase().trim();
    const isOwner = sessionUser && (itemOwner.includes(sessionUser) || sessionUser.includes(itemOwner));

    const body = EOD.createElement('div', 'stack');
    body.innerHTML = `
      <form class="stack" data-report-detail-form>
        <div class="draft-strip">
          <div>
            <strong>${EOD.escapeHtml(report.employee || 'User')}</strong>
            <div class="helper">${EOD.escapeHtml(report.project || 'Untitled project')} · ${EOD.escapeHtml(report.role || 'Role')}</div>
          </div>
          <span class="pill">${EOD.formatDate(report.date || report.createdAt)}</span>
        </div>

        <div class="mini-grid">
          <label class="field"><span>Status</span><select name="status">${reportStatusOptions(report.status)}</select></label>
          <label class="field"><span>Priority</span><select name="priority">${reportPriorityOptions(report.priority)}</select></label>
        </div>

        <div class="preview-body report-preview-content">
          <div class="preview-header-card">
            <div class="preview-header-card__meta">
              <span class="pill">${EOD.formatDate(report.date || report.createdAt)}</span>
              <span class="role-pill">${EOD.escapeHtml(report.role || 'Role')}</span>
              <span class="priority-pill is-${String(report.priority || 'medium').toLowerCase()}">${EOD.escapeHtml(report.priority || 'medium')}</span>
            </div>
            <h3>${EOD.escapeHtml(report.project || 'Report')}</h3>
            <p>${EOD.escapeHtml(report.employee || 'User')} · ${EOD.escapeHtml(report.status || 'in progress')}</p>
          </div>

          <div class="preview-section-grid">
            <section class="preview-section">
              <span class="preview-section__label">Accomplishments</span>
              ${isOwner ? `<textarea name="accomplishments" rows="3" style="margin-top:8px;">${EOD.escapeHtml(report.accomplishments || '')}</textarea>` : `<p>${EOD.escapeHtml(report.accomplishments || 'No accomplishments entered yet.')}</p>`}
            </section>
            <section class="preview-section">
              <span class="preview-section__label">In progress</span>
              ${isOwner ? `<textarea name="inProgress" rows="3" style="margin-top:8px;">${EOD.escapeHtml(report.inProgress || '')}</textarea>` : `<p>${EOD.escapeHtml(report.inProgress || 'No in progress notes entered yet.')}</p>`}
            </section>
            <section class="preview-section">
              <span class="preview-section__label">Deployment updates</span>
              ${isOwner ? `<textarea name="deploymentUpdates" rows="3" style="margin-top:8px;">${EOD.escapeHtml(report.deploymentUpdates || '')}</textarea>` : `<p>${EOD.escapeHtml(report.deploymentUpdates || 'No deployment updates entered yet.')}</p>`}
            </section>
            <section class="preview-section">
              <span class="preview-section__label">Tomorrow</span>
              ${isOwner ? `<textarea name="tomorrowPlan" rows="3" style="margin-top:8px;">${EOD.escapeHtml(report.tomorrowPlan || '')}</textarea>` : `<p>${EOD.escapeHtml(report.tomorrowPlan || 'TBD')}</p>`}
            </section>
            <section class="preview-section preview-section--wide">
              <span class="preview-section__label">URLs</span>
              ${isOwner ? `<input name="urls" value="${EOD.escapeHtml(report.urls || '')}" style="margin-top:8px;">` : `<p>${EOD.escapeHtml(report.urls || 'None')}</p>`}
            </section>
            ${report.clearedAt ? `
              <section class="preview-section preview-section--wide">
                <span class="preview-section__label">Cleared by</span>
                <p>${EOD.escapeHtml(report.clearedByName || report.clearedBy || 'Unknown')} · ${EOD.formatDate(report.clearedAt)}</p>
              </section>
            ` : ''}
          </div>
        </div>

          <div class="button-row report-modal-actions">
          <button class="button-primary" type="submit">Save changes</button>
          <button class="button-ghost" type="button" data-clear-report>${report.clearedAt ? 'Already cleared' : 'Clear from inbox'}</button>
        </div>
      </form>
    `;

    EOD.openModal({
      label: 'Report details',
      title: report.project || 'Report',
      subtitle: 'Edit status and priority, then clear it when the team is done reviewing.',
      wide: true,
      body
    });

    const form = EOD.qs('[data-report-detail-form]');
    const clearButton = EOD.qs('[data-clear-report]');

    clearButton?.addEventListener('click', () => {
      if (report.clearedAt) return;
      EOD.clearReportInbox(report.id);
      EOD.notify('Report cleared from the inbox.', 'success', 'Report');
      EOD.closeModal();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const patch = {
        status: String(data.status || report.status),
        priority: String(data.priority || report.priority)
      };
      if (isOwner) {
        if ('accomplishments' in data) patch.accomplishments = String(data.accomplishments);
        if ('inProgress' in data) patch.inProgress = String(data.inProgress);
        if ('deploymentUpdates' in data) patch.deploymentUpdates = String(data.deploymentUpdates);
        if ('tomorrowPlan' in data) patch.tomorrowPlan = String(data.tomorrowPlan);
        if ('urls' in data) patch.urls = String(data.urls);
      }
      EOD.updateReport(report.id, patch);
      EOD.notify('Report updated.', 'success', 'Report');
      EOD.closeModal();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });
  }

  function renderReportsList(root, reports, query = '') {
    const session = EOD.getSession ? EOD.getSession() : {};
    const sessionUser = String(session.username || session.displayName || '').toLowerCase().trim();

    const filtered = EOD.filterReports(reports, { query });
    root.innerHTML = filtered.length ? filtered.map((item) => {
      const itemOwner = String(item.employee || '').toLowerCase().trim();
      const isOwner = sessionUser && (itemOwner.includes(sessionUser) || sessionUser.includes(itemOwner));
      
      return `
      <article class="report-item fade-up" data-open-report-detail="${EOD.escapeHtml(item.id)}" role="button" tabindex="0">
        <div class="report-item__top">
          <div>
            <strong>${EOD.escapeHtml(item.employee)}</strong>
            <p>${EOD.escapeHtml(item.project)} · ${EOD.formatDate(item.date)} · ${EOD.escapeHtml(item.role)}</p>
          </div>
          <span class="status-pill ${String(item.status).includes('blocked') ? 'is-blocked' : ''}">${EOD.escapeHtml(item.status)}</span>
        </div>
        <p>${EOD.escapeHtml(item.accomplishments)}</p>
        <div class="meta-row" style="margin-top:14px;">
          <span class="priority-pill is-${String(item.priority).toLowerCase()}">${EOD.escapeHtml(item.priority)}</span>
          ${item.urls ? `<span class="pill">${EOD.escapeHtml(item.urls)}</span>` : ''}
          ${item.clearedAt ? `<span class="pill">Cleared by ${EOD.escapeHtml(item.clearedByName || item.clearedBy || 'Team')}</span>` : ''}
          <div style="flex-grow:1;"></div>
          <button class="button-ghost" type="button" data-open-report-detail="${EOD.escapeHtml(item.id)}">Open</button>
          ${isOwner ? `<button class="button-soft" type="button" data-action-delete="${EOD.escapeHtml(item.id)}">Delete</button>` : ''}
        </div>
      </article>
      `;
    }).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${ICONS.report}</div><strong>${query.trim() ? 'No reports match your filter' : 'No reports yet'}</strong><span>${query.trim() ? 'Try a different search term.' : 'Submit your first standup update to start the history.'}</span>${!query.trim() ? '<button class="button-soft" type="button" data-open-report-modal style="margin-top:14px;">New report</button>' : ''}</div>`;
  }

  function applyEodTemplateToForm(form, updatePreview) {
    if (!form || !EOD.getEodTemplate) return;
    const template = EOD.getEodTemplate();
    const fields = ['date', 'accomplishments', 'inProgress', 'deploymentUpdates', 'tomorrowPlan', 'priority', 'status'];
    fields.forEach((name) => {
      const input = form.elements[name];
      if (input && name in template) input.value = template[name];
    });
    updatePreview();
    EOD.notify('EOD template applied to accomplishments.', 'brand', 'Template');
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

    const body = EOD.createElement('div');
    body.innerHTML = `
      <form class="stack" data-report-form style="max-width: 680px; margin: 0 auto; width: 100%;">
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

        <div class="section-heading" style="margin-top:24px;"><div><h4 style="margin:0;">Progress Update</h4></div></div>

        <label class="field"><span>Accomplishments <span class="character-count" data-count-accomplishments>0</span></span><textarea name="accomplishments" data-preview-source="accomplishments" maxlength="1800" rows="5">${EOD.escapeHtml(payload.accomplishments || '')}</textarea><span class="helper">Keep it concrete and readable.</span></label>
        <label class="field"><span>In progress <span class="character-count" data-count-inProgress>0</span></span><textarea name="inProgress" data-preview-source="inProgress" maxlength="1200" rows="3">${EOD.escapeHtml(payload.inProgress || '')}</textarea></label>
        
        <div class="section-heading" style="margin-top:24px;"><div><h4 style="margin:0;">Additional Details</h4></div></div>

        <label class="field"><span>Deployment updates</span><textarea name="deploymentUpdates" data-preview-source="deploymentUpdates" maxlength="1200" rows="2">${EOD.escapeHtml(payload.deploymentUpdates || '')}</textarea></label>
        <label class="field"><span>URLs worked on</span><input name="urls" value="${EOD.escapeHtml(payload.urls || '')}" placeholder="dashboard.html, reports.html"></label>
        <label class="field"><span>Tomorrow plan</span><textarea name="tomorrowPlan" data-preview-source="tomorrowPlan" maxlength="1200" rows="2">${EOD.escapeHtml(payload.tomorrowPlan || '')}</textarea></label>

        <div class="button-row report-modal-actions" style="margin-top:32px;">
          <button type="submit" class="button-primary">Save report</button>
          <button type="button" class="button-ghost" data-apply-eod-template>Use EOD template</button>
          <button type="button" class="button-ghost" data-clear-draft>Clear draft</button>
        </div>
      </form>
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

    function updatePreview() {
      const data = formData(form);
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

    EOD.qs('[data-apply-eod-template]', form)?.addEventListener('click', () => {
      applyEodTemplateToForm(form, updatePreview);
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
              <p class="workspace-description">Write and review daily standup updates. Drafts autosave while you edit.</p>
              <div class="hero-actions" style="margin-top:18px;">
                <button class="button-primary" type="button" data-open-report-modal>New report</button>
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

        <section class="list-card reports-workspace">
          <div class="section-heading">
            <div>
              <h3>Report history</h3>
              <p>Search and open past standup submissions from your team.</p>
            </div>
          </div>
          <label class="search-field reports-workspace__filter"><span aria-hidden="true">⌕</span><input data-report-query placeholder="Filter by employee, project, update, or status"></label>
          <div class="report-list" data-report-list></div>
        </section>
      </div>
    `;

    const queryInput = EOD.qs('[data-report-query]');
    const list = EOD.qs('[data-report-list]');
    renderReportsList(list, reports, '');
    queryInput?.addEventListener('input', () => renderReportsList(list, reports, queryInput.value));
    EOD.qs('[data-open-report-modal]')?.addEventListener('click', () => openReportModal());

    root.addEventListener('click', (event) => {
      const delBtn = event.target.closest('[data-action-delete]');
      if (delBtn) {
        event.stopPropagation();
        const id = delBtn.getAttribute('data-action-delete');
        if (id && confirm('Are you sure you want to permanently delete this item?')) {
          if (id.startsWith('rep-') && EOD.deleteReport) {
            EOD.deleteReport(id);
            EOD.notify('Report permanently deleted.', 'brand', 'Deleted');
            EOD.renderCurrentPage && EOD.renderCurrentPage();
          }
        }
        return;
      }
      
      const detail = event.target.closest('[data-open-report-detail]');
      if (!detail) return;
      const id = detail.getAttribute('data-open-report-detail');
      if (id) openReportDetail(id);
    });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('[data-open-report-detail]');
      if (!card) return;
      event.preventDefault();
      const id = card.getAttribute('data-open-report-detail');
      if (id) openReportDetail(id);
    });
  }

  EOD.openReportModal = openReportModal;
  EOD.openReportDetail = openReportDetail;
  EOD.initReportsPage = function (root) {
    if (!root) return;
    EOD.setPageMeta('Reports', 'Compose and review daily updates.');
    renderReportsPage(root);
  };
})();
