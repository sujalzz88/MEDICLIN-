/* ==========================================================================
   MEDICLIN N8N API CLIENT (N8N-CLIENT.JS)
   Centralized bi-directional webhook gateway for AI Medical Triage
   ========================================================================== */

export const N8N_ENDPOINTS = {
  test: 'https://aryanna.app.n8n.cloud/webhook-test/a5b3b9e3-267f-406f-a37b-aabeff9b50d0',
  production: 'https://aryanna.app.n8n.cloud/webhook/a5b3b9e3-267f-406f-a37b-aabeff9b50d0'
};

export const N8N_PRODUCTION_WEBHOOK_URL = N8N_ENDPOINTS.production;
export const N8N_TEST_WEBHOOK_URL = N8N_ENDPOINTS.test;

const STORAGE_KEY_WEBHOOK_URL = 'n8n_clinical_webhook_url';
const STORAGE_KEY_N8N_MODE = 'mediclin_n8n_mode';
const REQUEST_TIMEOUT_MS = 60000; // 60s for full LLM analysis & triage pipeline

/**
 * Diagnostic error categories
 */
export const N8N_ERROR_TYPES = {
  TEST_LISTENER_NOT_ACTIVE: 'TEST_LISTENER_NOT_ACTIVE',
  PRODUCTION_WORKFLOW_INACTIVE: 'PRODUCTION_WORKFLOW_INACTIVE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  HTTP_400: 'HTTP_400',
  HTTP_404: 'HTTP_404',
  HTTP_500: 'HTTP_500',
  N8N_WORKFLOW_ERROR: 'N8N_WORKFLOW_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT: 'TIMEOUT'
};

/**
 * Safe synthetic test patient
 */
export const SYNTHETIC_TEST_PATIENT = {
  q3_fullName: { first: 'Test', last: 'Patient' },
  q4_email: 'test@example.com',
  q5_phone: '0000000000',
  q6_dateOfBirth: '1990-01-01',
  q7_reasonForVisit: 'Test appointment',
  q8_symptoms: 'Mild headache for one day',
  q9_duration: '1 day',
  q10_painLevel: 2,
  q11_medications: 'None',
  q12_allergies: 'None',
  q13_medicalHistory: 'None',
  q14_insurance: 'Self-pay',
  q15_preferredDate: '2026-09-01',
  q16_preferredTime: '10:00',
  submissionID: 'DEBUG-001'
};

/**
 * Get active n8n mode ('production' | 'test')
 * Defaults strictly to 'production'
 */
export function getConfiguredN8nMode() {
  if (typeof localStorage === 'undefined') return 'production';
  try {
    const mode = localStorage.getItem(STORAGE_KEY_N8N_MODE);
    return mode === 'test' ? 'test' : 'production';
  } catch (e) {
    return 'production';
  }
}

export function getN8nMode() {
  return getConfiguredN8nMode();
}

/**
 * Set active n8n mode ('production' | 'test')
 */
export function setN8nMode(mode) {
  const cleanMode = mode === 'test' ? 'test' : 'production';
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_N8N_MODE, cleanMode);
    } catch (e) {}
  }
  return cleanMode;
}

/**
 * Retrieve active webhook URL based on explicit mode
 * Default is always PRODUCTION URL
 */
export function getActiveWebhookUrl(modeOverride) {
  const mode = modeOverride || getConfiguredN8nMode();
  if (mode === 'test') {
    return N8N_ENDPOINTS.test;
  }
  return N8N_ENDPOINTS.production;
}

/**
 * Save active webhook URL to storage
 */
export function setActiveWebhookUrl(url) {
  const cleanUrl = (url && typeof url === 'string') ? url.trim() : N8N_ENDPOINTS.production;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, cleanUrl);
      if (cleanUrl.includes('/webhook-test/')) {
        localStorage.setItem(STORAGE_KEY_N8N_MODE, 'test');
      } else if (cleanUrl.includes('/webhook/')) {
        localStorage.setItem(STORAGE_KEY_N8N_MODE, 'production');
      }
    } catch (e) {}
  }
  return cleanUrl;
}

/**
 * Helper to safely sanitize input values and ensure no null/undefined values
 */
function sanitizeValue(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  return val;
}

