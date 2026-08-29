/* ==========================================================================
   STATE MANAGEMENT - MEDICLIN PATIENT INTAKE & TRIAGE STORAGE
   ========================================================================== */

import { evaluateTriage } from './triage-engine.js';

export const INITIAL_PRESETS = {
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
  },
  URGENT_APPENDICITIS: {
    intake_id: "INT-582049",
    patient_name: "Marcus Holloway",
    patient_email: "marcus.h@example.com",
    patient_phone: "+1 (555) 876-5432",
    date_of_birth: "1994-09-23",
    reason_for_visit: "Acute right lower quadrant abdominal pain with fever",
    symptoms: "Migrating periumbilical pain to RLQ, low-grade fever (101.4°F), nausea, loss of appetite",
    symptom_duration: "18 hours",
    pain_level: 7,
    heart_rate: "94",
    blood_pressure: "128/82",
    oxygen_sat: "98",
    temperature: "101.4",
    current_medications: "None",
    allergies: "NKDA (No Known Drug Allergies)",
    medical_history: "No previous surgeries",
    insurance_provider: "Aetna Choice POS II",
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time: "09:30 AM"
  }
};

class AppState {
  constructor() {
    this.currentRoute = 'HOME'; // HOME, EMERGENCY, URGENT, ROUTINE PLANNING, ABOUT US
    this.intakes = [];
    this.activeIntake = null; // Only show assessment after user processes intake
    this.listeners = [];

    this.initSampleData();
  }

  initSampleData() {
    let stored = null;
    try {
      if (typeof localStorage !== 'undefined') {
        stored = localStorage.getItem('mediclin_intakes_n8n');
      }
    } catch (e) {}
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.intakes = parsed.filter(Boolean).map(item => {
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
  }

  saveIntakes() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mediclin_intakes_n8n', JSON.stringify(this.intakes));
      }
    } catch (e) {}
    this.notify();
  }

  addIntake(intakeWithTriage) {
    if (!intakeWithTriage) return;
    if (!intakeWithTriage.triage && intakeWithTriage.patient) {
      intakeWithTriage.triage = evaluateTriage(intakeWithTriage.patient);
    }
    this.intakes.unshift(intakeWithTriage);
    this.activeIntake = intakeWithTriage;
    this.saveIntakes();
  }

  setRoute(route) {
    this.currentRoute = route;
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this);
      } catch (e) {
        console.error('[MediClin State] Listener error:', e);
      }
    });
  }

  getEmergencyQueue() {
    if (!Array.isArray(this.intakes)) return [];
    return this.intakes.filter(i => i && i.triage && (i.triage.urgency_level === 'emergency' || (i.triage.urgency_level || '').toLowerCase().includes('emerg')));
  }

  getUrgentQueue() {
    if (!Array.isArray(this.intakes)) return [];
    return this.intakes.filter(i => i && i.triage && (i.triage.urgency_level === 'urgent' || (i.triage.urgency_level || '').toLowerCase().includes('urg')));
  }

  getRoutineQueue() {
    if (!Array.isArray(this.intakes)) return [];
    return this.intakes.filter(i => i && i.triage && (i.triage.urgency_level === 'routine' || i.triage.urgency_level === 'non_urgent' || (i.triage.urgency_level || '').toLowerCase().includes('rout')));
  }
}

export const state = new AppState();
