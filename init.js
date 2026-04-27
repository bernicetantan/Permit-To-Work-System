/**
 * PTW System — Initialisation
 * Bootstraps the application on page load. No seed data.
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Render initial dashboard (empty state)
    PTW.renderDashboard();

    // Render workflow diagrams for all type pages (pre-render)
    PTW_Workflows.renderAllWorkflowDiagrams();

    // Render settings (routing rules)
    PTW.renderSettings();

    // Set today's date in dashboard
    const dashDate = document.getElementById('dashDate');
    if (dashDate) {
      dashDate.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    }

    // Set default start/end dates on new permit form to today
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('f_startDate');
    const endDate   = document.getElementById('f_endDate');
    if (startDate) startDate.value = today;
    if (endDate)   endDate.value   = today;

    // Update badges
    PTW.updateBadges();

    console.log('[PTW] System initialised. No permits loaded (clean state).');
  });
})();
