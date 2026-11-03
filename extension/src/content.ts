// RoadPulse Google Maps In-Page Overlay Script
console.log('%c[RoadPulse] Active on Google Maps', 'color: #D4AF37; font-weight: bold; font-size: 14px;');

let currentOrigin = '';
let currentDestination = '';
let currentRoutes = [];
let userLambda = 0.50;
let isNavigating = false;
let watchId = null;

// Always ensure the HUD container exists on the page
function ensureHudExists() {
  // Only inject if on Google Maps
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
      width: 360px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      border-radius: 16px !important;
      background: rgba(255, 255, 255, 0.96) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1.5px solid #D4AF37 !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22), 0 0 20px rgba(212, 175, 55, 0.25) !important;
      padding: 14px !important;
      color: #121417 !important;
      box-sizing: border-box !important;
      display: block !important;
      transition: all 0.3s ease !important;
    `;
    document.documentElement.appendChild(hud);
    renderInitialIdleHud(hud);
  }
  return hud;
}

function renderInitialIdleHud(hud) {
  hud.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 26px; height: 26px; border-radius: 6px; background: linear-gradient(135deg, #D4AF37, #AA8232); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; color: #121417;">⚡</div>
        <div style="font-weight: 800; font-size: 13px; letter-spacing: 0.5px; color: #121417;">ROADPULSE</div>
      </div>
      <span style="font-size: 9px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 7px; border-radius: 6px;">
        ● LIVE GUARD
      </span>
    </div>

    <div style="font-size: 11px; color: #475569; margin-bottom: 10px; line-height: 1.4;">
      Search any destination or route in Google Maps. RoadPulse will automatically analyze safety risk scores for each route.
    </div>

    <div style="background: rgba(212, 175, 55, 0.1); border: 1px dashed #D4AF37; border-radius: 10px; padding: 8px; font-size: 10px; color: #854D0E; display: flex; align-items: center; justify-content: space-between;">
      <span>Waiting for route in Google Maps...</span>
      <button id="rp-demo-btn" style="background: #121417; color: #FFFFFF; border: none; border-radius: 6px; padding: 4px 8px; font-size: 9px; font-weight: bold; cursor: pointer;">
        Demo Test
      </button>
    </div>
  `;

  const demoBtn = document.getElementById('rp-demo-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      currentOrigin = 'Koramangala 5th Block';
      currentDestination = 'Indiranagar 100ft Road';
      fetchSafetyAnalysis(currentOrigin, currentDestination);
    });
  }
}

// Parse Google Maps search box & URL
function detectGoogleMapsRoute() {
  const url = window.location.href;

  // 1. Google Maps directions URL: /dir/Origin/Destination/
  const dirMatch = url.match(/\/dir\/([^\/]+)\/([^\/]+)/);
  if (dirMatch && dirMatch.length >= 3) {
    const orig = decodeURIComponent(dirMatch[1].replace(/\+/g, ' '));
    const dest = decodeURIComponent(dirMatch[2].replace(/\+/g, ' '));
    if (orig && dest && (orig !== currentOrigin || dest !== currentDestination)) {
      currentOrigin = orig;
      currentDestination = dest;
      fetchSafetyAnalysis(orig, dest);
    }
    return;
  }

  // 2. Google Maps inputs search
  const inputs = document.querySelectorAll('input.tactile-searchbox-input, input.searchboxinput, [aria-label*="Choose starting point"], [aria-label*="Choose destination"]');
  if (inputs.length >= 2) {
    const orig = inputs[0].value.trim();
    const dest = inputs[1].value.trim();
    if (orig && dest && (orig !== currentOrigin || dest !== currentDestination)) {
      currentOrigin = orig;
      currentDestination = dest;
      fetchSafetyAnalysis(orig, dest);
    }
  }
}

