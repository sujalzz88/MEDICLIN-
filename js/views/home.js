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
import { state } from '../state.js';

export function renderHomeView(containerEl) {
  const isEvaluated = !!state.activeIntake;

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
  const briefMount = containerEl.querySelector('#providerBriefMount');

  // Render Stepper (Step 1 active initially, Step 2-5 active upon triage)
  renderWorkflowStepper(stepperMount, isEvaluated ? 2 : 1);

  // If already evaluated, populate rows 2 and 3
  if (isEvaluated) {
    renderPatientStatusOverview(statusMount, state.activeIntake);
    renderPatientAlerts(alertsMount, state.activeIntake);
    renderProviderBrief(briefMount, state.activeIntake);
  }

  // Mount Intake Form in Row 1
  renderIntakeForm(formMount, (newRecord) => {
    // Reveal Row 2 & 3
    assessSection.style.display = 'flex';
    renderWorkflowStepper(stepperMount, 2);
    renderPatientStatusOverview(statusMount, newRecord);
    renderPatientAlerts(alertsMount, newRecord);
    renderProviderBrief(briefMount, newRecord);

    // Smooth scroll down to assessment results in Row 2
    assessSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