/**
 * Format raw clinical intake form data into canonical n8n payload matching Extract Patient Data node
 * Guarantees exactly 15 non-null fields matching the n8n Extract Patient Data contract.
 */
export function formatN8nPayload(formData) {
  if (!formData || typeof formData !== 'object') formData = {};

  const fullName = sanitizeValue(formData.patient_name, '').trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Patient';
  const lastName = nameParts.slice(1).join(' ') || '';

  const rawPain = parseInt(formData.pain_level, 10);
  const painLevel = (isNaN(rawPain) || rawPain === null || rawPain === undefined) ? 0 : Math.max(0, Math.min(10, rawPain));

  const rawId = sanitizeValue(formData.intake_id, '');
  const cleanId = rawId || ('INT-' + Math.floor(100000 + Math.random() * 900000));
  const submissionID = cleanId.replace(/^INT-/, '').replace(/^MED-/, '') || String(Date.now());

  let symptomsText = sanitizeValue(formData.symptoms, '');
  const vitalsList = [];
  if (formData.heart_rate) vitalsList.push(`HR: ${sanitizeValue(formData.heart_rate)} bpm`);
  if (formData.blood_pressure) vitalsList.push(`BP: ${sanitizeValue(formData.blood_pressure)} mmHg`);
  if (formData.oxygen_sat) vitalsList.push(`SpO2: ${sanitizeValue(formData.oxygen_sat)}%`);
  if (formData.temperature) vitalsList.push(`Temp: ${sanitizeValue(formData.temperature)}°F`);

  if (vitalsList.length > 0 && !symptomsText.includes('bpm') && !symptomsText.includes('mmHg')) {
    symptomsText = symptomsText ? `${symptomsText} [Vitals: ${vitalsList.join(', ')}]` : `Vitals: ${vitalsList.join(', ')}`;
  }

  const payload = {
    q3_fullName: {
      first: firstName || 'Patient',
      last: lastName || ''
    },
    q4_email: sanitizeValue(formData.patient_email, 'patient@example.com'),
    q5_phone: sanitizeValue(formData.patient_phone, 'N/A'),
    q6_dateOfBirth: sanitizeValue(formData.date_of_birth, '1980-01-01'),
    q7_reasonForVisit: sanitizeValue(formData.reason_for_visit, 'Medical evaluation'),
    q8_symptoms: symptomsText || 'No specific symptoms described.',
    q9_duration: sanitizeValue(formData.symptom_duration, 'Not specified'),
    q10_painLevel: painLevel,
    q11_medications: sanitizeValue(formData.current_medications, 'None') || 'None',
    q12_allergies: sanitizeValue(formData.allergies, 'None') || 'None',
    q13_medicalHistory: sanitizeValue(formData.medical_history, 'None reported') || 'None reported',
    q14_insurance: sanitizeValue(formData.insurance_provider, 'Self-pay') || 'Self-pay',
    q15_preferredDate: sanitizeValue(formData.preferred_date, new Date().toISOString().split('T')[0]),
    q16_preferredTime: sanitizeValue(formData.preferred_time, 'Immediate'),
    submissionID: submissionID
  };

  // Deep sanitize to guarantee 0 null or undefined values
  const deepSanitize = (obj) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === null || obj[key] === undefined) {
        obj[key] = '';
      } else if (typeof obj[key] === 'object') {
        deepSanitize(obj[key]);
      }
    });
    return obj;
  };

  return deepSanitize(payload);
}

/**
 * Safely parse and normalize response from n8n into standard MediClin triage schema
 */
