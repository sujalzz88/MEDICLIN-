/* ==========================================================================
   MEDICLIN CLINICAL WORKSTATION - APPLICATION BUNDLE (APP-BUNDLE.JS)
   100% Standalone Zero-Dependency Script
   Form First (Row 1) ➔ Assessment (Row 2 & 3) Revealed on Process
   Integrated Donut Gauge Inside Alerts • SBAR Matrix in Last Row
   ========================================================================== */

(function () {
  'use strict';

  // --- 1. WEB AUDIO SYNTHESIZER ---
  var ClinicalAudioEngine = function () {
    this.ctx = null;
    this.isMuted = localStorage.getItem('mediclin_audio_muted') === 'true';
  };

  ClinicalAudioEngine.prototype.getAudioContext = function () {
    if (!this.ctx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  };

  ClinicalAudioEngine.prototype.toggleMute = function () {
    this.isMuted = !this.isMuted;
    localStorage.setItem('mediclin_audio_muted', this.isMuted);
    return this.isMuted;
  };

  ClinicalAudioEngine.prototype.playEmergencySiren = function () {
    if (this.isMuted) return;
    try {
      var ctx = this.getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(920, now);
      osc.frequency.setValueAtTime(920, now + 0.25);
      osc.frequency.setValueAtTime(660, now + 0.26);
      osc.frequency.setValueAtTime(660, now + 0.50);
      osc.frequency.setValueAtTime(920, now + 0.51);
      osc.frequency.setValueAtTime(920, now + 0.75);
      osc.frequency.setValueAtTime(660, now + 0.76);
      osc.frequency.setValueAtTime(660, now + 1.05);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.setValueAtTime(0.18, now + 0.95);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {}
  };

  ClinicalAudioEngine.prototype.playUrgentBeep = function () {
    if (this.isMuted) return;
    try {
      var ctx = this.getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      [0, 0.14, 0.28].forEach(function (offset, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740 + idx * 40, now + offset);
        gain.gain.setValueAtTime(0.01, now + offset);
        gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    } catch (e) {}
  };

  ClinicalAudioEngine.prototype.playChime = function () {
    if (this.isMuted) return;
    try {
      var ctx = this.getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach(function (freq, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } catch (e) {}
  };

  ClinicalAudioEngine.prototype.playClick = function () {
    if (this.isMuted) return;
    try {
      var ctx = this.getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.03);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  };

  var clinicalAudio = new ClinicalAudioEngine();

  // --- 2. TRIAGE ENGINE ---
  function calculatePatientAgeAndCategory(dobString) {
    if (!dobString) return { age: 35, category: "Adult (18-64)" };
    var dob = new Date(dobString);
    if (isNaN(dob.getTime())) return { age: 35, category: "Adult (18-64)" };
    var diffMs = Date.now() - dob.getTime();
    var ageDate = new Date(diffMs);
    var age = Math.abs(ageDate.getUTCFullYear() - 1970);

    var category = "Adult (18-64)";
    if (age < 12) category = "Pediatric (< 12)";
    else if (age >= 12 && age < 18) category = "Adolescent (12-17)";
    else if (age >= 65) category = "Geriatric (65+)";

    return { age: age, category: category };
  }

  function evaluateTriage(intakeData) {
    var ageObj = calculatePatientAgeAndCategory(intakeData.date_of_birth);
    var age = ageObj.age;
    var category = ageObj.category;

    var painLevel = parseInt(intakeData.pain_level || 0, 10);
    var reason = (intakeData.reason_for_visit || '').toLowerCase();
    var symptoms = (intakeData.symptoms || '').toLowerCase();

    var hr = parseFloat(intakeData.heart_rate || 75);
    var spo2 = parseFloat(intakeData.oxygen_sat || 98);
    var temp = parseFloat(intakeData.temperature || 98.6);
    var bp = (intakeData.blood_pressure || "120/80").trim();
    var systolic = parseInt(bp.split('/')[0] || '120', 10);

    var isHypoxic = spo2 > 0 && spo2 < 92;
    var isSevereHypoxic = spo2 > 0 && spo2 < 88;
    var isTachycardic = hr > 110;
    var isHypertensiveEmergency = systolic >= 180;

    var emergencyKeywords = [
      'chest pain', 'shortness of breath', 'anaphylaxis', 'crushing', 'stroke',
      'unconscious', 'seizure', 'severe bleeding', 'radiating to jaw', 'sudden numbness',
      'cyanosis', 'cardiac arrest', 'facial droop', 'unresponsive'
    ];

    var urgentKeywords = [
      'fever', 'abdominal pain', 'rlq', 'migrating', 'fracture', 'deep laceration',
      'vomiting', 'inability to retain fluids', 'acute pain', 'kidney stone',
      'asthma flare', 'burn', 'infection'
    ];

    var isEmergencyMatch = emergencyKeywords.some(function (kw) {
      return reason.indexOf(kw) !== -1 || symptoms.indexOf(kw) !== -1;
    }) || painLevel >= 9 || isSevereHypoxic || isHypertensiveEmergency || (isHypoxic && isTachycardic);

    var isUrgentMatch = !isEmergencyMatch && (urgentKeywords.some(function (kw) {
      return reason.indexOf(kw) !== -1 || symptoms.indexOf(kw) !== -1;
    }) || (painLevel >= 6 && painLevel <= 8) || isHypoxic || temp >= 100.4 || isTachycardic);

    var urgency_level = "routine";
    var esi_level = "ESI Level 4 (Less Urgent / Outpatient)";
    var priority_score = 35;
    var urgency_reasoning = "";
    var red_flag_symptoms = [];
    var critical_alerts = [];
    var possible_conditions = [];
    var recommended_provider = "Dr. Sarah Lin, MD";
    var recommended_specialty = "Internal Medicine / General Practice";
    var questions_for_provider = [];
    var exams_needed = [];
    var tests_to_consider = [];
    var patient_instructions = [];
    var items_to_bring = ["Government Photo ID", "Insurance Card", "Current Medication Bottles"];
    var appointment_duration = "30 minutes";

    if (isEmergencyMatch) {
      urgency_level = "emergency";
      esi_level = isSevereHypoxic || painLevel === 10 ? "ESI Level 1 (STAT Resuscitation)" : "ESI Level 2 (Emergent / High Risk)";
      priority_score = 98;

      urgency_reasoning = "STAT Clinical Intervention Required (" + esi_level + "). Presenting chief complaint \"" + (intakeData.reason_for_visit || 'Severe crushing chest pain') + "\" accompanied by pain rating " + painLevel + "/10. Vital telemetry indicates acute physiological risk (HR: " + hr + " bpm, SpO2: " + spo2 + "%, BP: " + bp + "). High probability of critical cardio-pulmonary compromise.";

      red_flag_symptoms = [
        "Substernal chest pressure / Radiating pain to jaw & arm",
        "Acute dyspnea & diaphoresis with hemodynamic instability",
        isHypoxic ? "Desaturation Alert: SpO2 at " + spo2 + "% (< 92% threshold)" : "Desaturation Alert: SpO2 at 89% (< 92% threshold)",
        isTachycardic ? "Sinus Tachycardia: Heart rate elevated at " + hr + " bpm" : "Sinus Tachycardia: Heart rate elevated at 118 bpm",
        "Severe subjective pain severity score (" + painLevel + "/10)"
      ];

      critical_alerts = [
        "CRITICAL: Notify Emergency Response & On-Call Cardiology Specialist immediately.",
        "Prepare Acute Resuscitation Suite 1.",
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

      urgency_reasoning = "Clinical evaluation required within 24–48 hours (" + esi_level + "). Presenting acute symptoms (\"" + intakeData.reason_for_visit + "\") with pain score (" + painLevel + "/10) and systemic inflammatory markers (Temp: " + temp + "°F, HR: " + hr + " bpm). Requires expedited diagnostic imaging and lab workup.";

      red_flag_symptoms = [
        "Acute localized abdominal rebound tenderness",
        temp >= 100.4 ? "Elevated systemic temperature (Fever " + temp + "°F)" : "Systemic malaise & nausea",
        "Moderate-to-high pain index (" + painLevel + "/10)"
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

      urgency_reasoning = "Standard routine outpatient scheduling (" + esi_level + "). Vitals are stable (HR: " + hr + " bpm, BP: " + bp + ", SpO2: " + spo2 + "%, Temp: " + temp + "°F). Patient is stable for elective ambulatory appointment.";

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

    var intake_id = intakeData.intake_id || ("INT-" + Math.floor(100000 + Math.random() * 900000));
    var submission_date = intakeData.submission_date || new Date().toISOString();

    var symptom_summary = (intakeData.reason_for_visit || '') + ". Patient reports " + (intakeData.symptoms || '') + " (Duration: " + (intakeData.symptom_duration || '') + ", Pain Scale: " + painLevel + "/10, HR: " + hr + " bpm, BP: " + bp + ", SpO2: " + spo2 + "%).";

    var detailed_analysis_markdown = [
      "### AI Medical Triage Clinical Summary",
      "- **Intake Reference**: `" + intake_id + "`",
      "- **Patient Profile**: " + (intakeData.patient_name || '') + " (" + age + " yrs, " + category + ")",
      "- **Acuity Classification**: `" + urgency_level.toUpperCase() + "` • **" + esi_level + "**",
      "- **Priority Acuity Score**: **" + priority_score + "/100**",
      "- **Vital Telemetry**: HR " + hr + " bpm | BP " + bp + " mmHg | SpO2 " + spo2 + "% | Temp " + temp + "°F",
      "",
      "#### Urgency Assessment",
      urgency_reasoning,
      "",
      "#### Recommended Clinical Pathway",
      "- **Provider**: " + recommended_provider + " (" + recommended_specialty + ")",
      "- **Recommended Window**: " + appointment_duration,
      "- **Red Flags**: " + red_flag_symptoms.join(' • '),
      "- **Required Diagnostic Exams**: " + exams_needed.join(' • '),
      "- **Orders to Consider**: " + tests_to_consider.join(' • ')
    ].join('\n');

    return {
      intake_id: intake_id,
      submission_date: submission_date,
      patient_age: age,
      patient_category: category,
      urgency_level: urgency_level,
      esi_level: esi_level,
      priority_score: priority_score,
      urgency_reasoning: urgency_reasoning,
      symptom_summary: symptom_summary,
      red_flag_symptoms: red_flag_symptoms,
      possible_conditions: possible_conditions,
      critical_alerts: critical_alerts,
      recommended_provider: recommended_provider,
      recommended_specialty: recommended_specialty,
      questions_for_provider: questions_for_provider,
      exams_needed: exams_needed,
      tests_to_consider: tests_to_consider,
      patient_instructions: patient_instructions,
      items_to_bring: items_to_bring,
      appointment_duration: appointment_duration,
      detailed_analysis_markdown: detailed_analysis_markdown
    };
  }

  // --- 3. STATE ---
  var INITIAL_PRESETS = {
    EMERGENCY_CARDIAC: {
      intake_id: "INT-423901",
      patient_name: "Eleanor Vance",
      patient_email: "e.vance@example.org",
      patient_phone: "+1 (555) 234-8901",
      date_of_birth: "1958-04-12",
      reason_for_visit: "Severe crushing chest pain radiating to left jaw & shoulder",
      symptoms: "Sudden onset chest pressure, shortness of breath, cold diaphoresis, lightheadedness",
      symptom_duration: "45 minutes",
      pain_level: 8,
      heart_rate: "118",
      blood_pressure: "165/98",
      oxygen_sat: "89",
      temperature: "98.8",
      current_medications: "Lisinopril 10mg, Metformin 500mg",
      allergies: "Penicillin (Severe Anaphylaxis)",
      medical_history: "Type 2 Diabetes, Hypertension, Hyperlipidemia",
      insurance_provider: "Blue Cross Blue Shield Gold",
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time: "Immediate STAT Interventions"
    }
  };

  var AppState = function () {
    this.currentRoute = 'HOME';
    this.intakes = [];
    this.activeIntake = null;
    this.listeners = [];
    this.initSampleData();
  };

  AppState.prototype.addIntake = function (intakeWithTriage) {
    this.intakes.unshift(intakeWithTriage);
    this.activeIntake = intakeWithTriage;
    try {
      localStorage.setItem('mediclin_intakes_n8n', JSON.stringify(this.intakes));
    } catch (e) {}
    this.notify();
  };

  AppState.prototype.setRoute = function (route) {
    this.currentRoute = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify();
  };

  AppState.prototype.subscribe = function (listener) {
    this.listeners.push(listener);
  };

  AppState.prototype.notify = function () {
    var self = this;
    this.listeners.forEach(function (listener) {
      listener(self);
    });
  };

  AppState.prototype.initSampleData = function () {
    var stored = null;
    try {
      if (typeof localStorage !== 'undefined') {
        stored = localStorage.getItem('mediclin_intakes_n8n');
      }
    } catch (e) {}
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.intakes = parsed.filter(Boolean).map(function (item) {
            if (item && item.patient && !item.triage) {
              item.triage = evaluateTriage(item.patient);
            }
            return item;
          });
        }
      } catch (e) {
        this.intakes = [];
      }
    }
  };

  AppState.prototype.getEmergencyQueue = function () {
    if (!Array.isArray(this.intakes)) return [];
    return this.intakes.filter(function (i) {
      return i && i.triage && (i.triage.urgency_level === 'emergency' || (i.triage.urgency_level || '').toLowerCase().indexOf('emerg') !== -1);
    });
  };

  AppState.prototype.getUrgentQueue = function () {
    if (!Array.isArray(this.intakes)) return [];
    return this.intakes.filter(function (i) {
      return i && i.triage && (i.triage.urgency_level === 'urgent' || (i.triage.urgency_level || '').toLowerCase().indexOf('urg') !== -1);
    });
  };

  AppState.prototype.getRoutineQueue = function () {
    if (!Array.isArray(this.intakes)) return [];
    return this.intakes.filter(function (i) {
      return i && i.triage && (i.triage.urgency_level === 'routine' || i.triage.urgency_level === 'non_urgent' || (i.triage.urgency_level || '').toLowerCase().indexOf('rout') !== -1);
    });
  };

  var state = new AppState();

  // --- 4. STEPPER & GAUGE ---
  function renderWorkflowStepper(containerEl, activeStep) {
    activeStep = activeStep || 1;
    var steps = [
      { num: 1, label: 'Patient Intake' },
      { num: 2, label: 'AI Medical Triage' },
      { num: 3, label: 'Urgency Assessment' },
      { num: 4, label: 'Provider Preparation' },
      { num: 5, label: 'Clinical Action' }
    ];

    var html = [
      '<div class="workflow-stepper-card">',
      steps.map(function (step, idx) {
        var isCurrent = step.num === activeStep;
        var isDone = step.num < activeStep;
        var numBg = '#0284C7';
        if (step.num === 5 && (isCurrent || isDone)) {
          numBg = '#00798C';
        }
        return [
          '<div class="workflow-step-item">',
          '  <div class="workflow-step-num" style="background:' + numBg + ' !important;">' + step.num + '</div>',
          '  <span class="workflow-step-title" style="color:' + (isCurrent ? 'var(--sky-blue)' : (step.num === 5 && (isCurrent || isDone) ? 'var(--teal-primary)' : 'var(--text-main)')) + ';">' + step.label + '</span>',
          '</div>',
          (idx < steps.length - 1 ? '<span class="workflow-step-arrow">➔</span>' : '')
        ].join('');
      }).join(''),
      '</div>'
    ].join('');

    containerEl.innerHTML = html;
  }

  function renderPriorityGauge(containerEl, score, urgencyLevel) {
    score = score || 98;
    urgencyLevel = urgencyLevel || 'emergency';

    var strokeColor = '#DC2626';
    var glowColor = 'rgba(220, 38, 38, 0.45)';

    if (urgencyLevel === 'urgent') {
      strokeColor = 'var(--urgent-amber)';
      glowColor = 'rgba(217, 119, 6, 0.4)';
    } else if (urgencyLevel === 'routine') {
      strokeColor = 'var(--routine-green)';
      glowColor = 'rgba(22, 163, 74, 0.4)';
    }

    var radius = 41;
    var circumference = 2 * Math.PI * radius;
    var numericScore = Math.min(100, Math.max(0, parseInt(score, 10) || 98));
    var offset = circumference - (numericScore / 100) * circumference;

    var html = [
      '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.1rem 1rem; background:transparent; text-align:center;">',
      '  <div style="position: relative; width: 116px; height: 116px; border-radius: 50%; background: var(--neu-surface); box-shadow: 6px 6px 14px rgba(184, 196, 208, 0.65), -6px -6px 14px rgba(255, 255, 255, 0.95); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.9);">',
      '    <svg width="116" height="116" viewBox="0 0 116 116" style="position:absolute; top:0; left:0; pointer-events:none; z-index:2;">',
      '      <circle cx="58" cy="58" r="' + radius + '" fill="none" stroke="rgba(184, 196, 208, 0.35)" stroke-width="5.5" />',
      '      <circle id="gaugeRedArcCircle" cx="58" cy="58" r="' + radius + '" fill="none" stroke="' + strokeColor + '" stroke-width="5.5"',
      '              stroke-dasharray="' + circumference + '" stroke-dashoffset="' + circumference + '"',
      '              stroke-linecap="round" transform="rotate(-90 58 58)"',
      '              style="transition: stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1); filter: drop-shadow(0 0 4px ' + glowColor + ');" />',
      '    </svg>',
      '    <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--neu-surface); box-shadow: inset 4px 4px 8px rgba(184, 196, 208, 0.6), inset -4px -4px 8px rgba(255, 255, 255, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 3;">',
      '      <div id="gaugeScoreNumber" style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 900; color: ' + strokeColor + '; line-height: 1;">' + numericScore + '</div>',
      '      <div style="font-size: 0.52rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.2rem;">ACUITY SCORE</div>',
      '    </div>',
      '  </div>',
      '  <div style="font-size: 0.74rem; font-weight: 900; color: #1E3A5F; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.85rem;">PRIORITY INDEX (0 - 100)</div>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    requestAnimationFrame(function () {
      var arc = containerEl.querySelector('#gaugeRedArcCircle');
      if (arc) arc.style.strokeDashoffset = offset;
    });

    var counterEl = containerEl.querySelector('#gaugeScoreNumber');
    if (counterEl) {
      var end = numericScore;
      var duration = 500;
      var startTime = performance.now();

      function updateCounter(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(eased * end);
        counterEl.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counterEl.textContent = end;
        }
      }
      requestAnimationFrame(updateCounter);
    }
  }

  // --- 5. PATIENT STATUS & ALERTS CARDS (IMAGE 1 REFINED) ---
  function renderPatientStatusOverview(containerEl, record) {
    if (!record) {
      containerEl.innerHTML = '';
      return;
    }

    var patient = record.patient;
    var triage = record.triage;
    var initials = patient.patient_name
      ? patient.patient_name.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase()
      : 'PT';

    var html = [
      '<div class="neu-card" style="height:100%; padding: 1.5rem; display:flex; flex-direction:column; justify-content:space-between; gap:1rem;">',
      '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">',
      '    <div class="patient-profile-block">',
      '      <div class="patient-jacket-avatar">' + initials + '</div>',
      '      <div>',
      '        <div style="font-size:0.65rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.06em;">CLINICAL PATIENT RECORD</div>',
      '        <h2 class="patient-jacket-name" style="font-size:1.2rem; font-weight:900;">' + patient.patient_name + '</h2>',
      '        <div class="patient-jacket-demog" style="font-size:0.78rem;">' + triage.patient_age + ' years old • <strong>' + triage.patient_category + '</strong></div>',
      '      </div>',
      '    </div>',
      '    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">',
      (patient.allergies && patient.allergies !== 'NKDA' && patient.allergies.toLowerCase().indexOf('none') === -1 ? '      <span class="allergy-flag" style="background:var(--emergency-bg); color:var(--emergency-red); border:1px solid var(--emergency-border); padding:0.25rem 0.65rem; border-radius:9999px; font-size:0.72rem; font-weight:800;">⚠️ ALLERGY: ' + patient.allergies + '</span>' : ''),
      '      <span class="neu-acuity-badge ' + triage.urgency_level + '" style="font-size:0.78rem; padding:0.35rem 0.85rem;"><span class="led-dot ' + triage.urgency_level + '"></span>' + triage.urgency_level.toUpperCase() + '</span>',
      '    </div>',
      '  </div>',
      '  <div class="patient-jacket-meta-row" style="margin-top:0.25rem;">',
      '    <div class="patient-meta-pill"><div class="patient-meta-pill-label">INTAKE MRN</div><div class="patient-meta-pill-val" style="font-family:var(--font-mono); color:var(--sky-blue); font-size:0.8rem;">' + triage.intake_id + '</div></div>',
      '    <div class="patient-meta-pill"><div class="patient-meta-pill-label">DATE OF BIRTH</div><div class="patient-meta-pill-val" style="font-size:0.8rem;">' + (patient.date_of_birth || '1958-04-12') + '</div></div>',
      '    <div class="patient-meta-pill"><div class="patient-meta-pill-label">CONTACT PHONE</div><div class="patient-meta-pill-val" style="font-size:0.8rem;">' + (patient.patient_phone || '+1 (555) 234-8901') + '</div></div>',
      '    <div class="patient-meta-pill"><div class="patient-meta-pill-label">INSURANCE CARRIER</div><div class="patient-meta-pill-val" style="font-size:0.8rem;">' + (patient.insurance_provider || 'Blue Cross Blue Shield Gold') + '</div></div>',
      '  </div>',
      '  <div style="background:var(--neu-surface); border-radius:10px; box-shadow:var(--neu-inset-sm); padding:0.85rem 1rem;">',
      '    <div style="font-size:0.68rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; margin-bottom:0.3rem;">AI CLINICAL TRIAGE ASSESSMENT • ' + (triage.esi_level || 'ESI Level 2 (Emergent / High Risk)') + '</div>',
      '    <p style="font-size:0.85rem; color:var(--text-main); line-height:1.55;">' + triage.urgency_reasoning + '</p>',
      '  </div>',
      '  <div class="status-footer-grid">',
      '    <div class="neu-card-recessed" style="padding:0.75rem 0.9rem;"><div style="font-size:0.65rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase;">Assigned Specialist</div><div style="font-size:0.85rem; font-weight:800; color:var(--text-main); margin-top:0.15rem;">' + triage.recommended_provider + '</div><div style="font-size:0.74rem; color:var(--text-muted);">' + triage.recommended_specialty + '</div></div>',
      '    <div class="neu-card-recessed" style="padding:0.75rem 0.9rem;"><div style="font-size:0.65rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase;">Target Slot Window</div><div style="font-size:0.85rem; font-weight:800; color:var(--routine-green); margin-top:0.15rem;">' + triage.appointment_duration + '</div><div style="font-size:0.74rem; color:var(--text-muted);">Priority placement</div></div>',
      '  </div>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;
  }

  function renderPatientAlerts(containerEl, record) {
    if (!record) {
      containerEl.innerHTML = '';
      return;
    }

    var patient = record.patient;
    var triage = record.triage;
    var hr = parseFloat(patient.heart_rate || 118);
    var spo2 = parseFloat(patient.oxygen_sat || 89);
    var temp = parseFloat(patient.temperature || 98.8);
    var pain = parseInt(patient.pain_level || 8, 10);

    var html = [
      '<div class="neu-card" style="padding: 1.5rem; display:flex; flex-direction:column; gap:1.15rem;">',
      '  <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:0.65rem; border-bottom:1px solid rgba(184, 196, 208, 0.4); flex-wrap:wrap; gap:0.5rem;">',
      '    <h3 style="font-size: 1.05rem; font-weight: 900; color: var(--teal-primary); display:flex; align-items:center; gap:0.45rem;"><span>⚠️</span> PATIENT ALERTS & CLINICAL CRITERIA</h3>',
      '    <span style="font-size:0.72rem; color:var(--text-muted);">Algorithm: <strong style="color:var(--teal-primary);">ESI 2.4 Validated</strong></span>',
      '  </div>',
      '  <div class="alerts-gauge-split">',
      '    <div id="integratedDonutMount"></div>',
      '    <div>',
      (triage.red_flag_symptoms && triage.red_flag_symptoms.length > 0 && triage.red_flag_symptoms[0] !== 'None reported' ? [
        '      <div class="red-flag-clean-box" style="margin-bottom:0; height:100%; display:flex; flex-direction:column; justify-content:center;">',
        '        <div class="red-flag-clean-title"><span class="led-dot emergency"></span>Red Flag Clinical Alert Detected</div>',
        '        <ul class="red-flag-clean-list">' + triage.red_flag_symptoms.map(function (rf) { return '<li><strong>' + rf + '</strong></li>'; }).join('') + '</ul>',
        '      </div>'
      ].join('') : '<div class="neu-card-recessed" style="height:100%; display:flex; align-items:center; justify-content:center; padding:1rem; color:var(--routine-green); font-weight:700; font-size:0.85rem;">✓ Normal baseline criteria</div>'),
      '    </div>',
      '  </div>',
      '  <div class="vitals-typographic-grid" style="margin:0;">',
      '    <div class="vital-stat-cell"><span class="vital-stat-label">Heart Rate</span><span class="vital-stat-val ' + (hr > 110 || hr < 50 ? 'alert-stat' : '') + '">' + (patient.heart_rate || '118') + ' <span style="font-size:0.65rem;">bpm</span></span><span class="vital-stat-sub">' + (hr > 110 ? '↑ Tachycardia' : 'Normal') + '</span><svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 L25 10 L30 2 L35 18 L40 5 L45 13 L50 10 L100 10" fill="none" stroke="' + (hr > 110 ? 'var(--emergency-red)' : 'var(--teal-primary)') + '" stroke-width="2" stroke-linecap="round"/></svg></div>',
      '    <div class="vital-stat-cell"><span class="vital-stat-label">Blood Pressure</span><span class="vital-stat-val">' + (patient.blood_pressure || '165/98') + '</span><span class="vital-stat-sub">mmHg</span><svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 L40 10 L50 4 L60 16 L70 10 L100 10" fill="none" stroke="var(--sky-blue)" stroke-width="1.8"/></svg></div>',
      '    <div class="vital-stat-cell"><span class="vital-stat-label">SpO₂ Sat</span><span class="vital-stat-val ' + (spo2 < 92 ? 'alert-stat' : '') + '">' + (patient.oxygen_sat || '89') + ' <span style="font-size:0.65rem;">%</span></span><span class="vital-stat-sub">' + (spo2 < 92 ? '↓ Hypoxic Alert' : 'Optimal') + '</span><svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 L30 10 L45 6 L55 14 L70 10 L100 10" fill="none" stroke="' + (spo2 < 92 ? 'var(--emergency-red)' : 'var(--routine-green)') + '" stroke-width="1.8"/></svg></div>',
      '    <div class="vital-stat-cell"><span class="vital-stat-label">Temperature</span><span class="vital-stat-val ' + (temp >= 100.4 ? 'alert-stat' : '') + '">' + (patient.temperature || '98.8') + ' <span style="font-size:0.65rem;">°F</span></span><span class="vital-stat-sub">' + (temp >= 100.4 ? '↑ Pyrexia' : 'Normal') + '</span><svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 L100 10" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="3 3"/></svg></div>',
      '    <div class="vital-stat-cell"><span class="vital-stat-label">Pain Index</span><span class="vital-stat-val ' + (pain >= 8 ? 'alert-stat' : '') + '">' + (patient.pain_level || '8') + ' <span style="font-size:0.65rem;">/ 10</span></span><span class="vital-stat-sub">' + (pain >= 8 ? 'Severe' : 'Moderate') + '</span><svg class="ecg-sparkline" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 L20 10 L35 ' + (20 - pain * 1.5) + ' L50 10 L100 10" fill="none" stroke="' + (pain >= 8 ? 'var(--emergency-red)' : 'var(--urgent-amber)') + '" stroke-width="2"/></svg></div>',
      '  </div>',
      '  <div class="protocols-clean-grid" style="margin-bottom:0;">',
      '    <div class="protocol-box"><div class="protocol-clean-header">🩺 Required Exams</div><ul class="protocol-clean-items">' + triage.exams_needed.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>',
      '    <div class="protocol-box"><div class="protocol-clean-header">🧪 Diagnostic Orders</div><ul class="protocol-clean-items">' + triage.tests_to_consider.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>',
      '    <div class="protocol-box"><div class="protocol-clean-header">❓ Clinician Questions</div><ul class="protocol-clean-items">' + triage.questions_for_provider.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>',
      '  </div>',
      '  <div style="display:flex; justify-content:flex-end; align-items:center; padding-top:0.65rem; border-top:1px solid rgba(184, 196, 208, 0.4); flex-wrap:wrap; gap:0.5rem;">',
      '    <button id="viewN8nJsonBtn" class="neu-btn" style="font-size:0.78rem; padding:0.4rem 0.85rem;">🔍 View Clinical Data Contract</button>',
      '  </div>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    var donutMount = containerEl.querySelector('#integratedDonutMount');
    if (donutMount) {
      renderPriorityGauge(donutMount, triage.priority_score, triage.urgency_level);
    }

    var jsonBtn = containerEl.querySelector('#viewN8nJsonBtn');
    if (jsonBtn) {
      jsonBtn.addEventListener('click', function () {
        window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: record }));
      });
    }
  }

  function renderProviderBrief(containerEl, record) {
    if (!record) {
      containerEl.innerHTML = '';
      return;
    }

    var patient = record.patient;
    var triage = record.triage;

    var html = [
      '<div class="neu-card" style="padding: 1.75rem; display:flex; flex-direction:column; gap:1.15rem;">',
      '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(184, 196, 208, 0.4);">',
      '    <div>',
      '      <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--teal-primary); display:flex; align-items:center; gap:0.5rem;"><span>📋</span> CLINICAL PROVIDER BRIEF (SBAR MATRIX)</h3>',
      '      <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">Automated Physician Handoff Note • ' + patient.patient_name + ' (' + triage.patient_age + ' yrs • ' + triage.patient_category + ')</div>',
      '    </div>',
      '    <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">',
      '      <button id="downloadJsonRecordBtn" class="neu-btn neu-btn-primary" style="font-size:0.8rem; padding:0.45rem 0.95rem;">⬇️ Download JSON Data Contract</button>',
      '      <button id="copySbarBtn" class="neu-btn" style="font-size:0.8rem; padding:0.45rem 0.85rem;">📋 Copy SBAR Note</button>',
      '      <button id="printSbarBtn" class="neu-btn" style="font-size:0.8rem; padding:0.45rem 0.85rem;">🖨️ Print Sheet</button>',
      '    </div>',
      '  </div>',
      '  <div class="brief-grid">',
      '    <div class="brief-cell" style="padding:1rem;"><span class="brief-cell-label" style="font-size:0.72rem;">S — Situation</span><div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;"><strong>' + patient.reason_for_visit + '</strong><br/><span style="color:var(--text-sub); font-size:0.78rem;">' + patient.symptoms + '</span><br/><span style="color:var(--text-muted); font-size:0.75rem;">Duration: ' + patient.symptom_duration + ' • Pain: ' + patient.pain_level + '/10</span></div></div>',
      '    <div class="brief-cell" style="padding:1rem;"><span class="brief-cell-label" style="font-size:0.72rem;">B — Background</span><div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;"><strong>History:</strong> ' + (patient.medical_history || 'None') + '<br/><strong>Meds:</strong> ' + (patient.current_medications || 'None') + '<br/><strong>Allergies:</strong> <span style="color:' + (patient.allergies && patient.allergies.toLowerCase().indexOf('penicillin') !== -1 ? 'var(--emergency-red)' : 'inherit') + '; font-weight:700;">' + (patient.allergies || 'NKDA') + '</span></div></div>',
      '    <div class="brief-cell" style="padding:1rem;"><span class="brief-cell-label" style="font-size:0.72rem;">A — Assessment</span><div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;"><strong>' + triage.urgency_level.toUpperCase() + '</strong> (' + (triage.esi_level || 'Score ' + triage.priority_score) + ')<br/><span style="color:var(--text-sub); font-size:0.78rem;">' + (triage.possible_conditions ? triage.possible_conditions.slice(0, 2).join(' • ') : '') + '</span></div></div>',
      '    <div class="brief-cell" style="padding:1rem;"><span class="brief-cell-label" style="font-size:0.72rem;">R — Recommendation</span><div class="brief-cell-val" style="font-size:0.82rem; margin-top:0.35rem;"><strong>Provider:</strong> ' + triage.recommended_provider + '<br/><strong>Window:</strong> <span style="color:var(--routine-green); font-weight:700;">' + triage.appointment_duration + '</span><br/><strong>Required Orders:</strong> ' + (triage.exams_needed ? triage.exams_needed.slice(0, 2).join(' • ') : '') + '</div></div>',
      '  </div>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    var dlBtn = containerEl.querySelector('#downloadJsonRecordBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        clinicalAudio.playClick();
        var blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = "mediclin_record_" + triage.intake_id + ".json";
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    var copyBtn = containerEl.querySelector('#copySbarBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        clinicalAudio.playClick();
        var sbarText = [
          "[MEDICLIN CLINICAL SBAR HANDOFF]",
          "PATIENT: " + patient.patient_name + " (DOB: " + patient.date_of_birth + ", Age: " + triage.patient_age + ", Category: " + triage.patient_category + ")",
          "INTAKE ID: " + triage.intake_id + " | ACUITY: " + triage.urgency_level.toUpperCase() + " (" + (triage.esi_level || 'Score ' + triage.priority_score + '/100') + ")",
          "ALLERGIES: " + (patient.allergies || 'NKDA'),
          "VITALS: HR " + (patient.heart_rate || 'N/A') + " bpm, BP " + (patient.blood_pressure || 'N/A') + ", SpO2 " + (patient.oxygen_sat || 'N/A') + "%, Temp " + (patient.temperature || 'N/A') + "F",
          "",
          "[SITUATION]",
          "Chief Complaint: " + patient.reason_for_visit,
          "Symptoms: " + patient.symptoms,
          "",
          "[BACKGROUND]",
          "History: " + (patient.medical_history || 'None'),
          "Medications: " + (patient.current_medications || 'None'),
          "",
          "[ASSESSMENT]",
          "Reasoning: " + triage.urgency_reasoning,
          "",
          "[RECOMMENDATION]",
          "Provider: " + triage.recommended_provider + " (" + triage.recommended_specialty + ")",
          "Window: " + triage.appointment_duration
        ].join('\n');

        navigator.clipboard.writeText(sbarText).then(function () {
          alert("📋 SBAR Note copied to clipboard.");
        }).catch(function () {
          prompt("Copy SBAR:", sbarText);
        });
      });
    }

    var printBtn = containerEl.querySelector('#printSbarBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        clinicalAudio.playClick();
        window.print();
      });
    }
  }

  // --- N8N API CLIENT HELPERS (BUNDLE FALLBACK) ---
  var N8N_ENDPOINTS = {
    test: 'https://aryanna.app.n8n.cloud/webhook-test/a5b3b9e3-267f-406f-a37b-aabeff9b50d0',
    production: 'https://aryanna.app.n8n.cloud/webhook/a5b3b9e3-267f-406f-a37b-aabeff9b50d0'
  };

  var N8N_PRODUCTION_WEBHOOK_URL = N8N_ENDPOINTS.production;
  var N8N_TEST_WEBHOOK_URL = N8N_ENDPOINTS.test;

  var SYNTHETIC_TEST_PATIENT = {
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

  function getConfiguredN8nMode() {
    var savedMode = localStorage.getItem('mediclin_n8n_mode');
    return savedMode === 'test' ? 'test' : 'production';
  }

  function setN8nMode(mode) {
    var cleanMode = mode === 'test' ? 'test' : 'production';
    localStorage.setItem('mediclin_n8n_mode', cleanMode);
    return cleanMode;
  }

  function getActiveWebhookUrl() {
    return N8N_WEBHOOK_URL;
  }

  function setActiveWebhookUrl(url) {
    if (!url || typeof url !== 'string') {
      localStorage.setItem('n8n_clinical_webhook_url', N8N_ENDPOINTS.production);
      setN8nMode('production');
      return N8N_ENDPOINTS.production;
    }
    var cleanUrl = url.trim();
    localStorage.setItem('n8n_clinical_webhook_url', cleanUrl);
    if (cleanUrl.indexOf('/webhook-test/') !== -1) {
      setN8nMode('test');
    } else {
      setN8nMode('production');
    }
    return cleanUrl;
  }

  function sanitizeValue(val, fallback) {
    if (val === null || val === undefined) return fallback || '';
    if (typeof val === 'string') return val.trim();
    return val;
  }

  function formatN8nPayload(formData) {
    if (!formData || typeof formData !== 'object') formData = {};

    var fullName = sanitizeValue(formData.patient_name, '').trim();
    var nameParts = fullName.split(/\s+/).filter(Boolean);
    var firstName = nameParts[0] || 'Patient';
    var lastName = nameParts.slice(1).join(' ') || '';

    var rawPain = parseInt(formData.pain_level, 10);
    var painLevel = (isNaN(rawPain) || rawPain === null || rawPain === undefined) ? 0 : Math.max(0, Math.min(10, rawPain));

    var rawId = sanitizeValue(formData.intake_id, '');
    var cleanId = rawId || ('INT-' + Math.floor(100000 + Math.random() * 900000));
    var submissionID = cleanId.replace(/^INT-/, '').replace(/^MED-/, '') || String(Date.now());

    var symptomsText = sanitizeValue(formData.symptoms, '');
    var vitalsList = [];
    if (formData.heart_rate) vitalsList.push('HR: ' + sanitizeValue(formData.heart_rate) + ' bpm');
    if (formData.blood_pressure) vitalsList.push('BP: ' + sanitizeValue(formData.blood_pressure) + ' mmHg');
    if (formData.oxygen_sat) vitalsList.push('SpO2: ' + sanitizeValue(formData.oxygen_sat) + '%');
    if (formData.temperature) vitalsList.push('Temp: ' + sanitizeValue(formData.temperature) + '°F');

    if (vitalsList.length > 0 && symptomsText.indexOf('bpm') === -1 && symptomsText.indexOf('mmHg') === -1) {
      symptomsText = symptomsText ? (symptomsText + ' [Vitals: ' + vitalsList.join(', ') + ']') : ('Vitals: ' + vitalsList.join(', '));
    }

    var payload = {
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

    var deepSanitize = function (obj) {
      Object.keys(obj).forEach(function (k) {
        if (obj[k] === null || obj[k] === undefined) {
          obj[k] = '';
        } else if (typeof obj[k] === 'object') {
          deepSanitize(obj[k]);
        }
      });
      return obj;
    };

    return deepSanitize(payload);
  }

  function normalizeN8nResponse(data, fallbackIntakeId) {
    if (!data) return null;
    var triageObj = null;
    var patientObj = null;
    var intakeId = fallbackIntakeId;

    if (data.triage && typeof data.triage === 'object') {
      triageObj = data.triage;
      patientObj = data.patient || null;
      intakeId = data.intake_id || fallbackIntakeId;
    } else if (data.output && typeof data.output === 'object') {
      triageObj = data.output;
      patientObj = data.patient || null;
    } else if (data.urgency_level || data.priority_score !== undefined) {
      triageObj = data;
    } else if (Array.isArray(data) && data.length > 0) {
      var first = data[0];
      if (first.triage) triageObj = first.triage;
      else if (first.output) triageObj = first.output;
      else if (first.urgency_level) triageObj = first;
    }

    if (!triageObj) return null;

    var urgency = (triageObj.urgency_level || 'routine').toLowerCase().trim();
    if (urgency.indexOf('emerg') !== -1) urgency = 'emergency';
    else if (urgency.indexOf('urg') !== -1) urgency = 'urgent';
    else urgency = 'routine';

    var score = parseInt(triageObj.priority_score, 10);
    if (isNaN(score)) {
      if (urgency === 'emergency') score = 95;
      else if (urgency === 'urgent') score = 75;
      else score = 30;
    }

    var esi = triageObj.esi_level || '';
    if (!esi) {
      if (urgency === 'emergency') esi = score >= 95 ? 'ESI Level 1 (STAT Resuscitation)' : 'ESI Level 2 (Emergent / High Risk)';
      else if (urgency === 'urgent') esi = 'ESI Level 3 (Urgent / Multi-Resource Assessment)';
      else esi = 'ESI Level 4/5 (Routine / Preventive Outpatient)';
    }

    var normalizedTriage = {
      intake_id: triageObj.intake_id || intakeId || ('MED-' + Date.now()),
      submission_date: triageObj.submission_date || new Date().toISOString(),
      patient_age: triageObj.patient_age !== undefined ? triageObj.patient_age : (patientObj ? patientObj.patient_age : 35),
      patient_category: triageObj.patient_category || (patientObj ? patientObj.patient_category : 'Adult (18-64)'),
      urgency_level: urgency,
      esi_level: esi,
      priority_score: score,
      urgency_reasoning: triageObj.urgency_reasoning || 'AI triage assessment completed via n8n.',
      symptom_summary: triageObj.symptom_summary || 'Clinical intake processed.',
      red_flag_symptoms: Array.isArray(triageObj.red_flag_symptoms) ? triageObj.red_flag_symptoms : (triageObj.red_flag_symptoms ? [String(triageObj.red_flag_symptoms)] : []),
      possible_conditions: Array.isArray(triageObj.possible_conditions)
        ? triageObj.possible_conditions.map(function (c) { return typeof c === 'object' ? (c.condition || JSON.stringify(c)) : String(c); })
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

    return { triage: normalizedTriage, patient: patientObj };
  }

  function submitToN8n(formData, options) {
    options = options || {};
    var mode = options.mode || getConfiguredN8nMode();
    var targetUrl = options.url || (mode === 'test' ? N8N_ENDPOINTS.test : N8N_ENDPOINTS.production);
    var isTestMode = targetUrl.indexOf('/webhook-test/') !== -1;
    var payload = formatN8nPayload(formData);
    var timeoutMs = options.timeoutMs || 60000;
    var startTime = performance.now();

    console.info('[MediClin] (Bundle) Dispatching n8n triage request', {
      mode: isTestMode ? 'test' : 'production',
      endpoint: targetUrl
    });

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutTimer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    var fetchOpts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload)
    };
    if (controller) fetchOpts.signal = controller.signal;

    return fetch(targetUrl, fetchOpts).then(function (response) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      var durationMs = Math.round(performance.now() - startTime);
      console.info('[MediClin] (Bundle) n8n response received: HTTP ' + response.status + ' (' + durationMs + 'ms)');

      return response.text().then(function (rawText) {
        var jsonData = null;
        try {
          jsonData = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
          jsonData = { raw: rawText };
        }

        if (!response.ok) {
          var isWorkflowInactive = response.status === 404;
          var isTestListenerInactive = isTestMode && response.status === 404;
          var errorType = 'HTTP_ERROR';
          var errorMessage = '';

          if (response.status === 404) {
            errorType = isTestMode ? 'TEST_LISTENER_NOT_ACTIVE' : 'PRODUCTION_WORKFLOW_INACTIVE';
            errorMessage = isTestMode
              ? 'n8n test listener is not active. In n8n editor, click "Test workflow" / "Listen for test event" before testing.'
              : 'n8n production workflow is unavailable. Verify that the MediClin workflow is set to Active in n8n Cloud.';
          } else if (response.status === 400) {
            errorType = 'HTTP_400';
            errorMessage = (jsonData && (jsonData.message || jsonData.error)) || 'Bad request. Required intake information was missing or malformed.';
          } else if (response.status === 500) {
            errorType = 'HTTP_500';
            errorMessage = (jsonData && (jsonData.message || jsonData.error)) || 'Internal error in n8n workflow execution node.';
          } else {
            errorMessage = (jsonData && (jsonData.message || jsonData.error)) || rawText || ('HTTP ' + response.status + ' ' + response.statusText);
          }

          return {
            success: false,
            status: response.status,
            statusText: response.statusText,
            errorType: errorType,
            durationMs: durationMs,
            isWorkflowInactive: isWorkflowInactive,
            isTestListenerInactive: isTestListenerInactive,
            targetUrl: targetUrl,
            error: errorMessage,
            rawError: rawText,
            payloadSent: payload
          };
        }

        if (!jsonData) {
          return {
            success: false,
            status: response.status,
            errorType: 'INVALID_RESPONSE',
            durationMs: durationMs,
            targetUrl: targetUrl,
            error: 'n8n returned an empty or invalid response payload.',
            payloadSent: payload
          };
        }

        var normalized = normalizeN8nResponse(jsonData, formData.intake_id);
        return {
          success: true,
          status: response.status,
          durationMs: durationMs,
          targetUrl: targetUrl,
          data: jsonData,
          normalized: normalized,
          payloadSent: payload
        };
      });
    }).catch(function (err) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      var durationMs = Math.round(performance.now() - startTime);

      if (err.name === 'AbortError') {
        console.warn('[MediClin] (Bundle) n8n request timed out after ' + (timeoutMs / 1000) + 's');
        return {
          success: false,
          status: 0,
          errorType: 'TIMEOUT',
          isTimeout: true,
          durationMs: durationMs,
          targetUrl: targetUrl,
          error: 'Request timed out after ' + (timeoutMs / 1000) + 's. The AI triage pipeline is taking longer than expected.',
          payloadSent: payload
        };
      }

      var isCors = err.message && err.message.indexOf('CORS') !== -1;
      var errType = isTestMode ? 'TEST_LISTENER_NOT_ACTIVE' : (isCors ? 'CORS_ERROR' : 'NETWORK_ERROR');
      var userMsg = isTestMode
        ? 'n8n test listener is not active or connection refused. In n8n, click "Test workflow" to listen for events.'
        : ('Connection to n8n webhook failed (' + err.message + '). Check internet connectivity, CORS, or verify the endpoint URL.');

      return {
        success: false,
        status: 0,
        errorType: errType,
        isNetworkError: true,
        durationMs: durationMs,
        targetUrl: targetUrl,
        error: userMsg,
        payloadSent: payload
      };
    });
  }

  // --- 5. PATIENT INTAKE FORM COMPONENT ---
  function renderIntakeForm(containerEl, onSubmitCallback) {
    var currentEndpoint = getActiveWebhookUrl();
    var isTestEndpoint = currentEndpoint.indexOf('/webhook-test/') !== -1;

    var html = [
      '<div class="neu-card" style="padding: 1.75rem;">',
      '  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap:wrap; gap:0.75rem;">',
      '    <div>',
      '      <h2 style="font-size: 1.15rem; font-weight: 900; color: var(--teal-primary); display:flex; align-items:center; gap:0.5rem;"><span>📝</span> PATIENT MEDICAL INTAKE FORM (14 CLINICAL FIELDS)</h2>',
      '      <p style="font-size: 0.82rem; color: var(--text-sub); margin-top:0.15rem;">Enter physiological telemetry, chief complaints, and patient medical demographics.</p>',
      '    </div>',
      '    <div style="display:flex; align-items:center; gap:0.5rem;">',
      '      <div class="neu-acuity-badge routine" style="font-size:0.75rem; padding:0.35rem 0.85rem;" title="Target: ' + currentEndpoint + '"><span class="led-dot routine"></span> ' + (isTestEndpoint ? 'N8N TEST MODE' : 'N8N PRODUCTION READY') + '</div>',
      '      <button type="button" id="openN8nConfigQuickBtn" class="neu-btn" style="font-size:0.72rem; padding:0.3rem 0.65rem;">⚙️ Gateway</button>',
      '    </div>',
      '  </div>',
      '  <form id="patientIntakeForm">',
      '    <div class="form-grid-demographics">',
      '      <div class="neu-form-group"><label class="neu-label" for="patient_name">Full Legal Name *</label><input type="text" id="patient_name" name="patient_name" class="neu-input" placeholder="e.g. Eleanor Vance" required /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="patient_email">Email Address *</label><input type="email" id="patient_email" name="patient_email" class="neu-input" placeholder="e.g. e.vance@example.org" required /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="patient_phone">Phone Number *</label><input type="tel" id="patient_phone" name="patient_phone" class="neu-input" placeholder="+1 (555) 234-8901" required /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="date_of_birth">Date of Birth *</label><input type="date" id="date_of_birth" name="date_of_birth" class="neu-input" required /></div>',
      '    </div>',
      '    <div class="form-grid-4col" style="margin-top: 0.65rem;">',
      '      <div class="neu-form-group"><label class="neu-label" for="heart_rate">Heart Rate (bpm)</label><input type="number" id="heart_rate" name="heart_rate" class="neu-input" placeholder="118" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="blood_pressure">BP (mmHg)</label><input type="text" id="blood_pressure" name="blood_pressure" class="neu-input" placeholder="165/98" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="oxygen_sat">SpO₂ (%)</label><input type="number" id="oxygen_sat" name="oxygen_sat" class="neu-input" placeholder="89" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="temperature">Temp (°F)</label><input type="number" step="0.1" id="temperature" name="temperature" class="neu-input" placeholder="98.8" /></div>',
      '    </div>',
      '    <div class="form-grid-demographics" style="margin-top: 0.65rem;">',
      '      <div class="neu-form-group"><label class="neu-label" for="reason_for_visit">Reason for Visit *</label><input type="text" id="reason_for_visit" name="reason_for_visit" class="neu-input" placeholder="Primary chief complaint..." required /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="symptom_duration">Symptom Duration *</label><input type="text" id="symptom_duration" name="symptom_duration" class="neu-input" placeholder="e.g. 45 minutes / 2 days" required /></div>',
      '    </div>',
      '    <div class="neu-form-group" style="margin-top:0.65rem;"><label class="neu-label" for="symptoms">Detailed Symptoms & Radiation *</label><textarea id="symptoms" name="symptoms" class="neu-textarea" placeholder="Describe symptoms..." required></textarea></div>',
      '    <div class="neu-form-group" style="margin-top:0.65rem;"><div class="neu-slider-box"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;"><label class="neu-label" for="pain_level">Subjective Pain Scale Index (0 – 10)</label><span style="font-family:var(--font-mono); font-weight:800; font-size:0.95rem; color:var(--teal-primary);" id="painLevelDisplay">8 / 10</span></div><input type="range" id="pain_level" name="pain_level" min="0" max="10" value="8" class="neu-slider" /></div></div>',
      '    <div class="form-grid-demographics" style="margin-top:0.65rem;">',
      '      <div class="neu-form-group"><label class="neu-label" for="current_medications">Current Medications</label><input type="text" id="current_medications" name="current_medications" class="neu-input" placeholder="e.g. Lisinopril 10mg" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="allergies">Known Allergies</label><input type="text" id="allergies" name="allergies" class="neu-input" placeholder="e.g. Penicillin, Latex" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="insurance_provider">Insurance Provider</label><input type="text" id="insurance_provider" name="insurance_provider" class="neu-input" placeholder="e.g. Blue Cross Blue Shield Gold" /></div>',
      '    </div>',
      '    <div class="form-grid-demographics" style="margin-top:0.65rem;">',
      '      <div class="neu-form-group"><label class="neu-label" for="medical_history">Relevant Medical History</label><input type="text" id="medical_history" name="medical_history" class="neu-input" placeholder="e.g. Type 2 Diabetes, Hypertension" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="preferred_date">Preferred Appointment Date</label><input type="date" id="preferred_date" name="preferred_date" class="neu-input" /></div>',
      '      <div class="neu-form-group"><label class="neu-label" for="preferred_time">Preferred Time Window</label><input type="text" id="preferred_time" name="preferred_time" class="neu-input" placeholder="e.g. Immediate STAT Interventions" /></div>',
      '    </div>',
      '    <div style="margin-top: 1.5rem; display:flex; flex-direction:column; gap:0.75rem;">',
      '      <div style="display:flex; justify-content:flex-end; width:100%;"><button type="submit" id="submitIntakeBtn" class="neu-btn neu-btn-primary" style="padding: 0.85rem 2.2rem; font-size: 0.95rem; font-weight:800; width:clamp(240px, 100%, 100%); min-height:50px; display:flex; align-items:center; justify-content:center; gap:0.5rem;"><span id="submitBtnIcon">⚙️</span> <span id="submitBtnText">PROCESS AI TRIAGE ASSESSMENT</span></button></div>',
      '      <div id="formStatusContainer" style="display:none;"></div>',
      '    </div>',
      '  </form>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    var form = containerEl.querySelector('#patientIntakeForm');
    var painSlider = containerEl.querySelector('#pain_level');
    var painDisplay = containerEl.querySelector('#painLevelDisplay');
    var submitBtn = containerEl.querySelector('#submitIntakeBtn');
    var submitBtnIcon = containerEl.querySelector('#submitBtnIcon');
    var submitBtnText = containerEl.querySelector('#submitBtnText');
    var statusContainer = containerEl.querySelector('#formStatusContainer');
    var quickConfigBtn = containerEl.querySelector('#openN8nConfigQuickBtn');

    var isSubmitting = false;

    if (quickConfigBtn) {
      quickConfigBtn.addEventListener('click', function () {
        window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: state.activeIntake }));
      });
    }

    painSlider.addEventListener('input', function (e) {
      painDisplay.textContent = e.target.value + " / 10";
    });

    var populateForm = function (presetData) {
      Object.keys(presetData).forEach(function (k) {
        var el = form.querySelector('[name="' + k + '"]');
        if (el) el.value = presetData[k];
      });
      painDisplay.textContent = (presetData.pain_level || 8) + " / 10";
    };

    populateForm(INITIAL_PRESETS.EMERGENCY_CARDIAC);

    var hideStatus = function () {
      statusContainer.style.display = 'none';
      statusContainer.innerHTML = '';
    };

    var showLoading = function (msg) {
      statusContainer.style.display = 'block';
      statusContainer.innerHTML = '<div class="neu-card-recessed" style="padding:0.85rem 1.25rem; display:flex; align-items:center; gap:0.75rem; color:var(--teal-primary); font-size:0.85rem; font-weight:700;"><span>⏳</span><div><div>' + msg + '</div><div style="font-size:0.72rem; color:var(--text-muted); font-weight:500;">Target: ' + getActiveWebhookUrl() + '</div></div></div>';
    };

    var processLocalDemoFallback = function (intakeData) {
      var localTriage = evaluateTriage(intakeData);
      var completeRecord = {
        patient: intakeData,
        triage: localTriage,
        source: 'local_demo',
        timestamp: new Date().toISOString()
      };
      state.addIntake(completeRecord);
      if (localTriage.urgency_level === 'emergency') clinicalAudio.playEmergencySiren();
      else if (localTriage.urgency_level === 'urgent') clinicalAudio.playUrgentBeep();
      else clinicalAudio.playChime();

      if (onSubmitCallback) onSubmitCallback(completeRecord);
    };

    var showErrorState = function (result, intakeData) {
      statusContainer.style.display = 'block';
      var isInactive = result.isWorkflowInactive;
      var isTestInactive = result.isTestListenerInactive;

      var errorTitle = 'n8n Automation Gateway Unavailable';
      var errorBadgeText = result.status ? ('HTTP ' + result.status) : (result.isTimeout ? 'TIMEOUT' : 'NETWORK ERROR');

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

      statusContainer.innerHTML = [
        '<div class="neu-card" style="border-left:5px solid var(--emergency-red); padding:1.25rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.85rem; background:rgba(254, 242, 242, 0.6);">',
        '  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">',
        '    <div><div style="font-size:0.9rem; font-weight:800; color:var(--emergency-red);">' + errorTitle + '</div><div style="font-size:0.75rem; color:var(--text-sub); margin-top:0.15rem;">' + (result.error || 'Failed to connect to n8n.') + '</div></div>',
        '    <span class="neu-badge emergency" style="font-size:0.68rem; padding:0.2rem 0.5rem;">' + errorBadgeText + '</span>',
        '  </div>',
        '  <div style="font-size:0.78rem; color:var(--text-main); background:rgba(255,255,255,0.7); padding:0.6rem 0.85rem; border-radius:6px; font-family:var(--font-mono); word-break:break-all;">Target Endpoint: ' + (result.targetUrl || getActiveWebhookUrl()) + '</div>',
        '  <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center; justify-content:flex-end;">',
        '    <button type="button" id="retryN8nBtn" class="neu-btn neu-btn-primary" style="font-size:0.78rem; padding:0.4rem 1rem;">🔄 Retry Submission</button>',
        '    <button type="button" id="useLocalDemoBtn" class="neu-btn" style="font-size:0.78rem; padding:0.4rem 1rem; color:var(--teal-primary); border:1px dashed var(--teal-primary);">🧪 Use Local Demo Analysis</button>',
        '  </div>',
        '</div>'
      ].join('');

      var retryBtn = statusContainer.querySelector('#retryN8nBtn');
      var demoBtn = statusContainer.querySelector('#useLocalDemoBtn');

      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          hideStatus();
          processSubmission(intakeData);
        });
      }
      if (demoBtn) {
        demoBtn.addEventListener('click', function () {
          hideStatus();
          processLocalDemoFallback(intakeData);
        });
      }
    };

    var processSubmission = function (intakeData) {
      if (isSubmitting) return;
      isSubmitting = true;

      submitBtn.disabled = true;
      submitBtnIcon.textContent = '⏳';
      submitBtnText.textContent = 'TRANSMITTING TO N8N AI TRIAGE...';
      showLoading('Transmitting payload to n8n webhook and running AI medical triage pipeline...');

      submitToN8n(intakeData).then(function (result) {
        if (result.success && result.normalized && result.normalized.triage) {
          hideStatus();
          var triageResult = result.normalized.triage;
          var completeRecord = {
            patient: intakeData,
            triage: triageResult,
            source: 'n8n',
            rawN8nData: result.data,
            timestamp: new Date().toISOString()
          };
          state.addIntake(completeRecord);
          if (triageResult.urgency_level === 'emergency') clinicalAudio.playEmergencySiren();
          else if (triageResult.urgency_level === 'urgent') clinicalAudio.playUrgentBeep();
          else clinicalAudio.playChime();

          if (onSubmitCallback) onSubmitCallback(completeRecord);
        } else {
          showErrorState(result, intakeData);
        }
      }).catch(function (err) {
        showErrorState({ success: false, status: 0, error: err.message }, intakeData);
      }).finally(function () {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtnIcon.textContent = '⚙️';
        submitBtnText.textContent = 'PROCESS AI TRIAGE ASSESSMENT';
      });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;

      var formData = new FormData(form);
      var intakeData = {};
      formData.forEach(function (value, key) {
        intakeData[key] = value;
      });

      processSubmission(intakeData);
    });
  }

  // --- 6. HEADER & SIDEBAR NAVIGATION ---
  function toggleMobileSidebar(forceState) {
    var sidebar = document.querySelector('.clinical-sidebar');
    var backdrop = document.getElementById('sidebarBackdrop');
    var menuBtn = document.getElementById('mobileMenuToggleBtn');

    if (!sidebar) return;

    var isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('sidebar-open');

    if (isOpen) {
      sidebar.classList.add('sidebar-open');
      if (backdrop) backdrop.classList.add('open');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = window.innerWidth < 1024 ? 'hidden' : '';
    } else {
      sidebar.classList.remove('sidebar-open');
      if (backdrop) backdrop.classList.remove('open');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  function renderHeaderNav(containerEl) {
    var now = new Date().toLocaleTimeString('en-US', { hour12: false });
    var isMuted = clinicalAudio.isMuted;

    var html = [
      '<header class="neu-header">',
      '  <div class="neu-header-left">',
      '    <button id="mobileMenuToggleBtn" class="mobile-menu-btn" aria-label="Toggle Clinical Navigation Menu" aria-expanded="false">☰</button>',
      '    <div class="neu-header-brand" id="headerBrandClick" style="cursor:pointer;" title="MediClin Home Workstation">',
      '      <div class="neu-logo-badge" style="overflow:hidden; padding:2px;">',
      '        <img src="assets/mediclin-logo.png" alt="MediClin Logo" style="width:100%; height:100%; object-fit:contain; border-radius:8px;" />',
      '      </div>',
      '      <div>',
      '        <div class="neu-header-title">MediClin</div>',
      '        <div class="neu-header-sub">AI Medical Intake & Smart Triage Dashboard</div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="neu-header-status">',
      '    <div class="clock-telemetry" id="liveWorkstationClock">' + now + '</div>',
      '    <button id="audioMuteToggleBtn" class="neu-btn" style="font-size:0.8rem; padding:0.35rem 0.65rem;">' + (isMuted ? '🔇 Off' : '🔊 Audio') + '</button>',
      '    <div class="neu-status-pill"><span class="led-dot routine"></span><span style="font-size:0.75rem; font-weight:800;">INTAKE ACTIVE</span></div>',
      '    <div class="neu-status-pill" style="font-size:0.78rem; font-weight:700;"><span>Dr. Alex Vance, MD</span></div>',
      '  </div>',
      '</header>'
    ].join('');

    containerEl.innerHTML = html;

    var menuBtn = containerEl.querySelector('#mobileMenuToggleBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        clinicalAudio.playClick();
        toggleMobileSidebar();
      });
    }

    var brandClick = containerEl.querySelector('#headerBrandClick');
    if (brandClick) {
      brandClick.addEventListener('click', function () {
        clinicalAudio.playClick();
        state.setRoute('HOME');
      });
    }

    var muteBtn = containerEl.querySelector('#audioMuteToggleBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        var muted = clinicalAudio.toggleMute();
        muteBtn.textContent = muted ? '🔇 Off' : '🔊 Audio';
        if (!muted) clinicalAudio.playClick();
      });
    }

    if (!window._mediclinClockInterval) {
      window._mediclinClockInterval = setInterval(function () {
        var clockEl = document.getElementById('liveWorkstationClock');
        if (clockEl) {
          clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
        }
      }, 1000);
    }
  }

  function renderSidebar(containerEl) {
    var currentRoute = state.currentRoute;
    var emergencyCount = state.getEmergencyQueue().length;
    var urgentCount = state.getUrgentQueue().length;

    var routineCount = state.getRoutineQueue().length;
    var navItems = [
      { id: 'HOME', label: 'HOME CONSOLE', icon: '📊' },
      { id: 'EMERGENCY', label: 'EMERGENCY QUEUE', icon: '🚨', count: emergencyCount, isEmergency: true },
      { id: 'URGENT', label: 'URGENT QUEUE', icon: '⚠️', count: urgentCount, isUrgent: true },
      { id: 'ROUTINE PLANNING', label: 'ROUTINE PLANNING', icon: '📅', count: routineCount },
      { id: 'ABOUT US', label: 'ABOUT ENGINE', icon: 'ℹ️' }
    ];

    var html = [
      '<aside class="clinical-sidebar" id="clinicalSidebar">',
      '  <div class="sidebar-drawer-header">',
      '    <div style="display:flex; align-items:center; gap:0.5rem;">',
      '      <div class="neu-logo-badge" style="width:30px; height:30px; font-size:0.9rem;">✚</div>',
      '      <div><div style="font-size:0.95rem; font-weight:900; color:var(--teal-primary);">MediClin</div><div style="font-size:0.65rem; color:var(--text-muted);">Station Navigation</div></div>',
      '    </div>',
      '    <button id="sidebarCloseBtn" class="sidebar-close-btn" aria-label="Close Navigation Drawer">✕</button>',
      '  </div>',
      '  <div class="sidebar-title">WORKSTATION CONTROL</div>',
      '  <nav class="sidebar-nav-list">',
      navItems.map(function (item) {
        var isActive = currentRoute === item.id;
        return [
          '<button class="sidebar-nav-btn neu-btn ' + (isActive ? 'active' : '') + '" data-route="' + item.id + '" style="display:flex; align-items:center; justify-content:space-between; width:100%; text-align:left; padding:0.75rem 0.85rem; font-size:0.8rem; font-weight:800; border-radius:12px; border:none; cursor:pointer; background:var(--neu-surface); color:' + (isActive ? 'var(--sky-blue)' : 'var(--teal-primary)') + '; box-shadow:' + (isActive ? 'var(--neu-inset-sm)' : 'var(--neu-flat-sm)') + ';">',
          '  <span style="display:flex; align-items:center; gap:0.55rem;"><span style="font-size:0.95rem;">' + item.icon + '</span><span>' + item.label + '</span></span>',
          (item.count ? '  <span class="neu-badge ' + (item.isEmergency ? 'emergency' : 'urgent') + '" style="font-size:0.68rem; padding:0.1rem 0.45rem; border-radius:9999px;">' + item.count + '</span>' : ''),
          '</button>'
        ].join('');
      }).join(''),
      '  </nav>',
      '</aside>'
    ].join('');

    containerEl.innerHTML = html;

    var closeBtn = containerEl.querySelector('#sidebarCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        clinicalAudio.playClick();
        toggleMobileSidebar(false);
      });
    }

    var backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop && !backdrop._hasCloseListener) {
      backdrop.addEventListener('click', function () {
        toggleMobileSidebar(false);
      });
      backdrop._hasCloseListener = true;
    }

    containerEl.querySelectorAll('.sidebar-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        clinicalAudio.playClick();
        var route = e.currentTarget.getAttribute('data-route');
        
        if (window.innerWidth < 1024) {
          toggleMobileSidebar(false);
        }

        if (route === 'CONTACT US') {
          window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: state.activeIntake }));
        }
        state.setRoute(route);
      });
    });
  }

  
  // --- UNIVERSAL ROUTINE & CARE PLANNING VIEW ---
  function renderPlanningView(containerEl) {
    var activeWorkflowType = 'routine';
    var isSubmitting = false;
    var lastPlanningResult = null;
    var activeIntake = state.activeIntake;

    function render() {
      var isEmerg = activeWorkflowType === 'emergency';
      var isUrg = activeWorkflowType === 'urgent';
      var isRout = activeWorkflowType === 'routine';

      var headerBadgeText = '📅 ROUTINE SCHEDULING PLANNER';
      var headerBadgeClass = 'routine';
      var themeBorder = 'var(--routine-green)';
      var defaultDuration = '30 min';
      var defaultSpecialty = 'Internal Medicine / Primary Care';
      var actionLabel = '🚀 SUBMIT ROUTINE PLANNING REQUEST';

      if (isEmerg) {
        headerBadgeText = '🚨 EMERGENCY CARE & TRAUMA PLANNER';
        headerBadgeClass = 'emergency';
        themeBorder = 'var(--emergency-red)';
        defaultDuration = '60 min (STAT)';
        defaultSpecialty = 'Trauma Resuscitation / Cardiology';
        actionLabel = '🚨 SUBMIT EMERGENCY ACTION PLAN';
      } else if (isUrg) {
        headerBadgeText = '⚡ URGENT AMBULATORY FAST-TRACK PLANNER';
        headerBadgeClass = 'urgent';
        themeBorder = 'var(--urgent-amber)';
        defaultDuration = '45 min';
        defaultSpecialty = 'Urgent Care / Acute Diagnostics';
        actionLabel = '⚡ SUBMIT URGENT PLANNING REQUEST';
      }

      var html = [
        '<div style="max-width: 1100px; margin: 0 auto; display:flex; flex-direction:column; gap:1.35rem;">',
        '  <div class="neu-card" style="padding: 1.5rem; border-left: 6px solid ' + themeBorder + '; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">',
        '    <div>',
        '      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem;">',
        '        <span class="neu-acuity-badge ' + headerBadgeClass + '">',
        '          <span class="led-dot ' + headerBadgeClass + '"></span>',
        '          ' + headerBadgeText,
        '        </span>',
        '        <span style="font-size:0.75rem; font-weight:800; color:var(--teal-primary); background:rgba(0, 121, 140, 0.08); padding:0.2rem 0.55rem; border-radius:6px;">',
        '          UNIVERSAL WORKFLOW ENGINE',
        '        </span>',
        '      </div>',
        '      <h2 style="font-size: 1.35rem; font-weight: 900; color: var(--text-main);">',
        '        Clinical Care Planning & Resource Allocation',
        '      </h2>',
        '      <p style="font-size: 0.85rem; color: var(--text-sub); margin-top:0.25rem;">',
        '        Prepare operational scheduling directives, physician assignment, and pre-arrival instructions to dispatch to the n8n automation pipeline.',
        '      </p>',
        '    </div>',
        activeIntake ? '    <button id="loadActiveIntakeBtn" class="neu-btn neu-btn-primary" style="font-size:0.8rem; padding:0.45rem 0.85rem;" title="Pre-populate form with active triage patient">📋 Load Active Patient (' + activeIntake.patient.patient_name + ')</button>' : '',
        '  </div>',
        '  <div class="neu-card" style="padding: 1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">',
        '    <div style="font-size:0.78rem; font-weight:800; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.04em;">Select Operational Planning Workflow:</div>',
        '    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">',
        '      <button class="workflow-type-tab neu-btn ' + (isEmerg ? 'active' : '') + '" data-type="emergency" style="font-size:0.8rem; padding:0.4rem 0.85rem; color:' + (isEmerg ? 'var(--emergency-red)' : 'inherit') + '; font-weight:' + (isEmerg ? '900' : '700') + ';">🚨 Emergency Planning</button>',
        '      <button class="workflow-type-tab neu-btn ' + (isUrg ? 'active' : '') + '" data-type="urgent" style="font-size:0.8rem; padding:0.4rem 0.85rem; color:' + (isUrg ? 'var(--urgent-amber)' : 'inherit') + '; font-weight:' + (isUrg ? '900' : '700') + ';">⚡ Urgent Planning</button>',
        '      <button class="workflow-type-tab neu-btn ' + (isRout ? 'active' : '') + '" data-type="routine" style="font-size:0.8rem; padding:0.4rem 0.85rem; color:' + (isRout ? 'var(--routine-green)' : 'inherit') + '; font-weight:' + (isRout ? '900' : '700') + ';">📅 Routine Planning</button>',
        '    </div>',
        '  </div>',
        '  <form id="planningForm" class="neu-card" style="padding: 1.5rem; display:flex; flex-direction:column; gap:1.25rem;">',
        '    <div>',
        '      <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">👤 1. Patient Identity & Demographics</h3>',
        '      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_patient_name">Patient Full Name</label><input type="text" id="plan_patient_name" class="neu-input" placeholder="e.g. Eleanor Vance" required /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_intake_id">Intake MRN / Reference ID</label><input type="text" id="plan_intake_id" class="neu-input" placeholder="e.g. INT-423901" /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_patient_phone">Contact Phone</label><input type="tel" id="plan_patient_phone" class="neu-input" placeholder="e.g. +1 (555) 234-8901" required /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_patient_email">Contact Email</label><input type="email" id="plan_patient_email" class="neu-input" placeholder="e.g. patient@example.org" required /></div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">🩺 2. Chief Complaint & Clinical Reason</h3>',
        '      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:0.85rem;">',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_reason">Reason for Visit / Procedure</label><input type="text" id="plan_reason" class="neu-input" placeholder="e.g. Cardiac consultation" required /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_symptoms">Presenting Symptoms & Clinical History</label><input type="text" id="plan_symptoms" class="neu-input" placeholder="e.g. Radiating chest pressure" /></div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">⏱️ 3. Scheduling & Resource Allocation</h3>',
        '      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.85rem;">',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_date">Target Appointment Date</label><input type="date" id="plan_date" class="neu-input" value="' + new Date().toISOString().split('T')[0] + '" required /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_time">Preferred Time Window</label><input type="text" id="plan_time" class="neu-input" value="' + (isEmerg ? 'Immediate STAT' : '09:30 AM') + '" required /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_duration">Allocated Visit Duration</label><input type="text" id="plan_duration" class="neu-input" value="' + defaultDuration + '" required /></div>',
        '        <div class="neu-form-group"><label class="neu-label" for="plan_specialty">Assigned Specialty / Provider</label><input type="text" id="plan_specialty" class="neu-input" value="' + defaultSpecialty + '" required /></div>',
        '      </div>',
        '    </div>',
        '    <div>',
        '      <h3 style="font-size:0.88rem; font-weight:900; color:var(--teal-primary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">📝 4. Clinical Directives & Patient Instructions</h3>',
        '      <div class="neu-form-group"><label class="neu-label" for="plan_instructions">Pre-Arrival Instructions & Operational Directives</label><textarea id="plan_instructions" class="neu-textarea" style="min-height:75px;" placeholder="e.g. Bring photo ID, medication bottles. Fast 8 hours prior to visit."></textarea></div>',
        '    </div>',
        '    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">',
        '      <button type="submit" id="submitPlanBtn" class="neu-btn neu-btn-primary" style="padding:0.75rem 1.75rem; font-size:0.9rem; font-weight:900;" ' + (isSubmitting ? 'disabled' : '') + '>' + (isSubmitting ? '⏳ TRANSMITTING PLANNING DIRECTIVE TO N8N...' : actionLabel) + '</button>',
        '    </div>',
        '  </form>',
        '  <div id="planResultMount" style="display:' + (lastPlanningResult ? 'flex' : 'none') + '; flex-direction:column; gap:1.35rem;"></div>',
        '</div>'
      ].join('');

      containerEl.innerHTML = html;

      containerEl.querySelectorAll('.workflow-type-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          clinicalAudio.playClick();
          activeWorkflowType = tab.getAttribute('data-type');
          render();
        });
      });

      var loadBtn = containerEl.querySelector('#loadActiveIntakeBtn');
      if (loadBtn && activeIntake) {
        loadBtn.addEventListener('click', function () {
          clinicalAudio.playClick();
          var p = activeIntake.patient;
          var t = activeIntake.triage;
          var nameInput = containerEl.querySelector('#plan_patient_name');
          var idInput = containerEl.querySelector('#plan_intake_id');
          var phoneInput = containerEl.querySelector('#plan_patient_phone');
          var emailInput = containerEl.querySelector('#plan_patient_email');
          var reasonInput = containerEl.querySelector('#plan_reason');
          var symptomsInput = containerEl.querySelector('#plan_symptoms');
          var specialtyInput = containerEl.querySelector('#plan_specialty');
          var instructionsInput = containerEl.querySelector('#plan_instructions');

          if (nameInput) nameInput.value = p.patient_name || '';
          if (idInput) idInput.value = t.intake_id || '';
          if (phoneInput) phoneInput.value = p.patient_phone || '';
          if (emailInput) emailInput.value = p.patient_email || '';
          if (reasonInput) reasonInput.value = p.reason_for_visit || '';
          if (symptomsInput) symptomsInput.value = p.symptoms || '';
          if (specialtyInput) specialtyInput.value = t.recommended_specialty || defaultSpecialty;
          if (instructionsInput) instructionsInput.value = (t.patient_instructions || []).join('; ') || '';

          if (t.urgency_level) {
            activeWorkflowType = t.urgency_level.toLowerCase().indexOf('emerg') !== -1 ? 'emergency' : (t.urgency_level.toLowerCase().indexOf('urg') !== -1 ? 'urgent' : 'routine');
          }
        });
      }

      var form = containerEl.querySelector('#planningForm');
      var resultMount = containerEl.querySelector('#planResultMount');
      if (lastPlanningResult && resultMount) {
        renderAutomationWorkflow(resultMount, lastPlanningResult);
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (isSubmitting) return;

          isSubmitting = true;
          clinicalAudio.playClick();
          render();

          var formData = {
            patient_name: containerEl.querySelector('#plan_patient_name') ? containerEl.querySelector('#plan_patient_name').value : '',
            intake_id: containerEl.querySelector('#plan_intake_id') ? containerEl.querySelector('#plan_intake_id').value : '',
            patient_phone: containerEl.querySelector('#plan_patient_phone') ? containerEl.querySelector('#plan_patient_phone').value : '',
            patient_email: containerEl.querySelector('#plan_patient_email') ? containerEl.querySelector('#plan_patient_email').value : '',
            reason_for_visit: containerEl.querySelector('#plan_reason') ? containerEl.querySelector('#plan_reason').value : '',
            symptoms: containerEl.querySelector('#plan_symptoms') ? containerEl.querySelector('#plan_symptoms').value : '',
            preferred_date: containerEl.querySelector('#plan_date') ? containerEl.querySelector('#plan_date').value : '',
            preferred_time: containerEl.querySelector('#plan_time') ? containerEl.querySelector('#plan_time').value : '',
            symptom_duration: containerEl.querySelector('#plan_duration') ? containerEl.querySelector('#plan_duration').value : '30 min',
            medical_history: containerEl.querySelector('#plan_specialty') ? containerEl.querySelector('#plan_specialty').value : defaultSpecialty,
            current_medications: containerEl.querySelector('#plan_instructions') ? containerEl.querySelector('#plan_instructions').value : '',
            workflowType: activeWorkflowType
          };

          submitToN8n(formData, { workflowType: activeWorkflowType }).then(function (result) {
            if (result.success && result.normalized) {
              result.normalized.triage.urgency_level = activeWorkflowType;
              lastPlanningResult = result.normalized;
              if (activeWorkflowType === 'emergency') clinicalAudio.playEmergencySiren();
              else if (activeWorkflowType === 'urgent') clinicalAudio.playUrgentBeep();
              else clinicalAudio.playChime();
            } else {
              alert('⚠️ Planning Submission Notice: ' + (result.error || 'Failed to connect to n8n webhook.'));
            }
          }).catch(function (err) {
            alert('⚠️ Error dispatching planning directive: ' + err.message);
          }).finally(function () {
            isSubmitting = false;
            render();
            var newResultMount = containerEl.querySelector('#planResultMount');
            if (newResultMount && lastPlanningResult) {
              newResultMount.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        });
      }
    }

    render();
  }


  // --- 7. HOME VIEW (FORM IN ROW 1 ➔ ASSESSMENT IN ROW 2 & 3 ON PROCESS) ---
  
  // --- DYNAMIC AUTOMATION WORKFLOW COMPONENT ---
  function normalizeTriageCategory(rawCategory) {
    if (!rawCategory || typeof rawCategory !== 'string') return 'unknown';
    var clean = rawCategory.toLowerCase().trim();

    if (clean.indexOf('emerg') !== -1 || clean.indexOf('stat') !== -1 || clean.indexOf('critical') !== -1 || clean.indexOf('esi 1') !== -1 || clean.indexOf('esi 2') !== -1) {
      return 'emergency';
    }
    if (clean.indexOf('non_urg') !== -1 || clean.indexOf('non-urg') !== -1 || clean.indexOf('rout') !== -1 || clean.indexOf('standard') !== -1 || clean.indexOf('esi 4') !== -1 || clean.indexOf('esi 5') !== -1 || clean.indexOf('low') !== -1) {
      return 'routine';
    }
    if (clean.indexOf('urg') !== -1 || clean.indexOf('amber') !== -1 || clean.indexOf('esi 3') !== -1 || clean.indexOf('priority') !== -1) {
      return 'urgent';
    }
    return 'unknown';
  }

  var WORKFLOW_DEFINITIONS = {
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

  function renderAutomationWorkflow(containerEl, record) {
    if (!containerEl) return;

    if (!record || !record.triage) {
      containerEl.innerHTML = '';
      return;
    }

    var rawCategory = record.triage.urgency_level || record.triage.urgency || '';
    var category = normalizeTriageCategory(rawCategory);
    var def = WORKFLOW_DEFINITIONS[category];

    if (!def) {
      containerEl.innerHTML = [
        '<div class="neu-card" style="padding: 1.25rem; border-left: 4px solid var(--text-muted);">',
        '  <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">',
        '    ⚙️ Automation Routing: Unclassified triage route (' + (rawCategory || 'Unknown') + ').',
        '  </div>',
        '</div>'
      ].join('');
      return;
    }

    var isEmergActive = category === 'emergency';
    var isUrgActive = category === 'urgent';
    var isRoutActive = category === 'routine';

    var stepsHtml = def.steps.map(function (step, idx) {
      var stepCard = [
        '<div class="automation-node-card">',
        '  <div style="display:flex; align-items:flex-start; gap:0.75rem;">',
        '    <div class="automation-node-icon" style="font-size:1.35rem; width:38px; height:38px; border-radius:10px; background:var(--neu-surface); display:flex; align-items:center; justify-content:center; box-shadow:var(--neu-flat-sm); flex-shrink:0;">' + step.icon + '</div>',
        '    <div style="flex:1; min-width:0;">',
        '      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.3rem;">',
        '        <h4 style="font-size:0.88rem; font-weight:900; color:var(--text-main); margin:0;">' + step.title + '</h4>',
        '        <span style="font-size:0.68rem; font-weight:800; font-family:var(--font-mono); color:var(--sky-blue); background:rgba(2, 132, 199, 0.08); padding:0.15rem 0.45rem; border-radius:4px;">' + step.channel + '</span>',
        '      </div>',
        '      <p style="font-size:0.76rem; color:var(--text-sub); margin-top:0.3rem; line-height:1.4;">' + step.desc + '</p>',
        '      <div style="margin-top:0.45rem; display:flex; align-items:center; gap:0.35rem;">',
        '        <span style="font-size:0.68rem; font-weight:800; color:' + def.accentColor + '; display:inline-flex; align-items:center; gap:0.25rem;">',
        '          <span style="width:6px; height:6px; border-radius:50%; background:' + def.accentColor + '; display:inline-block;"></span>',
        '          ' + step.status,
        '        </span>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');

      var connector = (idx < def.steps.length - 1) ? [
        '<div class="automation-pipeline-connector" aria-hidden="true">',
        '  <span class="connector-arrow-desktop">➔</span>',
        '  <span class="connector-arrow-mobile">⬇</span>',
        '</div>'
      ].join('') : '';

      return stepCard + connector;
    }).join('');

    var html = [
      '<section class="neu-card automation-workflow-card ' + def.category + '" aria-label="Clinical Automation Workflow Execution" style="border-left: 6px solid ' + def.borderAccent + '; padding: 1.5rem; display:flex; flex-direction:column; gap:1.15rem; background: var(--neu-surface);">',
      '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(184, 196, 208, 0.4);">',
      '    <div>',
      '      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">',
      '        <span class="neu-acuity-badge ' + def.badgeClass + '" style="font-size:0.78rem; padding:0.3rem 0.85rem;">',
      '          <span class="led-dot ' + def.badgeClass + '"></span>' + def.badge,
      '        </span>',
      '        <span style="font-size:0.75rem; font-weight:800; color:var(--teal-primary); background:rgba(0, 121, 140, 0.08); padding:0.25rem 0.6rem; border-radius:6px; border:1px solid rgba(0, 121, 140, 0.2);">',
      '          ⚡ N8N AUTOMATION PIPELINE',
      '        </span>',
      '      </div>',
      '      <div style="font-size:0.82rem; color:var(--text-sub); margin-top:0.35rem; line-height:1.4;">',
      '        <strong>' + def.priorityTag + '</strong> • <span style="color:var(--text-muted);">' + def.targetResponse + '</span>',
      '      </div>',
      '    </div>',
      '    <div class="workflow-routes-bar" style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">',
      '      <span class="neu-badge ' + (isEmergActive ? 'emergency' : '') + '" style="font-size:0.68rem; padding:0.25rem 0.55rem; opacity:' + (isEmergActive ? '1' : '0.45') + '; font-weight:' + (isEmergActive ? '900' : '600') + ';">' + (isEmergActive ? '● ' : '') + '🔴 Emergency Protocol</span>',
      '      <span class="neu-badge ' + (isUrgActive ? 'urgent' : '') + '" style="font-size:0.68rem; padding:0.25rem 0.55rem; opacity:' + (isUrgActive ? '1' : '0.45') + '; font-weight:' + (isUrgActive ? '900' : '600') + ';">' + (isUrgActive ? '● ' : '') + '⚡ Urgent Path</span>',
      '      <span class="neu-badge ' + (isRoutActive ? 'routine' : '') + '" style="font-size:0.68rem; padding:0.25rem 0.55rem; opacity:' + (isRoutActive ? '1' : '0.45') + '; font-weight:' + (isRoutActive ? '900' : '600') + ';">' + (isRoutActive ? '● ' : '') + '📅 Routine Path</span>',
      '    </div>',
      '  </div>',
      '  <div style="font-size:0.8rem; color:var(--text-main); line-height:1.5; background:var(--neu-surface); padding:0.75rem 1rem; border-radius:10px; box-shadow:var(--neu-inset-sm);">',
      '    <span style="font-weight:800; color:var(--teal-primary); text-transform:uppercase; font-size:0.72rem; letter-spacing:0.04em;">Selected Care Automation:</span> ' + def.description,
      '  </div>',
      '  <div class="automation-pipeline-container">',
      stepsHtml,
      '  </div>',
      '</section>'
    ].join('');

    containerEl.innerHTML = html;
  }

  function renderHomeView(containerEl) {
    if (!containerEl) return;
    var isEvaluated = Boolean(state.activeIntake && state.activeIntake.triage);

    var html = [
      '<div style="display:flex; flex-direction:column; gap:1.35rem;">',
      '  <div id="workflowStepperMount"></div>',
      '  <div id="intakeFormMount"></div>',
      '  <div id="assessmentSectionMount" style="display:' + (isEvaluated ? 'flex' : 'none') + '; flex-direction:column; gap:1.35rem;">',
      '    <div class="home-row2-split" id="row2Split">',
      '      <div id="patientStatusMount"></div>',
      '      <div id="patientAlertsMount"></div>',
      '    </div>',
      '    <div id="automationWorkflowMount"></div>',
      '    <div id="providerBriefMount"></div>',
      '  </div>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    var stepperMount = containerEl.querySelector('#workflowStepperMount');
    var formMount = containerEl.querySelector('#intakeFormMount');
    var assessSection = containerEl.querySelector('#assessmentSectionMount');
    var statusMount = containerEl.querySelector('#patientStatusMount');
    var alertsMount = containerEl.querySelector('#patientAlertsMount');
    var workflowMount = containerEl.querySelector('#automationWorkflowMount');
    var briefMount = containerEl.querySelector('#providerBriefMount');

    try { if (stepperMount) renderWorkflowStepper(stepperMount, isEvaluated ? 2 : 1); } catch (e) {}

    try {
      if (formMount) {
        renderIntakeForm(formMount, function (newRecord) {
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
      console.error('[MediClin Bundle] Intake form error:', e);
    }

    if (isEvaluated && state.activeIntake) {
      try { if (statusMount) renderPatientStatusOverview(statusMount, state.activeIntake); } catch (e) {}
      try { if (alertsMount) renderPatientAlerts(alertsMount, state.activeIntake); } catch (e) {}
      try { if (workflowMount) renderAutomationWorkflow(workflowMount, state.activeIntake); } catch (e) {}
      try { if (briefMount) renderProviderBrief(briefMount, state.activeIntake); } catch (e) {}
    }
  }

  function renderEmergencyView(containerEl) {
    var emergencyIntakes = state.getEmergencyQueue();
    var html = [
      '<div style="display:flex; flex-direction:column; gap:1.5rem;">',
      '  <div class="neu-card" style="padding: 1.5rem; border-left: 6px solid var(--emergency-red); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">',
      '    <div>',
      '      <div class="neu-acuity-badge emergency" style="margin-bottom:0.5rem;"><span class="led-dot emergency"></span> STAT TRAUMA RESUSCITATION PROTOCOL</div>',
      '      <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--emergency-red);">Emergency Trauma Queue</h2>',
      '      <p style="font-size: 0.88rem; color: var(--text-sub);">Cases classified as ESI Level 1/2 requiring immediate emergency disposition.</p>',
      '    </div>',
      '    <div class="neu-card-recessed" style="text-align:center; min-width:140px; padding:0.85rem 1.5rem;">',
      '      <div style="font-size:1.8rem; font-weight:900; color:var(--emergency-red);">' + emergencyIntakes.length + '</div>',
      '      <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Active STAT Cases</div>',
      '    </div>',
      '  </div>',
      (emergencyIntakes.length === 0 ? '<div class="neu-card" style="padding: 3rem; text-align: center;"><h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">Emergency Queue is Clear</h3></div>' : [
        '  <div style="display:flex; flex-direction:column; gap:1.5rem;">',
        emergencyIntakes.map(function (record, index) {
          return [
            '    <div class="neu-card" style="padding: 1.5rem; border-left: 5px solid var(--emergency-red); margin-bottom:1.5rem;">',
            '      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; padding-bottom:0.85rem; border-bottom:1px solid rgba(184, 196, 208, 0.4); flex-wrap:wrap; gap:0.75rem;">',
            '        <div>',
            '          <span class="neu-acuity-badge emergency"><span class="led-dot emergency"></span> ESI 1/2 • EMERGENT (' + record.triage.intake_id + ')</span>',
            '          <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main); margin-top:0.3rem;">Patient: ' + record.patient.patient_name + ' (' + record.triage.patient_age + ' yrs, ' + record.triage.patient_category + ')</h3>',
            '        </div>',
            '      </div>',
            '      <div id="emergencyBriefMount_' + index + '"></div>',
            '    </div>'
          ].join('');
        }).join(''),
        '  </div>'
      ].join('')),
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    emergencyIntakes.forEach(function (record, index) {
      var mount = containerEl.querySelector('#emergencyBriefMount_' + index);
      if (mount) renderProviderBrief(mount, record);
    });
  }

  function renderUrgentView(containerEl) {
    var urgentIntakes = state.getUrgentQueue();

    var html = [
      '<div style="max-width: 1100px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">',
      '  <div class="neu-card" style="padding: 1.5rem; border-left: 6px solid var(--urgent-amber); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">',
      '    <div>',
      '      <div class="neu-acuity-badge urgent" style="margin-bottom:0.5rem;"><span class="led-dot urgent"></span> URGENT AMBULATORY PROTOCOL</div>',
      '      <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--urgent-amber);">Urgent Care Queue</h2>',
      '      <p style="font-size: 0.88rem; color: var(--text-sub);">Cases classified as ESI Level 3 requiring expedited physician evaluation.</p>',
      '    </div>',
      '    <div class="neu-card-recessed" style="text-align:center; min-width:140px; padding:0.85rem 1.5rem;">',
      '      <div style="font-size:1.8rem; font-weight:900; color:var(--urgent-amber);">' + urgentIntakes.length + '</div>',
      '      <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Active Urgent Cases</div>',
      '    </div>',
      '  </div>',
      (urgentIntakes.length === 0 ? '<div class="neu-card" style="padding: 3rem; text-align: center;"><h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">Urgent Care Queue is Clear</h3></div>' : [
        '  <div style="display:flex; flex-direction:column; gap:1.5rem;">',
        urgentIntakes.map(function (record, index) {
          return [
            '    <div class="neu-card" style="padding: 1.5rem; border-left: 5px solid var(--urgent-amber); margin-bottom:1.5rem;">',
            '      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; padding-bottom:0.85rem; border-bottom:1px solid rgba(184, 196, 208, 0.4); flex-wrap:wrap; gap:0.75rem;">',
            '        <div>',
            '          <span class="neu-acuity-badge urgent"><span class="led-dot urgent"></span> ESI 3 • URGENT (' + record.triage.intake_id + ')</span>',
            '          <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main); margin-top:0.3rem;">Patient: ' + record.patient.patient_name + ' (' + record.triage.patient_age + ' yrs, ' + record.triage.patient_category + ')</h3>',
            '        </div>',
            '        <button class="neu-btn neu-btn-primary confirm-urgent-btn" data-index="' + index + '" style="font-size:0.82rem; padding:0.4rem 0.9rem;">Confirm Slot</button>',
            '      </div>',
            '      <div id="urgentBriefMount_' + index + '"></div>',
            '    </div>'
          ].join('');
        }).join(''),
        '  </div>'
      ].join('')),
      '</div>'
    ].join('');

    containerEl.innerHTML = html;

    urgentIntakes.forEach(function (record, index) {
      var mount = containerEl.querySelector('#urgentBriefMount_' + index);
      if (mount) renderProviderBrief(mount, record);
    });

    containerEl.querySelectorAll('.confirm-urgent-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        clinicalAudio.playClick();
        var idx = e.currentTarget.getAttribute('data-index');
        var record = urgentIntakes[idx];
        alert("✅ URGENT APPOINTMENT CONFIRMED!\n\nPatient: " + record.patient.patient_name + "\nSpecialist: " + record.triage.recommended_provider);
      });
    });
  }

  function renderAboutView(containerEl) {
    var html = [
      '<div style="max-width: 960px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">',
      '  <div class="neu-card" style="padding: 2rem; border-left: 6px solid var(--teal-primary);">',
      '    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">',
      '      <div style="width:52px; height:52px; border-radius:14px; background:var(--neu-surface); box-shadow:var(--neu-flat-sm); padding:4px; display:flex; align-items:center; justify-content:center;">',
      '        <img src="assets/mediclin-logo.png" alt="MediClin Emblem" style="width:100%; height:100%; object-fit:contain; border-radius:10px;" />',
      '      </div>',
      '      <div>',
      '        <div class="neu-acuity-badge routine" style="margin-bottom:0.35rem; display:inline-flex; align-items:center; gap:0.4rem;"><span class="led-dot routine"></span> SYSTEM SPECIFICATION & OVERVIEW</div>',
      '        <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--teal-primary);">MediClin: Automation Suite for Clinical Support & Medical Intake</h2>',
      '      </div>',
      '    </div>',
      '    <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.7; margin-bottom: 1rem;">',
      '      <strong>MediClin</strong> is an enterprise automation suite for clinical support and medical intake triage. Designed specifically for high-stakes healthcare environments, trauma centers, and ambulatory clinics, MediClin harmonizes patient physiological telemetry, chief complaint classification, Emergency Severity Index (ESI) scoring, and automated provider handoff generation into a seamless, high-precision workflow.',
      '    </p>',
      '  </div>',
      '</div>'
    ].join('');
    containerEl.innerHTML = html;
  }

  function renderContactView(containerEl) {
    var html = [
      '<div style="max-width: 900px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">',
      '  <div class="neu-card" style="padding: 1.75rem;">',
      '    <div class="neu-acuity-badge routine" style="margin-bottom:0.5rem;"><span class="led-dot routine"></span> WORKFLOW AUTOMATION GATEWAY</div>',
      '    <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--teal-primary); margin-bottom: 0.5rem;">MediClin N8N Integration Config</h2>',
      '    <p style="font-size: 0.9rem; color: var(--text-sub); line-height: 1.6;">Click the button below to inspect active JSON payload contracts or test live webhook dispatches.</p>',
      '    <button id="openN8nConfigBtn" class="neu-btn neu-btn-primary" style="margin-top:1rem;">⚡ Open Automation Data Contract</button>',
      '  </div>',
      '</div>'
    ].join('');

    containerEl.innerHTML = html;
    var btn = containerEl.querySelector('#openN8nConfigBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        window.dispatchEvent(new CustomEvent('open-n8n-modal', { detail: state.activeIntake }));
      });
    }
  }

  // --- 8. INITIALIZATION ---
  function initApp() {
    if (window.__mediclinAppInitialized) return;
    window.__mediclinAppInitialized = true;

    var headerMount = document.getElementById('headerMount');
    var sidebarMount = document.getElementById('sidebarMount');
    var mainMount = document.getElementById('mainMount');
    var modalMount = document.getElementById('modalMount');

    if (!headerMount || !mainMount) return;

    renderHeaderNav(headerMount);
    if (sidebarMount) renderSidebar(sidebarMount);
    // Modal removed

    var updateRoute = function () {
      renderHeaderNav(headerMount);
      if (sidebarMount) renderSidebar(sidebarMount);

      switch (state.currentRoute) {
        case 'HOME':
          renderHomeView(mainMount);
          break;
        case 'EMERGENCY':
          renderEmergencyView(mainMount);
          break;
        case 'URGENT':
          renderUrgentView(mainMount);
          break;
        case 'CONTACT US':
          renderContactView(mainMount);
          break;
        case 'ABOUT US':
          renderAboutView(mainMount);
          break;
        default:
          renderHomeView(mainMount);
          break;
      }
    };

    state.subscribe(function () {
      updateRoute();
    });

    // Global keyboard listener for Escape
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        toggleMobileSidebar(false);
        var modal = document.getElementById('n8nModalBackdrop');
        if (modal && modal.classList.contains('open')) {
          modal.classList.remove('open');
        }
      }
    });

    // Reset overflow lock on desktop resize
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = '';
        var backdrop = document.getElementById('sidebarBackdrop');
        if (backdrop) backdrop.classList.remove('open');
        var sidebar = document.querySelector('.clinical-sidebar');
        if (sidebar) sidebar.classList.remove('sidebar-open');
      }
    });

    updateRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
