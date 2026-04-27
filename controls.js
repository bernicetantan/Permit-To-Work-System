// SafeWork PTW — Safety Checklist & Risk Matrix Rendering

const ControlsRenderer = {

  // Render practical safety checklist for given permit type
  renderControls(type) {
    const container = document.getElementById('safety-checklist-container');
    if (!container) return;
    if (!type || !PTW_CONFIG.safetyChecklists[type]) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Select a permit type first.</p>';
      return;
    }

    const groups = PTW_CONFIG.safetyChecklists[type];
    const typeMeta = PTW_CONFIG.permitTypes[type];
    const colorVar = { WAH:'var(--accent)', CS:'var(--purple)', LOTO:'var(--yellow)', HW:'var(--orange)', ELEC:'var(--green)' }[type];

    container.innerHTML = `
      <div class="checklist-header" style="border-color:${colorVar}">
        <span style="color:${colorVar};font-weight:600;font-family:var(--display)">${typeMeta.label} — Safety Checklist</span>
        <span class="checklist-progress" id="checklist-progress">0 / 0 checked</span>
      </div>
      ${groups.map(g => `
        <div class="checklist-group">
          <div class="checklist-group-title">
            <span class="checklist-icon">${g.icon}</span>
            <span>${g.group}</span>
          </div>
          <div class="checklist-items">
            ${g.items.map(item => `
              <label class="checklist-item" for="${item.id}">
                <input type="checkbox" id="${item.id}" name="safety-check" value="${item.label}" 
                  class="safety-cb ${item.mandatory ? 'mandatory' : ''}"
                  onchange="ControlsRenderer.updateProgress()">
                <span class="checklist-item-text">
                  ${item.label}
                  ${item.mandatory ? '<span class="req" title="Mandatory">*</span>' : ''}
                </span>
                <span class="checklist-item-status" id="status-${item.id}"></span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <div class="mandatory-note">
        <span class="req">*</span> Mandatory items — must be confirmed before permit can be submitted
      </div>`;

    this.updateProgress();
  },

  updateProgress() {
    const all = document.querySelectorAll('input.safety-cb');
    const checked = document.querySelectorAll('input.safety-cb:checked');
    const mandatory = document.querySelectorAll('input.safety-cb.mandatory');
    const mandatoryChecked = document.querySelectorAll('input.safety-cb.mandatory:checked');

    const progressEl = document.getElementById('checklist-progress');
    if (progressEl) {
      const allDone = checked.length === all.length;
      const mandDone = mandatoryChecked.length === mandatory.length;
      progressEl.textContent = `${checked.length} / ${all.length} checked`;
      progressEl.style.color = allDone ? 'var(--green)' : mandDone ? 'var(--yellow)' : 'var(--text-muted)';
    }

    // Tick visual on each checked item
    all.forEach(cb => {
      const statusEl = document.getElementById(`status-${cb.id}`);
      if (statusEl) statusEl.textContent = cb.checked ? '✓' : '';
    });
  },

  // Check all mandatory items are ticked
  allMandatoryChecked() {
    const mandatory = document.querySelectorAll('input.safety-cb.mandatory');
    if (!mandatory.length) return true;
    return [...mandatory].every(cb => cb.checked);
  },

  // Render type-specific fields
  renderTypeFields(type) {
    const container = document.getElementById('type-specific-fields');
    if (!container) return;
    if (!type || !PTW_CONFIG.typeFields[type]) {
      container.innerHTML = '';
      return;
    }
    const typeMeta = PTW_CONFIG.permitTypes[type];
    const fields = PTW_CONFIG.typeFields[type];
    const colorClass = { WAH:'type-label-wah', CS:'type-label-cs', LOTO:'type-label-loto', HW:'type-label-hw', ELEC:'type-label-elec' }[type];

    let html = `<div class="type-specific-section">
      <h4><span class="${colorClass}">◆</span> ${typeMeta.label} — Additional Details</h4>
      <div class="form-grid">`;
    fields.forEach(f => {
      html += `<div class="form-group"><label>${f.label}</label>`;
      if (f.type === 'select') {
        html += `<select id="${f.id}"><option value="">Select...</option>${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`;
      } else {
        html += `<input type="${f.type}" id="${f.id}" placeholder="${f.placeholder || ''}">`;
      }
      html += `</div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;
  },

  // Render routing info
  renderRoutingInfo(type) {
    const container = document.getElementById('routing-info');
    const approverContainer = document.getElementById('approver-selector');
    if (!container || !approverContainer) return;
    if (!type) {
      container.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Select a permit type first.</p>';
      approverContainer.innerHTML = '';
      return;
    }
    const rules = PTW_CONFIG.routingRules[type];
    if (!rules) return;

    container.innerHTML = `
      <h4>AUTOMATED ROUTING</h4>
      <p style="font-size:12.5px;color:var(--text-sub);margin-bottom:10px">${rules.description}</p>
      ${rules.checks.map(c => `
        <div class="routing-rule">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5 10L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ${c}
        </div>`).join('')}`;

    approverContainer.innerHTML = rules.assessors.map((a, i) => `
      <label class="approver-option" for="approver-${a.id}">
        <input type="radio" id="approver-${a.id}" name="approver" value="${a.id}" ${i === 0 ? 'checked' : ''}>
        <div class="approver-details">
          <span class="approver-name">${a.name}</span>
          <span class="approver-title">${a.title}</span>
        </div>
        <span class="approver-badge">${a.badge}</span>
      </label>`).join('');

    approverContainer.querySelectorAll('.approver-option').forEach(el => {
      el.addEventListener('click', () => {
        approverContainer.querySelectorAll('.approver-option').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
      });
    });
    const first = approverContainer.querySelector('.approver-option');
    if (first) first.classList.add('selected');
  },

  // Build risk matrix visual (5x5)
  buildRiskMatrix() {
    const container = document.getElementById('risk-matrix');
    if (!container) return;
    container.innerHTML = '';
    for (let row = 5; row >= 1; row--) {
      for (let col = 1; col <= 5; col++) {
        const score = row * col;
        const cell = document.createElement('div');
        cell.className = 'risk-cell';
        cell.id = `rm-${row}-${col}`;
        cell.textContent = score;
        const { bg, color } = ControlsRenderer.riskColor(score);
        cell.style.background = bg;
        cell.style.color = color;
        container.appendChild(cell);
      }
    }
  },

  updateRiskDisplay(likelihood, consequence) {
    const score = likelihood * consequence;
    const numEl = document.getElementById('risk-score-num');
    const labelEl = document.getElementById('risk-score-label');
    const scoreDisplay = document.querySelector('.risk-score-display');
    document.querySelectorAll('.risk-cell').forEach(c => c.classList.remove('highlighted'));
    if (!likelihood || !consequence) {
      if (numEl) numEl.textContent = '—';
      if (labelEl) labelEl.textContent = 'Select likelihood & consequence';
      if (scoreDisplay) scoreDisplay.style.borderColor = 'var(--border)';
      return score;
    }
    const { level, color } = ControlsRenderer.riskLevel(score);
    if (numEl) { numEl.textContent = score; numEl.style.color = color; }
    if (labelEl) { labelEl.textContent = level; labelEl.style.color = color; }
    if (scoreDisplay) scoreDisplay.style.borderColor = color;
    const cell = document.getElementById(`rm-${likelihood}-${consequence}`);
    if (cell) cell.classList.add('highlighted');
    return score;
  },

  riskLevel(score) {
    if (score <= 4)  return { level: 'LOW RISK',    color: 'var(--green)',  key: 'LOW' };
    if (score <= 9)  return { level: 'MEDIUM RISK', color: 'var(--yellow)', key: 'MEDIUM' };
    if (score <= 16) return { level: 'HIGH RISK',   color: 'var(--orange)', key: 'HIGH' };
    return             { level: 'EXTREME RISK', color: 'var(--red)',    key: 'EXTREME' };
  },

  riskColor(score) {
    if (score <= 4)  return { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' };
    if (score <= 9)  return { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' };
    if (score <= 16) return { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' };
    return             { bg: 'rgba(239,68,68,0.15)',    color: '#ef4444' };
  },

  // Get checked safety items for saving
  getSelectedControls() {
    const checked = [...document.querySelectorAll('input.safety-cb:checked')];
    return checked.length ? { checklist: checked.map(c => c.value) } : {};
  },

  getTypeFieldValues(type) {
    if (!PTW_CONFIG.typeFields[type]) return {};
    const result = {};
    PTW_CONFIG.typeFields[type].forEach(f => {
      const el = document.getElementById(f.id);
      if (el) result[f.label] = el.value;
    });
    return result;
  }
};
