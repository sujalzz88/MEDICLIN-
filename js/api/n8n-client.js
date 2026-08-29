/* ==========================================================================
   MEDICLIN N8N API CLIENT (N8N-CLIENT.JS)
   Centralized bi-directional webhook gateway for AI Medical Triage & Planning
   Configured to use the centralized n8n PRODUCTION Webhook Endpoint
   ========================================================================== */

export const N8N_PRODUCTION_WEBHOOK_URL = 'https://aryanna.app.n8n.cloud/webhook/a5b3b9e3-267f-406f-a37b-aabeff9b50d0';
export const N8N_WEBHOOK_URL = N8N_PRODUCTION_WEBHOOK_URL;

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
 * Retrieve active webhook URL - strictly returns the centralized PRODUCTION URL
 */
export function getActiveWebhookUrl() {
  return N8N_WEBHOOK_URL;
}

/**
 * Sanitize string value
 */
export function sanitizeValue(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  return str.length > 0 ? str : fallback;
}

/**
 * Formats patient intake form into the 15-field JSON payload expected by n8n
 */
export function formatN8nPayload(rawFormData, customWorkflowType) {
  let firstName = 'Patient';
  let lastName = '';
  const fullNameRaw = sanitizeValue(rawFormData.patient_name || rawFormData.name || (rawFormData.q3_fullName ? (typeof rawFormData.q3_fullName === 'object' ? `${rawFormData.q3_fullName.first} ${rawFormData.q3_fullName.last}` : rawFormData.q3_fullName) : ''));
  if (fullNameRaw) {
    const parts = fullNameRaw.split(' ');
    firstName = parts[0] || 'Patient';
    lastName = parts.slice(1).join(' ') || '';
  }

  const rawPhone = sanitizeValue(rawFormData.patient_phone || rawFormData.phone || rawFormData.q5_phone, '+1 (555) 000-0000');
  const rawEmail = sanitizeValue(rawFormData.patient_email || rawFormData.email || rawFormData.q4_email, 'patient@example.org');
  const rawDob = sanitizeValue(rawFormData.date_of_birth || rawFormData.dob || rawFormData.q6_dateOfBirth, '1985-01-01');
  const rawReason = sanitizeValue(rawFormData.reason_for_visit || rawFormData.reason || rawFormData.q7_reasonForVisit, 'Clinical consultation');

  let rawSymptoms = sanitizeValue(rawFormData.symptoms || rawFormData.q8_symptoms, 'Standard clinical evaluation requested');
  const hr = sanitizeValue(rawFormData.heart_rate);
  const bp = sanitizeValue(rawFormData.blood_pressure);
  const spo2 = sanitizeValue(rawFormData.oxygen_sat);
  const temp = sanitizeValue(rawFormData.temperature);
  if ((hr || bp || spo2 || temp) && !rawSymptoms.includes('[Vitals:')) {
    const vitalsStr = ` [Vitals: HR: ${hr || 75} bpm, BP: ${bp || '120/80'} mmHg, SpO2: ${spo2 || 98}%, Temp: ${temp || 98.6}°F]`;
    rawSymptoms += vitalsStr;
  }

  const rawDuration = sanitizeValue(rawFormData.symptom_duration || rawFormData.duration || rawFormData.q9_duration, '1 day');
  let rawPain = rawFormData.pain_level !== undefined && rawFormData.pain_level !== null ? parseInt(rawFormData.pain_level, 10) : (rawFormData.q10_painLevel !== undefined ? parseInt(rawFormData.q10_painLevel, 10) : 5);
  if (isNaN(rawPain)) rawPain = 5;

  const rawMeds = sanitizeValue(rawFormData.current_medications || rawFormData.medications || rawFormData.q11_medications, 'None reported');
  const rawAllergies = sanitizeValue(rawFormData.allergies || rawFormData.q12_allergies, 'NKDA');
  const rawHistory = sanitizeValue(rawFormData.medical_history || rawFormData.history || rawFormData.q13_medicalHistory, 'None documented');
  const rawInsurance = sanitizeValue(rawFormData.insurance_provider || rawFormData.insurance || rawFormData.q14_insurance, 'Self-Pay / Standard Insurance');

  const todayStr = new Date().toISOString().split('T')[0];
  const rawDate = sanitizeValue(rawFormData.preferred_date || rawFormData.date || rawFormData.q15_preferredDate, todayStr);
  const rawTime = sanitizeValue(rawFormData.preferred_time || rawFormData.time || rawFormData.q16_preferredTime, '09:00 AM');

  let subId = sanitizeValue(rawFormData.intake_id || rawFormData.submissionID || rawFormData.submission_id);
  if (!subId) {
    subId = String(Math.floor(100000 + Math.random() * 900000));
  } else {
    subId = subId.replace(/^INT-/, '');
  }

  const payload = {
    q3_fullName: {
      first: firstName,
      last: lastName
    },
    q4_email: rawEmail,
    q5_phone: rawPhone,
    q6_dateOfBirth: rawDob,
    q7_reasonForVisit: rawReason,
    q8_symptoms: rawSymptoms,
    q9_duration: rawDuration,
    q10_painLevel: rawPain,
    q11_medications: rawMeds,
    q12_allergies: rawAllergies,
    q13_medicalHistory: rawHistory,
    q14_insurance: rawInsurance,
    q15_preferredDate: rawDate,
    q16_preferredTime: rawTime,
    submissionID: subId
  };

  if (customWorkflowType) {
    payload.workflowType = customWorkflowType;
  }

  return payload;
}

