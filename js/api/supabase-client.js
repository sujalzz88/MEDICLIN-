/* ==========================================================================
   MEDICLIN SUPABASE CLIENT (SUPABASE-CLIENT.JS)
   Direct Client-Side Data Persistence via Supabase PostgREST REST API
   Independent from n8n AI Automation Pipeline • Zero UI Dependencies
   ========================================================================== */

export const SUPABASE_URL = 'https://dolmvvtlihbhafzfmyhm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JTWSmDCBhDyWin312J8xig_lStVYaZ-';
export const SUPABASE_TABLE = 'patient_intakes';

/**
 * Calculate patient age and clinical demographic category from DOB
 */
export function calculateAgeAndCategory(dobString) {
  if (!dobString) return { age: 35, category: 'Adult (18-64)' };
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return { age: 35, category: 'Adult (18-64)' };
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  let category = 'Adult (18-64)';
  if (age < 12) category = 'Pediatric (< 12)';
  else if (age >= 12 && age < 18) category = 'Adolescent (12-17)';
  else if (age >= 65) category = 'Geriatric (65+)';

  return { age, category };
}

/**
 * Direct insertion of patient intake data into Supabase patient_intakes table
 * Independent from n8n execution • Handles errors without throwing or blocking UI
 *
 * @param {Object} rawFormData - Form fields submitted by user
 * @param {Object} [triageData] - Optional pre-computed or returned triage data
 * @returns {Promise<{success: boolean, data?: Object, submissionId: string, error?: string}>}
 */
export async function saveIntakeToSupabase(rawFormData, triageData = null) {
  if (!rawFormData || typeof rawFormData !== 'object') {
    return { success: false, error: 'Invalid form data provided' };
  }

  // 1. Resolve Patient Full Name safely
  let patientName = '';
  if (typeof rawFormData.patient_name === 'string') {
    patientName = rawFormData.patient_name.trim();
  } else if (rawFormData.q3_fullName) {
    if (typeof rawFormData.q3_fullName === 'object') {
      patientName = `${rawFormData.q3_fullName.first || ''} ${rawFormData.q3_fullName.last || ''}`.trim();
    } else {
      patientName = String(rawFormData.q3_fullName).trim();
    }
  }

  // 2. Resolve Submission ID
  const submissionId = String(
    rawFormData.submission_id ||
    rawFormData.submissionID ||
    rawFormData.intake_id ||
    ('SUB-' + Math.floor(100000 + Math.random() * 900000))
  );

  // 3. Resolve Age & Category
  const dob = rawFormData.date_of_birth || rawFormData.q6_dateOfBirth || '1958-04-12';
  const { age, category } = calculateAgeAndCategory(dob);

  // 4. Resolve Pain Level
  const painLevel = parseInt(rawFormData.pain_level || rawFormData.q10_painLevel || 0, 10);

  // 5. Construct PostgREST Row strictly matching patient_intakes schema
  const rowPayload = {
    submission_id: submissionId,
    patient_name: patientName || 'Anonymous Patient',
    patient_email: rawFormData.patient_email || rawFormData.q4_email || null,
    patient_phone: rawFormData.patient_phone || rawFormData.q5_phone || null,
    date_of_birth: dob,
    patient_age: age,
    patient_category: category,
    reason_for_visit: rawFormData.reason_for_visit || rawFormData.q7_reasonForVisit || 'Medical Consultation',
    symptoms: rawFormData.symptoms || rawFormData.q8_symptoms || 'None documented',
    symptom_duration: rawFormData.symptom_duration || rawFormData.q9_duration || null,
    pain_level: isNaN(painLevel) ? 0 : painLevel,
    urgency_level: triageData?.urgency_level || (rawFormData.workflowType ? rawFormData.workflowType : 'routine'),
    priority_score: triageData?.priority_score || 35,
    red_flag_symptoms: Array.isArray(triageData?.red_flag_symptoms) ? triageData.red_flag_symptoms : [],
    critical_alerts: Array.isArray(triageData?.critical_alerts) ? triageData.critical_alerts : [],
    raw_payload: rawFormData
  };

  console.info('[MediClin] Supabase insert started (Table: ' + SUPABASE_TABLE + ')');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(rowPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = null;
      try { errorJson = JSON.parse(errorText); } catch (e) {}
      const errorMsg = (errorJson && (errorJson.message || errorJson.error)) || `HTTP ${response.status} ${response.statusText}`;
      console.warn('[MediClin] Supabase insert failed:', errorMsg);
      return {
        success: false,
        status: response.status,
        submissionId: submissionId,
        error: errorMsg
      };
    }

    const responseData = await response.json();
    console.info('[MediClin] Supabase insert successful (HTTP 201 Created)');

    return {
      success: true,
      status: response.status,
      submissionId: submissionId,
      data: Array.isArray(responseData) ? responseData[0] : responseData
    };

  } catch (err) {
    console.warn('[MediClin] Supabase insert network error:', err.message);
    return {
      success: false,
      status: 0,
      submissionId: submissionId,
      error: err.message || 'Network error during Supabase direct persistence'
    };
  }
}
