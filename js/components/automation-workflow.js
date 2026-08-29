/* ==========================================================================
   DYNAMIC AUTOMATION WORKFLOW COMPONENT (AUTOMATION-WORKFLOW.JS)
   Frontend Visualization of Backend n8n Emergency / Urgent / Routine Routes
   ========================================================================== */

/**
 * Normalizes triage classification returned by n8n / AI agent
 * Returns 'emergency' | 'urgent' | 'routine' | 'unknown'
 */
export function normalizeTriageCategory(rawCategory) {
  if (!rawCategory || typeof rawCategory !== 'string') return 'unknown';
  const clean = rawCategory.toLowerCase().trim();

  if (clean.includes('emerg') || clean.includes('stat') || clean.includes('critical') || clean.includes('esi 1') || clean.includes('esi 2')) {
    return 'emergency';
  }
  if (clean.includes('non_urg') || clean.includes('non-urg') || clean.includes('rout') || clean.includes('standard') || clean.includes('esi 4') || clean.includes('esi 5') || clean.includes('low')) {
    return 'routine';
  }
  if (clean.includes('urg') || clean.includes('amber') || clean.includes('esi 3') || clean.includes('priority')) {
    return 'urgent';
  }
  return 'unknown';
}

/**
 * Real n8n Workflow Definitions mapped directly to backend automation nodes
 */
export const WORKFLOW_DEFINITIONS = {
  emergency: {
    category: 'emergency',
    badge: '🚨 EMERGENCY RESPONSE PROTOCOL',
    badgeClass: 'emergency',
    accentColor: 'var(--emergency-red)',
    borderAccent: 'var(--emergency-red)',
    priorityTag: 'Patient Safety Above All',
    targetResponse: 'Target: ≤ 15 min Specialist Response',
    description: 'When AI detects life-threatening or acute hemodynamic risk, n8n executes the automated emergency response protocol.',
    steps: [
      {
        icon: '🚨',
        title: 'Alert Emergency Team',
        channel: 'Slack #emergency-trauma',
        desc: 'Dispatches STAT patient telemetry, vital signs, and resuscitation bay directive to trauma team.',
        status: '✓ Dispatched by n8n Router'
      },
      {
        icon: '📩',
        title: 'Send Emergency Instructions',
        channel: 'Patient / Care Team',
        desc: 'Transmits immediate pre-arrival emergency guidance and safety precautions.',
        status: '✓ Dispatched by n8n Router'
      },
      {
        icon: '👨‍⚕️',
        title: 'Alert On-Call Doctor',
        channel: 'On-Call Attending MD',
        desc: 'Directly pages designated on-call cardiology / trauma specialist with clinical intake summary.',
        status: '✓ Dispatched by n8n Router'
      }
    ]
  },
  urgent: {
    category: 'urgent',
    badge: '⚡ URGENT SCHEDULING PATH',
    badgeClass: 'urgent',
    accentColor: 'var(--urgent-amber)',
    borderAccent: 'var(--urgent-amber)',
    priorityTag: 'High-Priority Scheduling',
    targetResponse: 'Target: 24–48 Hour Evaluation Window',
    description: 'For cases requiring expedited physician assessment, n8n initiates the urgent ambulatory fast-track path.',
    steps: [
      {
        icon: '⚡',
        title: 'Notify Front Desk',
        channel: 'Front Desk & Nursing Team',
        desc: 'Alerts front desk and nursing supervisor to fast-track check-in and priority room allocation.',
        status: '✓ Dispatched by n8n Router'
      },
      {
        icon: '📋',
        title: 'Send Patient Confirmation',
        channel: 'Patient Urgent Care Notice',
        desc: 'Sends patient urgent care appointment confirmation with required documentation checklist.',
        status: '✓ Dispatched by n8n Router'
      }
    ]
  },
  routine: {
    category: 'routine',
    badge: '📅 ROUTINE SCHEDULING PATH',
    badgeClass: 'routine',
    accentColor: 'var(--routine-green)',
    borderAccent: 'var(--routine-green)',
    priorityTag: 'Standard Outpatient Scheduling',
    targetResponse: 'Target: Standard Outpatient Slot (1–2 Weeks)',
    description: 'For preventive and standard clinical visits, n8n orchestrates standard queue booking and patient confirmation.',
    steps: [
      {
        icon: '📅',
        title: 'Notify Scheduler',
        channel: 'Outpatient Scheduling Desk',
        desc: 'Places appointment request into standard queue for routine slot allocation.',
        status: '✓ Dispatched by n8n Router'
      },
      {
        icon: '✉️',
        title: 'Send Patient Confirmation',
        channel: 'Patient Confirmation Email',
        desc: 'Transmits standard appointment confirmation with intake instructions and preparation notes.',
        status: '✓ Dispatched by n8n Router'
      }
    ]
  }
};

/**
 * Render the dynamic Automation Workflow Card
 */
