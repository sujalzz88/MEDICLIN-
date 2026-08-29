# 🏥 MediClin

## AI Medical Intake & Smart Triage Workstation

> **MediClin** is an enterprise-grade, browser-based **AI Medical Intake & Smart Triage Workstation** engineered for emergency departments, urgent care clinics, and ambulatory outpatient centers. It transforms patient telemetry, vital signs, and clinical symptoms into structured **Emergency Severity Index (ESI Levels 1–5)** acuity scores, dynamic automation pathways (**Emergency**, **Urgent**, and **Routine**), and standardized **SBAR Physician Handoff Briefs** via bi-directional **n8n Cloud** orchestration and secure backend persistence.

---

### 🌐 Live Production Deployment

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20MediClin%20Workstation-00798C?style=for-the-badge&logo=google-chrome&logoColor=white)](https://sujalzz88.github.io/MEDICLIN-/)

**Deployed Application URL**: [`https://sujalzz88.github.io/MEDICLIN-/`](https://sujalzz88.github.io/MEDICLIN-/)  
**Active n8n Gateway**: `https://aryanna.app.n8n.cloud/webhook-test/a5b3b9e3-267f-406f-a37b-aabeff9b50d0`

---

### 🛡️ Verified Technology Badges

![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20ES6%20JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Styling](https://img.shields.io/badge/Design%20System-Neumorphic%20CSS3%20Tokens-00798C?style=flat-square&logo=css3&logoColor=white)
![Audio](https://img.shields.io/badge/Telemetry-Web%20Audio%20API%20Synthesizer-0284C7?style=flat-square&logo=webassembly&logoColor=white)
![Orchestration](https://img.shields.io/badge/Backend%20Automation-n8n%20Cloud%20(27%20Nodes)-EA4B71?style=flat-square&logo=n8n&logoColor=white)
![AI Engine](https://img.shields.io/badge/AI%20Inference-LangChain%20Agent%20%2B%20OpenRouter-6366F1?style=flat-square&logo=openai&logoColor=white)
![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Hosting](https://img.shields.io/badge/Deployment-GitHub%20Pages-22272E?style=flat-square&logo=github&logoColor=white)

---

## 🧭 Quick Navigation

| Section | Description |
| :--- | :--- |
| [🧠 Overview](#-system-overview) | What MediClin is and core clinical capabilities |
| [🎯 Problem vs. Solution](#-problem-vs-solution) | Bottlenecks in triage and how MediClin solves them |
| [⚙️ System Architecture](#️-system-architecture) | End-to-end data pipeline from DOM to n8n and Supabase |
| [🤖 AI Triage & Clinical Decision Support](#-ai-triage--clinical-decision-support) | ESI 5-level scoring, red-flag detection, and differential analysis |
| [🚨 Dynamic Automation Pathways](#-dynamic-automation-pathways) | Emergency, Urgent, and Routine workflow visualizations |
| [📋 SBAR Physician Handoff Matrix](#-sbar-physician-handoff-matrix) | Standardized Situation, Background, Assessment, and Recommendation brief |
| [📅 Universal Routine & Care Planner](#-universal-routine--care-planning-workspace) | Reusable operational scheduling workspace |
| [🔊 Web Audio Telemetry Synthesizer](#-web-audio-api-hardware-synthesizer) | Procedural hospital acoustic sirens, triads, and chimes |
| [🎨 Neumorphic Design System](#-neumorphic-uiux-design-system) | Soft-UI tokens, WCAG AAA contrast, and responsive layout |
| [🔒 Security & PHI Isolation](#-security-hipaa-readiness--credential-isolation) | Zero frontend credentials and vault-encrypted access |
| [🚀 Local Setup & Verification](#-local-setup--getting-started) | How to run and test MediClin locally |
| [⚠️ Medical Disclaimer](#-medical-disclaimer) | Clinical decision support boundary statement |

---

## 🧠 System Overview

Traditional patient intake treats high-acuity, life-threatening cases identically to routine outpatient visits on static clipboards and forms. **MediClin** bridges the critical gap between patient submission and emergency room intervention by executing instantaneous, structured AI clinical evaluation, triggering automated hospital notifications, persisting medical records in a secure database, and rendering an interactive, tactile workstation dashboard for medical staff.
