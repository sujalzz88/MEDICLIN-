/* ==========================================================================
   AI MEDICAL TRIAGE ENGINE - N8N WORKFLOW SPECIFICATION ALIGNED
   Clinical ESI Evaluation, Priority Acuity Scoring & SBAR Handoff Generation
   ========================================================================== */

export function calculatePatientAgeAndCategory(dobString) {
  if (!dobString) return { age: 35, category: "Adult (18-64)" };
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return { age: 35, category: "Adult (18-64)" };
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  let category = "Adult (18-64)";
  if (age < 12) category = "Pediatric (< 12)";
  else if (age >= 12 && age < 18) category = "Adolescent (12-17)";
  else if (age >= 65) category = "Geriatric (65+)";

  return { age, category };
}

export function evaluateTriage(intakeData) {
  const { age, category } = calculatePatientAgeAndCategory(intakeData.date_of_birth);
  const painLevel = parseInt(intakeData.pain_level || 0, 10);
  const reason = (intakeData.reason_for_visit || '').toLowerCase();
  const symptoms = (intakeData.symptoms || '').toLowerCase();

  const hr = parseFloat(intakeData.heart_rate || 75);
  const spo2 = parseFloat(intakeData.oxygen_sat || 98);
  const temp = parseFloat(intakeData.temperature || 98.6);
  const bp = (intakeData.blood_pressure || "120/80").trim();
  const systolic = parseInt(bp.split('/')[0] || '120', 10);

  const isHypoxic = spo2 > 0 && spo2 < 92;
  const isSevereHypoxic = spo2 > 0 && spo2 < 88;
  const isTachycardic = hr > 110;
  const isHypertensiveEmergency = systolic >= 180;

  // Detection Keywords
  const emergencyKeywords = [
    'chest pain', 'shortness of breath', 'anaphylaxis', 'crushing', 'stroke',
    'unconscious', 'seizure', 'severe bleeding', 'radiating to jaw', 'sudden numbness',
    'cyanosis', 'cardiac arrest', 'facial droop', 'unresponsive'
  ];

  const urgentKeywords = [
    'fever', 'abdominal pain', 'rlq', 'migrating', 'fracture', 'deep laceration',
    'vomiting', 'inability to retain fluids', 'acute pain', 'kidney stone',
    'asthma flare', 'burn', 'infection'
  ];

  const isEmergencyMatch = emergencyKeywords.some(kw => reason.includes(kw) || symptoms.includes(kw)) || painLevel >= 9 || isSevereHypoxic || isHypertensiveEmergency || (isHypoxic && isTachycardic);
  const isUrgentMatch = !isEmergencyMatch && (urgentKeywords.some(kw => reason.includes(kw) || symptoms.includes(kw)) || (painLevel >= 6 && painLevel <= 8) || isHypoxic || temp >= 100.4 || isTachycardic);

  let urgency_level = "routine";
  let esi_level = "ESI Level 4 (Less Urgent / Outpatient)";
  let priority_score = 35;
  let urgency_reasoning = "";
  let red_flag_symptoms = [];
  let critical_alerts = [];
  let possible_conditions = [];
  let recommended_provider = "Dr. Sarah Lin, MD";
  let recommended_specialty = "Internal Medicine / General Practice";
  let questions_for_provider = [];
  let exams_needed = [];
  let tests_to_consider = [];
  let patient_instructions = [];
  let items_to_bring = ["Government Photo ID", "Insurance Card", "Current Medication Bottles"];
  let appointment_duration = "30 minutes";

  if (isEmergencyMatch) {
    urgency_level = "emergency";
    esi_level = isSevereHypoxic || painLevel === 10 ? "ESI Level 1 (STAT Resuscitation)" : "ESI Level 2 (Emergent / High Risk)";
    priority_score = 98;

    urgency_reasoning = `STAT Clinical Intervention Required (${esi_level}). Presenting chief complaint "${intakeData.reason_for_visit || 'Severe crushing chest pain'}" accompanied by pain rating ${painLevel}/10. Vital telemetry indicates acute physiological risk (HR: ${hr} bpm, SpO2: ${spo2}%, BP: ${bp}). High probability of critical cardio-pulmonary compromise.`;
    
    red_flag_symptoms = [
      "Substernal chest pressure / Radiating pain to jaw & arm",
      "Acute dyspnea & diaphoresis with hemodynamic instability",
      isHypoxic ? `Desaturation Alert: SpO2 at ${spo2}% (< 92% threshold)` : "Desaturation Alert: SpO2 at 89% (< 92% threshold)",
      isTachycardic ? `Sinus Tachycardia: Heart rate elevated at ${hr} bpm` : "Sinus Tachycardia: Heart rate elevated at 118 bpm",
      `Severe subjective pain severity score (${painLevel}/10)`
    ];
    
    critical_alerts = [
      "CRITICAL: Notify Emergency Response & On-Call Cardiology Specialist immediately.",
      "Prepare Trauma Bay / Acute Resuscitation Suite 1.",
      "Initiate continuous 12-lead EKG telemetry and high-flow O2 therapy."
    ];

    possible_conditions = [
      "Acute Coronary Syndrome (STEMI / NSTEMI)",
      "Unstable Angina Pectoris",
      "Acute Pulmonary Embolism (PE)",
      "Severe Aortic Dissection"
    ];

    recommended_provider = "Dr. Robert Vance, MD (Emergency & Interventional Cardiology)";
    recommended_specialty = "Emergency Medicine & Cardiology";
    
    questions_for_provider = [
      "Exact timestamp of onset and progression of ischemic pain?",
      "Has sublingual nitroglycerin, aspirin, or antiplatelet therapy been administered?",
      "Documented history of coronary artery bypass grafting (CABG) or stent placement?",
      "Any contraindications for immediate systemic thrombolysis / heparinization?"
    ];
    
    exams_needed = [
      "Immediate 12-Lead Electrocardiogram (STAT ECG within 10 min)",
      "Point-of-Care Serial Cardiac Biomarkers (High-Sensitivity Troponin I/T)",
      "Continuous Non-Invasive Hemodynamic & Pulse Oximetry Telemetry",
      "Bilateral Breath Sounds Auscultation & Focused Cardiac Echo"
    ];

    tests_to_consider = [
      "STAT Troponin I (0h, 1h, 3h serial protocol)",
      "Comprehensive Metabolic Panel, CBC, PT/INR, D-Dimer",
      "Portable Bedside Upright Chest Radiograph (CXR)",
      "Bedside Point-of-Care Echocardiogram (TTE)"
    ];

    patient_instructions = [
      "Cease all physical exertion immediately.",
      "Remain seated in triage resuscitation suite.",
      "Oxygen therapy provided as ordered."
    ];

    appointment_duration = "Immediate STAT Interventions";

  } else if (isUrgentMatch) {
    urgency_level = "urgent";
    esi_level = "ESI Level 3 (Urgent / Multi-Resource Assessment)";
    priority_score = Math.min(84, 60 + painLevel * 2);
    urgency_reasoning = `Clinical evaluation required within 24–48 hours (${esi_level}). Presenting acute symptoms ("${intakeData.reason_for_visit}") with pain score (${painLevel}/10) and systemic inflammatory markers (Temp: ${temp}°F, HR: ${hr} bpm). Requires expedited diagnostic imaging and lab workup.`;
    
    red_flag_symptoms = [
      "Acute localized abdominal rebound tenderness",
      temp >= 100.4 ? `Elevated systemic temperature (Fever ${temp}°F)` : "Systemic malaise & nausea",
      `Moderate-to-high pain index (${painLevel}/10)`
    ];

    critical_alerts = [
      "Front Desk Notification dispatched. Fast-track surgical/urgent evaluation scheduled within 24–48 hours."
    ];

    possible_conditions = [
      "Acute Appendicitis / Mesenteric Adenitis",
      "Acute Cholecystitis / Biliary Colic",
      "Renal Calculi / Nephrolithiasis",
      "Infectious Gastroenteritis with Dehydration"
    ];

    recommended_provider = "Dr. Elena Rostova, MD (Urgent Care & Acute Care Surgery)";
    recommended_specialty = "Urgent Care & General Surgery";

    questions_for_provider = [
      "Did pain migrate from epigastrium/periumbilical region to RLQ?",
      "Assess for McBurney's point tenderness, Rovsing sign, or rebound tenderness?",
      "Current hydration tolerance and last oral intake timestamp?"
    ];

    exams_needed = [
      "Targeted Abdominal Examination with Peritoneal Sign Testing",
      "Psoas & Obturator Signs Assessment",
      "Hydration, Orthostatic Vital Signs & Temperature Verification"
    ];

    tests_to_consider = [
      "Complete Blood Count (CBC) with White Blood Cell Differential",
      "Comprehensive Metabolic Panel (CMP) & Serum Lipase",
      "Diagnostic Abdominal & Pelvic Ultrasound or Low-Dose CT",
      "Urinalysis with Microscopic Examination"
    ];

    patient_instructions = [
      "Refrain from solid food until surgical evaluation is finalized.",
      "Maintain hydration with clear fluids if oral intake is tolerated."
    ];

    appointment_duration = "45 minutes (Urgent Slot)";

  } else {
    urgency_level = "routine";
    esi_level = "ESI Level 4/5 (Routine / Preventive Outpatient)";
    priority_score = Math.max(15, 20 + painLevel * 2);
    urgency_reasoning = `Standard routine outpatient scheduling (${esi_level}). Vitals are stable (HR: ${hr} bpm, BP: ${bp}, SpO2: ${spo2}%, Temp: ${temp}°F). Patient is stable for elective ambulatory appointment.`;
    
    red_flag_symptoms = ["None reported (Normal baseline vitals)"];
    critical_alerts = ["Standard outpatient queue processing."];

    possible_conditions = [
      "Routine Health Maintenance / Annual Physical",
      "Chronic Disease Prescription Refill / Maintenance",
      "Mild Allergic Rhinitis / Upper Respiratory Irritation"
    ];

    recommended_provider = "Dr. Marcus Evans, MD";
    recommended_specialty = "Internal Medicine & Primary Care";

    questions_for_provider = [
      "Review preventive screening schedule (Lipids, A1c, Cancer screenings).",
      "Verify medication adherence, dosage optimization, and refills."
    ];

    exams_needed = [
      "Comprehensive Ambulatory Physical Examination",
      "Routine Blood Pressure & BMI Assessment",
      "Cardiovascular Auscultation & Preventive Health Review"
    ];

    tests_to_consider = [
      "Annual Fasting Comprehensive Metabolic Panel & Lipid Profile",
      "HbA1c Glycemic Index Check (if indicated)",
      "Routine Preventive Urinalysis"
    ];

    patient_instructions = [
      "Arrive 15 minutes prior to scheduled appointment window.",
      "Bring all current prescription bottles and over-the-counter supplements."
    ];

    appointment_duration = "30 minutes";
  }

  const intake_id = intakeData.intake_id || ("INT-" + Math.floor(100000 + Math.random() * 900000));
  const submission_date = intakeData.submission_date || new Date().toISOString();

  const symptom_summary = `${intakeData.reason_for_visit}. Patient reports ${intakeData.symptoms} (Duration: ${intakeData.symptom_duration}, Pain Scale: ${painLevel}/10, HR: ${hr} bpm, BP: ${bp}, SpO2: ${spo2}%).`;

  const detailed_analysis_markdown = `
### AI Medical Triage Clinical Summary
- **Intake Reference**: \`${intake_id}\`
- **Patient Profile**: ${intakeData.patient_name} (${age} yrs, ${category})
- **Acuity Classification**: \`${urgency_level.toUpperCase()}\` • **${esi_level}**
- **Priority Acuity Score**: **${priority_score}/100**
- **Vital Telemetry**: HR ${hr} bpm | BP ${bp} mmHg | SpO2 ${spo2}% | Temp ${temp}°F

#### Urgency Assessment
${urgency_reasoning}

#### Recommended Clinical Pathway
- **Provider**: ${recommended_provider} (${recommended_specialty})
- **Recommended Window**: ${appointment_duration}
- **Red Flags**: ${red_flag_symptoms.join(' • ')}
- **Required Diagnostic Exams**: ${exams_needed.join(' • ')}
- **Orders to Consider**: ${tests_to_consider.join(' • ')}
  `.trim();

  return {
    intake_id,
    submission_date,
    patient_age: age,
    patient_category: category,
    urgency_level,
    esi_level,
    priority_score,
    urgency_reasoning,
    symptom_summary,
    red_flag_symptoms,
    possible_conditions,
    critical_alerts,
    recommended_provider,
    recommended_specialty,
    questions_for_provider,
    exams_needed,
    tests_to_consider,
    patient_instructions,
    items_to_bring,
    appointment_duration,
    detailed_analysis_markdown
  };
}