/**
 * Normalizes n8n response into standard record object
 */
export function normalizeN8nResponse(data, rawSubmissionPayload) {
  let resObj = data;
  if (Array.isArray(data) && data.length > 0) {
    resObj = data[0];
  }
  if (resObj && resObj.json) {
    resObj = resObj.json;
  }

  const payload = rawSubmissionPayload || {};
  const firstName = payload.q3_fullName?.first || 'Patient';
  const lastName = payload.q3_fullName?.last || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Patient';

  const subId = payload.submissionID || String(Math.floor(100000 + Math.random() * 900000));
  const intakeId = `INT-${subId}`;

  const patient = {
    patient_name: resObj?.patient?.name || resObj?.patient?.patient_name || fullName,
    patient_email: resObj?.patient?.email || payload.q4_email || 'patient@example.org',
    patient_phone: resObj?.patient?.phone || payload.q5_phone || '+1 (555) 000-0000',
    date_of_birth: resObj?.patient?.date_of_birth || payload.q6_dateOfBirth || '1985-01-01',
    reason_for_visit: resObj?.patient?.reason_for_visit || payload.q7_reasonForVisit || 'Clinical consultation',
    symptoms: resObj?.patient?.symptoms || payload.q8_symptoms || '',
    symptom_duration: resObj?.patient?.symptom_duration || payload.q9_duration || '1 day',
    pain_level: resObj?.patient?.pain_level !== undefined ? resObj.patient.pain_level : (payload.q10_painLevel || 5),
    current_medications: resObj?.patient?.current_medications || payload.q11_medications || 'None reported',
    allergies: resObj?.patient?.allergies || payload.q12_allergies || 'NKDA',
    medical_history: resObj?.patient?.medical_history || payload.q13_medicalHistory || 'None documented',
    insurance_provider: resObj?.patient?.insurance_provider || payload.q14_insurance || 'Standard Insurance',
    preferred_date: resObj?.patient?.preferred_date || payload.q15_preferredDate || new Date().toISOString().split('T')[0],
    preferred_time: resObj?.patient?.preferred_time || payload.q16_preferredTime || '09:00 AM'
  };

  const triageSource = resObj?.triage || resObj?.output || resObj || {};

  const triage = {
    intake_id: resObj?.intake_id || intakeId,
    patient_age: resObj?.patient?.age || 35,
    patient_category: resObj?.patient?.category || 'Adult (18-64)',
    urgency_level: (triageSource.urgency_level || 'routine').toLowerCase(),
    urgency_reasoning: triageSource.urgency_reasoning || 'Automated AI clinical decision support assessment.',
    priority_score: typeof triageSource.priority_score === 'number' ? triageSource.priority_score : (parseInt(triageSource.priority_score, 10) || 50),
    symptom_summary: triageSource.symptom_summary || patient.reason_for_visit,
    red_flag_symptoms: Array.isArray(triageSource.red_flag_symptoms) ? triageSource.red_flag_symptoms : [],
    possible_conditions: Array.isArray(triageSource.possible_conditions) ? triageSource.possible_conditions.map(c => typeof c === 'object' ? `${c.condition || ''} (${c.likelihood || 'Possible'})` : String(c)) : [],
    critical_alerts: Array.isArray(triageSource.critical_alerts) ? triageSource.critical_alerts : [],
    recommended_provider: triageSource.recommended_provider || 'Attending Physician',
    recommended_specialty: triageSource.recommended_specialty || 'General / Internal Medicine',
    questions_for_provider: Array.isArray(triageSource.questions_for_provider) ? triageSource.questions_for_provider : [],
    exams_needed: Array.isArray(triageSource.exams_needed) ? triageSource.exams_needed : [],
    tests_to_consider: Array.isArray(triageSource.tests_to_consider) ? triageSource.tests_to_consider : [],
    patient_instructions: Array.isArray(triageSource.patient_instructions) ? triageSource.patient_instructions : [],
    items_to_bring: Array.isArray(triageSource.items_to_bring) ? triageSource.items_to_bring : ['Photo ID', 'Insurance Card', 'Current Medication Bottles'],
    appointment_duration: triageSource.appointment_duration || '30 minutes',
    detailed_analysis_markdown: triageSource.detailed_analysis_markdown || ''
  };

  return {
    source: 'n8n',
    patient,
    triage,
    rawN8nData: resObj
  };
}

