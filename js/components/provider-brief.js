/* ==========================================================================
   PROVIDER BRIEF COMPONENT (PROVIDER-BRIEF.JS)
   Standardized SBAR Matrix Placed in Last Row with Download/Copy/Print
   ========================================================================== */

import { clinicalAudio } from './audio.js';

export function renderProviderBrief(containerEl, record) {
  if (!record) {
    containerEl.innerHTML = ``;
    return;
  }

  const { patient, triage } = record;

  const html = `
    <div class="neu-card" style="padding: 1.75rem; display:flex; flex-direction:column; gap:1.15rem;">
      
      <!-- SBAR Header & Actions -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(184, 196, 208, 0.4);">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--teal-primary); display:flex; align-items:center; gap:0.5rem;">
            <span>📋</span> CLINICAL PROVIDER BRIEF (SBAR MATRIX)
          </h3>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">
            Automated Physician Handoff Note • ${patient.patient_name} (${triage.patient_age} yrs • ${triage.patient_category})
          </div>
        </div>

        <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
          <button id="downloadJsonRecordBtn" class="neu-btn neu-btn-primary" style="font-size:0.8rem; padding:0.45rem 0.95rem;" title="Download structured clinical JSON payload">
            ⬇️ Download JSON Data Contract
          </button>
          <button id="copySbarBtn" class="neu-btn" style="font-size:0.8rem; padding:0.45rem 0.85rem;" title="Copy SBAR text to clipboard">
            📋 Copy SBAR Note
          </button>
          <button id="printSbarBtn" class="neu-btn" style="font-size:0.8rem; padding:0.45rem 0.85rem;" title="Print physical handoff sheet">
            🖨️ Print Sheet
          </button>
        </div>
      </div>

      <!-- SBAR 4-Cell Matrix Grid -->
      <div class="brief-grid">
        
        <!-- Situation -->
        <div class="brief-cell" style="padding:1rem;">
          <span class="brief-cell-label" style="font-size:0.72rem;">S — Situation</span>
          <div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;">
            <strong>${patient.reason_for_visit}</strong><br/>
            <span style="color:var(--text-sub); font-size:0.78rem;">${patient.symptoms}</span><br/>
            <span style="color:var(--text-muted); font-size:0.75rem;">Duration: ${patient.symptom_duration} • Pain: ${patient.pain_level}/10</span>
          </div>
        </div>

        <!-- Background -->
        <div class="brief-cell" style="padding:1rem;">
          <span class="brief-cell-label" style="font-size:0.72rem;">B — Background</span>
          <div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;">
            <strong>History:</strong> ${patient.medical_history || 'None documented'}<br/>
            <strong>Meds:</strong> ${patient.current_medications || 'None reported'}<br/>
            <strong>Allergies:</strong> <span style="color:${patient.allergies?.toLowerCase().includes('penicillin') ? 'var(--emergency-red)' : 'inherit'}; font-weight:700;">${patient.allergies || 'NKDA'}</span>
          </div>
        </div>

        <!-- Assessment -->
        <div class="brief-cell" style="padding:1rem;">
          <span class="brief-cell-label" style="font-size:0.72rem;">A — Assessment</span>
          <div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;">
            <strong>${triage.urgency_level.toUpperCase()}</strong> (${triage.esi_level || 'Score ' + triage.priority_score})<br/>
            <span style="color:var(--text-sub); font-size:0.78rem;">${triage.possible_conditions.slice(0, 2).join(' • ')}</span>
          </div>
        </div>

        <!-- Recommendation -->
        <div class="brief-cell" style="padding:1rem;">
          <span class="brief-cell-label" style="font-size:0.72rem;">R — Recommendation</span>
          <div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;">
            <strong>Provider:</strong> ${triage.recommended_provider}<br/>
            <strong>Window:</strong> <span style="color:var(--routine-green); font-weight:700;">${triage.appointment_duration}</span><br/>
            <strong>Required Orders:</strong> ${triage.exams_needed.slice(0, 2).join(' • ')}
          </div>
        </div>

      </div>

    </div>
  `;

  containerEl.innerHTML = html;

  const dlBtn = containerEl.querySelector('#downloadJsonRecordBtn');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      clinicalAudio.playClick();
      const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mediclin_record_${record.triage.intake_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const copyBtn = containerEl.querySelector('#copySbarBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      clinicalAudio.playClick();
      const sbarText = `
[MEDICLIN CLINICAL SBAR HANDOFF]
PATIENT: ${patient.patient_name} (DOB: ${patient.date_of_birth}, Age: ${triage.patient_age}, Category: ${triage.patient_category})
INTAKE ID: ${triage.intake_id} | ACUITY: ${triage.urgency_level.toUpperCase()} (${triage.esi_level || 'Score ' + triage.priority_score + '/100'})
ALLERGIES: ${patient.allergies || 'NKDA'}
VITALS: HR ${patient.heart_rate || 'N/A'} bpm, BP ${patient.blood_pressure || 'N/A'}, SpO2 ${patient.oxygen_sat || 'N/A'}%, Temp ${patient.temperature || 'N/A'}F

[SITUATION]
Chief Complaint: ${patient.reason_for_visit}
Symptoms: ${patient.symptoms} (Duration: ${patient.symptom_duration}, Pain: ${patient.pain_level}/10)

[BACKGROUND]
History: ${patient.medical_history || 'None'}
Medications: ${patient.current_medications || 'None'}

[ASSESSMENT]
Triage Reasoning: ${triage.urgency_reasoning || 'Clinical classification verified.'}
Possible Differentials: ${triage.possible_conditions.join(', ')}
Red Flags: ${triage.red_flag_symptoms.join(', ')}

[RECOMMENDATION]
Provider: ${triage.recommended_provider} (${triage.recommended_specialty})
Target Window: ${triage.appointment_duration}
Exams/Orders: ${triage.exams_needed.join(', ')}
      `.trim();

      navigator.clipboard.writeText(sbarText).then(() => {
        alert("📋 SBAR Note copied to clipboard for EHR paste.");
      }).catch(() => {
        prompt("Copy SBAR Note:", sbarText);
      });
    });
  }

  const printBtn = containerEl.querySelector('#printSbarBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      clinicalAudio.playClick();
      window.print();
    });
  }
}
