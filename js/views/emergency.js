/* ==========================================================================
   EMERGENCY PAGE VIEW - CRITICAL EMERGENCY DETECTION CONSOLE (NEUMORPHIC EDITION)
   ========================================================================== */

import { renderProviderBrief } from '../components/provider-brief.js';
import { state } from '../state.js';

export function renderEmergencyView(containerEl) {
  const emergencyIntakes = state.getEmergencyQueue();

  const html = `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      
      <!-- Emergency Header Banner -->
      <div class="neu-card" style="padding: 1.5rem; border-left: 6px solid var(--emergency-red); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="neu-acuity-badge emergency" style="margin-bottom:0.5rem;">
            <span class="led-dot emergency"></span> EMERGENCY MONITORING CENTER
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--emergency-red);">
            High-Priority Critical Triage Alerts
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-sub);">
            Cases flagged with urgency level "EMERGENCY" by AI Medical Triage requiring immediate resuscitation suite dispatch.
          </p>
        </div>

        <div class="neu-card-recessed" style="text-align:center; min-width:140px;">
          <div style="font-size:1.8rem; font-weight:900; color:var(--emergency-red);">${emergencyIntakes.length}</div>
          <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Active Alerts</div>
        </div>
      </div>

      <!-- Emergency Active Queue -->
      ${emergencyIntakes.length === 0 ? `
        <div class="neu-card" style="padding: 2.5rem; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🟢</div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--routine-green);">No Emergency Cases in Queue</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
            Return to the HOME page and submit or load the "Emergency (Cardiac)" preset to test emergency response workflows.
          </p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          ${emergencyIntakes.map((record, index) => `
            <div class="neu-card" style="padding: 1.5rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; border-bottom:1px solid rgba(184, 196, 208, 0.4); padding-bottom:0.75rem;">
                <div>
                  <span class="neu-acuity-badge emergency">STAT EMERGENCY • SCORE: ${record.triage.priority_score}/100</span>
                  <h3 style="font-size:1.2rem; font-weight:800; color:var(--text-main); margin-top:0.3rem;">
                    Patient: ${record.patient.patient_name} (${record.triage.patient_age} yrs, ${record.triage.patient_category})
                  </h3>
                </div>
                <div style="text-align:right;">
                  <button class="neu-btn neu-btn-emergency dispatch-btn" data-index="${index}">
                    🚨 DISPATCH EMERGENCY TEAM
                  </button>
                </div>
              </div>

              <!-- Red Flag Highlights -->
              <div class="neu-card" style="border-left: 4px solid var(--emergency-red); padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
                <div style="font-size:0.8rem; font-weight:900; color:var(--emergency-red); text-transform:uppercase; margin-bottom:0.3rem;">
                  ⚠️ RED FLAG SYMPTOMS
                </div>
                <ul style="padding-left:1.2rem; color:var(--text-main); font-size:0.875rem;">
                  ${record.triage.red_flag_symptoms.map(rf => `<li><strong>${rf}</strong></li>`).join('')}
                </ul>
              </div>

              <!-- Provider Brief Integration -->
              <div id="emergencyBriefMount_${index}"></div>
            </div>
          `).join('')}
        </div>
      `}

    </div>
  `;

  containerEl.innerHTML = html;

  // Mount Provider Briefs for each emergency record
  emergencyIntakes.forEach((record, index) => {
    const mount = containerEl.querySelector(`#emergencyBriefMount_${index}`);
    if (mount) {
      renderProviderBrief(mount, record);
    }
  });

  // Dispatch alert handlers
  containerEl.querySelectorAll('.dispatch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      const record = emergencyIntakes[idx];
      alert(`🚨 EMERGENCY RESPONSE DISPATCHED!\n\nPatient: ${record.patient.patient_name}\nOn-Call Doctor (${record.triage.recommended_provider}) notified.\nTrauma Bay prepared.`);
    });
  });
}