async function fetchSafetyAnalysis(origin, destination) {
  const hud = ensureHudExists();
  if (!hud) return;

  hud.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">⚡</span>
        <div style="font-weight: 800; font-size: 13px;">ROADPULSE SAFETY MATRIX</div>
      </div>
    </div>
    <div style="font-size: 11px; color: #B45309; padding: 12px 0; text-align: center; font-weight: 600;">
      Calculating road risk indices for:<br/>
      <strong style="color: #121417;">${origin.slice(0, 25)} ➔ ${destination.slice(0, 25)}</strong>...
    </div>
  `;

  try {
    const res = await fetch('http://localhost:5001/api/routes/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_query: origin,
        dest_query: destination,
        lambda: userLambda
      })
    });

    const data = await res.json();
    if (data.success && data.routes) {
      currentRoutes = data.routes;
      renderHudRoutes(data.routes);
    }
  } catch (err) {
    console.error('[RoadPulse] Fetch error', err);
  }
}

function renderHudRoutes(routes) {
  const hud = ensureHudExists();
  if (!hud) return;

  const routesHtml = routes.map((r, i) => {
    const isRecommended = r.isRecommended || i === 0;
    const riskColor = r.route_risk >= 70 ? '#E11D48' : r.route_risk >= 40 ? '#D97706' : '#10B981';

    return `
      <div style="
        background: ${isRecommended ? 'rgba(212, 175, 55, 0.12)' : 'rgba(241, 245, 249, 0.8)'};
        border: 1.5px solid ${isRecommended ? '#D4AF37' : '#E2E8F0'};
        border-radius: 12px;
        padding: 9px;
        margin-bottom: 8px;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 6px;
              background: ${isRecommended ? '#D4AF37' : '#94A3B8'};
              color: ${isRecommended ? '#121417' : '#FFFFFF'};
            ">${r.routeLabel || (isRecommended ? '★ Recommended' : 'Alternative')}</span>
            <span style="font-weight: 800; font-size: 13px;">${r.travel_time_minutes} min</span>
            <span style="font-size: 10px; color: #64748B;">(${(r.distance_meters / 1000).toFixed(1)} km)</span>
          </div>

          <div style="
            background: #FFFFFF;
            padding: 2px 8px;
            border-radius: 8px;
            border: 1px solid ${riskColor};
            font-size: 11px;
            font-weight: 800;
            color: ${riskColor};
          ">
            Risk: ${r.route_risk}/100
          </div>
        </div>

        <div style="font-size: 10px; color: #334155; font-weight: 500; line-height: 1.3;">
          🛣️ ${r.summary}
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
      <span style="font-size: 9px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 6px; border-radius: 6px;">
        Live Companion
      </span>
    </div>

    <!-- Routes list with Safety Indices in front of them -->
    <div style="max-height: 220px; overflow-y: auto;">
      ${routesHtml}
    </div>

    <!-- Live Navigation Guard Status -->
    <div style="
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(212,175,55,0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
    ">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span>
        <span style="font-size: 10px; font-weight: 700; color: #334155;">
          ${isNavigating ? 'Driving Companion: ACTIVE' : 'Safety Guard Ready'}
        </span>
      </div>

      <button id="rp-start-nav-btn" style="
        background: ${isNavigating ? '#E11D48' : '#121417'};
        color: #FFFFFF;
        border: none;
        border-radius: 8px;
        padding: 5px 10px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
      ">
        ${isNavigating ? 'Stop Guard' : 'Start Live Guard'}
      </button>
    </div>

    <!-- Live In-Route Hazard Alert -->
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
      line-height: 1.3;
    ">
      ⚠️ In 400m: High near-miss intersection & sudden braking zone ahead. Maintain safe distance.
    </div>
  `;

  const btn = document.getElementById('rp-start-nav-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      isNavigating = !isNavigating;
      renderHudRoutes(routes);
    });
  }
}

// Continuous check on Google Maps page
setInterval(() => {
  ensureHudExists();
  detectGoogleMapsRoute();
}, 1000);
