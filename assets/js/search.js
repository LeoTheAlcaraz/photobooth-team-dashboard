(function () {
  const EOD = window.EOD = window.EOD || {};

  function normalize(value) {
    return String(value || '').toLowerCase();
  }

  function matchesRecord(record, query, fields) {
    const needle = normalize(query).trim();
    if (!needle) return true;
    return fields.some((field) => normalize(record[field]).includes(needle));
  }

  function filterReports(reports, filters) {
    return reports.filter((report) => {
      const searchHit = matchesRecord(report, filters.query, ['employee', 'role', 'project', 'accomplishments', 'inProgress', 'blockers', 'deploymentUpdates', 'urls', 'tomorrowPlan', 'status', 'priority']);
      const roleHit = !filters.role || normalize(report.role) === normalize(filters.role);
      const statusHit = !filters.status || normalize(report.status) === normalize(filters.status);
      const priorityHit = !filters.priority || normalize(report.priority) === normalize(filters.priority);
      const dateHit = !filters.date || String(report.date || '').startsWith(filters.date);
      return searchHit && roleHit && statusHit && priorityHit && dateHit;
    });
  }

  function filterBugs(bugs, filters) {
    return bugs.filter((bug) => {
      const searchHit = matchesRecord(bug, filters.query, ['title', 'description', 'affectedUrl', 'browser', 'steps', 'expectedResult', 'actualResult', 'reporter', 'role', 'severity']);
      const severityHit = !filters.severity || normalize(bug.severity) === normalize(filters.severity);
      const priorityHit = !filters.priority || normalize(bug.priority) === normalize(filters.priority);
      const dateHit = !filters.date || String(bug.createdAt || '').startsWith(filters.date);
      return searchHit && severityHit && priorityHit && dateHit;
    });
  }

  function filterActivity(activity, filters) {
    return activity.filter((item) => {
      const searchHit = matchesRecord(item, filters.query, ['title', 'body', 'role', 'priority', 'severity', 'type']);
      const roleHit = !filters.role || normalize(item.role) === normalize(filters.role);
      const severityHit = !filters.severity || normalize(item.severity || '') === normalize(filters.severity);
      const priorityHit = !filters.priority || normalize(item.priority) === normalize(filters.priority);
      const dateHit = !filters.date || String(item.createdAt || '').startsWith(filters.date);
      return searchHit && roleHit && severityHit && priorityHit && dateHit;
    });
  }

  EOD.normalizeText = normalize;
  EOD.matchesRecord = matchesRecord;
  EOD.filterReports = filterReports;
  EOD.filterBugs = filterBugs;
  EOD.filterActivity = filterActivity;
})();
