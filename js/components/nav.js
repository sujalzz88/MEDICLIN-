/* ==========================================================================
   NAVIGATION COMPONENT (NAV.JS) — MEDICLIN TOP HEADER
   Brand Emblem, Status Pills, Sound Toggle & Real-Time Telemetry Clock
   Responsive Mobile Navigation Support
   ========================================================================== */

import { clinicalAudio } from './audio.js';

export function toggleMobileSidebar(forceState) {
  const sidebar = document.querySelector('.clinical-sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const menuBtn = document.getElementById('mobileMenuToggleBtn');

  if (!sidebar) return;

  const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('sidebar-open');

  if (isOpen) {
    sidebar.classList.add('sidebar-open');
    if (backdrop) backdrop.classList.add('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = window.innerWidth < 1024 ? 'hidden' : '';
  } else {
    sidebar.classList.remove('sidebar-open');
    if (backdrop) backdrop.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

export function renderHeaderNav(containerEl) {
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  const isMuted = clinicalAudio.isMuted;

  const html = `
    <header class="neu-header">
      
      <!-- Left Group: Hamburger Toggle + Brand Emblem -->
      <div class="neu-header-left">
        <button id="mobileMenuToggleBtn" class="mobile-menu-btn" aria-label="Toggle Clinical Navigation Menu" aria-expanded="false">
          ☰
        </button>

        <div class="neu-header-brand" style="cursor:pointer;" id="headerBrandClick" title="MediClin Home Workstation">
          <div class="neu-logo-badge" style="overflow:hidden; padding:2px;">
            <img src="assets/mediclin-logo.png" alt="MediClin Logo" style="width:100%; height:100%; object-fit:contain; border-radius:8px;" />
          </div>
          <div>
            <div class="neu-header-title">
              MediClin
            </div>
            <div class="neu-header-sub">
              AI Medical Intake & Smart Triage Dashboard
            </div>
          </div>
        </div>
      </div>

      <!-- Right Header Status Group -->
      <div class="neu-header-status">
        
        <!-- Live Precision Workstation Time -->
        <div class="clock-telemetry" id="liveWorkstationClock" title="Synchronized Hospital Station Time">
          ${now}
        </div>

        <!-- Audio Toggle Button -->
        <button id="audioMuteToggleBtn" class="neu-btn" style="font-size:0.8rem; padding:0.35rem 0.65rem;" title="Toggle Clinical Audio & Sirens">
          ${isMuted ? '🔇 Off' : '🔊 Audio'}
        </button>

        <!-- Intake Process Status Pill -->
        <div class="neu-status-pill">
          <span class="led-dot routine"></span>
          <span style="font-size:0.75rem; font-weight:800; letter-spacing:0.04em;">INTAKE ACTIVE</span>
        </div>
        
        <!-- Clinician Profile Pill -->
        <div class="neu-status-pill" style="font-size:0.78rem; font-weight:700;">
          <span>Dr. Alex Vance, MD</span>
        </div>

      </div>

    </header>
  `;

  containerEl.innerHTML = html;

  // Mobile Menu Button Action
  const menuBtn = containerEl.querySelector('#mobileMenuToggleBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clinicalAudio.playClick();
      toggleMobileSidebar();
    });
  }

  // Brand click returns to HOME
  const brandClick = containerEl.querySelector('#headerBrandClick');
  if (brandClick) {
    brandClick.addEventListener('click', () => {
      clinicalAudio.playClick();
      window.dispatchEvent(new CustomEvent('navigate-route', { detail: 'HOME' }));
    });
  }

  // Audio Toggle Action
  const muteBtn = containerEl.querySelector('#audioMuteToggleBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const muted = clinicalAudio.toggleMute();
      muteBtn.textContent = muted ? '🔇 Off' : '🔊 Audio';
      if (!muted) {
        clinicalAudio.playClick();
      }
    });
  }

  // Ticker Interval
  if (!window._mediclinClockInterval) {
    window._mediclinClockInterval = setInterval(() => {
      const clockEl = document.getElementById('liveWorkstationClock');
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
      }
    }, 1000);
  }
}
