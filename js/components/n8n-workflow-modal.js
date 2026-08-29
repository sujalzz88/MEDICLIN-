/* ==========================================================================
   N8N WORKFLOW GATEWAY MODAL (N8N-WORKFLOW-MODAL.JS)
   Diagnostic View of Active Test Webhook & JSON Data Payload Schema
   ========================================================================== */

import { formatN8nPayload, getActiveWebhookUrl } from '../api/n8n-client.js';
import { INITIAL_PRESETS, state } from '../state.js';

export function renderN8nModal(containerEl) {
  if (!containerEl) return;

  const html = `
    <div class="neu-modal-backdrop" id="n8nModalBackdrop" aria-hidden="true">
      <div class="neu-modal" role="dialog" aria-modal="true" aria-labelledby="n8nModalTitle">
        
        <div class="neu-modal-header">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-size:1.3rem;">⚡</span>
            <div>
              <h3 id="n8nModalTitle" class="neu-modal-title">n8n Automation Gateway & Data Contract</h3>
              <p style="font-size:0.75rem; color:var(--text-sub); margin-top:0.15rem;">
                Configured n8n Cloud Webhook Gateway & Real-Time Payload Telemetry
              </p>
            </div>
          </div>
          <button class="neu-modal-close" id="closeN8nModalBtn" aria-label="Close modal">✕</button>
        </div>

        <div class="neu-modal-body">
          
          <!-- Webhook Status Card -->
          <div class="neu-card-recessed" style="padding: 1rem 1.15rem; display:flex; flex-direction:column; gap:0.6rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span style="font-size:0.75rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.04em;">
                Active Webhook Gateway:
              </span>
              <span id="modalActiveModeBadge" class="neu-badge urgent" style="font-size:0.7rem; padding:0.2rem 0.6rem;">
                🏭 N8N PRODUCTION GATEWAY ACTIVE
              </span>
            </div>

            <div style="background:var(--neu-surface); padding:0.65rem 0.85rem; border-radius:8px; border:1px solid rgba(184, 196, 208, 0.5); font-family:var(--font-mono); font-size:0.78rem; word-break:break-all; color:var(--text-main);">
              ${getActiveWebhookUrl()}
            </div>
            
            <div style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">
              💡 <em>Ensure the workflow is set to <strong>Active</strong> in your n8n Cloud editor.</em>
            </div>
          </div>

          <!-- Payload Header Toolbar -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <span style="font-size:0.75rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.04em;">
              Structured Outbound n8n Payload Schema:
            </span>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button id="copyJsonPayloadBtn" class="neu-btn" style="font-size:0.75rem; padding:0.3rem 0.7rem;">
                📋 Copy JSON
              </button>
              <button id="downloadJsonPayloadBtn" class="neu-btn" style="font-size:0.75rem; padding:0.3rem 0.7rem;">
                ⬇️ Download .JSON
              </button>
            </div>
          </div>

          <!-- JSON Viewer -->
          <pre class="json-box" id="n8nJsonPreview" style="max-height:260px; overflow:auto;">// Loading payload schema...</pre>

          <!-- Status Console -->
          <div id="n8nStatusBanner" style="display:none; padding:0.75rem 1rem; border-radius:8px; font-size:0.82rem; font-weight:700; line-height:1.5;"></div>

        </div>

      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  containerEl.innerHTML = '';
  containerEl.appendChild(wrapper);

  const backdrop = containerEl.querySelector('#n8nModalBackdrop');
  const closeBtn = containerEl.querySelector('#closeN8nModalBtn');
  const copyBtn = containerEl.querySelector('#copyJsonPayloadBtn');
  const dlBtn = containerEl.querySelector('#downloadJsonPayloadBtn');
  const preview = containerEl.querySelector('#n8nJsonPreview');
  const statusBanner = containerEl.querySelector('#n8nStatusBanner');

  const updatePreview = (record) => {
    const patientData = record?.patient || record || state.activeIntake?.patient || INITIAL_PRESETS.EMERGENCY_CARDIAC;
    const payload = formatN8nPayload(patientData);
    if (preview) preview.textContent = JSON.stringify(payload, null, 2);
  };

  const closeModal = () => {
    if (backdrop) backdrop.classList.remove('open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (preview) {
        navigator.clipboard.writeText(preview.textContent).then(() => {
          if (statusBanner) {
            statusBanner.style.display = 'block';
            statusBanner.style.background = 'var(--routine-bg)';
            statusBanner.style.color = 'var(--routine-green)';
            statusBanner.innerHTML = '📋 Formatted n8n JSON payload copied to clipboard!';
            setTimeout(() => { statusBanner.style.display = 'none'; }, 3000);
          }
        });
      }
    });
  }

  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      if (preview) {
        const blob = new Blob([preview.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mediclin_n8n_payload_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  window.addEventListener('open-n8n-modal', (e) => {
    updatePreview(e.detail);
    if (backdrop) backdrop.classList.add('open');
  });

  updatePreview(state.activeIntake);
}
