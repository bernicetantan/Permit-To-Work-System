/**
 * PTW System — New Permit Form
 * Multi-step permit creation form with type-specific fields.
 */

(function() {
  'use strict';

  let _step = 1;
  let _type = null;

  // ── OPEN ────────────────────────────────────────────────────────────
  function openNewPermitModal(presetType) {
    _step = 1;
    _type = null;

    // Reset form
    const ids = ['f_name','f_company','f_contact','f_email','f_desc','f_location','f_supervisor','f_workerNames','f_controls','f_sigName'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('f_workers').value = '1';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('f_startDate').value = today;
    document.getElementById('f_endDate').value   = today;
    document.getElementById('f_sigDate').value   = new Date().toLocaleString('en-GB');

    document.getElementById('routingNotice').style.display = 'none';
    document.getElementById('typeFields').innerHTML        = '';
    document.getElementById('hazardList').innerHTML        = '';
    document.getElementById('ppeList').innerHTML           = '';
    document.getElementById('preWorkList').innerHTML       = '';
    document.getElementById('approvalRouteDisplay').innerHTML = '';
    document.getElementById('riskDisplay').innerHTML       = '';
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));

    document.getElementById('f_likelihood').value  = '3';
    document.getElementById('f_consequence').value = '3';

    goToStep(1);
    document.getElementById('newPermitModal').style.display = 'flex';

    if (presetType) {
      const card = document.querySelector(`.type-card[data-type="${presetType}"]`);
      if (card) selectType(presetType, card);
    }

    setTimeout(() => PTW.initSig('sigCanvas', 'sigHint', 'main'), 200);
  }

  // ── TYPE SELECTION ──────────────────────────────────────────────────
  function selectType(type, card) {
    _type = type;
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    const wf   = PTW_CONFIG.workflows[type];
    const meta = PTW_CONFIG.types[type];

    // Show routing notice
    const notice = document.getElementById('routingNotice');
    notice.style.display = 'block';
    notice.style.borderColor = meta.color;
    notice.style.background  = meta.bg;
    notice.innerHTML = `
      <strong>Auto-routing: ${meta.icon} ${meta.label}</strong><br>
      This permit follows a <strong>${wf.stages.length}-stage approval</strong> workflow:
      ${wf.stages.map((s,i) => `<strong>Stage ${i+1}</strong>: ${s.role}`).join(' → ')}
    `;

    // Type-specific fields
    buildTypeFields(type);
  }

  function buildTypeFields(type) {
    const fields  = PTW_CONFIG.typeFields[type];
    const meta    = PTW_CONFIG.types[type];
    if (!fields) return;

    const fieldsHtml = fields.map(f => `
      <div class="form-group">
        <label class="form-label">${f.label}${f.required ? ' <span class="req">*</span>' : ''}</label>
        ${f.type === 'select'
          ? `<select class="form-input" id="${f.id}"><option value="">— Select —</option>${(f.options||[]).map(o => `<option>${o}</option>`).join('')}</select>`
          : `<input class="form-input" type="${f.type}" id="${f.id}" placeholder="${f.placeholder||''}" ${f.required?'required':''}>`
        }
        ${f.hint ? `<div class="form-hint">${f.hint}</div>` : ''}
      </div>
    `).join('');

    document.getElementById('typeFields').innerHTML = `
      <div class="type-fields-section">
        <div class="type-fields-header" style="background:${meta.color}">
          ${meta.icon} ${meta.label} — Additional Details
        </div>
        <div class="type-fields-body">
          <div class="form-grid">${fieldsHtml}</div>
        </div>
      </div>
    `;
  }

  // ── STEP NAVIGATION ─────────────────────────────────────────────────
  function step(dir) {
    const next = _step + dir;
    if (dir > 0 && !validateStep(_step)) return;
    goToStep(next);
  }

  function validateStep(s) {
    if (s === 1) {
      if (!_type) { PTW.toast('Please select a permit type', 'error'); return false; }
      if (!v('f_name'))     { PTW.toast('Please enter your full name', 'error'); return false; }
      if (!v('f_company'))  { PTW.toast('Please enter your company name', 'error'); return false; }
      if (!v('f_desc'))     { PTW.toast('Please enter work description', 'error'); return false; }
      if (!v('f_location')) { PTW.toast('Please enter work location', 'error'); return false; }
    }
    return true;
  }

  function v(id) { const el = document.getElementById(id); return el && el.value.trim(); }

  function goToStep(s) {
    _step = Math.max(1, Math.min(4, s));

    // Show/hide panels
    document.querySelectorAll('.step-panel').forEach((p, i) => {
      p.classList.toggle('active', i + 1 === _step);
    });

    // Update step progress
    [1, 2, 3, 4].forEach(i => {
      const item = document.getElementById('sp' + i);
      const line = document.getElementById('sl' + i);
      if (!item) return;
      item.classList.remove('active', 'done');
      if (i < _step)       item.classList.add('done');
      else if (i === _step) item.classList.add('active');
      if (line) line.classList.toggle('done', i < _step);
    });

    // Buttons
    document.getElementById('prevBtn').style.display   = _step > 1 ? 'inline-flex' : 'none';
    document.getElementById('nextBtn').style.display   = _step < 4 ? 'inline-flex' : 'none';
    document.getElementById('submitBtn').style.display = _step === 4 ? 'inline-flex' : 'none';

    // Per-step lazy builds
    if (_step === 2) buildHazardsStep();
    if (_step === 3) buildChecklistStep();
    if (_step === 4) document.getElementById('f_sigDate').value = new Date().toLocaleString('en-GB');

    updateRisk();
  }

  // ── STEP 2: HAZARDS ─────────────────────────────────────────────────
  function buildHazardsStep() {
    if (!_type) return;

    document.getElementById('hazardList').innerHTML = (PTW_CONFIG.hazards[_type] || []).map((h, i) => `
      <div class="check-item">
        <input type="checkbox" id="hz_${i}" />
        <label for="hz_${i}">${h}</label>
      </div>
    `).join('');

    document.getElementById('ppeList').innerHTML = (PTW_CONFIG.ppe[_type] || []).map((p, i) => `
      <div class="check-item">
        <input type="checkbox" id="ppe_${i}" checked />
        <label for="ppe_${i}">${p}</label>
      </div>
    `).join('');
  }

  // ── STEP 2: RISK DISPLAY ────────────────────────────────────────────
  function updateRisk() {
    const lEl = document.getElementById('f_likelihood');
    const cEl = document.getElementById('f_consequence');
    const rEl = document.getElementById('riskDisplay');
    if (!lEl || !cEl || !rEl) return;

    const score = parseInt(lEl.value) * parseInt(cEl.value);
    let level, col, bg, icon;
    if (score <= 4)       { level = 'Low';     col = '#1B5E20'; bg = '#E8F5E9'; icon = '✅'; }
    else if (score <= 9)  { level = 'Medium';  col = '#E65100'; bg = '#FFF3E0'; icon = '⚠️'; }
    else if (score <= 16) { level = 'High';    col = '#BF360C'; bg = '#FBE9E7'; icon = '🔴'; }
    else                  { level = 'Extreme'; col = '#B71C1C'; bg = '#FFEBEE'; icon = '🚨'; }

    rEl.innerHTML = `
      <div class="risk-display" style="background:${bg};border:1.5px solid ${col}25">
        <span style="font-size:22px">${icon}</span>
        <div>
          <div class="risk-score" style="color:${col}">Risk Score: ${score} / 25</div>
          <div class="risk-level" style="color:${col}">${level} Risk</div>
        </div>
      </div>
    `;
    rEl.dataset.level = level;
  }

  // ── STEP 3: CHECKLIST & ROUTE ───────────────────────────────────────
  function buildChecklistStep() {
    if (!_type) return;

    document.getElementById('preWorkList').innerHTML = (PTW_CONFIG.preChecklist[_type] || []).map((item, i) => `
      <div class="check-item">
        <input type="checkbox" id="pre_${i}" />
        <label for="pre_${i}">${item}</label>
      </div>
    `).join('');

    const wf = PTW_CONFIG.workflows[_type];
    document.getElementById('approvalRouteDisplay').innerHTML = `
      <div class="notice notice--info" style="margin-bottom:12px">
        This permit requires <strong>${wf.stages.length}-stage approval</strong> before work can commence.
      </div>
      <div class="route-stages">
        ${wf.stages.map((s, i) => `
          <div class="route-stage">
            <div class="route-stage-num" style="background:${s.color}">${i + 1}</div>
            <div class="route-stage-info">
              <div class="route-stage-role">${s.role}</div>
              <div class="route-stage-desc">${s.requirement}</div>
            </div>
            <span class="badge badge-pending">⏳ Awaiting</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── SUBMIT ──────────────────────────────────────────────────────────
  function submitPermit() {
    const sigName = document.getElementById('f_sigName').value.trim();
    if (!sigName) { PTW.toast('Please type your full name to confirm', 'error'); return; }
    if (!PTW.getSigHasContent()) { PTW.toast('Please draw your signature', 'error'); return; }

    const risk    = document.getElementById('riskDisplay')?.dataset?.level || 'Medium';
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    const permits = PTW.getPermits();
    const id      = `PTW-${now.getFullYear()}-${String(permits.length + 1).padStart(3, '0')}`;

    // Collect type-specific data
    const typeData = {};
    (PTW_CONFIG.typeFields[_type] || []).forEach(f => {
      const el = document.getElementById(f.id);
      if (el) typeData[f.id] = el.value.trim();
    });

    const permit = {
      id,
      type:      _type,
      requester: document.getElementById('f_name').value.trim(),
      company:   document.getElementById('f_company').value.trim(),
      contact:   document.getElementById('f_contact').value.trim(),
      email:     document.getElementById('f_email').value.trim(),
      location:  document.getElementById('f_location').value.trim(),
      description: document.getElementById('f_desc').value.trim(),
      supervisor:  document.getElementById('f_supervisor').value.trim(),
      workers:     document.getElementById('f_workers').value,
      workerNames: document.getElementById('f_workerNames').value.trim(),
      startDate:   document.getElementById('f_startDate').value,
      startTime:   document.getElementById('f_startTime').value,
      endDate:     document.getElementById('f_endDate').value,
      endTime:     document.getElementById('f_endTime').value,
      risk,
      status:    'pending',
      date:      dateStr,
      controls:  document.getElementById('f_controls').value.trim() || 'Standard controls applied per checklist',
      typeData,
      approvals: {},
      signature: sigName,
      sigDate:   dateStr,
      comments:  [],
    };

    PTW.closeModal('newPermitModal');
    PTW.addPermit(permit);
    PTW.toast(`Permit ${id} submitted — awaiting ${PTW_CONFIG.workflows[_type].stages[0].role}`, 'success');
  }

  // ── EXPOSE ──────────────────────────────────────────────────────────
  PTW.openNewPermitModal = openNewPermitModal;
  PTW.step               = step;
  PTW.selectType         = selectType;
  PTW.updateRisk         = updateRisk;
  PTW.submitPermit       = submitPermit;
})();