export function renderAutomationWorkflow(containerEl, record) {
  if (!containerEl) return;

  if (!record || !record.triage) {
    containerEl.innerHTML = '';
    return;
  }

  const rawCategory = record.triage.urgency_level || record.triage.urgency || '';
  const category = normalizeTriageCategory(rawCategory);
  const def = WORKFLOW_DEFINITIONS[category];

  if (!def) {
    containerEl.innerHTML = `
      <div class="neu-card" style="padding: 1.25rem; border-left: 4px solid var(--text-muted);">
        <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">
          ⚙️ Automation Routing: Unclassified triage route (${rawCategory || 'Unknown'}).
        </div>
      </div>
    `;
    return;
  }

  const isEmergActive = category === 'emergency';
  const isUrgActive = category === 'urgent';
  const isRoutActive = category === 'routine';

  const html = `
    <section class="neu-card automation-workflow-card ${def.category}" aria-label="Clinical Automation Workflow Execution" style="border-left: 6px solid ${def.borderAccent}; padding: 1.5rem; display:flex; flex-direction:column; gap:1.15rem; background: var(--neu-surface);">
      
      <!-- Top Routing Header & Active Overview Badges -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(184, 196, 208, 0.4);">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span class="neu-acuity-badge ${def.badgeClass}" style="font-size:0.78rem; padding:0.3rem 0.85rem;">
              <span class="led-dot ${def.badgeClass}"></span>
              ${def.badge}
            </span>
            <span style="font-size:0.75rem; font-weight:800; color:var(--teal-primary); background:rgba(0, 121, 140, 0.08); padding:0.25rem 0.6rem; border-radius:6px; border:1px solid rgba(0, 121, 140, 0.2);">
              ⚡ N8N AUTOMATION PIPELINE
            </span>
          </div>
          <div style="font-size:0.82rem; color:var(--text-sub); margin-top:0.35rem; line-height:1.4;">
            <strong>${def.priorityTag}</strong> • <span style="color:var(--text-muted);">${def.targetResponse}</span>
          </div>
        </div>

        <!-- Compact 3-Route Status Indicator -->
        <div class="workflow-routes-bar" style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
          <span class="neu-badge ${isEmergActive ? 'emergency' : ''}" style="font-size:0.68rem; padding:0.25rem 0.55rem; opacity:${isEmergActive ? '1' : '0.45'}; font-weight:${isEmergActive ? '900' : '600'};">
            ${isEmergActive ? '● ' : ''}🔴 Emergency Protocol
          </span>
          <span class="neu-badge ${isUrgActive ? 'urgent' : ''}" style="font-size:0.68rem; padding:0.25rem 0.55rem; opacity:${isUrgActive ? '1' : '0.45'}; font-weight:${isUrgActive ? '900' : '600'};">
            ${isUrgActive ? '● ' : ''}⚡ Urgent Path
          </span>
          <span class="neu-badge ${isRoutActive ? 'routine' : ''}" style="font-size:0.68rem; padding:0.25rem 0.55rem; opacity:${isRoutActive ? '1' : '0.45'}; font-weight:${isRoutActive ? '900' : '600'};">
            ${isRoutActive ? '● ' : ''}📅 Routine Path
          </span>
        </div>
      </div>

      <!-- Protocol Rationale Note -->
      <div style="font-size:0.8rem; color:var(--text-main); line-height:1.5; background:var(--neu-surface); padding:0.75rem 1rem; border-radius:10px; box-shadow:var(--neu-inset-sm);">
        <span style="font-weight:800; color:var(--teal-primary); text-transform:uppercase; font-size:0.72rem; letter-spacing:0.04em;">Selected Care Automation:</span> ${def.description}
      </div>

      <!-- Connected Step Nodes Pipeline -->
      <div class="automation-pipeline-container">
        ${def.steps.map((step, idx) => `
          <div class="automation-node-card">
            <div style="display:flex; align-items:flex-start; gap:0.75rem;">
              <div class="automation-node-icon" style="font-size:1.35rem; width:38px; height:38px; border-radius:10px; background:var(--neu-surface); display:flex; align-items:center; justify-content:center; box-shadow:var(--neu-flat-sm); flex-shrink:0;">
                ${step.icon}
              </div>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.3rem;">
                  <h4 style="font-size:0.88rem; font-weight:900; color:var(--text-main); margin:0;">
                    ${step.title}
                  </h4>
                  <span style="font-size:0.68rem; font-weight:800; font-family:var(--font-mono); color:var(--sky-blue); background:rgba(2, 132, 199, 0.08); padding:0.15rem 0.45rem; border-radius:4px;">
                    ${step.channel}
                  </span>
                </div>
                <p style="font-size:0.76rem; color:var(--text-sub); margin-top:0.3rem; line-height:1.4;">
                  ${step.desc}
                </p>
                <div style="margin-top:0.45rem; display:flex; align-items:center; gap:0.35rem;">
                  <span style="font-size:0.68rem; font-weight:800; color:${def.accentColor}; display:inline-flex; align-items:center; gap:0.25rem;">
                    <span style="width:6px; height:6px; border-radius:50%; background:${def.accentColor}; display:inline-block;"></span>
                    ${step.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          ${idx < def.steps.length - 1 ? `
            <div class="automation-pipeline-connector" aria-hidden="true">
              <span class="connector-arrow-desktop">➔</span>
              <span class="connector-arrow-mobile">⬇</span>
            </div>
          ` : ''}
        `).join('')}
      </div>

    </section>
  `;

  containerEl.innerHTML = html;
}
