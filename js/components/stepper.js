/* ==========================================================================
   WORKFLOW STEPPER COMPONENT (STEPPER.JS)
   Single Clean Horizontal Progression Bar Matching Image 2
   ========================================================================== */

export function renderWorkflowStepper(containerEl, activeStep = 1) {
  const steps = [
    { num: 1, label: 'Patient Intake' },
    { num: 2, label: 'AI Medical Triage' },
    { num: 3, label: 'Urgency Assessment' },
    { num: 4, label: 'Provider Preparation' },
    { num: 5, label: 'Clinical Action' }
  ];

  const html = `
    <div class="workflow-stepper-card">
      ${steps.map((step, idx) => {
        const isCurrent = step.num === activeStep;
        const isDone = step.num < activeStep;
        const isHighlight = isCurrent || isDone || activeStep > 1;

        // Custom colors for nodes matching Image 2
        let numBg = '#0284C7';
        if (step.num === 5 && (isCurrent || isDone)) {
          numBg = '#00798C';
        }

        return `
          <div class="workflow-step-item">
            <div class="workflow-step-num" style="background:${numBg} !important;">
              ${step.num}
            </div>
            <span class="workflow-step-title" style="color:${isCurrent ? 'var(--sky-blue)' : (step.num === 5 && (isCurrent || isDone) ? 'var(--teal-primary)' : 'var(--text-main)')};">
              ${step.label}
            </span>
          </div>
          ${idx < steps.length - 1 ? `
            <span class="workflow-step-arrow">➔</span>
          ` : ''}
        `;
      }).join('')}
    </div>
  `;

  containerEl.innerHTML = html;
}
