/* ==========================================================================
   HOME VIEW (HOME.JS) — MEDICLIN WORKSTATION
   1. Stepper on Top
   2. Row 1: Patient Medical Intake Form (14 Clinical Fields)
   3. Row 2 (Revealed on Process): Patient Status Overview (Left) + Patient Alerts & Clinical Criteria with Donut Gauge (Right)
   4. Row 3 (Revealed on Process): Clinical Provider Brief (SBAR Matrix for Downloading)
   ========================================================================== */

import { renderIntakeForm } from '../components/intake-form.js';
import { renderProviderBrief } from '../components/provider-brief.js';
import { renderWorkflowStepper } from '../components/stepper.js';
import { renderPatientAlerts, renderPatientStatusOverview } from '../components/triage-results.js';
import { renderAutomationWorkflow } from '../components/automation-workflow.js';
import { state } from '../state.js';

export function renderHomeView(containerEl) {
  if (!containerEl) return;

  const isEvaluated = Boolean(state.activeIntake && state.activeIntake.triage);

  const html = `
    <div style="display:flex; flex-direction:column; gap:1.35rem;">
      
      <!-- Top 5-Node Workflow Stepper Matching Image -->
      <div id="workflowStepperMount"></div>

      <!-- Row 1: Patient Medical Intake Form (14 Clinical Fields) Displayed First -->
      <div id="intakeFormMount"></div>

      <!-- Assessment Container (Revealed After Process) -->
      <div id="assessmentSectionMount" style="display:${isEvaluated ? 'flex' : 'none'}; flex-direction:column; gap:1.35rem;">
        
        <!-- Row 2: Patient Status Overview (Left) + Patient Alerts & Criteria with Donut Gauge (Right) -->
        <div class="home-row2-split" id="row2Split">
          <div id="patientStatusMount"></div>
          <div id="patientAlertsMount"></div>
        </div>

        <!-- Row 2.5: Dynamic Automation Workflow Pipeline (Emergency / Urgent / Routine) -->
        <div id="automationWorkflowMount"></div>

        <!-- Row 3 (Last Row): Clinical Provider Brief (SBAR Matrix) for Downloading / Copying -->
        <div id="providerBriefMount"></div>

      </div>

    </div>
  `;

  containerEl.innerHTML = html;

  const stepperMount = containerEl.querySelector('#workflowStepperMount');
  const formMount = containerEl.querySelector('#intakeFormMount');
  const assessSection = containerEl.querySelector('#assessmentSectionMount');
  const statusMount = containerEl.querySelector('#patientStatusMount');
  const alertsMount = containerEl.querySelector('#patientAlertsMount');
  const workflowMount = containerEl.querySelector('#automationWorkflowMount');
  const briefMount = containerEl.querySelector('#providerBriefMount');

  // 1. Render Stepper
  try {
    if (stepperMount) renderWorkflowStepper(stepperMount, isEvaluated ? 2 : 1);
  } catch (e) {
    console.error('[MediClin] Stepper render error:', e);
  }

  // 2. Render Intake Form in Row 1 (Always rendered first for safety)
  try {
    if (formMount) {
      renderIntakeForm(formMount, (newRecord) => {
        if (assessSection) assessSection.style.display = 'flex';
        try { if (stepperMount) renderWorkflowStepper(stepperMount, 2); } catch (e) {}
        try { if (statusMount) renderPatientStatusOverview(statusMount, newRecord); } catch (e) {}
        try { if (alertsMount) renderPatientAlerts(alertsMount, newRecord); } catch (e) {}
        try { if (workflowMount) renderAutomationWorkflow(workflowMount, newRecord); } catch (e) {}
        try { if (briefMount) renderProviderBrief(briefMount, newRecord); } catch (e) {}

        if (assessSection) {
          assessSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  } catch (e) {
    console.error('[MediClin] Intake form render error:', e);
  }

  // 3. If already evaluated, populate rows 2, 2.5, and 3
  if (isEvaluated && state.activeIntake) {
    try { if (statusMount) renderPatientStatusOverview(statusMount, state.activeIntake); } catch (e) { console.error(e); }
    try { if (alertsMount) renderPatientAlerts(alertsMount, state.activeIntake); } catch (e) { console.error(e); }
    try { if (workflowMount) renderAutomationWorkflow(workflowMount, state.activeIntake); } catch (e) { console.error(e); }
    try { if (briefMount) renderProviderBrief(briefMount, state.activeIntake); } catch (e) { console.error(e); }
  }
}
