/* ==========================================================================
   PRIORITY ACUITY INDEX NEUMORPHIC DIAL (GAUGE.JS)
   Concentric Neumorphic Dial with Red Acuity Stroke Ring
   ========================================================================== */

export function renderPriorityGauge(containerEl, score = 98, urgencyLevel = 'emergency') {
  let strokeColor = '#DC2626'; // Vibrant emergency red line
  let glowColor = 'rgba(220, 38, 38, 0.45)';

  if (urgencyLevel === 'urgent') {
    strokeColor = 'var(--urgent-amber)';
    glowColor = 'rgba(217, 119, 6, 0.4)';
  } else if (urgencyLevel === 'routine') {
    strokeColor = 'var(--routine-green)';
    glowColor = 'rgba(22, 163, 74, 0.4)';
  }

  const radius = 41;
  const circumference = 2 * Math.PI * radius;
  const numericScore = Math.min(100, Math.max(0, parseInt(score, 10) || 98));
  const offset = circumference - (numericScore / 100) * circumference;

  const html = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.1rem 1rem; background:transparent; text-align:center;">
      
      <!-- Outermost Raised Neumorphic Disc -->
      <div style="
        position: relative;
        width: 116px;
        height: 116px;
        border-radius: 50%;
        background: var(--neu-surface);
        box-shadow: 6px 6px 14px rgba(184, 196, 208, 0.65), -6px -6px 14px rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.9);
      ">
        
        <!-- Concentric SVG Red Line Ring -->
        <svg width="116" height="116" viewBox="0 0 116 116" style="position:absolute; top:0; left:0; pointer-events:none; z-index:2;">
          <!-- Track Background -->
          <circle cx="58" cy="58" r="${radius}" fill="none" stroke="rgba(184, 196, 208, 0.35)" stroke-width="5.5" />
          <!-- Vibrant Red Animated Stroke Ring -->
          <circle id="gaugeRedArcCircle" cx="58" cy="58" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="5.5"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                  stroke-linecap="round" transform="rotate(-90 58 58)"
                  style="transition: stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1); filter: drop-shadow(0 0 4px ${glowColor});" />
        </svg>

        <!-- Inner Sunken Well -->
        <div style="
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--neu-surface);
          box-shadow: inset 4px 4px 8px rgba(184, 196, 208, 0.6), inset -4px -4px 8px rgba(255, 255, 255, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 3;
        ">
          
          <!-- Acuity Number -->
          <div id="gaugeScoreNumber" style="
            font-family: var(--font-mono);
            font-size: 1.6rem;
            font-weight: 900;
            color: ${strokeColor};
            line-height: 1;
          ">
            ${numericScore}
          </div>

          <!-- ACUITY SCORE Label -->
          <div style="
            font-size: 0.52rem;
            font-weight: 800;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0.2rem;
          ">
            ACUITY SCORE
          </div>

        </div>

      </div>

      <!-- PRIORITY INDEX (0 - 100) Label -->
      <div style="
        font-size: 0.74rem;
        font-weight: 900;
        color: #1E3A5F;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-top: 0.85rem;
      ">
        PRIORITY INDEX (0 - 100)
      </div>

    </div>
  `;

  containerEl.innerHTML = html;

  requestAnimationFrame(() => {
    const arc = containerEl.querySelector('#gaugeRedArcCircle');
    if (arc) {
      arc.style.strokeDashoffset = offset;
    }
  });

  const counterEl = containerEl.querySelector('#gaugeScoreNumber');
  if (counterEl) {
    let start = 0;
    const end = numericScore;
    const duration = 500;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
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
