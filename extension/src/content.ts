// RoadPulse 100% Client-Side Google Maps In-Page Companion
// Automatically detects Google Maps routes, calculates 3 safety-aware candidates,
// and when a user clicks a route card, it seamlessly syncs into Google Maps directions/waypoints!

import { generateRohiniCandidateRoutes } from './rohiniDataset';

console.log('%c[RoadPulse] Live Google Maps Sync & Route Controller Active', 'color: #D4AF37; font-weight: bold; font-size: 14px;');

let currentOrigin = '';
let currentDestination = '';
let currentRoutes: any[] = [];
let userLambda = 0.50;
let isNavigating = false;
let selectedRouteIndex = 0;

// Waypoints to force Google Maps to route through specific Rohini safety corridors
const CORRIDOR_WAYPOINTS: Record<string, string> = {
  rohini_route_fastest: 'Outer Ring Rd, Mangolpuri, Delhi',
  rohini_route_balanced: 'M2K Cinemas Rohini, Sector 3, Delhi',
  rohini_route_safest: 'Sector 16 Rohini, Delhi'
};

// Ensure floating RoadPulse HUD exists on Google Maps
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
      width: 380px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      border-radius: 18px !important;
      background: rgba(255, 255, 255, 0.96) !important;
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
    renderInitialHud(hud);
  }
  return hud;
}

function renderInitialHud(hud: HTMLElement) {
  // Read existing Google Maps search boxes if available
  detectGoogleMapsRoute();
  if (!currentOrigin) {
    currentOrigin = 'Rithala Metro Station, Bhagwan Mahavir Marg';
    currentDestination = 'Madhuban Chowk, Block CD, Pitampura';
  }
  currentRoutes = generateRohiniCandidateRoutes(currentOrigin, currentDestination, userLambda);
  renderHudRoutes(currentRoutes);
}

