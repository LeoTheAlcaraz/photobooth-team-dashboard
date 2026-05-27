(function () {
  const EOD = window.EOD = window.EOD || {};

  function notify(message, tone, title) {
    if (EOD.getSettings && !EOD.getSettings().notifications) return;
    if (typeof EOD.toast === 'function') EOD.toast(message, tone, title);
  }

  function browserNotify(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  function requestBrowserPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    return Notification.requestPermission();
  }

  EOD.notify = notify;
  EOD.browserNotify = browserNotify;
  EOD.requestBrowserPermission = requestBrowserPermission;
})();
