/* ==========================================================================
   ROUTINE & UNIVERSAL PLANNING WORKSPACE (PLANNING.JS) — MEDICLIN
   Universal Planning & Scheduling Workspace for Emergency, Urgent & Routine
   ========================================================================== */

import { submitToN8n } from '../api/n8n-client.js';
import { clinicalAudio } from '../components/audio.js';
import { renderAutomationWorkflow } from '../components/automation-workflow.js';
import { state } from '../state.js';

export function renderPlanningView(containerEl) {
  let activeWorkflowType = 'routine'; // 'routine' | 'urgent' | 'emergency'
  let isSubmitting = false;
  let lastPlanningResult = null;

  // If there is an active intake from AI triage, check its urgency
  const activeIntake = state.activeIntake;

  function render() {
    const isEmerg = activeWorkflowType === 'emergency';
    const isUrg = activeWorkflowType === 'urgent';
    const isRout = activeWorkflowType === 'routine';

    let headerBadgeText = '📅 ROUTINE SCHEDULING PLANNER';
    let headerBadgeClass = 'routine';
    let themeAccent = 'var(--routine-green)';
    let themeBorder = 'var(--routine-green)';
    let defaultDuration = '30 min';
    let defaultSpecialty = 'Internal Medicine / Primary Care';
    let actionLabel = '🚀 SUBMIT ROUTINE PLANNING REQUEST';

    if (isEmerg) {
      headerBadgeText = '🚨 EMERGENCY CARE & TRAUMA PLANNER';
      headerBadgeClass = 'emergency';
      themeAccent = 'var(--emergency-red)';
      themeBorder = 'var(--emergency-red)';
      defaultDuration = '60 min (STAT)';
      defaultSpecialty = 'Trauma Resuscitation / Cardiology';
      actionLabel = '🚨 SUBMIT EMERGENCY ACTION PLAN';
    } else if (isUrg) {
      headerBadgeText = '⚡ URGENT AMBULATORY FAST-TRACK PLANNER';
      headerBadgeClass = 'urgent';
      themeAccent = 'var(--urgent-amber)';
      themeBorder = 'var(--urgent-amber)';
      defaultDuration = '45 min';
      defaultSpecialty = 'Urgent Care / Acute Diagnostics';
      actionLabel = '⚡ SUBMIT URGENT PLANNING REQUEST';
    }

    const html = `
      <div style="max-width: 1100px; margin: 0 auto; display:flex; flex-direction:column; gap:1.35rem;">
        
        <!-- Header Banner -->
        <div class="neu-card" style="padding: 1.5rem; border-left: 6px solid ${themeBorder}; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem;">
              <span class="neu-acuity-badge ${headerBadgeClass}">
                <span class="led-dot ${headerBadgeClass}"></span>
                ${headerBadgeText}
              </span>
              <span style="font-size:0.75rem; font-weight:800; color:var(--teal-primary); background:rgba(0, 121, 140, 0.08); padding:0.2rem 0.55rem; border-radius:6px;">
                UNIVERSAL WORKFLOW ENGINE
              </span>
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 900; color: var(--text-main);">
              Clinical Care Planning & Resource Allocation
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-sub); margin-top:0.25rem;">
              Prepare operational scheduling directives, physician assignment, and pre-arrival instructions to dispatch to the n8n automation pipeline.
            </p>
          </div>

          <!-- Pre-populate from Active Intake Button (if available) -->
          ${activeIntake ? `
            <button id="loadActiveIntakeBtn" class="neu-btn neu-btn-primary" style="font-size:0.8rem; padding:0.45rem 0.85rem;" title="Pre-populate form with active triage patient">
              📋 Load Active Patient (${activeIntake.patient.patient_name})
            </button>
          ` : ''}
        </div>

        <!-- Workflow Type Selector Tabs -->
        <div class="neu-card" style="padding: 1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div style="font-size:0.78rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.04em;">
            Select Operational Planning Workflow:
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="workflow-type-tab neu-btn ${isEmerg ? 'active' : ''}" data-type="emergency" style="font-size:0.8rem; padding:0.4rem 0.85rem; color:${isEmerg ? 'var(--emergency-red)' : 'inherit'}; font-weight:${isEmerg ? '900' : '700'};">
              🚨 Emergency Planning
            </button>
            <button class="workflow-type-tab neu-btn ${isUrg ? 'active' : ''}" data-type="urgent" style="font-size:0.8rem; padding:0.4rem 0.85rem; color:${isUrg ? 'var(--urgent-amber)' : 'inherit'}; font-weight:${isUrg ? '900' : '700'};">
              ⚡ Urgent Planning
            </button>
            <button class="workflow-type-tab neu-btn ${isRout ? 'active' : ''}" data-type="routine" style="font-size:0.8rem; padding:0.4rem 0.85rem; color:${isRout ? 'var(--routine-green)' : 'inherit'}; font-weight:${isRout ? '900' : '700'};">
              📅 Routine Planning
            </button>
          </div>
        </div>

        <!-- Planning Form & Configuration Grid -->
        <form id="planningForm" class="neu-card" style="padding: 1.5rem; display:flex; flex-direction:column; gap:1.25rem;">
          
          <!-- Section 1: Patient Identity -->
          <div>
            <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
              <span>👤</span> 1. Patient Identity & Demographics
            </h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
              <div class="neu-form-group">
                <label class="neu-label" for="plan_patient_name">Patient Full Name</label>
                <input type="text" id="plan_patient_name" class="neu-input" placeholder="e.g. Eleanor Vance" required />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_intake_id">Intake MRN / Reference ID</label>
                <input type="text" id="plan_intake_id" class="neu-input" placeholder="e.g. INT-423901" />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_patient_phone">Contact Phone</label>
                <input type="tel" id="plan_patient_phone" class="neu-input" placeholder="e.g. +1 (555) 234-8901" required />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_patient_email">Contact Email</label>
                <input type="email" id="plan_patient_email" class="neu-input" placeholder="e.g. patient@example.org" required />
              </div>
            </div>
          </div>

          <!-- Section 2: Clinical Presentation & Chief Complaint -->
          <div>
            <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
              <span>🩺</span> 2. Chief Complaint & Clinical Reason
            </h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:0.85rem;">
              <div class="neu-form-group">
                <label class="neu-label" for="plan_reason">Reason for Visit / Procedure</label>
                <input type="text" id="plan_reason" class="neu-input" placeholder="e.g. Cardiac consultation & continuous EKG monitoring" required />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_symptoms">Presenting Symptoms & Clinical History</label>
                <input type="text" id="plan_symptoms" class="neu-input" placeholder="e.g. Radiating chest pressure with diaphoresis" />
              </div>
            </div>
          </div>

          <!-- Section 3: Scheduling & Resource Allocation -->
          <div>
            <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
              <span>⏱️</span> 3. Scheduling & Resource Allocation
            </h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.85rem;">
              <div class="neu-form-group">
                <label class="neu-label" for="plan_date">Target Appointment Date</label>
                <input type="date" id="plan_date" class="neu-input" value="${new Date().toISOString().split('T')[0]}" required />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_time">Preferred Time Window</label>
                <input type="text" id="plan_time" class="neu-input" placeholder="e.g. Immediate STAT / 09:30 AM" value="${isEmerg ? 'Immediate STAT' : '09:30 AM'}" required />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_duration">Allocated Visit Duration</label>
                <input type="text" id="plan_duration" class="neu-input" value="${defaultDuration}" required />
              </div>
              <div class="neu-form-group">
                <label class="neu-label" for="plan_specialty">Assigned Specialty / Provider</label>
                <input type="text" id="plan_specialty" class="neu-input" value="${defaultSpecialty}" required />
              </div>
            </div>
          </div>

          <!-- Section 4: Care Directives & Pre-Arrival Instructions -->
          <div>
            <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
              <span>📝</span> 4. Clinical Directives & Patient Instructions
            </h3>
            <div class="neu-form-group">
              <label class="neu-label" for="plan_instructions">Pre-Arrival Instructions & Operational Directives</label>
              <textarea id="plan_instructions" class="neu-textarea" style="min-height:75px;" placeholder="e.g. Bring government photo ID, current medication bottles. Patient should fast 8 hours prior to laboratory blood draw."></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
            <button type="submit" id="submitPlanBtn" class="neu-btn neu-btn-primary" style="padding:0.75rem 1.75rem; font-size:0.9rem; font-weight:900;" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? '⏳ TRANSMITTING PLANNING DIRECTIVE TO N8N...' : actionLabel}
            </button>
          </div>
        </form>

        <!-- Planning Execution & Workflow Mount -->
        <div id="planResultMount" style="display:${lastPlanningResult ? 'flex' : 'none'}; flex-direction:column; gap:1.35rem;"></div>

      </div>
    `;

    containerEl.innerHTML = html;

    // Attach Tab Handlers
    containerEl.querySelectorAll('.workflow-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        clinicalAudio.playClick();
        activeWorkflowType = tab.getAttribute('data-type');
        render();
      });
    });

    // Attach Pre-population Handler
    const loadBtn = containerEl.querySelector('#loadActiveIntakeBtn');
    if (loadBtn && activeIntake) {
      loadBtn.addEventListener('click', () => {
        clinicalAudio.playClick();
        const p = activeIntake.patient;
        const t = activeIntake.triage;

        const nameInput = containerEl.querySelector('#plan_patient_name');
        const idInput = containerEl.querySelector('#plan_intake_id');
        const phoneInput = containerEl.querySelector('#plan_patient_phone');
        const emailInput = containerEl.querySelector('#plan_patient_email');
        const reasonInput = containerEl.querySelector('#plan_reason');
        const symptomsInput = containerEl.querySelector('#plan_symptoms');
        const specialtyInput = containerEl.querySelector('#plan_specialty');
        const instructionsInput = containerEl.querySelector('#plan_instructions');

        if (nameInput) nameInput.value = p.patient_name || '';
        if (idInput) idInput.value = t.intake_id || '';
        if (phoneInput) phoneInput.value = p.patient_phone || '';
        if (emailInput) emailInput.value = p.patient_email || '';
        if (reasonInput) reasonInput.value = p.reason_for_visit || '';
        if (symptomsInput) symptomsInput.value = p.symptoms || '';
        if (specialtyInput) specialtyInput.value = t.recommended_specialty || defaultSpecialty;
        if (instructionsInput) instructionsInput.value = (t.patient_instructions || []).join('; ') || '';

        // Switch to the matching workflow type
        if (t.urgency_level) {
          activeWorkflowType = t.urgency_level.toLowerCase().includes('emerg') ? 'emergency' : (t.urgency_level.toLowerCase().includes('urg') ? 'urgent' : 'routine');
        }
      });
    }

    // Attach Form Submission Handler
    const form = containerEl.querySelector('#planningForm');
    const resultMount = containerEl.querySelector('#planResultMount');

    if (lastPlanningResult && resultMount) {
      renderAutomationWorkflow(resultMount, lastPlanningResult);
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        isSubmitting = true;
        clinicalAudio.playClick();
        render();

        const formData = {
          patient_name: containerEl.querySelector('#plan_patient_name')?.value || '',
          intake_id: containerEl.querySelector('#plan_intake_id')?.value || '',
          patient_phone: containerEl.querySelector('#plan_patient_phone')?.value || '',
          patient_email: containerEl.querySelector('#plan_patient_email')?.value || '',
          reason_for_visit: containerEl.querySelector('#plan_reason')?.value || '',
          symptoms: containerEl.querySelector('#plan_symptoms')?.value || '',
          preferred_date: containerEl.querySelector('#plan_date')?.value || '',
          preferred_time: containerEl.querySelector('#plan_time')?.value || '',
          symptom_duration: containerEl.querySelector('#plan_duration')?.value || '30 min',
          medical_history: containerEl.querySelector('#plan_specialty')?.value || defaultSpecialty,
          current_medications: containerEl.querySelector('#plan_instructions')?.value || '',
          workflowType: activeWorkflowType
        };

        try {
          const result = await submitToN8n(formData, { workflowType: activeWorkflowType });

          if (result.success && result.normalized) {
            // Force normalized record's urgency_level to match operational workflowType
            result.normalized.triage.urgency_level = activeWorkflowType;
            lastPlanningResult = result.normalized;

            if (activeWorkflowType === 'emergency') {
              clinicalAudio.playEmergencySiren();
            } else if (activeWorkflowType === 'urgent') {
              clinicalAudio.playUrgentBeep();
            } else {
              clinicalAudio.playChime();
            }
          } else {
            alert(`⚠️ Planning Submission Notice: ${result.error || 'Failed to connect to n8n webhook.'}`);
          }
        } catch (err) {
          alert(`⚠️ Error dispatching planning directive: ${err.message}`);
        } finally {
          isSubmitting = false;
          render();
          const newResultMount = containerEl.querySelector('#planResultMount');
          if (newResultMount && lastPlanningResult) {
            newResultMount.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }
  }

  render();
}
