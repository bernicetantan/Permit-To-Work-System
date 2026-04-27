/**
 * PTW System — Core Application
 * State management, navigation, and shared utilities.
 */

const PTW = (() => {
  'use strict';

  // ── STATE ──────────────────────────────────────────────────────────
  let _permits      = [];
  let _currentStep  = 1;
  let _selectedType = null;
  let _filterStatus = 'all';
  let _approveId    = null;
  let _approveStage = null;
  let _approveMode  = 'approve'; // 'approve' | 'reject'
  let _currentDetailId = null;

  // Signature state
  let _sigCtx = null, _sigDrawing = false, _sigHasContent = false;
  let _apSigCtx = null, _apSigDrawing = false, _apSigHasContent = false;

  // ── NAVIGATION ─────────────────────────────────────────────────────
  function showPage(pageId, navEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Lazy render for pages
    switch (pageId) {
      case 'all-permits': renderAllPermits(); break;
      case 'approvals':   renderApprovals(); break;
      case 'analytics':   renderAnalytics(); break;
      case 'settings':    renderSettings(); break;
      case 'type-WAH':    renderTypePage('WAH'); break;
      case 'type-CS':     renderTypePage('CS'); break;
      case 'type-LOTO':   renderTypePage('LOTO'); break;
      case 'type-HW':     renderTypePage('HW'); break;
      case 'type-ELEC':   renderTypePage('ELEC'); break;
    }
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────
  function renderDashboard() {
    document.getElementById('dashDate').textContent =
      new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const total   = _permits.length;
    const pending = _permits.filter(p => p.status === 'pending').length;
    const active  = _permits.filter(p => p.status === 'active').length;
    const closed  = _permits.filter(p => p.status === 'closed').length;
    const hi      = _permits.filter(p => ['High','Extreme'].includes(p.risk)).length;

    document.getElementById('dashStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Permits</div>
        <div class="stat-value">${total}</div>
        <div class="stat-sub">All time</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending Approval</div>
        <div class="stat-value" style="color:var(--shopee-orange)">${pending}</div>
        <div class="stat-sub">Awaiting review</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Work</div>
        <div class="stat-value" style="color:#1565C0">${active}</div>
        <div class="stat-sub">In progress</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Closed</div>
        <div class="stat-value" style="color:var(--text-3)">${closed}</div>
        <div class="stat-sub">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">High / Extreme Risk</div>
        <div class="stat-value" style="color:#C62828">${hi}</div>
        <div class="stat-sub">Elevated risk</div>
      </div>
    `;

    // Recent permits table
    const recent = [..._permits].slice(0, 6);
    const tbody = document.getElementById('recentTableBody');
    if (!recent.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No permits yet. Create your first permit using the button above.</td></tr>';
    } else {
      tbody.innerHTML = recent.map(p => `
        <tr onclick="PTW.openDetail('${p.id}')">
          <td><span class="mono">${p.id}</span></td>
          <td>${typeBadge(p.type)}</td>
          <td style="font-size:12px">${p.requester}</td>
          <td style="font-size:12px;color:var(--text-3)">${p.company}</td>
          <td style="font-size:12px">${p.location}</td>
          <td>${riskBadge(p.risk)}</td>
          <td>${statusBadge(p.status)}</td>
          <td style="font-size:12px;color:var(--text-3)">${p.date}</td>
        </tr>
      `).join('');
    }

    // Type breakdown chart
    const tc = {};
    Object.keys(PTW_CONFIG.types).forEach(t => tc[t] = 0);
    _permits.forEach(p => tc[p.type] = (tc[p.type] || 0) + 1);
    const maxT = Math.max(...Object.values(tc), 1);
    document.getElementById('typeBreakdown').innerHTML = Object.entries(tc).map(([t, c]) => {
      const meta = PTW_CONFIG.types[t];
      return `
        <div class="bar-item">
          <div class="bar-label">${meta.icon} ${meta.label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${c/maxT*100}%;background:${meta.color}"></div></div>
          <div class="bar-count">${c}</div>
        </div>
      `;
    }).join('');

    // Pending approvals
    const pendingPermits = _permits.filter(p => p.status === 'pending');
    document.getElementById('pendingCount').textContent = `${pendingPermits.length} pending`;
    const pdiv = document.getElementById('pendingList');
    if (!pendingPermits.length) {
      pdiv.innerHTML = '<div class="empty-state-sm">No permits awaiting approval.</div>';
    } else {
      pdiv.innerHTML = pendingPermits.map(p => {
        const nextStage = getNextStage(p);
        return `
          <div class="pending-item">
            <div class="pending-item-icon">${PTW_CONFIG.types[p.type].icon}</div>
            <div class="pending-item-info">
              <div class="pending-item-id">${p.id} — ${PTW_CONFIG.types[p.type].label}</div>
              <div class="pending-item-meta">${p.requester} · ${p.company} · ${p.location} · ${nextStage ? nextStage.label : 'Awaiting'}</div>
            </div>
            ${riskBadge(p.risk)}
            <div class="pending-item-actions">
              <button class="btn btn-ghost btn-xs" onclick="PTW.openDetail('${p.id}')">View</button>
              ${nextStage ? `<button class="btn btn-success btn-xs" onclick="PTW.openApproveModal('${p.id}','${nextStage.key}')">Approve</button>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    updateBadges();
  }

  // ── ALL PERMITS ────────────────────────────────────────────────────
  function renderAllPermits() {
    const search = (document.getElementById('permitSearch')?.value || '').toLowerCase();
    let list = [..._permits];
    if (_filterStatus !== 'all') list = list.filter(p => p.status === _filterStatus);
    if (search) list = list.filter(p =>
      p.id.toLowerCase().includes(search) ||
      p.requester.toLowerCase().includes(search) ||
      p.company.toLowerCase().includes(search) ||
      p.location.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );

    const tbody = document.getElementById('allPermitsBody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-row">No permits found.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(p => `
      <tr onclick="PTW.openDetail('${p.id}')">
        <td><span class="mono">${p.id}</span></td>
        <td>${typeBadge(p.type)}</td>
        <td style="font-size:12px">${p.requester}</td>
        <td style="font-size:12px;color:var(--text-3)">${p.company}</td>
        <td style="font-size:12px">${p.location}</td>
        <td>${riskBadge(p.risk)}</td>
        <td>${statusBadge(p.status)}</td>
        <td style="font-size:12px;color:var(--text-3)">${p.date}</td>
        <td onclick="event.stopPropagation()" style="white-space:nowrap">
          ${actionBtns(p)}
        </td>
      </tr>
    `).join('');
  }

  function actionBtns(p) {
    const next = getNextStage(p);
    let btns = `<button class="btn btn-ghost btn-xs" onclick="PTW.openDetail('${p.id}')">View</button>`;
    if (p.status === 'pending' && next) {
      btns += ` <button class="btn btn-success btn-xs" onclick="PTW.openApproveModal('${p.id}','${next.key}')">Approve</button>`;
      btns += ` <button class="btn btn-danger btn-xs" onclick="PTW.openApproveModal('${p.id}','${next.key}','reject')">Reject</button>`;
    }
    if (p.status === 'approved') {
      btns += ` <button class="btn btn-primary btn-xs" onclick="PTW.activatePermit('${p.id}')">Activate</button>`;
    }
    if (p.status === 'active') {
      btns += ` <button class="btn btn-ghost btn-xs" onclick="PTW.closePermit('${p.id}')">Close</button>`;
    }
    return btns;
  }

  // ── TYPE PAGE ──────────────────────────────────────────────────────
  function renderTypePage(type) {
    const wf = PTW_CONFIG.workflows[type];
    const meta = PTW_CONFIG.types[type];

    // Workflow diagram
    const diagEl = document.getElementById('workflow-' + type);
    if (diagEl) {
      const stagesHtml = wf.stages.map((s, i) => `
        <div class="workflow-stage" style="border-color:${s.color}20">
          <div class="wf-stage-num" style="background:${s.color}">${i+1}</div>
          <div class="wf-stage-body">
            <div class="wf-stage-role">${s.role}</div>
            <div class="wf-stage-desc">${s.desc}</div>
          </div>
        </div>
        ${i < wf.stages.length - 1 ? '<div class="wf-arrow">→</div>' : ''}
      `).join('');

      diagEl.innerHTML = `
        <div class="workflow-title">
          <span style="color:${meta.color}">${meta.icon}</span>
          ${wf.name}
        </div>
        <div class="workflow-stages">${stagesHtml}</div>
      `;
    }

    // Type-specific table
    const typePermits = _permits.filter(p => p.type === type);
    const tbody = document.getElementById('typeBody-' + type);
    if (!tbody) return;

    if (!typePermits.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-row">No ${meta.label} permits yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = typePermits.map(p => {
      const extra = getTypeExtraCells(p);
      return `
        <tr onclick="PTW.openDetail('${p.id}')">
          <td><span class="mono">${p.id}</span></td>
          <td style="font-size:12px">${p.requester}</td>
          <td style="font-size:12px;color:var(--text-3)">${p.company}</td>
          ${extra}
          <td>${riskBadge(p.risk)}</td>
          <td>${statusBadge(p.status)}</td>
          <td style="font-size:12px;color:var(--text-3)">${p.date}</td>
          <td onclick="event.stopPropagation()">${actionBtns(p)}</td>
        </tr>
      `;
    }).join('');
  }

  function getTypeExtraCells(p) {
    switch (p.type) {
      case 'WAH':  return `<td style="font-size:12px">${p.typeData?.wah_height || '—'} m</td><td style="font-size:12px">${p.typeData?.wah_equip || '—'}</td>`;
      case 'CS':   return `<td style="font-size:12px">${p.typeData?.cs_space || '—'}</td><td style="font-size:12px">${p.typeData?.cs_atm || '—'}</td>`;
      case 'LOTO': return `<td style="font-size:12px">${p.typeData?.loto_energy || '—'}</td><td style="font-size:12px">${p.typeData?.loto_voltage || '—'}</td>`;
      case 'HW':   return `<td style="font-size:12px">${p.typeData?.hw_type || '—'}</td><td style="font-size:12px">${p.typeData?.hw_firewatch || '—'}</td>`;
      case 'ELEC': return `<td style="font-size:12px">${p.typeData?.elec_voltage || '—'}</td><td style="font-size:12px">${p.typeData?.elec_panel || '—'}</td>`;
      default:     return '<td>—</td><td>—</td>';
    }
  }

  // ── APPROVALS PAGE ─────────────────────────────────────────────────
  function renderApprovals() {
    const cont = document.getElementById('approvalsContent');
    const pending = _permits.filter(p => p.status === 'pending');

    if (!pending.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">All clear!</div><p>No permits awaiting approval.</p></div>';
      return;
    }

    // Group by next required stage
    const byStage = {};
    pending.forEach(p => {
      const next = getNextStage(p);
      if (!next) return;
      const key = next.label;
      if (!byStage[key]) byStage[key] = { stage: next, permits: [] };
      byStage[key].permits.push(p);
    });

    let html = '';
    Object.entries(byStage).forEach(([label, { stage, permits }]) => {
      html += `<div class="approval-section-title">${label} (${permits.length})</div>`;
      permits.forEach(p => {
        const meta = PTW_CONFIG.types[p.type];
        html += `
          <div class="approval-card">
            <div class="approval-card-header">
              <div>
                <div class="approval-card-id">${meta.icon} ${p.id} — ${meta.label}</div>
                <div class="approval-card-meta">${p.requester} · ${p.company} · ${p.location} · ${p.date}</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">${riskBadge(p.risk)} ${statusBadge(p.status)}</div>
            </div>
            <div class="approval-card-body">
              <div class="approval-card-desc">${p.description}</div>
              ${renderWorkflowProgress(p)}
              <div class="approval-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="PTW.openDetail('${p.id}')">📄 Review Details</button>
                <button class="btn btn-danger btn-sm" onclick="PTW.openApproveModal('${p.id}','${stage.key}','reject')">✗ Reject</button>
                <button class="btn btn-success btn-sm" onclick="PTW.openApproveModal('${p.id}','${stage.key}')">✓ Approve</button>
              </div>
            </div>
          </div>
        `;
      });
    });

    cont.innerHTML = html;
  }

  function renderWorkflowProgress(p) {
    const wf = PTW_CONFIG.workflows[p.type];
    const stages = wf.stages;
    const approvals = p.approvals || {};

    const items = stages.map((s, i) => {
      const ap = approvals[s.key];
      const isDone = !!ap;
      const isNext = !isDone && stages.slice(0, i).every(prev => !!approvals[prev.key]);

      return `
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;">
          <div style="width:18px;height:18px;border-radius:50%;background:${isDone ? '#1B8A35' : isNext ? s.color : 'var(--border)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${isDone ? '<span style="color:white;font-size:9px;font-weight:800">✓</span>' : `<span style="color:white;font-size:9px;font-weight:800">${i+1}</span>`}
          </div>
          <span style="color:${isDone ? '#1B8A35' : isNext ? 'var(--text)' : 'var(--text-3)'};font-weight:${isDone||isNext?'600':'400'}">${s.label}</span>
          ${isDone ? `<span style="color:var(--text-3);margin-left:4px">— ${ap.by}</span>` : ''}
        </div>
      `;
    }).join('');

    return `<div style="margin:8px 0 12px">${items}</div>`;
  }

  // ── PERMIT DETAIL MODAL ────────────────────────────────────────────
  function openDetail(id) {
    _currentDetailId = id;
    const p = _permits.find(x => x.id === id);
    if (!p) return;

    const meta = PTW_CONFIG.types[p.type];
    const wf   = PTW_CONFIG.workflows[p.type];

    document.getElementById('detailIcon').textContent  = meta.icon;
    document.getElementById('detailTitle').textContent = `${p.id} — ${meta.label}`;
    document.getElementById('detailSubtitle').textContent = `${p.status.charAt(0).toUpperCase() + p.status.slice(1)} · ${p.risk} Risk · ${p.date}`;

    // Workflow track
    const track = wf.stages.map(s => {
      const ap = (p.approvals || {})[s.key];
      return `
        <div class="wf-track-item ${ap ? 'done' : ''}">
          <div class="wf-avatar ${ap ? 'done' : ''}" style="${ap ? '' : 'background:var(--text-3)'}">
            ${ap ? initials(ap.by) : (wf.stages.indexOf(s) + 1)}
          </div>
          <div class="wf-info">
            <div class="wf-info-name">${ap ? ap.by : s.role}</div>
            <div class="wf-info-role">${ap ? `${ap.role} · ${ap.date}${ap.comment ? ' · "'+ap.comment+'"' : ''}` : s.desc}</div>
          </div>
          ${ap ? '<span class="badge badge-approved">✓ Approved</span>' : '<span class="badge badge-pending">⏳ Pending</span>'}
        </div>
      `;
    }).join('');

    // Type-specific details
    const typeDetails = renderTypeDetails(p);

    // Signatures
    const sigsHtml = buildSigsHtml(p, wf);

    // Comments
    const commentsHtml = p.comments?.length
      ? `<div class="section-label" style="margin-top:20px">Comments & Notes</div>
         ${p.comments.map(c => `<div style="padding:9px 12px;background:var(--surface2);border-radius:var(--radius-sm);font-size:13px;border-left:3px solid var(--border-strong);margin-bottom:5px">${c}</div>`).join('')}`
      : '';

    document.getElementById('detailBody').innerHTML = `
      <div class="detail-grid">
        <div>
          <div class="section-label">Permit Information</div>
          <div class="detail-block">
            <div class="detail-row"><span class="detail-key">Permit ID</span><span class="detail-val mono">${p.id}</span></div>
            <div class="detail-row"><span class="detail-key">Type</span><span class="detail-val">${typeBadge(p.type)}</span></div>
            <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">${statusBadge(p.status)}</span></div>
            <div class="detail-row"><span class="detail-key">Risk Level</span><span class="detail-val">${riskBadge(p.risk)}</span></div>
            <div class="detail-row"><span class="detail-key">Date Submitted</span><span class="detail-val">${p.date}</span></div>
          </div>
          <div class="section-label" style="margin-top:16px">Requester</div>
          <div class="detail-block">
            <div class="detail-row"><span class="detail-key">Name</span><span class="detail-val">${p.requester}</span></div>
            <div class="detail-row"><span class="detail-key">Company</span><span class="detail-val">${p.company}</span></div>
            ${p.contact ? `<div class="detail-row"><span class="detail-key">Contact</span><span class="detail-val">${p.contact}</span></div>` : ''}
            ${p.email   ? `<div class="detail-row"><span class="detail-key">Email</span><span class="detail-val">${p.email}</span></div>` : ''}
          </div>
        </div>
        <div>
          <div class="section-label">Work Details</div>
          <div class="detail-block">
            <div class="detail-row"><span class="detail-key">Location</span><span class="detail-val">${p.location}</span></div>
            <div class="detail-row"><span class="detail-key">Description</span><span class="detail-val" style="line-height:1.5">${p.description}</span></div>
            <div class="detail-row"><span class="detail-key">Controls</span><span class="detail-val" style="color:var(--text-2)">${p.controls}</span></div>
          </div>
          ${typeDetails}
        </div>
      </div>

      <div class="section-label">Approval Workflow — ${wf.name}</div>
      <div class="workflow-track">${track}</div>

      <div class="section-label">Signatures</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px">
        ${sigsHtml}
      </div>
      ${commentsHtml}
    `;

    // Footer buttons
    const footer = document.getElementById('detailFooter');
    footer.innerHTML = '';
    addBtn(footer, 'Close', 'btn-ghost', () => closeModal('detailModal'));
    addBtn(footer, '🖨️ Print', 'btn-secondary', () => window.print());

    const next = getNextStage(p);
    if (p.status === 'pending' && next) {
      addBtn(footer, '✗ Reject',  'btn-danger',  () => { closeModal('detailModal'); openApproveModal(id, next.key, 'reject'); });
      addBtn(footer, `✓ ${next.label}`, 'btn-success', () => { closeModal('detailModal'); openApproveModal(id, next.key); });
    }
    if (p.status === 'approved') addBtn(footer, '▶ Activate Work', 'btn-primary', () => { activatePermit(id); closeModal('detailModal'); });
    if (p.status === 'active')   addBtn(footer, '🔒 Close Permit', 'btn-danger',  () => { closePermit(id); closeModal('detailModal'); });

    document.getElementById('detailModal').style.display = 'flex';
  }

  function renderTypeDetails(p) {
    const fields = PTW_CONFIG.typeFields[p.type];
    if (!fields || !p.typeData) return '';
    const rows = fields.map(f => {
      const val = p.typeData[f.id];
      if (!val) return '';
      return `<div class="detail-row"><span class="detail-key">${f.label}</span><span class="detail-val">${val}</span></div>`;
    }).join('');
    if (!rows) return '';
    return `
      <div class="section-label" style="margin-top:16px">${PTW_CONFIG.types[p.type].icon} Type Details</div>
      <div class="detail-block">${rows}</div>
    `;
  }

  function buildSigsHtml(p, wf) {
    let html = `
      <div class="sig-display">
        <div class="sig-display-label">Requester</div>
        <div class="sig-display-name">${p.signature}</div>
        <div class="sig-display-date">${p.sigDate}</div>
      </div>
    `;
    wf.stages.forEach((s, i) => {
      const ap = (p.approvals || {})[s.key];
      html += `
        <div class="sig-display">
          <div class="sig-display-label">Stage ${i+1}</div>
          ${ap
            ? `<div class="sig-display-name">${ap.by}</div><div class="sig-display-date">${ap.date}</div>`
            : `<div style="font-size:11px;color:var(--text-3);padding:8px 0">Not yet signed</div>`
          }
        </div>
      `;
    });
    return html;
  }

  // ── APPROVE / REJECT MODAL ─────────────────────────────────────────
  function openApproveModal(id, stageKey, mode = 'approve') {
    _approveId    = id;
    _approveStage = stageKey;
    _approveMode  = mode;

    const p = _permits.find(x => x.id === id);
    if (!p) return;
    const wf    = PTW_CONFIG.workflows[p.type];
    const stage = wf.stages.find(s => s.key === stageKey);

    document.getElementById('approveIcon').textContent     = mode === 'reject' ? '✗' : '✓';
    document.getElementById('approveTitle').textContent    = mode === 'reject' ? `Reject — ${id}` : stage.label;
    document.getElementById('approveSubtitle').textContent = `${PTW_CONFIG.types[p.type].label} · ${p.requester} · ${p.company}`;

    document.getElementById('approveNotice').innerHTML = mode === 'reject'
      ? `<div class="notice notice--danger" style="margin-bottom:12px">⚠️ You are about to <strong>reject</strong> this permit. Please state your name and reason below.</div>`
      : `<div class="notice notice--info" style="margin-bottom:12px">ℹ️ <strong>${stage.label}</strong> — Enter your name, role and draw your signature to approve <strong>${id}</strong>.<br><small style="opacity:0.7">${stage.requirement}</small></div>`;

    document.getElementById('ap_name').value    = '';
    document.getElementById('ap_role').value    = '';
    document.getElementById('ap_comment').value = '';

    document.getElementById('rejectActionBtn').style.display  = mode === 'reject'  ? 'inline-flex' : 'none';
    document.getElementById('approveActionBtn').style.display = mode === 'approve' ? 'inline-flex' : 'none';

    document.getElementById('approveModal').style.display = 'flex';
    setTimeout(() => initSig('apSigCanvas', 'apSigHint', 'ap'), 120);
  }

  function doAction(action) {
    const name = document.getElementById('ap_name').value.trim();
    if (!name) { toast('Please enter your full name', 'error'); return; }
    if (action === 'approve' && !_apSigHasContent) { toast('Please draw your signature', 'error'); return; }

    const p = _permits.find(x => x.id === _approveId);
    if (!p) return;
    const role    = document.getElementById('ap_role').value.trim() || 'Approver';
    const comment = document.getElementById('ap_comment').value.trim();
    const now     = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

    if (action === 'reject') {
      p.status = 'rejected';
      if (comment) p.comments.push(`REJECTED: ${comment} — ${name}`);
      toast(`Permit ${p.id} rejected by ${name}`, 'error');
    } else {
      if (!p.approvals) p.approvals = {};
      p.approvals[_approveStage] = { by: name, role, date: now, comment };
      if (comment) p.comments.push(`${comment} — ${name}`);

      // Check if all stages done
      const wf = PTW_CONFIG.workflows[p.type];
      const allDone = wf.stages.every(s => !!p.approvals[s.key]);
      if (allDone) {
        p.status = 'approved';
        toast(`Permit ${p.id} fully approved — ready for work!`, 'success');
      } else {
        const nextStage = getNextStage(p);
        toast(`Stage approved by ${name}. Next: ${nextStage?.label}`, 'success');
      }
    }

    closeModal('approveModal');
    refreshAll();
    if (_currentDetailId === _approveId) openDetail(_approveId);
  }

  // ── WORKFLOW HELPERS ───────────────────────────────────────────────
  function getNextStage(p) {
    if (p.status !== 'pending') return null;
    const wf = PTW_CONFIG.workflows[p.type];
    const approvals = p.approvals || {};
    return wf.stages.find(s => !approvals[s.key]) || null;
  }

  // ── PERMIT LIFECYCLE ───────────────────────────────────────────────
  function activatePermit(id) {
    const p = _permits.find(x => x.id === id);
    if (p) { p.status = 'active'; refreshAll(); toast('Permit activated — work in progress', 'success'); }
  }

  function closePermit(id) {
    const p = _permits.find(x => x.id === id);
    if (p) { p.status = 'closed'; refreshAll(); toast('Permit closed', 'success'); }
  }

  // ── ANALYTICS ──────────────────────────────────────────────────────
  function renderAnalytics() {
    const total    = _permits.length;
    const approved = _permits.filter(p => ['approved','active'].includes(p.status)).length;
    const hi       = _permits.filter(p => ['High','Extreme'].includes(p.risk)).length;
    const pending  = _permits.filter(p => p.status === 'pending').length;

    document.getElementById('analyticsStats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Permits</div><div class="stat-value">${total}</div></div>
      <div class="stat-card"><div class="stat-label">Approved / Active</div><div class="stat-value" style="color:#1B8A35">${approved}</div></div>
      <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value" style="color:var(--shopee-orange)">${pending}</div></div>
      <div class="stat-card"><div class="stat-label">High / Extreme Risk</div><div class="stat-value" style="color:#C62828">${hi}</div></div>
    `;

    const tc = {}; Object.keys(PTW_CONFIG.types).forEach(t => tc[t] = 0);
    _permits.forEach(p => tc[p.type] = (tc[p.type]||0) + 1);
    const maxT = Math.max(...Object.values(tc), 1);
    document.getElementById('analyticsTypeChart').innerHTML = Object.entries(tc).map(([t,c]) => {
      const m = PTW_CONFIG.types[t];
      return `<div class="bar-item"><div class="bar-label">${m.icon} ${m.label}</div><div class="bar-track"><div class="bar-fill" style="width:${c/maxT*100}%;background:${m.color}"></div></div><div class="bar-count">${c}</div></div>`;
    }).join('');

    const sc = {pending:0,approved:0,active:0,closed:0,rejected:0};
    _permits.forEach(p => sc[p.status] = (sc[p.status]||0) + 1);
    const scC = {pending:'var(--shopee-orange)',approved:'#1B8A35',active:'#1565C0',closed:'var(--text-3)',rejected:'#C62828'};
    const maxS = Math.max(...Object.values(sc), 1);
    document.getElementById('analyticsStatusChart').innerHTML = Object.entries(sc).map(([s,c]) =>
      `<div class="bar-item"><div class="bar-label" style="text-transform:capitalize">${s}</div><div class="bar-track"><div class="bar-fill" style="width:${c/maxS*100}%;background:${scC[s]}"></div></div><div class="bar-count">${c}</div></div>`
    ).join('');

    const rc = {Low:0,Medium:0,High:0,Extreme:0};
    _permits.forEach(p => rc[p.risk] = (rc[p.risk]||0)+1);
    const rcC = {Low:'#1B8A35',Medium:'#E6A817',High:'#D05F12',Extreme:'#C62828'};
    const maxR = Math.max(...Object.values(rc), 1);
    document.getElementById('analyticsRiskChart').innerHTML = Object.entries(rc).map(([r,c]) =>
      `<div class="bar-item"><div class="bar-label">${r}</div><div class="bar-track"><div class="bar-fill" style="width:${c/maxR*100}%;background:${rcC[r]}"></div></div><div class="bar-count">${c}</div></div>`
    ).join('');
  }

  // ── SETTINGS ───────────────────────────────────────────────────────
  function renderSettings() {
    const cont = document.getElementById('settingsContent');
    cont.innerHTML = Object.entries(PTW_CONFIG.workflows).map(([type, wf]) => {
      const meta = PTW_CONFIG.types[type];
      const stagesHtml = wf.stages.map((s, i) => `
        <div class="settings-stage-item">
          <div class="settings-stage-num" style="background:${s.color}">${i+1}</div>
          <div class="settings-stage-info">
            <div class="settings-stage-role">${s.role}</div>
            <div class="settings-stage-note">${s.requirement}</div>
          </div>
        </div>
      `).join('');
      return `
        <div class="settings-card">
          <div class="settings-card-header">
            <span class="settings-type-icon">${meta.icon}</span>
            <div>
              <div class="settings-type-name">${meta.label}</div>
              <div class="settings-type-stages">${wf.stages.length}-stage approval workflow</div>
            </div>
          </div>
          <div class="settings-card-body">${stagesHtml}</div>
        </div>
      `;
    }).join('');
  }

  // ── FILTER ─────────────────────────────────────────────────────────
  function setFilter(status, el) {
    _filterStatus = status;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderAllPermits();
  }

  // ── BADGE HELPERS ──────────────────────────────────────────────────
  function updateBadges() {
    const pending = _permits.filter(p => p.status === 'pending').length;

    const ab = document.getElementById('allPermitsBadge');
    ab.textContent = _permits.length;
    ab.style.display = _permits.length ? 'flex' : 'none';

    const apb = document.getElementById('approvalsBadge');
    apb.textContent = pending;
    apb.style.display = pending ? 'flex' : 'none';
  }

  function refreshAll() {
    renderDashboard();
    renderAllPermits();
    renderApprovals();
    updateBadges();
  }

  // ── MODAL HELPERS ──────────────────────────────────────────────────
  function closeModal(id) { document.getElementById(id).style.display = 'none'; }
  function modalOverlayClick(e, id) { if (e.target === e.currentTarget) closeModal(id); }

  function addBtn(container, label, cls, fn) {
    const b = document.createElement('button');
    b.className = `btn ${cls}`; b.innerHTML = label; b.onclick = fn;
    container.appendChild(b);
  }

  // ── SIGNATURE ─────────────────────────────────────────────────────
  function initSig(canvasId, hintId, prefix) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || (prefix === 'ap' ? 480 : 760);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    if (prefix === 'ap') { _apSigCtx = ctx; _apSigDrawing = false; _apSigHasContent = false; }
    else                 { _sigCtx = ctx;   _sigDrawing   = false; _sigHasContent   = false; }

    const getPos = e => {
      const r = canvas.getBoundingClientRect(), pt = e.touches ? e.touches[0] : e;
      return { x: (pt.clientX - r.left) * (canvas.width / r.width), y: (pt.clientY - r.top) * (canvas.height / r.height) };
    };

    canvas.onmousedown = canvas.ontouchstart = e => {
      if (prefix === 'ap') { _apSigDrawing = true; _apSigHasContent = true; }
      else                 { _sigDrawing   = true; _sigHasContent   = true; }
      const hint = document.getElementById(hintId);
      if (hint) hint.style.display = 'none';
      const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault();
    };
    canvas.onmousemove = canvas.ontouchmove = e => {
      const drawing = prefix === 'ap' ? _apSigDrawing : _sigDrawing;
      if (!drawing) return;
      const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault();
    };
    canvas.onmouseup = canvas.ontouchend = canvas.onmouseleave = () => {
      if (prefix === 'ap') _apSigDrawing = false;
      else                 _sigDrawing   = false;
    };
  }

  function clearSig(canvasId, hintId) {
    const c = document.getElementById(canvasId);
    const h = document.getElementById(hintId);
    if (c.id === 'sigCanvas')   { if (_sigCtx)   _sigCtx.clearRect(0,0,c.width,c.height);   _sigHasContent   = false; }
    if (c.id === 'apSigCanvas') { if (_apSigCtx) _apSigCtx.clearRect(0,0,c.width,c.height); _apSigHasContent = false; }
    if (h) h.style.display = 'flex';
  }

  // ── TOAST ─────────────────────────────────────────────────────────
  function toast(msg, type = 'info') {
    const wrap = document.getElementById('toastWrap');
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✗':'ℹ'}</span> ${msg}`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all .3s'; setTimeout(() => t.remove(), 300); }, 3500);
  }

  // ── SHARED BADGE RENDERERS ────────────────────────────────────────
  function typeBadge(type) {
    const m = PTW_CONFIG.types[type] || { label: type, badgeClass: 'badge-pending' };
    return `<span class="badge ${m.badgeClass}">${m.icon} ${m.label}</span>`;
  }

  function statusBadge(status) {
    const labels = { pending:'⏳ Pending', approved:'✓ Approved', active:'▶ Active', closed:'Closed', rejected:'✗ Rejected' };
    return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
  }

  function riskBadge(risk) {
    return `<span class="badge badge-${risk}">${risk}</span>`;
  }

  function initials(name) {
    return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // ── INTERNAL STATE ACCESSORS (for other modules) ──────────────────
  function getPermits()      { return _permits; }
  function getSigHasContent(){ return _sigHasContent; }
  function getApSigHasContent(){ return _apSigHasContent; }

  function addPermit(p) {
    _permits.unshift(p);
    refreshAll();
  }

  return {
    showPage, renderDashboard, renderAllPermits, renderTypePage,
    renderApprovals, renderAnalytics, renderSettings,
    openDetail, openApproveModal, doAction,
    activatePermit, closePermit,
    setFilter, updateBadges, refreshAll,
    closeModal, modalOverlayClick,
    initSig, clearSig, toast,
    typeBadge, statusBadge, riskBadge, initials,
    getPermits, getSigHasContent, getApSigHasContent, addPermit,
    getNextStage,
    // expose form step nav (set later by forms.js)
    openNewPermitModal: null,
    step: null,
    selectType: null,
    updateRisk: null,
    submitPermit: null,
    exportExcel: null,
  };
})();
