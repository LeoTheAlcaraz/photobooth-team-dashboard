(function () {
  const EOD = window.EOD = window.EOD || {};

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value, options) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, Object.assign({ month: 'short', day: 'numeric', year: 'numeric' }, options || {})).format(date);
  }

  function formatTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function timeAgo(value) {
    const date = new Date(value);
    const delta = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.floor(delta / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function initials(name) {
    return String(name || 'EOD').split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
  }

  function avatar(name) {
    return `<span class="avatar" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const nextClassList = new Set(String(document.body.className || '').split(/\s+/).filter(Boolean).filter((name) => name !== 'light-theme'));
    if (theme === 'light') nextClassList.add('light-theme');
    document.body.className = Array.from(nextClassList).join(' ');

    const nextRootClassList = new Set(String(document.documentElement.className || '').split(/\s+/).filter(Boolean).filter((name) => name !== 'light-theme'));
    if (theme === 'light') nextRootClassList.add('light-theme');
    document.documentElement.className = Array.from(nextRootClassList).join(' ');

    localStorage.setItem(EOD.keys.theme, theme);
  }

  function getTheme() {
    return localStorage.getItem(EOD.keys.theme) || (EOD.getSettings && EOD.getSettings().theme) || 'dark';
  }

  function setCompact(enabled) {
    document.body.classList.toggle('compact', Boolean(enabled));
    localStorage.setItem(EOD.keys.compact, enabled ? '1' : '0');
  }

  function setShellCollapsed(enabled) {
    const shell = qs('.app-shell');
    if (!shell) return;
    shell.classList.toggle('sidebar-collapsed', enabled);
    localStorage.setItem(EOD.keys.sidebarCollapsed, enabled ? '1' : '0');
  }

  function setSidebarOpen(enabled) {
    const sidebar = qs('[data-sidebar]');
    if (!sidebar) return;
    sidebar.classList.toggle('is-open', enabled);
    document.body.classList.toggle('sidebar-open', enabled);
  }

  function createElement(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function ensureRoots() {
    const modalRoot = qs('#modal-root') || document.body.appendChild(createElement('div', 'modal-root', ''));
    const toastRoot = qs('#toast-root') || document.body.appendChild(createElement('div', 'toast-root', ''));
    return { modalRoot, toastRoot };
  }

  function toast(message, tone = 'brand', title) {
    const { toastRoot } = ensureRoots();
    const node = createElement('div', 'toast');
    const icon = tone === 'success' ? '✓' : tone === 'danger' ? '!' : tone === 'warning' ? '!' : '•';
    node.innerHTML = `
      <div class="toast__icon">${icon}</div>
      <div>
        <div class="toast__title">${escapeHtml(title || (tone === 'success' ? 'Saved' : tone === 'danger' ? 'Attention' : 'Update'))}</div>
        <div class="toast__body">${escapeHtml(message)}</div>
      </div>
    `;
    toastRoot.prepend(node);
    setTimeout(() => node.remove(), 3400);
    return node;
  }

  function closeModal() {
    const { modalRoot } = ensureRoots();
    modalRoot.innerHTML = '';
    document.body.classList.remove('modal-open');
  }

  function openModal(options) {
    const { modalRoot } = ensureRoots();
    modalRoot.innerHTML = '';
    const modal = createElement('div', 'modal');
    modal.innerHTML = `
      <div class="modal__panel ${options && options.wide ? 'is-wide' : ''}">
        <div class="modal__header">
          <div>
            <div class="section-label">${escapeHtml(options && options.label ? options.label : 'Workspace')}</div>
            <h3 style="margin:10px 0 0; letter-spacing:-0.03em;">${escapeHtml(options && options.title ? options.title : '')}</h3>
            ${options && options.subtitle ? `<p class="subtle" style="margin-top:6px;">${escapeHtml(options.subtitle)}</p>` : ''}
          </div>
          <button class="icon-button" type="button" data-close-modal aria-label="Close modal">✕</button>
        </div>
        <div class="modal__body"></div>
        ${options && options.footer ? `<div class="modal__footer">${options.footer}</div>` : ''}
      </div>
    `;
    const body = qs('.modal__body', modal);
    if (typeof options.body === 'string') body.innerHTML = options.body; else if (options.body instanceof Node) body.appendChild(options.body);
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.hasAttribute('data-close-modal')) closeModal();
    });
    modalRoot.appendChild(modal);
    document.body.classList.add('modal-open');
    return modal;
  }

  function setPageMeta(title, subtitle) {
    const heading = qs('[data-page-title]');
    const subtitleNode = qs('[data-page-subtitle]');
    if (heading) heading.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle || '';
    document.title = `${title} · Photobooth-io Development Feed`;
  }

  function renderAvatarGroup(names) {
    return `<div class="avatar-stack">${names.map((name) => avatar(name)).join('')}</div>`;
  }

  function downloadJSON(name, value) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function copyText(value) {
    return navigator.clipboard.writeText(String(value || ''));
  }

  EOD.qs = qs;
  EOD.qsa = qsa;
  EOD.escapeHtml = escapeHtml;
  EOD.formatDate = formatDate;
  EOD.formatTime = formatTime;
  EOD.timeAgo = timeAgo;
  EOD.avatar = avatar;
  EOD.setTheme = setTheme;
  EOD.getTheme = getTheme;
  EOD.setCompact = setCompact;
  EOD.setShellCollapsed = setShellCollapsed;
  EOD.setSidebarOpen = setSidebarOpen;
  EOD.toast = toast;
  EOD.openModal = openModal;
  EOD.closeModal = closeModal;
  EOD.setPageMeta = setPageMeta;
  EOD.renderAvatarGroup = renderAvatarGroup;
  EOD.downloadJSON = downloadJSON;
  EOD.copyText = copyText;
  EOD.createElement = createElement;
})();
