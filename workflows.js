/**
 * PTW System — Workflow Rendering
 * Renders the approval workflow diagrams for each permit type.
 */

(function() {
  'use strict';

  function renderAllWorkflowDiagrams() {
    Object.keys(PTW_CONFIG.workflows).forEach(type => {
      const el = document.getElementById('workflow-' + type);
      if (!el) return;
      renderWorkflowDiagram(type, el);
    });
  }

  function renderWorkflowDiagram(type, container) {
    const wf   = PTW_CONFIG.workflows[type];
    const meta = PTW_CONFIG.types[type];

    const stagesHtml = wf.stages.map((s, i) => `
      <div class="workflow-stage" style="border-color:${s.color}30;border-left:3px solid ${s.color}">
        <div class="wf-stage-num" style="background:${s.color}">${i + 1}</div>
        <div class="wf-stage-body">
          <div class="wf-stage-role">${s.role}</div>
          <div class="wf-stage-desc">${s.desc}</div>
        </div>
      </div>
      ${i < wf.stages.length - 1 ? '<div class="wf-arrow">→</div>' : ''}
    `).join('');

    container.innerHTML = `
      <div class="workflow-title">
        <span style="color:${meta.color};font-size:18px">${meta.icon}</span>
        ${wf.name}
      </div>
      <div class="workflow-stages">${stagesHtml}</div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:8px">Approver Requirements</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${wf.stages.map((s, i) => `
            <div style="display:flex;align-items:center;gap:6px;font-size:11.5px;background:var(--surface2);border-radius:6px;padding:5px 10px">
              <span style="width:16px;height:16px;border-radius:50%;background:${s.color};display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white">${i+1}</span>
              <span style="color:var(--text-2)">${s.requirement}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Expose
  window.PTW_Workflows = { renderAllWorkflowDiagrams, renderWorkflowDiagram };
})();
