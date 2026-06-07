(function () {
  const EOD = window.EOD = window.EOD || {};

  const ICONS = {
    attachment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z"/><path d="M7 6h10"/></svg>',
    bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7a3 3 0 0 1 6 0v1h2a2 2 0 0 1 2 2v1h-2"/><path d="M7 11H5v-1a2 2 0 0 1 2-2h2"/><path d="M7 13v2a5 5 0 0 0 10 0v-2"/><path d="M12 3v4"/><path d="M9 19l-1 2"/><path d="M15 19l1 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z"/></svg>'
  };

  function readFiles(files) {
    return Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result
      });
      reader.readAsDataURL(file);
    })));
  }

  function renderAttachments(attachments, onRemove) {
    return attachments.length ? attachments.map((item, index) => `
      <article class="attachment-card">
        ${item.type && item.type.startsWith('image/') ? `<img src="${item.dataUrl}" alt="${EOD.escapeHtml(item.name)}">` : `<div class="empty-state" style="min-height:118px;"><div class="empty-state__icon">${ICONS.attachment}</div></div>`}
        <div class="split-card">
          <div>
            <strong>${EOD.escapeHtml(item.name)}</strong>
            <div class="helper">${Math.round(item.size / 1024)} KB</div>
          </div>
          <button class="button-ghost" type="button" data-remove-attachment="${index}">Remove</button>
        </div>
      </article>
    `).join('') : `<div class="empty-state"><div class="empty-state__icon">${ICONS.attachment}</div><strong>No attachments yet</strong><span>Drag files here or paste a screenshot to add one.</span></div>`;
  }

  function buildBugForm(payload) {
    return `
      <form class="stack" data-bug-form>
        <div class="mini-grid">
          <label class="field"><span>Title</span><input name="title" value="${EOD.escapeHtml(payload.title || '')}" placeholder="What broke?"></label>
          <label class="field"><span>Severity</span><select name="severity"><option value="low" ${payload.severity === 'low' ? 'selected' : ''}>Low</option><option value="medium" ${payload.severity === 'medium' ? 'selected' : ''}>Medium</option><option value="high" ${payload.severity === 'high' ? 'selected' : ''}>High</option><option value="critical" ${payload.severity === 'critical' ? 'selected' : ''}>Critical</option></select></label>
          <label class="field"><span>Affected URL</span><input name="affectedUrl" value="${EOD.escapeHtml(payload.affectedUrl || '')}" placeholder="dashboard.html"></label>
          <label class="field"><span>Browser</span><input name="browser" value="${EOD.escapeHtml(payload.browser || '')}" placeholder="Chrome 125 / macOS"></label>
          <label class="field"><span>Reporter</span><input name="reporter" value="${EOD.escapeHtml(payload.reporter || EOD.getSettings().profile.displayName)}"></label>
          <label class="field"><span>Role</span><select name="role">${EOD.roles.map((role) => `<option value="${role}" ${role === (payload.role || EOD.getSettings().profile.title) ? 'selected' : ''}>${role}</option>`).join('')}</select></label>
        </div>

        <label class="field"><span>Description</span><textarea name="description" maxlength="1200">${EOD.escapeHtml(payload.description || '')}</textarea></label>
        <label class="field"><span>Reproduce steps</span><textarea name="steps" maxlength="1200">${EOD.escapeHtml(payload.steps || '')}</textarea></label>
        <label class="field"><span>Expected result</span><textarea name="expectedResult" maxlength="1200">${EOD.escapeHtml(payload.expectedResult || '')}</textarea></label>
        <label class="field"><span>Actual result</span><textarea name="actualResult" maxlength="1200">${EOD.escapeHtml(payload.actualResult || '')}</textarea></label>

        <div class="dropzone" data-dropzone>
          <div class="bug-preview-row">
            <div>
              <strong>Attachments</strong>
              <div class="paste-hint">Drag files here, click to upload, or paste a screenshot from the clipboard.</div>
            </div>
            <div class="attachment-actions">
              <input class="is-visually-hidden" type="file" multiple accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.pdf" data-file-input>
              <button class="button-soft" type="button" data-file-picker>Choose files</button>
              <button class="button-ghost" type="button" data-clear-attachments>Clear</button>
            </div>
          </div>
          <div class="thumb-grid" data-attachment-grid>${renderAttachments(payload.attachments || [])}</div>
        </div>

        <div class="button-row">
          <button class="button-primary" type="submit">Save bug</button>
          <button class="button-ghost" type="button" data-bug-draft-clear>Clear draft</button>
        </div>
      </form>
    `;
  }

  function bugSeverityOptions(severity) {
    return ['low', 'medium', 'high', 'critical'].map((item) => `<option value="${item}" ${String(severity || 'medium') === item ? 'selected' : ''}>${item.charAt(0).toUpperCase() + item.slice(1)}</option>`).join('');
  }

  function renderAttachmentThumbs(attachments) {
    if (!attachments || !attachments.length) {
      return '<p class="subtle">No attachments.</p>';
    }
    return `<div class="thumb-grid">${attachments.map((item) => (
      item.type && item.type.startsWith('image/')
        ? `<img src="${item.dataUrl}" alt="${EOD.escapeHtml(item.name)}" style="max-width:100%; border-radius:12px;">`
        : `<span class="pill">${EOD.escapeHtml(item.name)}</span>`
    )).join('')}</div>`;
  }

  function openBugDetail(bugOrId) {
    const bug = typeof bugOrId === 'object' ? bugOrId : EOD.getBugById(bugOrId);
    if (!bug) {
      EOD.notify('That bug could not be found.', 'warning', 'Bug');
      return;
    }

    const session = EOD.getSession ? EOD.getSession() : {};
    const sessionUser = String(session.username || session.displayName || '').toLowerCase().trim();
    const itemOwner = String(bug.reporter || '').toLowerCase().trim();
    const isOwner = sessionUser && (itemOwner.includes(sessionUser) || sessionUser.includes(itemOwner));

    const body = EOD.createElement('div', 'stack');
    body.innerHTML = `
      <form class="stack" data-bug-detail-form>
        <div class="draft-strip">
          <div>
            <strong>${EOD.escapeHtml(bug.reporter || 'Reporter')}</strong>
            <div class="helper">${EOD.escapeHtml(bug.affectedUrl || 'No URL')} · ${EOD.escapeHtml(bug.role || 'Role')}</div>
          </div>
          <span class="pill">${EOD.formatDate(bug.createdAt)}</span>
        </div>

        <div class="mini-grid">
          <label class="field"><span>Severity</span><select name="severity">${bugSeverityOptions(bug.severity)}</select></label>
          <label class="field"><span>Browser</span>${isOwner ? `<input name="browser" value="${EOD.escapeHtml(bug.browser || '')}">` : `<p style="margin:0;">${EOD.escapeHtml(bug.browser || '—')}</p>`}</label>
        </div>

        <div class="preview-body report-preview-content">
          <div class="preview-header-card">
            <div class="preview-header-card__meta">
              <span class="severity-pill is-${String(bug.severity || 'medium').toLowerCase()}">${EOD.escapeHtml(bug.severity || 'medium')}</span>
              <span class="role-pill">${EOD.escapeHtml(bug.role || 'Role')}</span>
            </div>
            ${isOwner ? `<input name="title" value="${EOD.escapeHtml(bug.title || '')}" style="margin-top:8px; font-size:1.15rem; font-weight:600; width:100%;">` : `<h3>${EOD.escapeHtml(bug.title || 'Bug')}</h3>`}
            <p>${EOD.escapeHtml(bug.reporter || 'Reporter')} · ${EOD.escapeHtml(bug.affectedUrl || 'No URL')}</p>
          </div>

          <div class="preview-section-grid">
            <section class="preview-section preview-section--wide">
              <span class="preview-section__label">Affected URL</span>
              ${isOwner ? `<input name="affectedUrl" value="${EOD.escapeHtml(bug.affectedUrl || '')}" style="margin-top:8px;">` : `<p>${EOD.escapeHtml(bug.affectedUrl || 'None')}</p>`}
            </section>
            <section class="preview-section preview-section--wide">
              <span class="preview-section__label">Description</span>
              ${isOwner ? `<textarea name="description" rows="3" style="margin-top:8px;">${EOD.escapeHtml(bug.description || '')}</textarea>` : `<p>${EOD.escapeHtml(bug.description || 'No description.')}</p>`}
            </section>
            <section class="preview-section preview-section--wide">
              <span class="preview-section__label">Reproduce steps</span>
              ${isOwner ? `<textarea name="steps" rows="3" style="margin-top:8px;">${EOD.escapeHtml(bug.steps || '')}</textarea>` : `<p>${EOD.escapeHtml(bug.steps || 'No steps provided.')}</p>`}
            </section>
            <section class="preview-section">
              <span class="preview-section__label">Expected result</span>
              ${isOwner ? `<textarea name="expectedResult" rows="2" style="margin-top:8px;">${EOD.escapeHtml(bug.expectedResult || '')}</textarea>` : `<p>${EOD.escapeHtml(bug.expectedResult || '—')}</p>`}
            </section>
            <section class="preview-section">
              <span class="preview-section__label">Actual result</span>
              ${isOwner ? `<textarea name="actualResult" rows="2" style="margin-top:8px;">${EOD.escapeHtml(bug.actualResult || '')}</textarea>` : `<p>${EOD.escapeHtml(bug.actualResult || '—')}</p>`}
            </section>
            <section class="preview-section preview-section--wide">
              <span class="preview-section__label">Attachments</span>
              ${renderAttachmentThumbs(bug.attachments || [])}
            </section>
            ${bug.clearedAt ? `
              <section class="preview-section preview-section--wide">
                <span class="preview-section__label">Cleared by</span>
                <p>${EOD.escapeHtml(bug.clearedByName || bug.clearedBy || 'Unknown')} · ${EOD.formatDate(bug.clearedAt)}</p>
              </section>
            ` : ''}
          </div>
        </div>

        <div class="button-row report-modal-actions">
          <button class="button-primary" type="submit">Save changes</button>
          <button class="button-ghost" type="button" data-clear-bug>${bug.clearedAt ? 'Already cleared' : 'Clear from inbox'}</button>
        </div>
      </form>
    `;

    EOD.openModal({
      label: 'Bug details',
      title: bug.title || 'Bug',
      subtitle: 'Review repro details and clear the issue once it is handled.',
      wide: true,
      body
    });

    const form = EOD.qs('[data-bug-detail-form]');
    const clearButton = EOD.qs('[data-clear-bug]');

    clearButton?.addEventListener('click', () => {
      if (bug.clearedAt) return;
      EOD.clearBugInbox(bug.id);
      EOD.notify('Bug cleared from the inbox.', 'success', 'Bug');
      EOD.closeModal();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const patch = {
        severity: String(data.severity || bug.severity)
      };
      if (isOwner) {
        if ('title' in data) patch.title = String(data.title);
        if ('description' in data) patch.description = String(data.description);
        if ('steps' in data) patch.steps = String(data.steps);
        if ('expectedResult' in data) patch.expectedResult = String(data.expectedResult);
        if ('actualResult' in data) patch.actualResult = String(data.actualResult);
        if ('affectedUrl' in data) patch.affectedUrl = String(data.affectedUrl);
        if ('browser' in data) patch.browser = String(data.browser);
      }
      EOD.updateBug(bug.id, patch);
      EOD.notify('Bug updated.', 'success', 'Bug');
      EOD.closeModal();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });
  }

  function bugCard(bug) {
    return `
      <article class="bug-item fade-up">
        <div class="bug-item__top">
          <div>
            <strong>${EOD.escapeHtml(bug.title)}</strong>
            <p>${EOD.escapeHtml(bug.reporter)} · ${EOD.escapeHtml(bug.browser)} · ${EOD.formatDate(bug.createdAt)}</p>
          </div>
          <span class="severity-pill is-${String(bug.severity).toLowerCase()}">${EOD.escapeHtml(bug.severity)}</span>
        </div>
        <p>${EOD.escapeHtml(bug.description)}</p>
        <div class="meta-row">
          <span class="pill">${EOD.escapeHtml(bug.affectedUrl)}</span>
          <span class="priority-pill is-${String(bug.priority || bug.severity).toLowerCase()}">${EOD.escapeHtml(bug.priority || bug.severity)}</span>
          <span class="pill">${(bug.attachments || []).length} attachments</span>
        </div>
      </article>
    `;
  }

  function openBugModal(prefill) {
    const payload = Object.assign({
      severity: 'medium',
      role: EOD.getSettings().profile.title,
      reporter: EOD.getSettings().profile.displayName,
      attachments: []
    }, EOD.getDraft('bug') || {}, prefill || {});

    EOD.openModal({
      label: 'Development feed',
      title: 'Log bug',
      subtitle: 'Upload screenshots and save repro details locally.',
      wide: true,
      body: buildBugForm(payload)
    });

    const form = EOD.qs('[data-bug-form]');
    const dropzone = EOD.qs('[data-dropzone]');
    const grid = EOD.qs('[data-attachment-grid]');
    const fileInput = EOD.qs('[data-file-input]');
    let attachments = payload.attachments.slice();

    function syncDraft() {
      const draft = Object.fromEntries(new FormData(form).entries());
      draft.attachments = attachments.slice();
      EOD.saveDraft('bug', draft);
      grid.innerHTML = renderAttachments(attachments);
    }

    async function addFiles(files) {
      if (!files || !files.length) return;
      const items = await readFiles(Array.from(files));
      attachments = attachments.concat(items).slice(0, 12);
      syncDraft();
      EOD.notify(`${items.length} attachment(s) added.`, 'success', 'Uploads');
    }

    dropzone.addEventListener('click', (event) => {
      if (event.target.closest('[data-file-picker]')) fileInput.click();
    });

    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));

    dropzone.addEventListener('drop', async (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
      await addFiles(event.dataTransfer.files);
    });

    fileInput.addEventListener('change', async () => {
      await addFiles(fileInput.files);
      fileInput.value = '';
    });

    form.addEventListener('paste', async (event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const files = items.filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter(Boolean);
      if (files.length) {
        await addFiles(files);
        EOD.notify('Clipboard screenshot pasted.', 'success', 'Attachments');
      }
    });

    form.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-attachment]');
      if (!remove) return;
      const index = Number(remove.getAttribute('data-remove-attachment'));
      attachments.splice(index, 1);
      syncDraft();
    });

    form.querySelector('[data-clear-attachments]')?.addEventListener('click', () => {
      attachments = [];
      syncDraft();
    });

    form.querySelector('[data-bug-draft-clear]')?.addEventListener('click', () => {
      EOD.clearDraft('bug');
      attachments = [];
      form.reset();
      syncDraft();
      EOD.notify('Bug draft cleared.', 'brand', 'Draft');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.title || !data.description || !data.steps) {
        EOD.notify('Add a title, description, and repro steps before saving.', 'warning', 'Validation');
        return;
      }
      const bug = EOD.addBug(Object.assign({}, data, { attachments }));
      EOD.clearDraft('bug');
      EOD.notify(`Bug saved: ${bug.title}.`, 'success', 'Bug tracker');
      EOD.closeModal();
      EOD.renderCurrentPage && EOD.renderCurrentPage();
    });

    syncDraft();
  }

  function renderBugsPage(root) {
    const bugs = EOD.getBugs();
    root.innerHTML = `
      <div class="page-stack fade-up">
        <section class="hero-card">
          <div class="hero-card__grid">
            <div class="workspace-header-block">
              <span class="badge-tag">Issue Tracking</span>
              <h2 class="workspace-title">System Error Logs</h2>
              <p class="workspace-description">Log and review platform defects. Attach screenshots and repro details from the editor.</p>
              <div class="hero-actions" style="margin-top:18px;">
                <button class="button-primary" type="button" data-open-bug-modal>New bug</button>
              </div>
            </div>
            <div class="premium-glass-card hero-aside">
              ${bugs.length ? `
                <div class="stack tight">
                  <span class="badge is-brand">${bugs.length} tracked bugs</span>
                  <div class="helper">Attachments are preview-only and persist locally.</div>
                  <div class="progress"><span style="width:${Math.min(bugs.length * 18, 100)}%"></span></div>
                </div>
              ` : `
                <div class="empty-state" style="min-height: 180px;">
                  <div class="empty-state__icon">${ICONS.alert}</div>
                  <strong>No active bugs</strong>
                  <span>Saved issues will appear here once they are added.</span>
                </div>
              `}
            </div>
          </div>
        </section>

        <section class="list-card bugs-workspace">
          <div class="section-heading">
            <div>
              <h3>Tracked issues</h3>
              <p>Filter and review open bugs across the team.</p>
            </div>
          </div>
          <label class="search-field bugs-workspace__filter"><span aria-hidden="true">⌕</span><input data-bug-query placeholder="Search by title, browser, URL, or reporter"></label>
          <div class="feed-filters bugs-workspace__filters">
            <select class="field" data-bug-severity><option value="">All severities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
            <select class="field" data-bug-priority><option value="">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
          </div>
          <div class="bug-list" data-bug-list></div>
        </section>
      </div>
    `;

    const query = EOD.qs('[data-bug-query]');
    const severity = EOD.qs('[data-bug-severity]');
    const priority = EOD.qs('[data-bug-priority]');
    const list = EOD.qs('[data-bug-list]');

    function render() {
      const items = EOD.filterBugs(bugs, { query: query.value, severity: severity.value, priority: priority.value });
      const hasFilters = query.value.trim() || severity.value || priority.value;
      list.innerHTML = items.length ? items.map(bugCard).join('') : `<div class="empty-state archive-empty"><div class="empty-state__icon">${ICONS.bug}</div><strong>${hasFilters ? 'No bugs match your filters' : 'No bugs yet'}</strong><span>${hasFilters ? 'Try a broader search.' : 'Log your first issue to start tracking defects.'}</span>${!hasFilters ? '<button class="button-soft" type="button" data-open-bug-modal style="margin-top:14px;">New bug</button>' : ''}</div>`;
    }

    [query, severity, priority].forEach((node) => node.addEventListener('input', render));
    render();
    EOD.qs('[data-open-bug-modal]')?.addEventListener('click', () => openBugModal());
  }

  EOD.openBugModal = openBugModal;
  EOD.openBugDetail = openBugDetail;
  EOD.initBugsPage = function (root) {
    if (!root) return;
    EOD.setPageMeta('Bugs', 'Report and review product issues.');
    renderBugsPage(root);
  };
})();
