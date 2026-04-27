// SafeWork PTW — Main Application Logic

const PTW = (() => {
  // ============ STATE ============
  let permits = JSON.parse(localStorage.getItem('ptw-permits') || '[]');
  let currentStep = 1;
  let selectedType = null;
  let hazards = [];
  let sigCanvas, sigCtx, isDrawing = false, lastX, lastY;
  let currentFilter = { type: '', risk: '' };

  // ============ STORAGE ============
  const save = () => localStorage.setItem('ptw-permits', JSON.stringify(permits));

  const generateId = () => {
    const d = new Date();
    const yy = d.getFullYear().toString().slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const seq = String(permits.length + 1).padStart(4, '0');
    return `PTW-${yy}${mm}-${seq}`;
  };

  // ============ TOAST ============
  const toast = (msg, type = 'info') => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    setTimeout(() => el.classList.remove('show'), 3500);
  };

  // ============ NAVIGATION ============
  const navigate = (page) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    const titles = {
      dashboard: 'Dashboard',
      'new-permit': 'New Permit',
      'active-permits': 'Active Permits',
      'pending-approval': 'Pending Approval',
      history: 'Permit History',
      export: 'Export to Excel'
    };
    document.getElementById('topbar-title').textContent = titles[page] || page;

    // Render page-specific content
    if (page === 'dashboard') renderDashboard();
    if (page === 'active-permits') renderActiveTable();
    if (page === 'pending-approval') renderPendingCards();
    if (page === 'history') renderHistoryTable();

    // Close sidebar on mobile
    if (window.innerWidth < 900) {
      document.getElementById('sidebar').classList.remove('open');
    }
  };

  // ============ DASHBOARD ============
  const renderDashboard = () => {
    const active    = permits.filter(p => p.status === 'ACTIVE').length;
    const pending   = permits.filter(p => p.status === 'PENDING').length;
    const high      = permits.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'EXTREME').length;
    const today     = new Date().toDateString();
    const completed = permits.filter(p => p.status === 'COMPLETED' && new Date(p.completedAt).toDateString() === today).length;

    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-high').textContent = high;
    document.getElementById('stat-completed').textContent = completed;

    document.getElementById('stat-active-sub').textContent = active ? `${active} permit(s) in progress` : 'None active';
    document.getElementById('stat-pending-sub').textContent = pending ? `${pending} awaiting review` : 'Queue clear';
    document.getElementById('stat-high-sub').textContent = high ? `${high} require priority review` : 'None';
    document.getElementById('stat-completed-sub').textContent = `As of ${new Date().toLocaleDateString()}`;

    // Badge
    const badge = document.getElementById('pending-badge');
    badge.textContent = pending;
    badge.style.display = pending ? '' : 'none';

    // Notif dot
    if (pending > 0) document.getElementById('notif-dot').classList.add('visible');
    else document.getElementById('notif-dot').classList.remove('visible');

    // Type breakdown
    ['WAH','CS','LOTO','HW','ELEC'].forEach(t => {
      const count = permits.filter(p => p.type === t).length;
      const map = { WAH:'wah', CS:'cs', LOTO:'loto', HW:'hw', ELEC:'elec' };
      const el = document.getElementById(`type-${map[t]}`);
      if (el) el.textContent = count;
    });

    // Recent permits (last 8)
    const recent = [...permits].reverse().slice(0, 8);
    const tbody = document.getElementById('recent-permits-body');
    if (!recent.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No permits yet. <a href="#" class="link-new">Create one →</a></td></tr>`;
      tbody.querySelector('.link-new')?.addEventListener('click', e => { e.preventDefault(); navigate('new-permit'); });
      return;
    }
    tbody.innerHTML = recent.map(p => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:11px;">${p.id}</span></td>
        <td><span style="color:${PTW_CONFIG.permitTypes[p.type]?.color}">${PTW_CONFIG.permitTypes[p.type]?.label || p.type}</span></td>
        <td>${p.location}</td>
        <td><span class="risk-badge risk-${p.riskLevel}">${p.riskLevel}</span></td>
        <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
        <td><button class="btn-ghost btn-sm btn-view" onclick="PTW.viewPermit('${p.id}')">View</button></td>
      </tr>`).join('');

    // Routing queue
    const queueEl = document.getElementById('routing-queue');
    const pendingPermits = permits.filter(p => p.status === 'PENDING').slice(0, 5);
    if (!pendingPermits.length) {
      queueEl.innerHTML = '<div class="empty-queue">No items in queue</div>';
    } else {
      queueEl.innerHTML = pendingPermits.map(p => `
        <div class="routing-item">
          <span class="ri-type">${p.type}</span>
          <span class="ri-to">→ ${p.approverName || 'Unassigned'}</span>
          <span class="ri-id">${p.id}</span>
        </div>`).join('');
    }
  };

  // ============ WIZARD ============
  const initWizard = () => {
    currentStep = 1;
    selectedType = null;
    hazards = [];
    showStep(1);

    // Type selector
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedType = btn.dataset.type;
        ControlsRenderer.renderTypeFields(selectedType);
      });
    });

    // Hazard input
    const hazardInput = document.getElementById('hazard-input');
    if (hazardInput) {
      hazardInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();
          addHazard(e.target.value.trim());
          e.target.value = '';
        }
      });
    }

    // Risk matrix
    ControlsRenderer.buildRiskMatrix();
    ['f-likelihood','f-consequence'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateRisk);
    });

    // Wizard nav
    document.getElementById('btn-next').onclick = nextStep;
    document.getElementById('btn-prev').onclick = prevStep;
    document.getElementById('btn-submit').onclick = submitPermit;

    // Init signature canvas
    initSignature();

    // Set default datetimes
    const now = new Date();
    const plus8 = new Date(now.getTime() + 8 * 3600000);
    document.getElementById('f-start').value = toLocalDatetime(now);
    document.getElementById('f-end').value = toLocalDatetime(plus8);
  };

  const toLocalDatetime = (d) => {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const showStep = (n) => {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => {
      const sn = parseInt(s.dataset.step);
      s.classList.remove('active','completed');
      if (sn === n) s.classList.add('active');
      if (sn < n)  s.classList.add('completed');
    });
    const stepEl = document.getElementById(`step-${n}`);
    if (stepEl) stepEl.classList.add('active');

    // Nav buttons
    document.getElementById('btn-prev').style.display = n > 1 ? '' : 'none';
    document.getElementById('btn-next').style.display = n < 5 ? '' : 'none';
    document.getElementById('btn-submit').style.display = n === 5 ? '' : 'none';

    currentStep = n;

    if (n === 4) {
      ControlsRenderer.renderRoutingInfo(selectedType);
    }
    if (n === 5) {
      renderPermitPreview();
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 3 && selectedType) ControlsRenderer.renderControls(selectedType);
    showStep(currentStep + 1);
  };

  const prevStep = () => showStep(currentStep - 1);

  const validateStep = (step) => {
    if (step === 1) {
      if (!selectedType)                     { toast('Please select a permit type', 'error'); return false; }
      if (!document.getElementById('f-location').value.trim()) { toast('Location is required', 'error'); return false; }
      if (!document.getElementById('f-start').value)           { toast('Start date/time required', 'error'); return false; }
      if (!document.getElementById('f-end').value)             { toast('End date/time required', 'error'); return false; }
      if (!document.getElementById('f-description').value.trim()) { toast('Work description required', 'error'); return false; }
    }
    if (step === 2) {
      if (!document.getElementById('f-likelihood').value)  { toast('Select likelihood rating', 'error'); return false; }
      if (!document.getElementById('f-consequence').value) { toast('Select consequence rating', 'error'); return false; }
      if (!hazards.length)                                  { toast('Add at least one hazard', 'error'); return false; }
    }
    if (step === 3) {
      if (!ControlsRenderer.allMandatoryChecked()) {
        toast("All mandatory (*) safety items must be confirmed", "error");
        document.querySelectorAll("input.safety-cb.mandatory:not(:checked)").forEach(cb => {
          const item = cb.closest(".checklist-item");
          if (item) { item.classList.add("checklist-item-error"); setTimeout(() => item.classList.remove("checklist-item-error"), 2500); }
        });
        return false;
      }
    }
    if (step === 4) {
      if (!document.getElementById('f-requester').value.trim())  { toast('Requester name required', 'error'); return false; }
      if (!document.getElementById('f-supervisor').value.trim()) { toast('Supervisor name required', 'error'); return false; }
    }
    return true;
  };

  const addHazard = (text) => {
    if (hazards.includes(text)) return;
    hazards.push(text);
    renderHazards();
  };

  const renderHazards = () => {
    const list = document.getElementById('hazards-list');
    list.innerHTML = hazards.map(h => `
      <span class="tag">${h}<span class="tag-remove" onclick="PTW.removeHazard('${h}')">×</span></span>
    `).join('');
  };

  const removeHazard = (h) => {
    hazards = hazards.filter(x => x !== h);
    renderHazards();
  };

  const updateRisk = () => {
    const l = parseInt(document.getElementById('f-likelihood').value) || 0;
    const c = parseInt(document.getElementById('f-consequence').value) || 0;
    ControlsRenderer.updateRiskDisplay(l, c);
  };

  const renderPermitPreview = () => {
    const el = document.getElementById('permit-preview');
    if (!el) return;
    const l = document.getElementById('f-likelihood').value;
    const c = document.getElementById('f-consequence').value;
    const score = l && c ? l * c : '—';
    const riskInfo = (l && c) ? ControlsRenderer.riskLevel(score) : { level: '—', color: 'var(--text-muted)' };
    const approverRadio = document.querySelector('input[name="approver"]:checked');
    const approverEl = approverRadio ? document.querySelector(`label[for="${approverRadio.id}"] .approver-name`) : null;
    const approverName = approverEl ? approverEl.textContent : 'Unassigned';

    el.innerHTML = `
      <h3>PERMIT SUMMARY — REVIEW BEFORE SIGNING</h3>
      <div class="preview-grid">
        <div class="preview-field"><span class="preview-label">Permit Type</span><span class="preview-value" style="color:${PTW_CONFIG.permitTypes[selectedType]?.color}">${PTW_CONFIG.permitTypes[selectedType]?.label}</span></div>
        <div class="preview-field"><span class="preview-label">Location</span><span class="preview-value">${document.getElementById('f-location').value}</span></div>
        <div class="preview-field"><span class="preview-label">Start</span><span class="preview-value">${formatDate(document.getElementById('f-start').value)}</span></div>
        <div class="preview-field"><span class="preview-label">End</span><span class="preview-value">${formatDate(document.getElementById('f-end').value)}</span></div>
        <div class="preview-field"><span class="preview-label">Risk Score</span><span class="preview-value" style="color:${riskInfo.color};">${score} — ${riskInfo.level || ''}</span></div>
        <div class="preview-field"><span class="preview-label">Assigned Approver</span><span class="preview-value">${approverName}</span></div>
        <div class="preview-field"><span class="preview-label">Requester</span><span class="preview-value">${document.getElementById('f-requester').value}</span></div>
        <div class="preview-field"><span class="preview-label">Supervisor</span><span class="preview-value">${document.getElementById('f-supervisor').value}</span></div>
        <div class="preview-field full"><span class="preview-label">Hazards (${hazards.length})</span><span class="preview-value">${hazards.join(', ') || '—'}</span></div>
      </div>`;
  };

  // ============ SIGNATURE ============
  const initSignature = () => {
    sigCanvas = document.getElementById('sig-canvas');
    if (!sigCanvas) return;
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.strokeStyle = '#e2e6f0';
    sigCtx.lineWidth = 2;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';

    const getPos = (e) => {
      const rect = sigCanvas.getBoundingClientRect();
      const scaleX = sigCanvas.width / rect.width;
      const scaleY = sigCanvas.height / rect.height;
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
    };

    sigCanvas.addEventListener('mousedown', e => { isDrawing = true; const p = getPos(e); [lastX, lastY] = [p.x, p.y]; });
    sigCanvas.addEventListener('mousemove', e => { if (!isDrawing) return; const p = getPos(e); drawLine(lastX, lastY, p.x, p.y); [lastX, lastY] = [p.x, p.y]; });
    sigCanvas.addEventListener('mouseup', () => isDrawing = false);
    sigCanvas.addEventListener('mouseleave', () => isDrawing = false);
    sigCanvas.addEventListener('touchstart', e => { e.preventDefault(); isDrawing = true; const p = getPos(e); [lastX, lastY] = [p.x, p.y]; });
    sigCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (!isDrawing) return; const p = getPos(e); drawLine(lastX, lastY, p.x, p.y); [lastX, lastY] = [p.x, p.y]; });
    sigCanvas.addEventListener('touchend', () => isDrawing = false);

    document.getElementById('sig-clear').onclick = () => { sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); };
  };

  const drawLine = (x1, y1, x2, y2) => {
    sigCtx.beginPath();
    sigCtx.moveTo(x1, y1);
    sigCtx.lineTo(x2, y2);
    sigCtx.stroke();
  };

  const isCanvasBlank = () => {
    const blank = document.createElement('canvas');
    blank.width = sigCanvas.width;
    blank.height = sigCanvas.height;
    return sigCanvas.toDataURL() === blank.toDataURL();
  };

  // ============ SUBMIT PERMIT ============
  const submitPermit = () => {
    // Validate step 5
    if (!document.getElementById('f-sig-name').value.trim()) { toast('Please type your full name to confirm', 'error'); return; }
    if (isCanvasBlank()) { toast('Please provide your digital signature', 'error'); return; }
    if (!document.getElementById('f-declaration').checked)   { toast('Please accept the declaration', 'error'); return; }

    const l = parseInt(document.getElementById('f-likelihood').value);
    const c = parseInt(document.getElementById('f-consequence').value);
    const score = l * c;
    const riskInfo = ControlsRenderer.riskLevel(score);

    const approverRadio = document.querySelector('input[name="approver"]:checked');
    const approverId = approverRadio ? approverRadio.value : '';
    const approverOption = approverRadio ? document.querySelector(`label[for="${approverRadio.id}"]`) : null;
    const approverName = approverOption ? approverOption.querySelector('.approver-name')?.textContent : 'Unassigned';

    const permit = {
      id: generateId(),
      type: selectedType,
      location: document.getElementById('f-location').value,
      department: document.getElementById('f-department').value,
      start: document.getElementById('f-start').value,
      end: document.getElementById('f-end').value,
      description: document.getElementById('f-description').value,
      contractor: document.getElementById('f-contractor').value,
      workers: document.getElementById('f-workers').value,
      likelihood: l,
      consequence: c,
      riskScore: score,
      riskLevel: riskInfo.key,
      hazards: [...hazards],
      riskNotes: document.getElementById('f-risk-notes').value,
      controls: ControlsRenderer.getSelectedControls(),
      extraControls: document.getElementById('f-extra-controls').value,
      emergency: document.querySelector('input[name="emergency"]:checked')?.value || '',
      requester: document.getElementById('f-requester').value,
      requesterId: document.getElementById('f-requester-id').value,
      supervisor: document.getElementById('f-supervisor').value,
      supervisorContact: document.getElementById('f-supervisor-contact').value,
      approverId,
      approverName,
      assessorNotes: document.getElementById('f-assessor-notes').value,
      signerName: document.getElementById('f-sig-name').value,
      signature: sigCanvas.toDataURL(),
      typeSpecific: ControlsRenderer.getTypeFieldValues(selectedType),
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      history: [{ action: 'SUBMITTED', by: document.getElementById('f-requester').value, at: new Date().toISOString() }]
    };

    permits.push(permit);
    save();

    toast(`Permit ${permit.id} submitted — routed to ${permit.approverName}`, 'success');
    renderDashboard();
    setTimeout(() => navigate('pending-approval'), 1200);
  };

  // ============ ACTIVE TABLE ============
  const renderActiveTable = () => {
    const filtered = permits.filter(p => p.status === 'ACTIVE' || p.status === 'APPROVED')
      .filter(p => !currentFilter.type || p.type === currentFilter.type)
      .filter(p => !currentFilter.risk || p.riskLevel === currentFilter.risk);

    const tbody = document.getElementById('active-tbody');
    if (!filtered.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="10">No active permits</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:11px">${p.id}</span></td>
        <td><span style="color:${PTW_CONFIG.permitTypes[p.type]?.color};font-size:12px">${PTW_CONFIG.permitTypes[p.type]?.label}</span></td>
        <td>${p.location}</td>
        <td>${p.requester}</td>
        <td>${formatDate(p.start)}</td>
        <td>${formatDate(p.end)}</td>
        <td><span class="risk-badge risk-${p.riskLevel}">${p.riskLevel}</span></td>
        <td>${p.approverName}</td>
        <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn-ghost btn-sm btn-view" onclick="PTW.viewPermit('${p.id}')">View</button>
          <button class="btn-ghost btn-sm btn-complete" onclick="PTW.updateStatus('${p.id}','COMPLETED')">Close</button>
        </td>
      </tr>`).join('');
  };

  // ============ PENDING CARDS ============
  const renderPendingCards = () => {
    const pending = permits.filter(p => p.status === 'PENDING');
    const container = document.getElementById('pending-cards');
    if (!pending.length) {
      container.innerHTML = `<div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="var(--border)" stroke-width="2"/><path d="M24 14V26M24 30V32" stroke="var(--text-muted)" stroke-width="2.5" stroke-linecap="round"/></svg>
        <p>No permits pending approval</p></div>`;
      return;
    }
    container.innerHTML = pending.map(p => `
      <div class="permit-card">
        <div class="permit-card-header">
          <span class="permit-card-id">${p.id}</span>
          <span class="risk-badge risk-${p.riskLevel}">${p.riskLevel}</span>
        </div>
        <div class="permit-card-body">
          <div class="permit-card-field"><span>Type</span><span style="color:${PTW_CONFIG.permitTypes[p.type]?.color}">${PTW_CONFIG.permitTypes[p.type]?.label}</span></div>
          <div class="permit-card-field"><span>Location</span><span>${p.location}</span></div>
          <div class="permit-card-field"><span>Requester</span><span>${p.requester}</span></div>
          <div class="permit-card-field"><span>Submitted</span><span>${formatDate(p.submittedAt)}</span></div>
          <div class="permit-card-field"><span>Routed to</span><span>${p.approverName}</span></div>
        </div>
        <div class="permit-card-actions">
          <button class="btn-ghost btn-sm btn-view" onclick="PTW.viewPermit('${p.id}')">View</button>
          <button class="btn-ghost btn-sm btn-approve" onclick="PTW.updateStatus('${p.id}','ACTIVE')">Approve</button>
          <button class="btn-ghost btn-sm btn-reject" onclick="PTW.updateStatus('${p.id}','REJECTED')">Reject</button>
        </div>
      </div>`).join('');
  };

  // ============ HISTORY TABLE ============
  const renderHistoryTable = () => {
    const hist = permits.filter(p => ['COMPLETED','REJECTED','CANCELLED'].includes(p.status));
    const tbody = document.getElementById('history-tbody');
    if (!hist.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No permit history</td></tr>';
      return;
    }
    tbody.innerHTML = [...hist].reverse().map(p => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:11px">${p.id}</span></td>
        <td><span style="color:${PTW_CONFIG.permitTypes[p.type]?.color};font-size:12px">${PTW_CONFIG.permitTypes[p.type]?.label}</span></td>
        <td>${p.location}</td>
        <td>${p.requester}</td>
        <td>${formatDate(p.submittedAt)}</td>
        <td><span class="risk-badge risk-${p.riskLevel}">${p.riskLevel}</span></td>
        <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
        <td><button class="btn-ghost btn-sm btn-view" onclick="PTW.viewPermit('${p.id}')">View</button></td>
      </tr>`).join('');
  };

  // ============ STATUS UPDATE ============
  const updateStatus = (id, newStatus) => {
    const p = permits.find(x => x.id === id);
    if (!p) return;
    p.status = newStatus;
    if (newStatus === 'COMPLETED') p.completedAt = new Date().toISOString();
    p.history = p.history || [];
    p.history.push({ action: newStatus, by: 'System', at: new Date().toISOString() });
    save();
    toast(`Permit ${id} — ${newStatus}`, newStatus === 'ACTIVE' ? 'success' : newStatus === 'REJECTED' ? 'error' : 'info');
    // Re-render current page
    const currentPage = document.querySelector('.page.active')?.id?.replace('page-', '');
    if (currentPage === 'pending-approval') renderPendingCards();
    if (currentPage === 'active-permits') renderActiveTable();
    if (currentPage === 'history') renderHistoryTable();
    if (currentPage === 'dashboard') renderDashboard();
    closeModal();

    // Update badges
    const pending = permits.filter(p => p.status === 'PENDING').length;
    const badge = document.getElementById('pending-badge');
    if (badge) { badge.textContent = pending; badge.style.display = pending ? '' : 'none'; }
  };

  // ============ MODAL ============
  const viewPermit = (id) => {
    const p = permits.find(x => x.id === id);
    if (!p) return;
    const typeMeta = PTW_CONFIG.permitTypes[p.type];
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const footer = document.getElementById('modal-footer');

    title.innerHTML = `${p.id} <span style="font-size:12px;color:${typeMeta?.color};margin-left:8px">${typeMeta?.label}</span>`;

    const checklistItems = p.controls?.checklist || [];
    const controlsHtml = checklistItems.length
      ? checklistItems.map(item => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12.5px;color:var(--text-sub);border-bottom:1px solid rgba(255,255,255,0.03)"><span style="color:var(--green);font-weight:600">✓</span>${item}</div>`).join('')
      : '';

    const typeSpecificHtml = Object.entries(p.typeSpecific || {}).map(([k,v]) =>
      `<div class="detail-field"><span class="detail-label">${k}</span><span class="detail-value">${v || '—'}</span></div>`
    ).join('');

    body.innerHTML = `
      <div class="detail-section">
        <h4>General Information</h4>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value"><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></span></div>
          <div class="detail-field"><span class="detail-label">Risk Level</span><span class="detail-value"><span class="risk-badge risk-${p.riskLevel}">${p.riskLevel} (${p.riskScore})</span></span></div>
          <div class="detail-field"><span class="detail-label">Location</span><span class="detail-value">${p.location}</span></div>
          <div class="detail-field"><span class="detail-label">Department</span><span class="detail-value">${p.department || '—'}</span></div>
          <div class="detail-field"><span class="detail-label">Start</span><span class="detail-value">${formatDate(p.start)}</span></div>
          <div class="detail-field"><span class="detail-label">End</span><span class="detail-value">${formatDate(p.end)}</span></div>
          <div class="detail-field" style="grid-column:1/-1"><span class="detail-label">Description</span><span class="detail-value">${p.description}</span></div>
        </div>
      </div>

      ${typeSpecificHtml ? `<div class="detail-section"><h4>${typeMeta?.label} — Specific</h4><div class="detail-grid">${typeSpecificHtml}</div></div>` : ''}

      <div class="detail-section">
        <h4>Risk & Hazards</h4>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Likelihood</span><span class="detail-value">${p.likelihood}</span></div>
          <div class="detail-field"><span class="detail-label">Consequence</span><span class="detail-value">${p.consequence}</span></div>
          <div class="detail-field" style="grid-column:1/-1"><span class="detail-label">Hazards</span><span class="detail-value">${p.hazards?.join(', ') || '—'}</span></div>
        </div>
      </div>

      ${controlsHtml ? `<div class="detail-section"><h4>Safety Checklist — Confirmed Items</h4>${controlsHtml}</div>` : ''}

      <div class="detail-section">
        <h4>Authorisation</h4>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Requester</span><span class="detail-value">${p.requester}</span></div>
          <div class="detail-field"><span class="detail-label">Supervisor</span><span class="detail-value">${p.supervisor}</span></div>
          <div class="detail-field"><span class="detail-label">Assigned Approver</span><span class="detail-value">${p.approverName}</span></div>
          <div class="detail-field"><span class="detail-label">Submitted</span><span class="detail-value">${formatDate(p.submittedAt)}</span></div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Digital Signature</h4>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Signed by: <strong style="color:var(--text)">${p.signerName}</strong></p>
        <div class="sig-preview-box">
          <img src="${p.signature}" alt="Signature" style="max-height:100px;background:#0d0f14">
        </div>
      </div>`;

    // Footer actions
    let footerBtns = `<button class="btn-ghost" onclick="PTW.closeModal()">Close</button>`;
    if (p.status === 'PENDING') {
      footerBtns += `
        <button class="btn-ghost btn-approve" onclick="PTW.updateStatus('${p.id}','ACTIVE')">✓ Approve</button>
        <button class="btn-ghost btn-reject" onclick="PTW.updateStatus('${p.id}','REJECTED')">✗ Reject</button>`;
    }
    if (p.status === 'ACTIVE') {
      footerBtns += `<button class="btn-ghost btn-complete" onclick="PTW.updateStatus('${p.id}','COMPLETED')">Mark Completed</button>`;
    }
    footer.innerHTML = footerBtns;

    overlay.classList.add('open');
  };

  const closeModal = () => document.getElementById('modal-overlay').classList.remove('open');

  // ============ EXPORT TO EXCEL ============
  const exportExcel = (mode) => {
    const statusEl = document.getElementById('export-status');
    let data = [...permits];
    let filename = 'PTW_All_Permits';

    if (mode === 'active') { data = data.filter(p => p.status === 'ACTIVE'); filename = 'PTW_Active_Permits'; }
    if (mode === 'HW')     { data = data.filter(p => p.type === 'HW');        filename = 'PTW_HotWork_Log'; }
    if (mode === 'risk')   { data = data.filter(p => ['HIGH','EXTREME'].includes(p.riskLevel)); filename = 'PTW_Risk_Register'; }

    if (!data.length) { toast('No data to export for this filter', 'error'); return; }

    const rows = data.map(p => ({
      'PTW ID': p.id,
      'Permit Type': PTW_CONFIG.permitTypes[p.type]?.label || p.type,
      'Status': p.status,
      'Location': p.location,
      'Department': p.department || '',
      'Work Description': p.description,
      'Start Date/Time': formatDate(p.start),
      'End Date/Time': formatDate(p.end),
      'Contractor': p.contractor || '',
      'No. Workers': p.workers || '',
      'Risk Score': p.riskScore,
      'Risk Level': p.riskLevel,
      'Likelihood': p.likelihood,
      'Consequence': p.consequence,
      'Hazards': (p.hazards || []).join('; '),
      'Risk Notes': p.riskNotes || '',
      'Safety Checklist Items': (p.controls?.checklist || []).join('; '),
      'Emergency Procedure': p.emergency || '',
      'Requester': p.requester,
      'Requester ID': p.requesterId || '',
      'Supervisor': p.supervisor,
      'Supervisor Contact': p.supervisorContact || '',
      'Assigned Approver': p.approverName,
      'Assessor Notes': p.assessorNotes || '',
      'Signed By': p.signerName,
      'Submitted At': formatDate(p.submittedAt),
      ...Object.fromEntries(Object.entries(p.typeSpecific || {}).map(([k,v]) => [`[Type] ${k}`, v]))
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    const colWidths = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 18) }));
    ws['!cols'] = colWidths;

    // Header style (note: xlsx.full.min.js doesn't support styling, but we set structure)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Permit Register');

    // Summary sheet
    const summaryData = [
      ['SafeWork PTW — Export Summary'],
      ['Generated:', new Date().toLocaleString()],
      ['Total Records:', data.length],
      [],
      ['By Type', ''],
      ...Object.entries(PTW_CONFIG.permitTypes).map(([k,v]) => [v.label, data.filter(p => p.type === k).length]),
      [],
      ['By Status', ''],
      ...['PENDING','ACTIVE','COMPLETED','REJECTED','CANCELLED'].map(s => [s, data.filter(p => p.status === s).length]),
      [],
      ['By Risk Level', ''],
      ...['LOW','MEDIUM','HIGH','EXTREME'].map(r => [r, data.filter(p => p.riskLevel === r).length])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    ws2['!cols'] = [{ wch: 28 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

    const ts = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
    toast(`Exported ${data.length} record(s) to Excel`, 'success');
    if (statusEl) statusEl.textContent = `✓ Exported ${data.length} record(s) — ${filename}_${ts}.xlsx`;
  };

  // ============ UTILS ============
  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    } catch { return d; }
  };

  // ============ INIT ============
  const init = () => {
    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });

    // Delegated btn-text "View all" clicks
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-text[data-page]');
      if (btn) navigate(btn.dataset.page);
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    // Menu toggle (mobile)
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Filters
    document.getElementById('filter-type').addEventListener('change', e => {
      currentFilter.type = e.target.value;
      renderActiveTable();
    });
    document.getElementById('filter-risk').addEventListener('change', e => {
      currentFilter.risk = e.target.value;
      renderActiveTable();
    });

    // Global search
    document.getElementById('global-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      if (!q) return;
      // Simple search — find matching permit IDs
      const match = permits.find(p =>
        p.id.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.requester.toLowerCase().includes(q)
      );
      if (match) { viewPermit(match.id); }
    });

    // Init wizard
    initWizard();

    // Load dashboard
    navigate('dashboard');

    // Add demo data if empty
    if (!permits.length) seedDemoData();
  };

  // ============ DEMO DATA ============
  const seedDemoData = () => {
    const demo = [
      {
        id: 'PTW-2605-0001', type: 'WAH', location: 'Building A, Roof Level',
        department: 'Maintenance', start: '2026-04-27T08:00', end: '2026-04-27T16:00',
        description: 'Installation of HVAC units on rooftop. Working at height of 12m.',
        contractor: 'AirTech Services', workers: '4', likelihood: 3, consequence: 4,
        riskScore: 12, riskLevel: 'HIGH', hazards: ['Falls from height', 'Slippery surface', 'Wind load'],
        riskNotes: 'Weather window confirmed', controls: { checklist: ['Full-body harness inspected and fitted correctly','Lanyard attached to anchor point','Anchor point inspected and rated for load','Rescue plan established','Exclusion zone set up below work area'] },
        emergency: 'yes', requester: 'John Davies', requesterId: 'EMP-0042',
        supervisor: 'Steve Clark', supervisorContact: 'Ext 4512', approverId: 'HSA-001',
        approverName: 'James Thornton', assessorNotes: 'Anchor points inspected',
        signerName: 'John Davies', signature: '', typeSpecific: { 'Maximum Working Height (m)': '12', 'Access Equipment Type': 'Scaffolding' },
        status: 'ACTIVE', submittedAt: new Date(Date.now() - 3600000).toISOString(),
        history: [{ action: 'SUBMITTED', by: 'John Davies', at: new Date(Date.now() - 3600000).toISOString() },
                  { action: 'ACTIVE', by: 'James Thornton', at: new Date(Date.now() - 1800000).toISOString() }]
      },
      {
        id: 'PTW-2605-0002', type: 'HW', location: 'Workshop Bay 3',
        department: 'Engineering', start: '2026-04-27T09:00', end: '2026-04-27T13:00',
        description: 'Welding of steel frame supports.',
        contractor: '', workers: '2', likelihood: 3, consequence: 3,
        riskScore: 9, riskLevel: 'MEDIUM', hazards: ['Fire/ignition', 'UV radiation', 'Metal fumes'],
        riskNotes: '', controls: { checklist: ['Combustibles removed or protected within 11m radius','Fire watch person assigned and briefed','Appropriate fire extinguisher available','Welding helmet / face shield worn','Leather welding gloves worn'] },
        emergency: 'yes', requester: 'Mike Chen', requesterId: 'EMP-0087',
        supervisor: 'Lisa Wang', supervisorContact: 'Ext 3301', approverId: 'HWA-001',
        approverName: 'Ben Hartley', assessorNotes: '', signerName: 'Mike Chen',
        signature: '', typeSpecific: { 'Hot Work Type': 'Welding', 'Fire Watch Person Name': 'Tom Ellis' },
        status: 'PENDING', submittedAt: new Date(Date.now() - 900000).toISOString(),
        history: [{ action: 'SUBMITTED', by: 'Mike Chen', at: new Date(Date.now() - 900000).toISOString() }]
      },
      {
        id: 'PTW-2605-0003', type: 'ELEC', location: 'Switchroom B2',
        department: 'Electrical', start: '2026-04-26T07:00', end: '2026-04-26T12:00',
        description: 'Replacement of main circuit breaker in distribution board.',
        contractor: 'PowerSafe Ltd', workers: '2', likelihood: 2, consequence: 5,
        riskScore: 10, riskLevel: 'HIGH', hazards: ['Electric shock', 'Arc flash', 'Burns'],
        riskNotes: 'Live work authorisation obtained', controls: { checklist: ['Circuit isolated at correct breaker','Lock and danger tag applied','Tested dead with calibrated tester','Work area barricaded and signed','Insulated voltage-rated gloves worn','Insulated hand tools in use'] },
        emergency: 'yes', requester: 'Anna Park', requesterId: 'EMP-0056',
        supervisor: 'Derek Osei', supervisorContact: 'Ext 7741', approverId: 'EA-001',
        approverName: 'Tom Prescott', assessorNotes: 'Circuit isolated and tested dead',
        signerName: 'Anna Park', signature: '',
        typeSpecific: { 'Maximum Voltage (V)': '415', 'Circuit / Board Reference': 'DB-B2-Main' },
        status: 'COMPLETED', submittedAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 72000000).toISOString(),
        history: [{ action: 'SUBMITTED', by: 'Anna Park', at: '' }, { action: 'ACTIVE', by: 'Tom Prescott', at: '' }, { action: 'COMPLETED', by: 'System', at: '' }]
      }
    ];
    // Generate blank signatures for demo
    demo.forEach(p => {
      if (!p.signature) {
        const c = document.createElement('canvas');
        c.width = 500; c.height = 150;
        p.signature = c.toDataURL();
      }
    });
    permits.push(...demo);
    save();
  };

  // Public API
  return { init, navigate, viewPermit, closeModal, updateStatus, exportExcel, removeHazard };
})();

window.addEventListener('DOMContentLoaded', PTW.init);
