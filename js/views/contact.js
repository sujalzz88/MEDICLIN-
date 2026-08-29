/* ==========================================================================
   CONTACT US / WORKFLOW CONFIG PAGE VIEW - HOSPITAL INTAKE & TRIAGE CONTACT PORTAL (NEUMORPHIC)
   ========================================================================== */

export function renderContactView(containerEl) {
  const html = `
    <div style="max-width: 900px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem;">
      
      <!-- Contact Header -->
      <div class="neu-card" style="padding: 1.5rem; text-align:center;">
        <div class="neu-acuity-badge routine" style="margin-bottom:0.5rem;">
          <span class="led-dot routine"></span> HOSPITAL INTAKE DESK & WORKFLOW PORTAL
        </div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">
          Hospital Triage & Patient Support Center
        </h2>
        <p style="font-size: 0.9rem; color: var(--text-sub); max-width:600px; margin: 0.4rem auto 0 auto;">
          Contact our medical intake coordination office for inquiries regarding triage scheduling, insurance verification, or intake updates.
        </p>
      </div>

      <!-- Emergency Hotline Bar -->
      <div class="neu-card" style="border-left: 6px solid var(--emergency-red); padding: 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="font-size:0.85rem; font-weight:900; color:var(--emergency-red); text-transform:uppercase;">🚨 MEDICAL EMERGENCY ALERT</div>
          <div style="font-size:0.875rem; color:var(--text-main);">
            If you are experiencing a life-threatening emergency, call 911 or visit the nearest emergency room immediately.
          </div>
        </div>
        <div style="font-family:var(--font-mono); font-size:1.15rem; font-weight:900; color:var(--emergency-red);">
          HOTLINE: 911 / (555) 999-0111
        </div>
      </div>

      <!-- Contact Info & Form -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
        
        <div class="neu-card" style="padding: 1.5rem;">
          <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--teal-primary); text-transform: uppercase; margin-bottom: 1rem;">
            🏥 INTAKE DESK DIRECTORY
          </h3>

          <div style="display:flex; flex-direction:column; gap:1rem;">
            <div class="neu-card-recessed">
              <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">MAIN HOSPITAL DESK</div>
              <div style="font-weight:700; color:var(--text-main); font-size:1rem;">+1 (555) 300-8000</div>
              <div style="font-size:0.8rem; color:var(--text-sub);">Ext. 401 (Central Triage)</div>
            </div>

            <div class="neu-card-recessed">
              <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">INTAKE COORDINATION EMAIL</div>
              <div style="font-weight:700; color:var(--teal-primary); font-size:0.95rem;">triage-intake@stjude-hospital.org</div>
            </div>

            <div class="neu-card-recessed">
              <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">TRIAGE OPERATING HOURS</div>
              <div style="font-weight:700; color:var(--routine-green); font-size:0.9rem;">24 Hours / 7 Days a Week</div>
            </div>
          </div>
        </div>

        <div class="neu-card" style="padding: 1.5rem;">
          <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--teal-primary); text-transform: uppercase; margin-bottom: 1rem;">
            ✉️ PATIENT INQUIRY FORM
          </h3>

          <form id="contactForm">
            <div class="neu-form-group">
              <label class="neu-label" for="contact_name">Your Name</label>
              <input type="text" id="contact_name" class="neu-input" placeholder="e.g. John Smith" required />
            </div>

            <div class="neu-form-group">
              <label class="neu-label" for="contact_email">Email Address</label>
              <input type="email" id="contact_email" class="neu-input" placeholder="e.g. john@example.com" required />
            </div>

            <div class="neu-form-group">
              <label class="neu-label" for="contact_msg">Inquiry Details</label>
              <textarea id="contact_msg" class="neu-textarea" placeholder="How can our triage intake team assist you?" required></textarea>
            </div>

            <button type="submit" class="neu-btn neu-btn-primary" style="width:100%;">
              SEND INQUIRY TO TRIAGE DESK
            </button>
          </form>
        </div>

      </div>

    </div>
  `;

  containerEl.innerHTML = html;

  const form = containerEl.querySelector('#contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert("✅ Inquiry submitted successfully to the St. Jude Medical Triage Desk.");
    form.reset();
  });
}