/**
 * Submit payload to the centralized n8n PRODUCTION Webhook
 */
export async function submitToN8n(rawFormData, options = {}) {
  const payload = formatN8nPayload(rawFormData, options.workflowType);
  const targetUrl = N8N_PRODUCTION_WEBHOOK_URL;

  console.info('[MediClin] Dispatching HTTP POST to n8n Production Webhook:', targetUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = null;
      try { errorJson = JSON.parse(errorText); } catch (e) {}

      if (response.status === 404 && (errorJson?.message?.includes('not registered') || errorText.includes('not registered') || errorJson?.hint?.includes('active'))) {
        return {
          success: false,
          errorType: N8N_ERROR_TYPES.PRODUCTION_WORKFLOW_INACTIVE,
          error: "The n8n Production Webhook is not currently active. In your n8n Cloud editor, toggle the workflow switch in the top-right to 'Active'.",
          status: 404,
          url: targetUrl,
          rawPayload: payload
        };
      }

      return {
        success: false,
        errorType: response.status === 500 ? N8N_ERROR_TYPES.HTTP_500 : N8N_ERROR_TYPES.N8N_WORKFLOW_ERROR,
        error: `n8n returned HTTP ${response.status}: ${errorJson?.message || errorText || response.statusText}`,
        status: response.status,
        url: targetUrl,
        rawPayload: payload
      };
    }

    const responseData = await response.json();
    const normalized = normalizeN8nResponse(responseData, payload);

    return {
      success: true,
      data: responseData,
      normalized,
      url: targetUrl,
      rawPayload: payload
    };

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        success: false,
        errorType: N8N_ERROR_TYPES.TIMEOUT,
        error: `n8n request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The AI triage pipeline took too long to return a response.`,
        url: targetUrl,
        rawPayload: payload
      };
    }

    const msg = err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return {
        success: false,
        errorType: N8N_ERROR_TYPES.NETWORK_ERROR,
        error: "Network connection to n8n Cloud failed. Please verify internet connectivity.",
        url: targetUrl,
        rawPayload: payload
      };
    }

    return {
      success: false,
      errorType: N8N_ERROR_TYPES.N8N_WORKFLOW_ERROR,
      error: msg || "Unknown error connecting to n8n webhook.",
      url: targetUrl,
      rawPayload: payload
    };
  }
}
