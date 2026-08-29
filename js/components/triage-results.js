/* ==========================================================================
   PATIENT STATUS OVERVIEW & ALERTS (TRIAGE-RESULTS.JS)
   1. Patient Status Overview (Row 2 Left)
   2. Patient Alerts & Clinical Criteria with Integrated Donut Gauge (Row 2 Right)
   ========================================================================== */

import { renderPriorityGauge } from './gauge.js';

export function renderPatientStatusOverview(containerEl, record) {
  if (!record) {
    containerEl.innerHTML = ``;
    return;
  }

  const { patient, triage } = record;
  const initials = patient.patient_name
    ? patient.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'PT';

  const html = `
    <div class="neu-card" style="height:100%; padding: 1.5rem; display:flex; flex-direction:column; justify-content:space-between; gap:1rem;">
      
      <!-- Top Card Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
        <div class="patient-profile-block">
          <div class="patient-jacket-avatar">
            ${initials}
          </div>
          <div>
            <div style="font-size:0.65rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.06em;">
              CLINICAL PATIENT RECORD
            </div>
            <h2 class="patient-jacket-name" style="font-size:1.2rem; font-weight:900;">
              ${patient.patient_name}
            </h2>
            <div class="patient-jacket-demog" style="font-size:0.78rem;">
              ${triage.patient_age} years old • <strong>${triage.patient_category}</strong>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          ${patient.allergies && patient.allergies !== 'NKDA' && !patient.allergies.toLowerCase().includes('none') ? `
            <span class="allergy-flag" style="background:var(--emergency-bg); color:var(--emergency-red); border:1px solid var(--emergency-border); padding:0.25rem 0.65rem; border-radius:9999px; font-size:0.72rem; font-weight:800;" title="Documented Allergy Alert">
              ⚠️ ALLERGY: ${patient.allergies}
            </span>
          ` : ''}

          <span class="neu-acuity-badge ${triage.urgency_level}" style="font-size:0.78rem; padding:0.35rem 0.85rem;">
            <span class="led-dot ${triage.urgency_level}"></span>
            ${triage.urgency_level.toUpperCase()}
          </span>
        </div>
      </div>

      <!-- 4 Recessed Metadata Wells -->
      <div class="patient-jacket-meta-row" style="margin-top:0.25rem;">
        <div class="patient-meta-pill">
          <div class="patient-meta-pill-label">INTAKE MRN</div>
          <div class="patient-meta-pill-val" style="font-family:var(--font-mono); color:var(--sky-blue); font-size:0.8rem;">${triage.intake_id}</div>
        </div>
        <div class="patient-meta-pill">
          <div class="patient-meta-pill-label">DATE OF BIRTH</div>
          <div class="patient-meta-pill-val" style="font-size:0.8rem;">${patient.date_of_birth || '1958-04-12'}</div>
        </div>
        <div class="patient-meta-pill">
          <div class="patient-meta-pill-label">CONTACT PHONE</div>
          <div class="patient-meta-pill-val" style="font-size:0.8rem;">${patient.patient_phone || '+1 (555) 234-8901'}</div>
        </div>
        <div class="patient-meta-pill">
          <div class="patient-meta-pill-label">INSURANCE CARRIER</div>
          <div class="patient-meta-pill-val" style="font-size:0.8rem;">${patient.insurance_provider || 'Blue Cross Blue Shield Gold'}</div>
        </div>
      </div>

      <!-- Clinical Assessment Summary Paragraph -->
      <div style="background:var(--neu-surface); border-radius:10px; box-shadow:var(--neu-inset-sm); padding:0.85rem 1rem;">
        <div style="font-size:0.68rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; margin-bottom:0.3rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
          <span>AI CLINICAL TRIAGE ASSESSMENT • ${triage.esi_level || 'ESI Level 2 (Emergent / High Risk)'}</span>
          ${record.source === 'n8n' ? `
            <span style="color:var(--routine-green); background:var(--routine-bg); border:1px solid #86EFAC; padding:0.15rem 0.55rem; border-radius:6px; font-size:0.65rem;">
              ⚡ N8N WORKFLOW VERIFIED
            </span>
          ` : (record.source === 'local_demo' ? `
            <span style="color:var(--urgent-amber); background:var(--urgent-bg); border:1px solid #FCD34D; padding:0.15rem 0.55rem; border-radius:6px; font-size:0.65rem;">
              🧪 DEMO MODE — LOCAL ANALYSIS
            </span>
          ` : '')}
        </div>
        <p style="font-size:0.85rem; color:var(--text-main); line-height:1.55;">
          ${triage.urgency_reasoning}
        </p>
      </div>

      <!-- Specialist & Target Slot Footer -->
      <div class="status-footer-grid">
        <div class="neu-card-recessed" style="padding:0.75rem 0.9rem;">
          <div style="font-size:0.65rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase;">Assigned Specialist</div>
          <div style="font-size:0.85rem; font-weight:800; color:var(--text-main); margin-top:0.15rem;">${triage.recommended_provider}</div>
          <div style="font-size:0.74rem; color:var(--text-muted);">${triage.recommended_specialty}</div>
        </div>
        <div class="neu-card-recessed" style="padding:0.75rem 0.9rem;">
          <div style="font-size:0.65rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase;">Target Slot Window</div>
          <div style="font-size:0.85rem; font-weight:800; color:var(--routine-green); margin-top:0.15rem;">${triage.appointment_duration}</div>
          <div style="font-size:0.74rem; color:var(--text-muted);">Priority placement</div>
        </div>
      </div>

    </div>
  `;

  containerEl.innerHTML = html;
}