// Function to automatically sync selected route into Google Maps directions inputs
function syncRouteToGoogleMaps(route: any, index: number) {
  selectedRouteIndex = index;
  renderHudRoutes(currentRoutes);

  // 1. Check if Google Maps has the destination input or intermediate waypoint
  const waypoint = CORRIDOR_WAYPOINTS[route.id] || '';

  // 2. Try filling Google Maps inputs directly in the DOM
  const inputs = document.querySelectorAll('input.tactile-searchbox-input, #directions-searchbox-1 input, #directions-searchbox-0 input') as NodeListOf<HTMLInputElement>;
  if (inputs && inputs.length >= 2) {
    // Flash visual feedback in Google Maps search bar
    const destInput = inputs[1];
    destInput.style.transition = 'all 0.3s ease';
    destInput.style.backgroundColor = '#FEF9C3';
    destInput.style.borderColor = '#D4AF37';

    setTimeout(() => {
      destInput.style.backgroundColor = '';
      destInput.style.borderColor = '';
    }, 1200);
  }

  // 3. Seamlessly update Google Maps route with the specific corridor waypoint
  if (currentOrigin && currentDestination && waypoint) {
    const encodedOrigin = encodeURIComponent(currentOrigin);
    const encodedWaypoint = encodeURIComponent(waypoint);
    const encodedDest = encodeURIComponent(currentDestination);

    // Google Maps multi-stop URL: /dir/Origin/Waypoint/Destination/
    const targetUrl = `https://www.google.com/maps/dir/${encodedOrigin}/${encodedWaypoint}/${encodedDest}/`;
    
    // Smooth in-page navigation without full page reload
    window.history.pushState(null, '', targetUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // Also click Google Maps' own alternative route cards if matching
  tryClickGoogleMapsAlternative(index);
}

// Click Google Maps' native alternative route if displayed on the left sidebar
function tryClickGoogleMapsAlternative(index: number) {
  const routeCards = document.querySelectorAll('[data-trip-index], div[role="region"][aria-label*="via"], [id*="section-directions-trip"]');
  if (routeCards && routeCards.length > index) {
    const targetCard = routeCards[index] as HTMLElement;
    targetCard.click();
  }
}

// Read Google Maps search boxes & URL
function detectGoogleMapsRoute() {
  const url = window.location.href;

  // 1. Detect from directions URL
  const dirMatch = url.match(/\/dir\/([^\/]+)\/([^\/]+)/);
  if (dirMatch && dirMatch.length >= 3) {
    const orig = decodeURIComponent(dirMatch[1].replace(/\+/g, ' ')).replace(/@.*/, '').trim();
    const dest = decodeURIComponent(dirMatch[2].replace(/\+/g, ' ')).replace(/@.*/, '').trim();
    if (orig && dest && (orig !== currentOrigin || dest !== currentDestination)) {
      currentOrigin = orig;
      currentDestination = dest;
      currentRoutes = generateRohiniCandidateRoutes(orig, dest, userLambda);
      renderHudRoutes(currentRoutes);
    }
    return;
  }

  // 2. Detect from search input elements
  const inputs = document.querySelectorAll('input.tactile-searchbox-input, input.searchboxinput, [aria-label*="Choose starting point"], [aria-label*="Choose destination"]') as NodeListOf<HTMLInputElement>;
  if (inputs.length >= 2) {
    const orig = inputs[0].value.trim();
    const dest = inputs[1].value.trim();
    if (orig && dest && (orig !== currentOrigin || dest !== currentDestination)) {
      currentOrigin = orig;
      currentDestination = dest;
      currentRoutes = generateRohiniCandidateRoutes(orig, dest, userLambda);
      renderHudRoutes(currentRoutes);
    }
  }
}

function renderHudRoutes(routes: any[]) {
  const hud = ensureHudExists();
  if (!hud) return;

  const routesHtml = routes.map((r, i) => {
    const isSelected = selectedRouteIndex === i;
    const riskColor = r.route_risk >= 60 ? '#E11D48' : r.route_risk >= 30 ? '#D97706' : '#10B981';

    return `
      <div class="rp-route-card" data-idx="${i}" style="
        background: ${isSelected ? 'rgba(212, 175, 55, 0.18)' : 'rgba(241, 245, 249, 0.85)'};
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
              padding: 2.5px 7px;
              border-radius: 6px;
              background: ${r.isRecommended ? '#D4AF37' : '#64748B'};
              color: ${r.isRecommended ? '#121417' : '#FFFFFF'};
            ">${r.routeLabel}</span>
            <span style="font-weight: 800; font-size: 14px; color: #0F172A;">${r.travel_time_minutes} min</span>
            <span style="font-size: 10px; color: #64748B;">(${(r.distance_meters / 1000).toFixed(1)} km)</span>
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

        <div style="font-size: 10.5px; color: #334155; font-weight: 600; line-height: 1.35; margin-bottom: 4px;">
          🛣️ ${r.summary}
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; color: #64748B; border-top: 1px dashed rgba(212,175,55,0.3); margin-top: 4px; padding-top: 3px;">
          <span>Potholes: <b>${r.hazards.P}</b> | Near-Miss: <b>${r.hazards.N}</b></span>
          <span style="font-weight: 700; color: ${isSelected ? '#854D0E' : '#64748B'};">
            ${isSelected ? '✔ Selected on Maps' : 'Click to Route on Maps'}
          </span>
        </div>
      </div>
    `;
  }).join('');

  hud.innerHTML = `
    <!-- Top Branding -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, #D4AF37, #AA8232); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; color: #121417;">⚡</div>
        <div style="font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">ROADPULSE ACTIVE</div>
      </div>
      <span style="font-size: 9px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 7px; border-radius: 6px;">
        Auto-Sync on Maps
      </span>
    </div>

    <!-- Origin & Destination -->
    <div style="font-size: 10px; color: #64748B; margin-bottom: 8px; line-height: 1.3;">
      From: <strong style="color: #121417;">${currentOrigin.slice(0, 32)}</strong><br/>
      To: <strong style="color: #121417;">${currentDestination.slice(0, 32)}</strong>
    </div>

    <!-- Safety Preference Slider -->
    <div style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; padding: 8px; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700; margin-bottom: 3px;">
        <span style="color: #854D0E;">SAFETY PREFERENCE λ: ${userLambda.toFixed(2)}</span>
        <span style="color: #121417; background: #FFFFFF; padding: 1px 6px; border-radius: 4px; font-size: 9px;">
          ${userLambda <= 0.25 ? 'Fastest' : userLambda >= 0.75 ? 'Safety-First' : 'Balanced'}
        </span>
      </div>
      <input id="rp-lambda-slider" type="range" min="0.00" max="1.00" step="0.05" value="${userLambda}" style="width: 100%; accent-color: #D4AF37; cursor: pointer;" />
    </div>

    <!-- 3 Distinct Routes (Clicking any route auto-syncs into Google Maps) -->
    <div style="max-height: 250px; overflow-y: auto;">
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
        padding: 6px 12px;
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
      padding: 9px;
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      border-radius: 9px;
      font-size: 10px;
      color: #92400E;
      font-weight: 600;
      line-height: 1.35;
    ">
      ⚠️ <strong>In 400m:</strong> High near-miss intersection & sudden braking zone ahead (Near Mangolpuri Flyover). Maintain safe gap.
    </div>
  `;

  // Attach auto-sync click listener to each route card
  hud.querySelectorAll('.rp-route-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-idx') || '0');
      syncRouteToGoogleMaps(routes[idx], idx);
    });
  });

  // Attach slider listener
  const slider = document.getElementById('rp-lambda-slider') as HTMLInputElement;
  if (slider) {
    slider.addEventListener('input', (e: any) => {
      userLambda = parseFloat(e.target.value);
      currentRoutes = generateRohiniCandidateRoutes(currentOrigin, currentDestination, userLambda);
      renderHudRoutes(currentRoutes);
    });
  }

  // Attach live guard listener
  const btn = document.getElementById('rp-start-nav-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      isNavigating = !isNavigating;
      renderHudRoutes(routes);
    });
  }
}

// Check every 1.5s for route updates
setInterval(() => {
  ensureHudExists();
  detectGoogleMapsRoute();
}, 1500);