export function normalizeN8nResponse(data, fallbackIntakeId) {
  if (!data) return null;

  // Case 1: Wrapped in { success: true, triage: { ... }, patient: { ... } }
  let triageObj = null;
  let patientObj = null;
  let intakeId = fallbackIntakeId;

  if (data.triage && typeof data.triage === 'object') {
    triageObj = data.triage;
    patientObj = data.patient || null;
    intakeId = data.intake_id || fallbackIntakeId;
  } else if (data.output && typeof data.output === 'object') {
    // Case 2: LangChain output wrapper { output: { urgency_level: ... } }
    triageObj = data.output;
    patientObj = data.patient || null;
  } else if (data.urgency_level || data.priority_score !== undefined) {
    // Case 3: Direct triage object
    triageObj = data;
  } else if (Array.isArray(data) && data.length > 0) {
    // Case 4: Array of items from n8n
    const first = data[0];
    if (first.triage) triageObj = first.triage;
    else if (first.output) triageObj = first.output;
    else if (first.urgency_level) triageObj = first;
  }

  if (!triageObj) {
    return null;
  }

  // Normalize urgency level
  let urgency = (triageObj.urgency_level || 'routine').toLowerCase().trim();
  if (urgency.includes('emerg')) urgency = 'emergency';
  else if (urgency.includes('urg')) urgency = 'urgent';
  else if (urgency.includes('rout') || urgency.includes('non')) urgency = 'routine';
  else urgency = 'routine';

  // Normalize score
  let score = parseInt(triageObj.priority_score, 10);
  if (isNaN(score)) {
    if (urgency === 'emergency') score = 95;
    else if (urgency === 'urgent') score = 75;
    else score = 30;
  }

  // ESI classification mapping
  let esi = triageObj.esi_level || '';
  if (!esi) {
    if (urgency === 'emergency') esi = score >= 95 ? 'ESI Level 1 (STAT Resuscitation)' : 'ESI Level 2 (Emergent / High Risk)';
    else if (urgency === 'urgent') esi = 'ESI Level 3 (Urgent / Multi-Resource Assessment)';
    else esi = 'ESI Level 4/5 (Routine / Preventive Outpatient)';
  }

  const normalizedTriage = {
    intake_id: triageObj.intake_id || intakeId || ('MED-' + Date.now()),
    submission_date: triageObj.submission_date || new Date().toISOString(),
    patient_age: triageObj.patient_age !== undefined ? triageObj.patient_age : (patientObj?.patient_age || 35),
    patient_category: triageObj.patient_category || patientObj?.patient_category || 'Adult (18-64)',
    urgency_level: urgency,
    esi_level: esi,
    priority_score: score,
    urgency_reasoning: triageObj.urgency_reasoning || 'AI triage assessment completed via n8n.',
    symptom_summary: triageObj.symptom_summary || 'Clinical intake processed.',
    red_flag_symptoms: Array.isArray(triageObj.red_flag_symptoms) ? triageObj.red_flag_symptoms : (triageObj.red_flag_symptoms ? [String(triageObj.red_flag_symptoms)] : []),
    possible_conditions: Array.isArray(triageObj.possible_conditions)
      ? triageObj.possible_conditions.map(c => typeof c === 'object' ? (c.condition || JSON.stringify(c)) : String(c))
      : (triageObj.possible_conditions ? [String(triageObj.possible_conditions)] : []),
    critical_alerts: Array.isArray(triageObj.critical_alerts) ? triageObj.critical_alerts : (triageObj.critical_alerts ? [String(triageObj.critical_alerts)] : []),
    recommended_provider: triageObj.recommended_provider || 'Attending Physician',
    recommended_specialty: triageObj.recommended_specialty || 'General Medicine',
    questions_for_provider: Array.isArray(triageObj.questions_for_provider) ? triageObj.questions_for_provider : [],
    exams_needed: Array.isArray(triageObj.exams_needed) ? triageObj.exams_needed : [],
    tests_to_consider: Array.isArray(triageObj.tests_to_consider) ? triageObj.tests_to_consider : [],
    patient_instructions: Array.isArray(triageObj.patient_instructions) ? triageObj.patient_instructions : [],
    items_to_bring: Array.isArray(triageObj.items_to_bring) ? triageObj.items_to_bring : ['Government Photo ID', 'Insurance Card'],
    appointment_duration: triageObj.appointment_duration || '30 minutes',
    detailed_analysis_markdown: triageObj.detailed_analysis_markdown || ''
  };

  return {
    triage: normalizedTriage,
    patient: patientObj
  };
}

/**
 * Submit clinical payload to n8n webhook with explicit test/production mode routing
 * The main submission button strictly defaults to PRODUCTION unless an explicit developer mode is passed.
 */