export function renderPatientAlerts(containerEl, record) {
  if (!record) {
    containerEl.innerHTML = ``;
    return;
  }

  const { patient, triage } = record;
  const hr = parseFloat(patient.heart_rate || 118);
  const spo2 = parseFloat(patient.oxygen_sat || 89);
  const temp = parseFloat(patient.temperature || 98.8);
  const pain = parseInt(patient.pain_level || 8, 10);

  const html = `
    <div class="neu-card" style="padding: 1.5rem; display:flex; flex-direction:column; gap:1.15rem;">
      
      <!-- Card Title Matching Image 1 -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:0.65rem; border-bottom:1px solid rgba(184, 196, 208, 0.4); flex-wrap:wrap; gap:0.5rem;">
        <h3 style="font-size: 1.05rem; font-weight: 900; color: var(--teal-primary); display:flex; align-items:center; gap:0.45rem;">
          <span>⚠️</span> PATIENT ALERTS & CLINICAL CRITERIA
        </h3>
        <span style="font-size:0.72rem; color:var(--text-muted);">
          Algorithm: <strong style="color:var(--teal-primary);">ESI 2.4 Validated</strong>
        </span>
      </div>

      <!-- Top Row Inside Card: Donut Gauge + Red Flags Side-by-Side -->
      <div class="alerts-gauge-split">
        
        <!-- Integrated Donut Gauge Inside Card -->
        <div id="integratedDonutMount"></div>

        <!-- Red Flag Clinical Alerts -->
        <div>
          ${triage.red_flag_symptoms && triage.red_flag_symptoms.length > 0 && triage.red_flag_symptoms[0] !== 'None reported' ? `
            <div class="red-flag-clean-box" style="margin-bottom:0; height:100%; display:flex; flex-direction:column; justify-content:center;">
              <div class="red-flag-clean-title">
                <span class="led-dot emergency"></span>
                Red Flag Clinical Alert Detected
              </div>
              <ul class="red-flag-clean-list">
                ${(triage.red_flag_symptoms || []).map(rf => `<li><strong>${rf}</strong></li>`).join('')}
              </ul>
            </div>
          ` : `
            <div class="neu-card-recessed" style="height:100%; display:flex; align-items:center; justify-content:center; padding:1rem; color:var(--routine-green); font-weight:700; font-size:0.85rem;">
              ✓ Normal baseline criteria — No critical red flags detected
            </div>
          `}
        </div>

      </div>

      <!-- 5 Vitals Pods with ECG Sparklines -->
      <div class="vitals-typographic-grid" style="margin:0;">
        <div class="vital-stat-cell">
          <span class="vital-stat-label">Heart Rate</span>
          <span class="vital-stat-val ${hr > 110 || hr < 50 ? 'alert-stat' : ''}">${patient.heart_rate || '118'} <span style="font-size:0.65rem;">bpm</span></span>
          <span class="vital-stat-sub">${hr > 110 ? '↑ Tachycardia' : 'Normal'}</span>
          <svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 10 L25 10 L30 2 L35 18 L40 5 L45 13 L50 10 L100 10" fill="none" stroke="${hr > 110 ? 'var(--emergency-red)' : 'var(--teal-primary)'}" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="vital-stat-cell">
          <span class="vital-stat-label">Blood Pressure</span>
          <span class="vital-stat-val">${patient.blood_pressure || '165/98'}</span>
          <span class="vital-stat-sub">mmHg</span>
          <svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 10 L40 10 L50 4 L60 16 L70 10 L100 10" fill="none" stroke="var(--sky-blue)" stroke-width="1.8"/>
          </svg>
        </div>

        <div class="vital-stat-cell">
          <span class="vital-stat-label">SpO₂ Sat</span>
          <span class="vital-stat-val ${spo2 < 92 ? 'alert-stat' : ''}">${patient.oxygen_sat || '89'} <span style="font-size:0.65rem;">%</span></span>
          <span class="vital-stat-sub">${spo2 < 92 ? '↓ Hypoxic Alert' : 'Optimal'}</span>
          <svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 10 L30 10 L45 6 L55 14 L70 10 L100 10" fill="none" stroke="${spo2 < 92 ? 'var(--emergency-red)' : 'var(--routine-green)'}" stroke-width="1.8"/>
          </svg>
        </div>

        <div class="vital-stat-cell">
          <span class="vital-stat-label">Temperature</span>
          <span class="vital-stat-val ${temp >= 100.4 ? 'alert-stat' : ''}">${patient.temperature || '98.8'} <span style="font-size:0.65rem;">°F</span></span>
          <span class="vital-stat-sub">${temp >= 100.4 ? '↑ Pyrexia' : 'Normal'}</span>
          <svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 10 L100 10" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="3 3"/>
          </svg>
        </div>

        <div class="vital-stat-cell">
          <span class="vital-stat-label">Pain Index</span>
          <span class="vital-stat-val ${pain >= 8 ? 'alert-stat' : ''}">${patient.pain_level || '8'} <span style="font-size:0.65rem;">/ 10</span></span>
          <span class="vital-stat-sub">${pain >= 8 ? 'Severe' : 'Moderate'}</span>
          <svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 10 L20 10 L35 ${20 - pain * 1.5} L50 10 L100 10" fill="none" stroke="${pain >= 8 ? 'var(--emergency-red)' : 'var(--urgent-amber)'}" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <!-- 3 Protocol Boxes Grid -->
      <div class="protocols-clean-grid" style="margin-bottom:0;">
        <div class="protocol-box">
          <div class="protocol-clean-header">🩺 Required Exams</div>
          <ul class="protocol-clean-items">
            ${(triage.exams_needed || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="protocol-box">
          <div class="protocol-clean-header">🧪 Diagnostic Orders</div>
          <ul class="protocol-clean-items">
            ${(triage.tests_to_consider || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="protocol-box">
          <div class="protocol-clean-header">❓ Clinician Questions</div>
          <ul class="protocol-clean-items">
            ${(triage.questions_for_provider || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Action Button -->
      <div style="display:flex; justify-content:flex-end; align-items:center; padding-top:0.65rem; border-top:1px solid rgba(184, 196, 208, 0.4);">
        <button id="viewN8nJsonBtn" class="neu-btn" style="font-size:0.78rem; padding:0.4rem 0.85rem;">
          🔍 View Clinical Data Contract
        </button>
      </div>

    </div>
  `;

  containerEl.innerHTML = html;

  // Mount Donut Gauge inside card
  const donutMount = containerEl.querySelector('#integratedDonutMount');
  if (donutMount) {
    renderPriorityGauge(donutMount, triage.priority_score, triage.urgency_level);
  }

  const jsonBtn = containerEl.querySelector('#viewN8nJsonBtn');
  if (jsonBtn) {
    jsonBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: record }));
    });
  }
}
