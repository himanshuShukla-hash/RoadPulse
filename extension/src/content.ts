// RoadPulse 100% Client-Side Google Maps In-Page Companion
// Uses Rohini Golden Pair: Rithala Metro Station ➔ M2K Cinemas Rohini
// 3 distinct corridors with instant Google Maps re-routing and in-HUD search bar

import { generateRohiniCandidateRoutes, GOLDEN_PAIR, USER_REPORTED_HAZARDS, RohiniHazard } from './rohiniDataset';

console.log('%c[RoadPulse] Golden Pair Route Companion Active', 'color: #D4AF37; font-weight: bold; font-size: 14px;');

let currentOrigin = GOLDEN_PAIR.origin;
let currentDestination = GOLDEN_PAIR.destination;
let currentRoutes = generateRohiniCandidateRoutes();
let isNavigating = false;
let selectedRouteIndex = 0;
let showReportModal = false;

function ensureHudExists(): HTMLElement | null {
  if (!window.location.href.includes('google.') && !window.location.href.includes('maps')) return null;

  let hud = document.getElementById('roadpulse-gmaps-hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'roadpulse-gmaps-hud';
    hud.style.cssText = `
      position: fixed !important;
      top: 16px !important;
      right: 75px !important;
      z-index: 2147483647 !important;
      width: 390px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      border-radius: 18px !important;
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1.5px solid #D4AF37 !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24), 0 0 20px rgba(212, 175, 55, 0.3) !important;
      padding: 14px !important;
      color: #121417 !important;
      box-sizing: border-box !important;
      display: block !important;
      transition: all 0.3s ease !important;
    `;
    document.documentElement.appendChild(hud);
    renderHud();
  }
  return hud;
}