export async function submitToN8n(formData, options = {}) {
  // 1. Resolve explicit Mode (default: 'production')
  const mode = options.mode || getConfiguredN8nMode();

  // 2. Resolve Endpoint URL
  let targetUrl = options.url;
  if (!targetUrl) {
    targetUrl = mode === 'test' ? N8N_ENDPOINTS.test : N8N_ENDPOINTS.production;
  }

  const isTestMode = targetUrl.includes('/webhook-test/');
  const payload = formatN8nPayload(formData);
  const timeoutMs = options.timeoutMs || REQUEST_TIMEOUT_MS;

  console.info('[MediClin] n8n mode:', isTestMode ? 'test' : 'production');
  console.info('[MediClin] n8n endpoint:', targetUrl);

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const startTime = performance.now();

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutTimer);
    const durationMs = Math.round(performance.now() - startTime);

    console.info(`[MediClin] n8n response received: HTTP ${response.status} (${durationMs}ms)`);

    const rawText = await response.text();
    let responseData = null;

    try {
      responseData = rawText ? JSON.parse(rawText) : null;
    } catch {
      responseData = { raw: rawText };
    }

    if (!response.ok) {
      let errorType = N8N_ERROR_TYPES.HTTP_ERROR;
      let errorMessage = '';

      if (response.status === 404) {
        errorType = isTestMode
          ? N8N_ERROR_TYPES.TEST_LISTENER_NOT_ACTIVE
          : N8N_ERROR_TYPES.PRODUCTION_WORKFLOW_INACTIVE;

        errorMessage = isTestMode
          ? 'n8n test listener is not active. In n8n editor, click "Test workflow" / "Listen for test event" before testing.'
          : 'n8n production workflow is unavailable. Verify that the MediClin workflow is set to Active in n8n Cloud.';
      } else if (response.status === 400) {
        errorType = N8N_ERROR_TYPES.HTTP_400;
        errorMessage = responseData?.message || responseData?.error || 'Bad request. Required intake information was missing or malformed.';
      } else if (response.status === 500) {
        errorType = N8N_ERROR_TYPES.HTTP_500;
        errorMessage = responseData?.message || responseData?.error || 'Internal error in n8n workflow execution node.';
      } else {
        errorMessage = responseData?.message || responseData?.error || rawText || `HTTP ${response.status} ${response.statusText}`;
      }

      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        errorType: errorType,
        durationMs,
        isWorkflowInactive: response.status === 404,
        isTestListenerInactive: isTestMode && response.status === 404,
        targetUrl,
        error: errorMessage,
        rawError: rawText,
        payloadSent: payload
      };
    }

    if (!responseData) {
      return {
        success: false,
        status: response.status,
        errorType: N8N_ERROR_TYPES.INVALID_RESPONSE,
        durationMs,
        targetUrl,
        error: 'n8n returned an empty or invalid response payload.',
        payloadSent: payload
      };
    }

    const normalized = normalizeN8nResponse(responseData, formData.intake_id);

    return {
      success: true,
      status: response.status,
      errorType: null,
      durationMs,
      targetUrl,
      data: responseData,
      normalized: normalized,
      payloadSent: payload
    };

  } catch (err) {
    clearTimeout(timeoutTimer);
    const durationMs = Math.round(performance.now() - startTime);

    if (err.name === 'AbortError') {
      console.warn(`[MediClin] n8n request timed out after ${timeoutMs / 1000}s`);
      return {
        success: false,
        status: 0,
        errorType: N8N_ERROR_TYPES.TIMEOUT,
        isTimeout: true,
        durationMs,
        targetUrl,
        error: `Request timed out after ${timeoutMs / 1000}s. The AI triage pipeline is taking longer than expected.`,
        payloadSent: payload
      };
    }

    const isNetworkError = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('CORS'));
    const isCors = err.message && err.message.includes('CORS');

    let classifiedError = N8N_ERROR_TYPES.NETWORK_ERROR;
    let userMsg = `Connection to n8n webhook failed (${err.message}).`;

    if (isTestMode) {
      classifiedError = N8N_ERROR_TYPES.TEST_LISTENER_NOT_ACTIVE;
      userMsg = 'n8n test listener is not active or connection refused. In n8n, click "Test workflow" to listen for events.';
    } else if (isCors) {
      classifiedError = N8N_ERROR_TYPES.CORS_ERROR;
      userMsg = 'CORS request blocked by browser. Ensure webhook is accessible.';
    }

    return {
      success: false,
      status: 0,
      errorType: classifiedError,
      isNetworkError: true,
      durationMs,
      targetUrl,
      error: userMsg,
      payloadSent: payload
    };
  }
}
