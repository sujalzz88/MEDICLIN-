/* ==========================================================================
   ABOUT VIEW (ABOUT.JS) — MEDICLIN AUTOMATION SUITE
   Clinical Decision Support, Automated Triage & Workflow Orchestration
   ========================================================================== */

export function renderAboutView(containerEl) {
  const html = `
    <div style="max-width: 960px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">
      
      <!-- Brand & Mission Header -->
      <div class="neu-card" style="padding: 2rem; border-left: 6px solid var(--teal-primary);">
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
          <div style="width:52px; height:52px; border-radius:14px; background:var(--neu-surface); box-shadow:var(--neu-flat-sm); padding:4px; display:flex; align-items:center; justify-content:center;">
            <img src="assets/mediclin-logo.png" alt="MediClin Emblem" style="width:100%; height:100%; object-fit:contain; border-radius:10px;" />
          </div>
          <div>
            <div class="neu-acuity-badge routine" style="margin-bottom:0.35rem; display:inline-flex; align-items:center; gap:0.4rem;">
              <span class="led-dot routine"></span> SYSTEM SPECIFICATION & OVERVIEW
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--teal-primary);">
              MediClin: Automation Suite for Clinical Support & Medical Intake
            </h2>
          </div>
        </div>

        <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.7; margin-bottom: 1rem;">
          <strong>MediClin</strong> is an enterprise automation suite for clinical support and medical intake triage. Designed specifically for high-stakes healthcare environments, trauma centers, and ambulatory clinics, MediClin harmonizes patient physiological telemetry, chief complaint classification, Emergency Severity Index (ESI) scoring, and automated provider handoff generation into a seamless, high-precision workflow.
        </p>

        <p style="font-size: 0.9rem; color: var(--text-sub); line-height: 1.6;">
          By leveraging deterministic algorithmic safety boundaries alongside bi-directional N8N webhook gateways, MediClin bridges patient arrival with instant specialist mobilization—drastically slashing emergency door-to-balloon and fast-track urgent care wait times.
        </p>
      </div>

      <!-- Core Capabilities Grid -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
        
        <div class="neu-card" style="padding:1.5rem;">
          <div style="font-size:1.4rem; margin-bottom:0.5rem;">⚡</div>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--teal-primary); margin-bottom:0.4rem;">
            Automated Intake Pipeline
          </h3>
          <p style="font-size:0.85rem; color:var(--text-sub); line-height:1.5;">
            14 structured clinical fields capturing vital telemetry, pain scores, medication history, and allergies with real-time field validation.
          </p>
        </div>

        <div class="neu-card" style="padding:1.5rem;">
          <div style="font-size:1.4rem; margin-bottom:0.5rem;">🩺</div>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--teal-primary); margin-bottom:0.4rem;">
            ESI 2.4 Triage Engine
          </h3>
          <p style="font-size:0.85rem; color:var(--text-sub); line-height:1.5;">
            Computes validated Emergency Severity Index (ESI Levels 1–5), Priority Acuity Scores (0–100), differential diagnoses, and red flag symptom alarms.
          </p>
        </div>

        <div class="neu-card" style="padding:1.5rem;">
          <div style="font-size:1.4rem; margin-bottom:0.5rem;">📋</div>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--teal-primary); margin-bottom:0.4rem;">
            Physician SBAR Matrix
          </h3>
          <p style="font-size:0.85rem; color:var(--text-sub); line-height:1.5;">
            Instantly formats complex patient data into structured Situation-Background-Assessment-Recommendation notes with 1-click clipboard and physical chart printing.
          </p>
        </div>

        <div class="neu-card" style="padding:1.5rem;">
          <div style="font-size:1.4rem; margin-bottom:0.5rem;">🔗</div>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--teal-primary); margin-bottom:0.4rem;">
            N8N Workflow Integration
          </h3>
          <p style="font-size:0.85rem; color:var(--text-sub); line-height:1.5;">
            Full REST/Webhook integration dispatching normalized JSON schemas to EHR systems, pager networks, on-call specialist phones, and trauma dispatchers.
          </p>
        </div>

      </div>

    </div>
  `;

  containerEl.innerHTML = html;
}
