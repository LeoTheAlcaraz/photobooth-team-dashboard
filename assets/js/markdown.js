(function () {
  const EOD = window.EOD = window.EOD || {};

  function renderMarkdown(input) {
    const text = String(input || '').replace(/\r\n/g, '\n');
    if (!text.trim()) return '<p class="subtle">Nothing to preview yet.</p>';

    const lines = text.split('\n');
    const blocks = [];
    let list = [];

    function flushList() {
      if (!list.length) return;
      blocks.push(`<ul>${list.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      list = [];
    }

    for (const line of lines) {
      const safe = EOD.escapeHtml(line)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

      if (/^#{1,3}\s/.test(line)) {
        flushList();
        const level = line.match(/^#+/)[0].length;
        blocks.push(`<h${level}>${safe.replace(/^#{1,3}\s/, '')}</h${level}>`);
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        list.push(safe.replace(/^[-*]\s+/, ''));
        continue;
      }

      flushList();
      if (!safe.trim()) {
        blocks.push('<div style="height:4px"></div>');
      } else {
        blocks.push(`<p>${safe}</p>`);
      }
    }

    flushList();
    return blocks.join('');
  }

  EOD.renderMarkdown = renderMarkdown;
})();
