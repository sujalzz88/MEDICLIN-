/* ==========================================================================
   SIDEBAR COMPONENT (SIDEBAR.JS) — WORKSTATION CONTROL
   Neumorphic Tactile Navigation Rail with Mobile Drawer Support
   ========================================================================== */

import { state } from '../state.js';
import { clinicalAudio } from './audio.js';
import { toggleMobileSidebar } from './nav.js';

export function renderSidebar(containerEl) {
  const currentRoute = state.currentRoute;
  const emergencyCount = state.getEmergencyQueue().length;
  const urgentCount = state.getUrgentQueue().length;
  const routineCount = state.getRoutineQueue().length;

  const navItems = [
    { id: 'HOME', label: 'HOME CONSOLE', icon: '📊' },
    { id: 'EMERGENCY', label: 'EMERGENCY QUEUE', icon: '🚨', count: emergencyCount, isEmergency: true },
    { id: 'URGENT', label: 'URGENT QUEUE', icon: '⚠️', count: urgentCount, isUrgent: true },
    { id: 'ROUTINE PLANNING', label: 'ROUTINE PLANNING', icon: '📅', count: routineCount },
    { id: 'ABOUT US', label: 'ABOUT ENGINE', icon: 'ℹ️' }
  ];

  const html = `
    <aside class="clinical-sidebar" id="clinicalSidebar">
      
      <!-- Drawer Header (Visible on Mobile/Tablet) -->
      <div class="sidebar-drawer-header">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <div class="neu-logo-badge" style="width:30px; height:30px; font-size:0.9rem;">
            ✚
          </div>
          <div>
            <div style="font-size:0.95rem; font-weight:900; color:var(--teal-primary);">MediClin</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">Station Navigation</div>
          </div>
        </div>
        <button id="sidebarCloseBtn" class="sidebar-close-btn" aria-label="Close Navigation Drawer">
          ✕
        </button>
      </div>

      <div class="sidebar-title">
        WORKSTATION CONTROL
      </div>

      <nav class="sidebar-nav-list">
        ${navItems.map(item => {
          const isActive = currentRoute === item.id;
          return `
            <button class="sidebar-nav-btn neu-btn ${isActive ? 'active' : ''}" 
                    data-route="${item.id}"
                    style="
                      display:flex; align-items:center; justify-content:space-between;
                      width:100%; text-align:left; padding:0.75rem 0.85rem;
                      font-size:0.8rem; font-weight:800; letter-spacing:0.02em;
                      border-radius:12px; border:none; cursor:pointer;
                      background:var(--neu-surface);
                      color:${isActive ? 'var(--sky-blue)' : 'var(--teal-primary)'};
                      box-shadow:${isActive ? 'var(--neu-inset-sm)' : 'var(--neu-flat-sm)'};
                      transition:all 0.15s ease;
                    ">
              <span style="display:flex; align-items:center; gap:0.55rem;">
                <span style="font-size:0.95rem;">${item.icon}</span>
                <span>${item.label}</span>
              </span>
              ${item.count ? `
                <span class="neu-badge ${item.isEmergency ? 'emergency' : 'urgent'}" style="font-size:0.68rem; padding:0.1rem 0.45rem; border-radius:9999px;">
                  ${item.count}
                </span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </nav>
    </aside>
  `;

  containerEl.innerHTML = html;

  // Close Drawer Action
  const closeBtn = containerEl.querySelector('#sidebarCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clinicalAudio.playClick();
      toggleMobileSidebar(false);
    });
  }

  // Backdrop close click listener
  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop && !backdrop._hasCloseListener) {
    backdrop.addEventListener('click', () => {
      toggleMobileSidebar(false);
    });
    backdrop._hasCloseListener = true;
  }

  // Navigation button actions
  containerEl.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      clinicalAudio.playClick();
      const route = e.currentTarget.getAttribute('data-route');
      
      // Auto-close drawer on mobile navigation
      if (window.innerWidth < 1024) {
        toggleMobileSidebar(false);
      }

      if (route === 'CONTACT US') {
        window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: state.activeIntake }));
      }
      state.setRoute(route);
    });
  });
}
