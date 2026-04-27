/**
 * PTW System — Excel Export
 * Exports all permit data to a structured .xlsx file with:
 *   - Summary tab
 *   - All Permits tab
 *   - One tab per permit type (WAH, CS, LOTO, HW, ELEC)
 *   - Approval Log tab
 */

(function() {
  'use strict';

  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      PTW.toast('Excel library not loaded. Check your internet connection.', 'error');
      return;
    }

    const permits = PTW.getPermits();
    const wb      = XLSX.utils.book_new();
    const now     = new Date().toLocaleDateString('en-GB');

    // ── SUMMARY TAB ─────────────────────────────────────────────────
    const summary = buildSummarySheet(permits, now);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

    // ── ALL PERMITS TAB ─────────────────────────────────────────────
    const allSheet = buildAllPermitsSheet(permits);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allSheet), 'All Permits');

    // ── PER-TYPE TABS ───────────────────────────────────────────────
    Object.keys(PTW_CONFIG.types).forEach(type => {
      const typePermits = permits.filter(p => p.type === type);
      const sheet = buildTypeSheet(type, typePermits);
      const sheetName = PTW_CONFIG.types[type].label.substring(0, 31); // Excel 31-char limit
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), sheetName);
    });

    // ── APPROVAL LOG TAB ────────────────────────────────────────────
    const approvalLog = buildApprovalLogSheet(permits);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(approvalLog), 'Approval Log');

    // ── EXPORT ──────────────────────────────────────────────────────
    const filename = `PTW_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    PTW.toast(`Exported ${permits.length} permits to ${filename}`, 'success');
  }

  // ── SUMMARY SHEET ───────────────────────────────────────────────────
  function buildSummarySheet(permits, exportDate) {
    const total    = permits.length;
    const byStatus = {};
    const byType   = {};
    const byRisk   = {};

    ['pending','approved','active','closed','rejected'].forEach(s => byStatus[s] = 0);
    Object.keys(PTW_CONFIG.types).forEach(t => byType[t] = 0);
    ['Low','Medium','High','Extreme'].forEach(r => byRisk[r] = 0);

    permits.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byType[p.type]     = (byType[p.type]     || 0) + 1;
      byRisk[p.risk]     = (byRisk[p.risk]     || 0) + 1;
    });

    return [
      ['PERMIT TO WORK SYSTEM — SUMMARY REPORT'],
      [`Generated: ${exportDate}`],
      [],
      ['OVERALL STATISTICS'],
      ['Total Permits', total],
      [],
      ['BY STATUS', 'Count'],
      ['Pending',  byStatus.pending],
      ['Approved', byStatus.approved],
      ['Active',   byStatus.active],
      ['Closed',   byStatus.closed],
      ['Rejected', byStatus.rejected],
      [],
      ['BY PERMIT TYPE', 'Count'],
      ...Object.entries(PTW_CONFIG.types).map(([t, meta]) => [meta.label, byType[t] || 0]),
      [],
      ['BY RISK LEVEL', 'Count'],
      ['Low',     byRisk.Low],
      ['Medium',  byRisk.Medium],
      ['High',    byRisk.High],
      ['Extreme', byRisk.Extreme],
      [],
      ['WORKFLOW SUMMARY'],
      ['Permit Type', 'Approval Stages', 'Stage 1 Role', 'Stage 2 Role', 'Stage 3 Role'],
      ...Object.entries(PTW_CONFIG.workflows).map(([type, wf]) => [
        PTW_CONFIG.types[type].label,
        wf.stages.length,
        wf.stages[0]?.role || '',
        wf.stages[1]?.role || '',
        wf.stages[2]?.role || 'N/A',
      ]),
    ];
  }

  // ── ALL PERMITS SHEET ───────────────────────────────────────────────
  function buildAllPermitsSheet(permits) {
    const header = [
      'Permit ID', 'Type', 'Status', 'Risk Level',
      'Requester Name', 'Company / Organisation', 'Contact', 'Email',
      'Location', 'Description',
      'Site Supervisor', 'No. of Workers', 'Worker Names',
      'Planned Start Date', 'Planned Start Time', 'Planned End Date', 'Planned End Time',
      'Control Measures',
      'Date Submitted', 'Requester Signature',
      'Stage 1 Approver', 'Stage 1 Role', 'Stage 1 Date', 'Stage 1 Comment',
      'Stage 2 Approver', 'Stage 2 Role', 'Stage 2 Date', 'Stage 2 Comment',
      'Stage 3 Approver', 'Stage 3 Role', 'Stage 3 Date', 'Stage 3 Comment',
      'Comments / Notes',
    ];

    const rows = permits.map(p => {
      const wf       = PTW_CONFIG.workflows[p.type];
      const approvals = p.approvals || {};
      const stageData = wf.stages.map(s => {
        const ap = approvals[s.key];
        return ap ? [ap.by, ap.role, ap.date, ap.comment || ''] : ['', '', '', ''];
      });
      // Pad to 3 stages
      while (stageData.length < 3) stageData.push(['','','','']);

      return [
        p.id,
        PTW_CONFIG.types[p.type]?.label || p.type,
        p.status,
        p.risk,
        p.requester, p.company, p.contact || '', p.email || '',
        p.location, p.description,
        p.supervisor || '', p.workers || '', p.workerNames || '',
        p.startDate || '', p.startTime || '', p.endDate || '', p.endTime || '',
        p.controls,
        p.date, p.signature,
        ...stageData[0], ...stageData[1], ...stageData[2],
        (p.comments || []).join(' | '),
      ];
    });

    return [header, ...rows];
  }

  // ── PER-TYPE SHEETS ─────────────────────────────────────────────────
  function buildTypeSheet(type, permits) {
    const meta   = PTW_CONFIG.types[type];
    const wf     = PTW_CONFIG.workflows[type];
    const fields = PTW_CONFIG.typeFields[type] || [];

    // Header: common cols + type-specific cols + approval stages
    const commonHeader = [
      'Permit ID', 'Status', 'Risk Level',
      'Requester Name', 'Company', 'Contact', 'Email',
      'Location', 'Description',
      'Control Measures', 'Date Submitted',
    ];
    const typeHeader  = fields.map(f => f.label);
    const stageHeader = wf.stages.flatMap((s, i) => [
      `Stage ${i+1} Approver (${s.role})`,
      `Stage ${i+1} Date`,
      `Stage ${i+1} Comment`,
    ]);
    const header = [...commonHeader, ...typeHeader, ...stageHeader];

    if (!permits.length) {
      return [
        [`${meta.label} Permits`],
        [`No ${meta.label} permits recorded.`],
        [],
        header,
      ];
    }

    const rows = permits.map(p => {
      const approvals = p.approvals || {};
      const typeVals  = fields.map(f => p.typeData?.[f.id] || '');
      const stageVals = wf.stages.flatMap(s => {
        const ap = approvals[s.key];
        return ap ? [ap.by, ap.date, ap.comment || ''] : ['', '', ''];
      });

      return [
        p.id, p.status, p.risk,
        p.requester, p.company, p.contact || '', p.email || '',
        p.location, p.description, p.controls, p.date,
        ...typeVals, ...stageVals,
      ];
    });

    return [
      [`${meta.label} Permits — ${meta.icon}`],
      [`Workflow: ${wf.name}`],
      [],
      header,
      ...rows,
    ];
  }

  // ── APPROVAL LOG SHEET ──────────────────────────────────────────────
  function buildApprovalLogSheet(permits) {
    const header = [
      'Permit ID', 'Permit Type', 'Requester', 'Company',
      'Stage No.', 'Stage Label', 'Approver Role',
      'Approved By', 'Approver Title', 'Approval Date', 'Comment',
    ];

    const rows = [];
    permits.forEach(p => {
      const wf       = PTW_CONFIG.workflows[p.type];
      const approvals = p.approvals || {};
      wf.stages.forEach((s, i) => {
        const ap = approvals[s.key];
        rows.push([
          p.id,
          PTW_CONFIG.types[p.type]?.label || p.type,
          p.requester, p.company,
          i + 1, s.label, s.role,
          ap ? ap.by      : '(Pending)',
          ap ? ap.role    : '',
          ap ? ap.date    : '',
          ap ? ap.comment : '',
        ]);
      });
    });

    if (!rows.length) {
      return [
        ['Approval Log'],
        ['No approvals recorded yet.'],
        [],
        header,
      ];
    }

    return [
      ['APPROVAL LOG — All Stages'],
      [],
      header,
      ...rows,
    ];
  }

  // Expose
  PTW.exportExcel = exportExcel;
})();