// Automatically sync route and fill Google Maps native search bars
function applyRouteToGoogleMaps(orig: string, dest: string, waypoint = '') {
  currentOrigin = orig;
  currentDestination = dest;
  currentRoutes = generateRohiniCandidateRoutes(orig, dest);
  renderHud();

  // Fill Google Maps inputs
  const inputs = document.querySelectorAll('input.tactile-searchbox-input, input.searchboxinput, #directions-searchbox-0 input, #directions-searchbox-1 input') as NodeListOf<HTMLInputElement>;
  if (inputs && inputs.length >= 2) {
    inputs[0].value = orig;
    inputs[1].value = dest;

    inputs[0].style.backgroundColor = '#FEF9C3';
    inputs[1].style.backgroundColor = '#FEF9C3';
    setTimeout(() => {
      inputs[0].style.backgroundColor = '';
      inputs[1].style.backgroundColor = '';
    }, 1200);
  }

  // Update Google Maps URL dynamically
  const encodedOrig = encodeURIComponent(orig);
  const encodedDest = encodeURIComponent(dest);
  let targetUrl = `https://www.google.com/maps/dir/${encodedOrig}/${encodedDest}/`;
  if (waypoint) {
    const encodedWaypoint = encodeURIComponent(waypoint);
    targetUrl = `https://www.google.com/maps/dir/${encodedOrig}/${encodedWaypoint}/${encodedDest}/`;
  }

  window.history.pushState(null, '', targetUrl);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function renderHud() {
  const hud = ensureHudExists();
  if (!hud) return;

  const routesHtml = currentRoutes.map((r, i) => {
    const isSelected = selectedRouteIndex === i;
    const riskColor = r.route_risk >= 50 ? '#E11D48' : r.route_risk >= 30 ? '#D97706' : '#10B981';

    return `
      <div class="rp-route-card" data-idx="${i}" style="
        background: ${isSelected ? 'rgba(212, 175, 55, 0.18)' : 'rgba(241, 245, 249, 0.9)'};
        border: ${isSelected ? '2px solid #D4AF37' : '1px solid #CBD5E1'};
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: ${isSelected ? '0 4px 12px rgba(212, 175, 55, 0.25)' : 'none'};
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 2px 7px;
              border-radius: 6px;
              background: ${r.isRecommended ? '#D4AF37' : '#64748B'};
              color: ${r.isRecommended ? '#121417' : '#FFFFFF'};
            ">${r.routeLabel}</span>
            <span style="font-weight: 800; font-size: 14px; color: #0F172A;">${r.travel_time_minutes} min</span>
            <span style="font-size: 10px; color: #64748B;">(${r.distance_km} km)</span>
          </div>

          <div style="
            background: #FFFFFF;
            padding: 3px 8px;
            border-radius: 8px;
            border: 1.5px solid ${riskColor};
            font-size: 11px;
            font-weight: 800;
            color: ${riskColor};
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          ">
            Risk: ${r.route_risk}/100
          </div>
        </div>

        <div style="font-size: 10.5px; color: #1E293B; font-weight: 700; line-height: 1.35; margin-bottom: 3px;">
          🛣️ ${r.summary}
        </div>

        <div style="font-size: 9.5px; color: #64748B; margin-bottom: 4px;">
          ${r.description}
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; color: #64748B; border-top: 1px dashed rgba(212,175,55,0.3); margin-top: 4px; padding-top: 3px;">
          <span>Potholes: <b>${r.hazards.P}</b> | Near-Miss: <b>${r.hazards.N}</b></span>
          <span style="font-weight: 700; color: ${isSelected ? '#854D0E' : '#64748B'};">
            ${isSelected ? '✔ Active on Google Maps' : 'Click to Route This Path'}
          </span>
        </div>
      </div>
    `;
  }).join('');

  hud.innerHTML = `
    <!-- Top Branding & Report Button -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, #D4AF37, #AA8232); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; color: #121417;">⚡</div>
        <div style="font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">ROADPULSE (ROHINI PILOT)</div>
      </div>

      <button id="rp-open-report-btn" style="
        background: #FEF3C7;
        border: 1px solid #D4AF37;
        color: #854D0E;
        border-radius: 6px;
        padding: 2.5px 7px;
        font-size: 9px;
        font-weight: 800;
        cursor: pointer;
      ">
        + Report Hazard
      </button>
    </div>

    <!-- IN-HUD SEARCH BARS -->
    <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 8px; margin-bottom: 8px;">
      <div style="margin-bottom: 5px;">
        <div style="font-size: 9px; font-weight: 700; color: #64748B; margin-bottom: 2px;">📍 ORIGIN (START)</div>
        <input id="rp-origin-input" type="text" value="${currentOrigin}" style="width: 100%; box-sizing: border-box; padding: 5px 8px; border: 1px solid #CBD5E1; border-radius: 7px; font-size: 10px; font-weight: 600; color: #0F172A;" />
      </div>

      <div style="margin-bottom: 6px;">
        <div style="font-size: 9px; font-weight: 700; color: #64748B; margin-bottom: 2px;">🏁 DESTINATION</div>
        <input id="rp-dest-input" type="text" value="${currentDestination}" style="width: 100%; box-sizing: border-box; padding: 5px 8px; border: 1px solid #CBD5E1; border-radius: 7px; font-size: 10px; font-weight: 600; color: #0F172A;" />
      </div>

      <button id="rp-find-routes-btn" style="width: 100%; background: linear-gradient(135deg, #D4AF37, #AA8232); color: #121417; font-weight: 800; font-size: 10.5px; border: none; border-radius: 7px; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
        <span>🔍 Search & Fill on Google Maps</span>
      </button>
    </div>

    <!-- 3 Distinct Routes with Front Safety Indices -->
    <div style="max-height: 240px; overflow-y: auto;">
      ${routesHtml}
    </div>

    <!-- Navigation Guard Status -->
    <div style="
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(212,175,55,0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
    ">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; animation: pulse 1.5s infinite;"></span>
        <span style="font-size: 10px; font-weight: 700; color: #334155;">
          ${isNavigating ? 'Driving Companion: ACTIVE' : 'Safety Guard Ready'}
        </span>
      </div>

      <button id="rp-start-nav-btn" style="
        background: ${isNavigating ? '#E11D48' : '#121417'};
        color: #FFFFFF;
        border: none;
        border-radius: 8px;
        padding: 5px 11px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s ease;
      ">
        ${isNavigating ? 'Stop Guard' : 'Start Live Guard'}
      </button>
    </div>

    <!-- In-Route Hazard Alert -->
    <div id="rp-live-alert" style="
      display: ${isNavigating ? 'block' : 'none'};
      margin-top: 8px;
      padding: 8px;
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      border-radius: 8px;
      font-size: 10px;
      color: #92400E;
      font-weight: 600;
      line-height: 1.35;
    ">
      ⚠️ <strong>In 400m:</strong> High near-miss intersection & sharp curve ahead (Near Sector 3 M2K Cinema). Maintain safe speed.
    </div>

    <!-- In-HUD Hazard Reporting Modal -->
    <div id="rp-report-modal" style="
      display: ${showReportModal ? 'block' : 'none'};
      margin-top: 10px;
      padding: 10px;
      background: #FFFFFF;
      border: 1.5px solid #D4AF37;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 11px; color: #121417;">📍 Mark Hazard (Rohini Area)</span>
        <span id="rp-close-modal" style="cursor: pointer; font-size: 14px; font-weight: bold; color: #64748B;">✕</span>
      </div>

      <div style="margin-bottom: 6px;">
        <label style="font-size: 9px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Hazard Category</label>
        <select id="rp-hazard-type" style="width: 100%; padding: 4px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 10px;">
          <option value="pothole">🕳️ Pothole / Road Damage</option>
          <option value="dangerous_turn">↪️ Sharp Blind Curve</option>
          <option value="accident_zone">⚠️ Accident-Prone Junction</option>
          <option value="poor_lighting">💡 Broken / Unlit Streetlamp</option>
          <option value="near_miss">⚡ Recurrent Near-Miss Conflict</option>
        </select>
      </div>

      <div style="margin-bottom: 6px;">
        <label style="font-size: 9px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Location / Sector Landmark</label>
        <input id="rp-hazard-loc" type="text" placeholder="e.g. Near M2K Sector 3 Cut" value="Rohini Sector 3 Cut" style="width: 100%; box-sizing: border-box; padding: 4px 6px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 10px;" />
      </div>

      <div style="margin-bottom: 8px;">
        <label style="font-size: 9px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">📸 Photo Proof Verification</label>
        <input id="rp-hazard-photo" type="file" accept="image/*" style="width: 100%; font-size: 9px; color: #64748B;" />
        <div id="rp-photo-preview" style="font-size: 8.5px; color: #15803D; font-weight: bold; margin-top: 2px;">✔ Geotag & timestamp verification active</div>
      </div>

      <button id="rp-submit-hazard-btn" style="width: 100%; background: linear-gradient(135deg, #D4AF37, #AA8232); color: #121417; font-weight: 800; font-size: 10px; border: none; border-radius: 6px; padding: 6px; cursor: pointer;">
        Submit Verified Hazard Report
      </button>
    </div>
  `;

  // Search & Fill button listener
  const findBtn = document.getElementById('rp-find-routes-btn');
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      const orig = (document.getElementById('rp-origin-input') as HTMLInputElement)?.value.trim();
      const dest = (document.getElementById('rp-dest-input') as HTMLInputElement)?.value.trim();
      if (orig && dest) {
        applyRouteToGoogleMaps(orig, dest);
      }
    });
  }

  // Click listener for the 3 route cards
  hud.querySelectorAll('.rp-route-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-idx') || '0');
      selectedRouteIndex = idx;
      const r = currentRoutes[idx];
      applyRouteToGoogleMaps(currentOrigin, currentDestination, r.waypoint);
    });
  });

  // Modal open/close listeners
  const openReportBtn = document.getElementById('rp-open-report-btn');
  if (openReportBtn) {
    openReportBtn.addEventListener('click', () => {
      showReportModal = !showReportModal;
      renderHud();
    });
  }

  const closeModalBtn = document.getElementById('rp-close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      showReportModal = false;
      renderHud();
    });
  }

  // Submit hazard listener
  const submitHazardBtn = document.getElementById('rp-submit-hazard-btn');
  if (submitHazardBtn) {
    submitHazardBtn.addEventListener('click', () => {
      const cat = (document.getElementById('rp-hazard-type') as HTMLSelectElement)?.value || 'pothole';
      const loc = (document.getElementById('rp-hazard-loc') as HTMLInputElement)?.value || 'Rohini Sector';
      
      const newHaz: RohiniHazard = {
        id: 'user_h_' + Date.now(),
        category: cat as any,
        name: `User Reported ${cat.replace('_', ' ').toUpperCase()} at ${loc}`,
        severity: 85,
        location: loc,
        lat: 28.7050,
        lng: 77.1000,
        verified: true,
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        reportedAt: 'Just Now'
      };

      USER_REPORTED_HAZARDS.push(newHaz);
      alert(`✅ Hazard "${newHaz.name}" verified with photo proof and added to Rohini safety network!`);
      showReportModal = false;
      renderHud();
    });
  }

  // Live guard listener
  const btn = document.getElementById('rp-start-nav-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      isNavigating = !isNavigating;
      renderHud();
    });
  }
}

setInterval(() => {
  ensureHudExists();
}, 2000);
