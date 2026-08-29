/* ==========================================================================
   PATIENT INTAKE FORM COMPONENT (INTAKE-FORM.JS)
   14 Structured Clinical Fields
   Direct n8n Production Integration with Double-Submission Lock,
   Asynchronous UI Feedback, Graceful Error Handling & Explicit Demo Mode
   ========================================================================== */

import { getActiveWebhookUrl, submitToN8n } from '../api/n8n-client.js';
import { INITIAL_PRESETS, state } from '../state.js';
import { evaluateTriage } from '../triage-engine.js';
import { clinicalAudio } from './audio.js';

export function renderIntakeForm(containerEl, onSubmitCallback) {
  const currentEndpoint = getActiveWebhookUrl();
  const isTestEndpoint = currentEndpoint.includes('/webhook-test/');

  const html = `
    <div class="neu-card" style="padding: 1.75rem;">
      
      <!-- Form Header Matching Image 1 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h2 style="font-size: 1.15rem; font-weight: 900; color: var(--teal-primary); display:flex; align-items:center; gap:0.5rem;">
            <span>📝</span> PATIENT MEDICAL INTAKE FORM (14 CLINICAL FIELDS)
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-sub); margin-top:0.15rem;">
            Enter physiological telemetry, chief complaints, and patient medical demographics.
          </p>
        </div>
        
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <div class="neu-acuity-badge routine" style="font-size:0.75rem; padding:0.35rem 0.85rem;" title="Target Endpoint: ${currentEndpoint}">
            <span class="led-dot routine"></span> ${isTestEndpoint ? 'N8N TEST MODE' : 'N8N PRODUCTION READY'}
          </div>
          
        </div>
      </div>

      <form id="patientIntakeForm">
        
        <!-- SECTION 1: Patient Identity & Contact -->
        <div class="form-grid-demographics">
          <div class="neu-form-group">
            <label class="neu-label" for="patient_name">Full Legal Name *</label>
            <input type="text" id="patient_name" name="patient_name" class="neu-input" placeholder="e.g. Eleanor Vance" required />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="patient_email">Email Address *</label>
            <input type="email" id="patient_email" name="patient_email" class="neu-input" placeholder="e.g. e.vance@example.org" required />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="patient_phone">Phone Number *</label>
            <input type="tel" id="patient_phone" name="patient_phone" class="neu-input" placeholder="+1 (555) 234-8901" required />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="date_of_birth">Date of Birth *</label>
            <input type="date" id="date_of_birth" name="date_of_birth" class="neu-input" required />
          </div>
        </div>

        <!-- SECTION 2: Physiological Vitals -->
        <div class="form-grid-4col" style="margin-top: 0.65rem;">
          <div class="neu-form-group">
            <label class="neu-label" for="heart_rate">Heart Rate (bpm)</label>
            <input type="number" id="heart_rate" name="heart_rate" class="neu-input" placeholder="118" />
          </div>
          <div class="neu-form-group">
            <label class="neu-label" for="blood_pressure">BP (mmHg)</label>
            <input type="text" id="blood_pressure" name="blood_pressure" class="neu-input" placeholder="165/98" />
          </div>
          <div class="neu-form-group">
            <label class="neu-label" for="oxygen_sat">SpO₂ (%)</label>
            <input type="number" id="oxygen_sat" name="oxygen_sat" class="neu-input" placeholder="89" />
          </div>
          <div class="neu-form-group">
            <label class="neu-label" for="temperature">Temp (°F)</label>
            <input type="number" step="0.1" id="temperature" name="temperature" class="neu-input" placeholder="98.8" />
          </div>
        </div>

        <!-- SECTION 3: Symptoms & Complaints -->
        <div class="form-grid-demographics" style="margin-top: 0.65rem;">
          <div class="neu-form-group">
            <label class="neu-label" for="reason_for_visit">Reason for Visit *</label>
            <input type="text" id="reason_for_visit" name="reason_for_visit" class="neu-input" placeholder="Primary chief complaint..." required />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="symptom_duration">Symptom Duration *</label>
            <input type="text" id="symptom_duration" name="symptom_duration" class="neu-input" placeholder="e.g. 45 minutes / 2 days" required />
          </div>
        </div>

        <div class="neu-form-group" style="margin-top:0.65rem;">
          <label class="neu-label" for="symptoms">Detailed Symptoms & Radiation *</label>
          <textarea id="symptoms" name="symptoms" class="neu-textarea" placeholder="Describe symptoms, radiation, triggers..." required></textarea>
        </div>

        <!-- Pain Level Tactile Dial / Slider -->
        <div class="neu-form-group" style="margin-top:0.65rem;">
          <div class="neu-slider-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;">
              <label class="neu-label" for="pain_level">Subjective Pain Scale Index (0 – 10)</label>
              <span style="font-family:var(--font-mono); font-weight:800; font-size:0.95rem; color:var(--teal-primary);" id="painLevelDisplay">8 / 10</span>
            </div>
            <input type="range" id="pain_level" name="pain_level" min="0" max="10" value="8" class="neu-slider" />
          </div>
        </div>

        <!-- SECTION 4: History & Insurance -->
        <div class="form-grid-demographics" style="margin-top:0.65rem;">
          <div class="neu-form-group">
            <label class="neu-label" for="current_medications">Current Medications</label>
            <input type="text" id="current_medications" name="current_medications" class="neu-input" placeholder="e.g. Lisinopril 10mg, Metformin 500mg" />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="allergies">Known Allergies</label>
            <input type="text" id="allergies" name="allergies" class="neu-input" placeholder="e.g. Penicillin (Severe Anaphylaxis)" />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="insurance_provider">Insurance Provider</label>
            <input type="text" id="insurance_provider" name="insurance_provider" class="neu-input" placeholder="e.g. Blue Cross Blue Shield Gold" />
          </div>
        </div>

        <div class="form-grid-demographics" style="margin-top:0.65rem;">
          <div class="neu-form-group">
            <label class="neu-label" for="medical_history">Relevant Medical History</label>
            <input type="text" id="medical_history" name="medical_history" class="neu-input" placeholder="e.g. Type 2 Diabetes, Hypertension, Hyperlipidemia" />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="preferred_date">Preferred Appointment Date</label>
            <input type="date" id="preferred_date" name="preferred_date" class="neu-input" />
          </div>

          <div class="neu-form-group">
            <label class="neu-label" for="preferred_time">Preferred Time Window</label>
            <input type="text" id="preferred_time" name="preferred_time" class="neu-input" placeholder="e.g. Immediate STAT Interventions" />
          </div>
        </div>

        <!-- Submit Button & Progress Area -->
        <div style="margin-top: 1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
          <div style="display:flex; justify-content:flex-end; align-items:center; gap:1rem; width:100%;">
            <button type="submit" id="submitIntakeBtn" class="neu-btn neu-btn-primary" style="padding: 0.85rem 2.2rem; font-size: 0.95rem; font-weight:800; letter-spacing:0.03em; display:flex; align-items:center; justify-content:center; gap:0.5rem; width:clamp(240px, 100%, 100%); min-height:50px;">
              <span id="submitBtnIcon">⚙️</span>
              <span id="submitBtnText">PROCESS AI TRIAGE ASSESSMENT</span>
            </button>
          </div>

          <!-- Asynchronous n8n Status & Error Banner Container -->
          <div id="formStatusContainer" style="display:none;"></div>
        </div>
      </form>
    </div>
  `;

  containerEl.innerHTML = html;

  const form = containerEl.querySelector('#patientIntakeForm');
  const painSlider = containerEl.querySelector('#pain_level');
  const painDisplay = containerEl.querySelector('#painLevelDisplay');
  const submitBtn = containerEl.querySelector('#submitIntakeBtn');
  const submitBtnIcon = containerEl.querySelector('#submitBtnIcon');
  const submitBtnText = containerEl.querySelector('#submitBtnText');
  const statusContainer = containerEl.querySelector('#formStatusContainer');
  const quickConfigBtn = containerEl.querySelector('#openN8nConfigQuickBtn');

  let isSubmitting = false;

  if (quickConfigBtn) {
    quickConfigBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: state.activeIntake }));
    });
  }

  painSlider.addEventListener('input', (e) => {
    painDisplay.textContent = `${e.target.value} / 10`;
  });

  // Populate helper function
  const fillForm = (data) => {
    Object.keys(data).forEach(key => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.value = data[key];
    });
    if (painDisplay) painDisplay.textContent = `${data.pain_level || 8} / 10`;
  };

  // Preload initial case (Eleanor Vance)
  if (state.activeIntake && state.activeIntake.patient) {
    fillForm(state.activeIntake.patient);
  } else {
    fillForm(INITIAL_PRESETS.EMERGENCY_CARDIAC);
  }

  const hideStatus = () => {
    statusContainer.style.display = 'none';
    statusContainer.innerHTML = '';
  };

  const showLoading = (msg) => {
    statusContainer.style.display = 'block';
    statusContainer.innerHTML = `
      <div class="neu-card-recessed" style="padding:0.85rem 1.25rem; display:flex; align-items:center; gap:0.75rem; color:var(--teal-primary); font-size:0.85rem; font-weight:700;">
        <span style="font-size:1.2rem; animation:spin 1.5s linear infinite; display:inline-block;">⏳</span>
        <div>
          <div>${msg}</div>
          <div style="font-size:0.72rem; color:var(--text-muted); font-weight:500; margin-top:0.15rem;">
            Target: <code style="font-family:var(--font-mono);">${getActiveWebhookUrl()}</code>
          </div>
        </div>
      </div>
    `;
  };

  const showErrorState = (result, intakeData) => {
    statusContainer.style.display = 'block';
    const isInactive = result.isWorkflowInactive;
    const isTestInactive = result.isTestListenerInactive;

    let errorTitle = 'n8n Automation Gateway Unavailable';
    let errorBadgeText = result.status ? `HTTP ${result.status}` : (result.isTimeout ? 'TIMEOUT' : 'NETWORK ERROR');

    if (result.errorType === 'PRODUCTION_WORKFLOW_INACTIVE') {
      errorTitle = 'n8n Production Workflow Inactive';
      errorBadgeText = 'HTTP 404 • INACTIVE';
    } else if (result.errorType === 'TEST_LISTENER_NOT_ACTIVE') {
      errorTitle = 'n8n Test Listener Not Active';
      errorBadgeText = 'HTTP 404 • NOT LISTENING';
    } else if (result.errorType === 'TIMEOUT') {
      errorTitle = 'AI Triage Request Timed Out (60s)';
      errorBadgeText = 'TIMEOUT';
    } else if (result.errorType === 'CORS_ERROR') {
      errorTitle = 'CORS Connection Blocked';
      errorBadgeText = 'CORS ERROR';
    } else if (result.errorType === 'HTTP_400') {
      errorTitle = 'Intake Form Validation Error';
      errorBadgeText = 'HTTP 400 BAD REQUEST';
    } else if (result.errorType === 'HTTP_500') {
      errorTitle = 'n8n Workflow Execution Failure';
      errorBadgeText = 'HTTP 500 ERROR';
    }

    statusContainer.innerHTML = `
      <div class="neu-card" style="border-left:5px solid var(--emergency-red); padding:1.25rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.85rem; background:rgba(254, 242, 242, 0.6);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.15rem;">⚠️</span>
            <div>
              <div style="font-size:0.9rem; font-weight:800; color:var(--emergency-red);">
                ${errorTitle}
              </div>
              <div style="font-size:0.75rem; color:var(--text-sub); margin-top:0.15rem;">
                ${result.error || 'Unable to establish bi-directional connection to n8n webhook.'}
              </div>
            </div>
          </div>
          <span class="neu-badge emergency" style="font-size:0.68rem; padding:0.2rem 0.5rem;">
            ${errorBadgeText}
          </span>
        </div>

        <div style="font-size:0.78rem; color:var(--text-main); background:rgba(255,255,255,0.7); padding:0.6rem 0.85rem; border-radius:6px; font-family:var(--font-mono); word-break:break-all;">
          Target Endpoint: ${result.targetUrl || getActiveWebhookUrl()}
        </div>

        <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center; justify-content:flex-end; margin-top:0.25rem;">
          <button type="button" id="openModalFromErrorBtn" class="neu-btn" style="font-size:0.78rem; padding:0.4rem 0.85rem;">
            ⚙️ Check Gateway Config
          </button>
          <button type="button" id="retryN8nBtn" class="neu-btn neu-btn-primary" style="font-size:0.78rem; padding:0.4rem 1rem;">
            🔄 Retry Submission
          </button>
          <button type="button" id="useLocalDemoBtn" class="neu-btn" style="font-size:0.78rem; padding:0.4rem 1rem; color:var(--teal-primary); border:1px dashed var(--teal-primary);">
            🧪 Use Local Demo Analysis
          </button>
        </div>
      </div>
    `;

    const retryBtn = statusContainer.querySelector('#retryN8nBtn');
    const demoBtn = statusContainer.querySelector('#useLocalDemoBtn');
    const configBtn = statusContainer.querySelector('#openModalFromErrorBtn');

    if (configBtn) {
      configBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: { patient: intakeData } }));
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        hideStatus();
        processSubmission(intakeData);
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        hideStatus();
        processLocalDemoFallback(intakeData);
      });
    }
  };

  const processLocalDemoFallback = (intakeData) => {
    console.log('[MediClin] Executing deterministic local ESI fallback (DEMO MODE)...');
    const localTriage = evaluateTriage(intakeData);
    const completeRecord = {
      patient: intakeData,
      triage: localTriage,
      source: 'local_demo',
      timestamp: new Date().toISOString()
    };

    state.addIntake(completeRecord);

    // Audio Feedback
    if (localTriage.urgency_level === 'emergency') {
      clinicalAudio.playEmergencySiren();
    } else if (localTriage.urgency_level === 'urgent') {
      clinicalAudio.playUrgentBeep();
    } else {
      clinicalAudio.playChime();
    }

    if (onSubmitCallback) onSubmitCallback(completeRecord);
  };

  const processSubmission = async (intakeData) => {
    if (isSubmitting) return;
    isSubmitting = true;

    // UI Loading state
    submitBtn.disabled = true;
    submitBtnIcon.textContent = '⏳';
    submitBtnText.textContent = 'TRANSMITTING TO N8N AI TRIAGE...';
    showLoading('Transmitting clinical payload to n8n webhook and running AI medical triage pipeline...');

    try {
      const result = await submitToN8n(intakeData);

      if (result.success && result.normalized && result.normalized.triage) {
        hideStatus();
        const triageResult = result.normalized.triage;
        const completeRecord = {
          patient: intakeData,
          triage: triageResult,
          source: 'n8n',
          rawN8nData: result.data,
          timestamp: new Date().toISOString()
        };

        state.addIntake(completeRecord);

        // Audio Feedback
        if (triageResult.urgency_level === 'emergency') {
          clinicalAudio.playEmergencySiren();
        } else if (triageResult.urgency_level === 'urgent') {
          clinicalAudio.playUrgentBeep();
        } else {
          clinicalAudio.playChime();
        }

        if (onSubmitCallback) onSubmitCallback(completeRecord);

      } else {
        // n8n returned error / HTTP 404 / inactive / timeout
        showErrorState(result, intakeData);
      }
    } catch (err) {
      showErrorState({
        success: false,
        status: 0,
        isNetworkError: true,
        error: err.message || 'Unexpected JavaScript execution error during transmission.'
      }, intakeData);
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtnIcon.textContent = '⚙️';
      submitBtnText.textContent = 'PROCESS AI TRIAGE ASSESSMENT';
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(form);
    const intakeData = {};
    formData.forEach((value, key) => {
      intakeData[key] = value;
    });

    await processSubmission(intakeData);
  });
}
