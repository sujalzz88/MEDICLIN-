/* ==========================================================================
   URGENT PAGE VIEW - 24–48 HOUR URGENT CARE SCHEDULING CONSOLE (NEUMORPHIC EDITION)
   Expedited Surgical & Diagnostic Pathways • Slot Confirmation
   ========================================================================== */

import { renderProviderBrief } from '../components/provider-brief.js';
import { state } from '../state.js';

export function renderUrgentView(containerEl) {
  const urgentIntakes = state.getUrgentQueue();

  const html = `
    <div style="max-width: 1100px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">
      
      <!-- Urgent Header Banner -->
      <div class="neu-card" style="padding: 1.5rem; border-left: 6px solid var(--urgent-amber); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="neu-acuity-badge urgent" style="margin-bottom:0.5rem; display:inline-flex; align-items:center; gap:0.4rem;">
            <span class="led-dot urgent"></span>
            FAST-TRACK URGENT CARE (24–48 HOURS)
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--urgent-amber); margin-top:0.2rem;">
            Prioritized Urgent Schedule
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-sub); margin-top:0.2rem;">
            Cases classified as ESI Level 3 requiring expedited diagnostic imaging and surgical evaluation within 24 to 48 hours.
          </p>
        </div>

        <div class="neu-card-recessed" style="text-align:center; min-width:140px; padding:0.85rem 1.5rem;">
          <div style="font-size:1.8rem; font-weight:900; font-family:var(--font-mono); color:var(--urgent-amber);">${urgentIntakes.length}</div>
          <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">Scheduled Cases</div>
        </div>
      </div>

      <!-- Urgent Active Queue -->
      ${urgentIntakes.length === 0 ? `
        <div class="neu-card" style="padding: 3.5rem 2rem; text-align: center;">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--routine-bg); color:var(--routine-green); display:flex; align-items:center; justify-content:center; margin:0 auto 0.85rem; font-size:1.4rem; font-weight:900;">
            ✓
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">No Urgent Cases in Queue</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem; max-width:460px; margin-left:auto; margin-right:auto;">
            All urgent fast-track slots are currently available. Return to HOME and load the "Urgent (Appendicitis)" preset to test expedited pathways.
          </p>
          <button id="goHomeBtnUrgent" class="neu-btn neu-btn-primary" style="margin-top:1.5rem;">
            Return to Triage Console
          </button>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          ${urgentIntakes.map((record, index) => `
            <div class="neu-card" style="padding: 1.5rem; border-left: 5px solid var(--urgent-amber);">
              
              <!-- Patient Header -->
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; padding-bottom:0.85rem; border-bottom:1px solid rgba(184, 196, 208, 0.4); flex-wrap:wrap; gap:0.75rem;">
                <div>
                  <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                    <span class="neu-acuity-badge urgent">
                      <span class="led-dot urgent"></span> ESI 3 • URGENT (24-48H)
                    </span>
                    <span style="font-family:var(--font-mono); font-size:0.78rem; color:var(--sky-blue); font-weight:700;">${record.triage.intake_id}</span>
                  </div>
                  <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main);">
                    Patient: ${record.patient.patient_name} <span style="font-weight:600; font-size:0.85rem; color:var(--text-muted);">(${record.triage.patient_age} yrs • ${record.triage.patient_category})</span>
                  </h3>
                  <div style="font-size:0.78rem; color:var(--text-sub); margin-top:0.2rem;">
                    <strong>DOB:</strong> ${record.patient.date_of_birth} • <strong>Phone:</strong> ${record.patient.patient_phone} • <strong>Preferred Slot:</strong> ${record.patient.preferred_time || '09:30 AM'}
                  </div>
                </div>

                <div>
                  <button class="neu-btn neu-btn-primary confirm-slot-action-btn" data-index="${index}" style="font-size:0.82rem; padding:0.55rem 1.1rem;">
                    📅 Confirm Slot (${record.patient.preferred_time || '09:30 AM'})
                  </button>
                </div>
              </div>

              <!-- Vitals Readout Grid -->
              <div class="vitals-typographic-grid" style="margin:0 0 1.1rem;">
                <div class="vital-stat-cell">
                  <span class="vital-stat-label">Heart Rate</span>
                  <span class="vital-stat-val">${record.patient.heart_rate || '94'} bpm</span>
                  <span class="vital-stat-sub">Normal</span>
                </div>
                <div class="vital-stat-cell">
                  <span class="vital-stat-label">Blood Pressure</span>
                  <span class="vital-stat-val">${record.patient.blood_pressure || '128/82'}</span>
                  <span class="vital-stat-sub">mmHg</span>
                </div>
                <div class="vital-stat-cell">
                  <span class="vital-stat-label">SpO₂ Sat</span>
                  <span class="vital-stat-val">${record.patient.oxygen_sat || '98'}%</span>
                  <span class="vital-stat-sub">Optimal</span>
                </div>
                <div class="vital-stat-cell">
                  <span class="vital-stat-label">Temperature</span>
                  <span class="vital-stat-val ${parseFloat(record.patient.temperature) >= 100.4 ? 'alert-stat' : ''}">${record.patient.temperature || '101.4'}°F</span>
                  <span class="vital-stat-sub">${parseFloat(record.patient.temperature) >= 100.4 ? '↑ Pyrexia' : 'Normal'}</span>
                </div>
                <div class="vital-stat-cell">
                  <span class="vital-stat-label">Pain Scale</span>
                  <span class="vital-stat-val">${record.patient.pain_level || '7'} / 10</span>
                  <span class="vital-stat-sub">Moderate</span>
                </div>
              </div>

              <!-- Pathway Summary Grid -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
                <div class="neu-card-recessed" style="padding:0.85rem 1rem;">
                  <span style="font-size:0.7rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.04em;">Assigned Specialist</span>
                  <div style="font-size:0.95rem; font-weight:800; color:var(--text-main); margin-top:0.15rem;">${record.triage.recommended_provider}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${record.triage.recommended_specialty}</div>
                </div>
                <div class="neu-card-recessed" style="padding:0.85rem 1rem;">
                  <span style="font-size:0.7rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.04em;">Fast-Track Window</span>
                  <div style="font-size:0.95rem; font-weight:800; color:var(--routine-green); margin-top:0.15rem;">${record.triage.appointment_duration}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Priority workup slot</div>
                </div>
              </div>

              <!-- Embedded SBAR Provider Brief -->
              <div id="urgentBriefMount_${index}"></div>
            </div>
          `).join('')}
        </div>
      `}

    </div>
  `;

  containerEl.innerHTML = html;

  urgentIntakes.forEach((record, index) => {
    const mount = containerEl.querySelector(`#urgentBriefMount_${index}`);
    if (mount) renderProviderBrief(mount, record);
  });

  containerEl.querySelectorAll('.confirm-slot-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      const record = urgentIntakes[idx];
      alert(`✅ URGENT APPOINTMENT CONFIRMED!\n\nPatient: ${record.patient.patient_name}\nSpecialist: ${record.triage.recommended_provider}\nTime Window: ${record.patient.preferred_time || '09:30 AM'}\nFront Desk & Confirmation SMS dispatched.`);
    });
  });

  const homeBtn = containerEl.querySelector('#goHomeBtnUrgent');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      state.setRoute('HOME');
    });
  }
}
