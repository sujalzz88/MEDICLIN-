/* ==========================================================================
   MAIN APPLICATION ENTRY POINT (APP.JS) — MEDICLIN WORKSTATION
   Routing, State Subscriptions, Sidebar & Navigation Controller
   ========================================================================== */

import { renderN8nModal } from './components/n8n-workflow-modal.js';
import { renderHeaderNav } from './components/nav.js';
import { renderSidebar } from './components/sidebar.js';
import { state } from './state.js';
import { renderAboutView } from './views/about.js';
import { renderContactView } from './views/contact.js';
import { renderEmergencyView } from './views/emergency.js';
import { renderHomeView } from './views/home.js';
import { renderUrgentView } from './views/urgent.js';

function initApp() {
  if (window.__mediclinAppInitialized) return;
  window.__mediclinAppInitialized = true;

  const headerMount = document.getElementById('headerMount');
  const sidebarMount = document.getElementById('sidebarMount');
  const mainMount = document.getElementById('mainMount');
  const modalMount = document.getElementById('modalMount');

  if (!headerMount || !mainMount) return;

  // Render static frame components
  renderHeaderNav(headerMount);
  if (sidebarMount) renderSidebar(sidebarMount);
  if (modalMount) renderN8nModal(modalMount);

  // Router Controller
  const updateRoute = () => {
    // Re-render header & sidebar to reflect active nav state and counts
    renderHeaderNav(headerMount);
    if (sidebarMount) renderSidebar(sidebarMount);

    switch (state.currentRoute) {
      case 'HOME':
        renderHomeView(mainMount);
        break;
      case 'EMERGENCY':
        renderEmergencyView(mainMount);
        break;
      case 'URGENT':
        renderUrgentView(mainMount);
        break;
      case 'CONTACT US':
        renderContactView(mainMount);
        break;
      case 'ABOUT US':
        renderAboutView(mainMount);
        break;
      default:
        renderHomeView(mainMount);
        break;
    }
  };

  // Subscribe to state changes
  state.subscribe(() => {
    updateRoute();
  });

  // Global Keyboard Handling (Escape closes drawer & modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebar = document.querySelector('.clinical-sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      const modal = document.getElementById('n8nModalBackdrop');

      if (sidebar && sidebar.classList.contains('sidebar-open')) {
        sidebar.classList.remove('sidebar-open');
        if (backdrop) backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }

      if (modal && modal.classList.contains('open')) {
        modal.classList.remove('open');
      }
    }
  });

  // Reset body overflow lock on desktop resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      document.body.style.overflow = '';
      const backdrop = document.getElementById('sidebarBackdrop');
      if (backdrop) backdrop.classList.remove('open');
      const sidebar = document.querySelector('.clinical-sidebar');
      if (sidebar) sidebar.classList.remove('sidebar-open');
    }
  });

  // Initial render
  updateRoute();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
