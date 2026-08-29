/* ==========================================================================
   N8N WORKFLOW MODAL COMPONENT (N8N-WORKFLOW-MODAL.JS)
   Full Automation Data Contract, Live Webhook Dispatch & JSON Schema Viewer
   ========================================================================== */

import {
  formatN8nPayload,
  getActiveWebhookUrl,
  getConfiguredN8nMode,
  N8N_ENDPOINTS,
  N8N_PRODUCTION_WEBHOOK_URL,
  N8N_TEST_WEBHOOK_URL,
  setN8nMode,
  submitToN8n,
  SYNTHETIC_TEST_PATIENT
} from '../api/n8n-client.js';
import { INITIAL_PRESETS, state } from '../state.js';

export function renderN8nModal(containerEl) {
  let modalBackdrop = document.getElementById('n8nModalBackdrop');
  if (modalBackdrop) {
    modalBackdrop.remove();
  }

  const activeMode = getConfiguredN8nMode();
  const activeUrl = getActiveWebhookUrl(activeMode);

  const html = `
    <div id="n8nModalBackdrop" class="modal-backdrop">
      <div class="modal-dialog">
        
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <div style="width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg, #0284C7 0%, #00798C 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.9rem; font-weight:900;">
              ⚡
            </div>
            <div>
              <h3 style="font-size:1.05rem; font-weight:800; color:var(--teal-primary);">
                MediClin Automation Suite — N8N Workflow Gateway
              </h3>
              <div style="font-size:0.75rem; color:var(--text-muted);">
                Bi-directional Webhook Gateway for EHR & AI Emergency Triage Systems
              </div>
            </div>
          </div>
          <button id="closeN8nModalBtn" class="neu-btn" style="padding:0.35rem 0.75rem; font-size:0.9rem;">✕</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:1rem;">
          
          <!-- Webhook Endpoint Configuration -->
          <div class="neu-card-recessed" style="padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <label class="neu-label" style="font-size:0.78rem; margin:0;">
                  N8N Webhook Gateway Target
                </label>
                <span id="modalActiveModeBadge" class="neu-badge ${activeMode === 'test' ? 'urgent' : 'routine'}" style="font-size:0.68rem; padding:0.15rem 0.5rem;">
                  ${activeMode === 'test' ? '🧪 TEST MODE ACTIVE' : '🏭 PRODUCTION DEFAULT'}
                </span>
              </div>
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button type="button" id="useProdUrlBtn" class="neu-btn" style="font-size:0.72rem; padding:0.25rem 0.6rem; color:var(--teal-primary); font-weight:700;" title="Set to Production Webhook (Active workflow)">
                  🏭 Production
                </button>
                <button type="button" id="useTestUrlBtn" class="neu-btn" style="font-size:0.72rem; padding:0.25rem 0.6rem; color:var(--urgent-amber); font-weight:700;" title="Set to Test Webhook (Requires active test listener in n8n)">
                  🧪 Test Mode
                </button>
              </div>
            </div>

            <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:stretch;">
              <input type="url" id="n8nWebhookUrlInput" class="neu-input" style="flex:1; min-width:min(100%, 200px); font-family:var(--font-mono); font-size:0.82rem;" placeholder="https://aryanna.app.n8n.cloud/webhook/..." value="${activeUrl}" />
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button id="saveN8nUrlBtn" class="neu-btn" style="font-size:0.8rem; padding:0.45rem 1rem; flex:1;">
                  💾 Save URL
                </button>
                <button id="testN8nDispatchBtn" class="neu-btn neu-btn-primary" style="font-size:0.8rem; padding:0.45rem 1rem; flex:1;">
                  🚀 Test Webhook
                </button>
              </div>
            </div>
            
            <div style="margin-top:0.6rem; font-size:0.72rem; color:var(--text-muted); line-height:1.5; word-break:break-all; overflow-wrap:anywhere;">
              • <strong>🏭 Production URL:</strong> <code>${N8N_ENDPOINTS.production}</code><br/>
              <span style="color:var(--text-sub);">&nbsp;&nbsp;↳ Used by main <strong>PROCESS AI TRIAGE</strong> button. (Requires workflow set to <strong>Active</strong> in n8n).</span><br/>
              • <strong>🧪 Test URL:</strong> <code>${N8N_ENDPOINTS.test}</code><br/>
              <span style="color:var(--text-sub);">&nbsp;&nbsp;↳ Used by <strong>Test Webhook</strong> button. (Requires clicking <strong>"Test workflow"</strong> in n8n editor).</span>
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
          <pre class="json-box" id="n8nJsonPreview" style="max-height:260px; overflow:auto;">// No active clinical record loaded.</pre>

          <!-- Status Console -->
          <div id="n8nStatusBanner" style="display:none; padding:0.75rem 1rem; border-radius:8px; font-size:0.82rem; font-weight:700; line-height:1.5;"></div>

        </div>

      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  containerEl.appendChild(wrapper);

  const backdrop = containerEl.querySelector('#n8nModalBackdrop');
  const closeBtn = containerEl.querySelector('#closeN8nModalBtn');
  const saveBtn = containerEl.querySelector('#saveN8nUrlBtn');
  const testBtn = containerEl.querySelector('#testN8nDispatchBtn');
  const prodBtn = containerEl.querySelector('#useProdUrlBtn');
  const testUrlBtn = containerEl.querySelector('#useTestUrlBtn');
  const urlInput = containerEl.querySelector('#n8nWebhookUrlInput');
  const modeBadge = containerEl.querySelector('#modalActiveModeBadge');
  const copyBtn = containerEl.querySelector('#copyJsonPayloadBtn');
  const dlBtn = containerEl.querySelector('#downloadJsonPayloadBtn');
  const preview = containerEl.querySelector('#n8nJsonPreview');
  const statusBanner = containerEl.querySelector('#n8nStatusBanner');

  let currentRecord = null;

  const showStatus = (msg, isSuccess = true) => {
    statusBanner.style.display = 'block';
    statusBanner.style.background = isSuccess ? 'var(--routine-bg)' : 'var(--emergency-bg)';
    statusBanner.style.color = isSuccess ? 'var(--routine-green)' : 'var(--emergency-red)';
    statusBanner.style.border = isSuccess ? '1px solid #86EFAC' : '1px solid #FCA5A5';
    statusBanner.innerHTML = msg;
  };

  const updatePreview = (record) => {
    currentRecord = record || state.activeIntake;
    const patientData = currentRecord?.patient || currentRecord || INITIAL_PRESETS.EMERGENCY_CARDIAC;
    const payload = formatN8nPayload(patientData);
    preview.textContent = JSON.stringify(payload, null, 2);
  };

  const closeModal = () => {
    backdrop.classList.remove('open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  if (prodBtn) {
    prodBtn.addEventListener('click', () => {
      setN8nMode('production');
      if (urlInput) urlInput.value = N8N_ENDPOINTS.production;
      if (modeBadge) {
        modeBadge.className = 'neu-badge routine';
        modeBadge.textContent = '🏭 PRODUCTION DEFAULT';
      }
      showStatus("✅ Set to Production Webhook Mode. (Ensure workflow is Active in n8n Cloud).");
    });
  }

  if (testUrlBtn) {
    testUrlBtn.addEventListener('click', () => {
      setN8nMode('test');
      if (urlInput) urlInput.value = N8N_ENDPOINTS.test;
      if (modeBadge) {
        modeBadge.className = 'neu-badge urgent';
        modeBadge.textContent = '🧪 TEST MODE ACTIVE';
      }
      showStatus("🧪 Set to Test Webhook Mode. (Make sure you clicked 'Test workflow' in n8n editor).");
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const url = urlInput ? urlInput.value.trim() : '';
      if (!url) {
        showStatus("⚠️ Webhook URL cannot be empty.", false);
        return;
      }
      if (url.includes('/webhook-test/')) {
        setN8nMode('test');
        if (modeBadge) {
          modeBadge.className = 'neu-badge urgent';
          modeBadge.textContent = '🧪 TEST MODE ACTIVE';
        }
      } else {
        setN8nMode('production');
        if (modeBadge) {
          modeBadge.className = 'neu-badge routine';
          modeBadge.textContent = '🏭 PRODUCTION DEFAULT';
        }
      }
      showStatus("✅ N8N Webhook Endpoint configured.");
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (preview) {
        navigator.clipboard.writeText(preview.textContent).then(() => {
          showStatus("📋 Formatted n8n JSON payload copied to clipboard!");
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
        showStatus("⬇️ JSON payload export downloaded successfully.");
      }
    });
  }

  // Live Developer Test Dispatch (Uses TEST URL explicitly)
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const customUrl = urlInput ? urlInput.value.trim() : '';
      const testTargetUrl = (customUrl && customUrl.includes('/webhook-test/')) ? customUrl : N8N_ENDPOINTS.test;

      showStatus(`⏳ Transmitting synthetic test patient to <code>${testTargetUrl}</code>...`, true);

      // Explicitly send synthetic test patient to test endpoint
      const result = await submitToN8n(SYNTHETIC_TEST_PATIENT, { url: testTargetUrl, mode: 'test' });

      if (result.success) {
        showStatus(`✅ <strong>Test Webhook Succeeded!</strong> (HTTP ${result.status} OK • ${result.durationMs}ms)<br/><span style="font-size:0.75rem; font-weight:normal; color:var(--text-main);">n8n pipeline received test payload and returned valid triage response.</span>`, true);
      } else if (result.isTestListenerInactive || result.status === 404) {
        showStatus(`⚠️ <strong>n8n Test Listener Not Active (HTTP 404)</strong> (${result.durationMs}ms)<br/><span style="font-size:0.75rem; font-weight:normal;">The test endpoint only works when n8n is actively listening. In your n8n editor, click <strong>"Test workflow"</strong> and then click <strong>"Test Webhook"</strong> again.</span>`, false);
      } else {
        showStatus(`❌ <strong>Test Webhook Failed:</strong> ${result.error} (${result.durationMs}ms)`, false);
      }
    });
  }

  // Global event listener for modal trigger
  window.addEventListener('open-n8n-modal', (e) => {
    updatePreview(e.detail);
    const curMode = getConfiguredN8nMode();
    if (urlInput) urlInput.value = getActiveWebhookUrl(curMode);
    if (modeBadge) {
      modeBadge.className = `neu-badge ${curMode === 'test' ? 'urgent' : 'routine'}`;
      modeBadge.textContent = curMode === 'test' ? '🧪 TEST MODE ACTIVE' : '🏭 PRODUCTION DEFAULT';
    }
    if (backdrop) backdrop.classList.add('open');
  });

  // Initial preview with preset or active intake
  updatePreview(state.activeIntake);
}

