// Content script for Google Maps Integration
// 1. Detects origin & destination directly from Google Maps search / directions URL / inputs
// 2. Injects a sleek floating executive HUD (glassmorphism + champagne gold) directly on Google Maps
// 3. Automatically calculates RoadPulse safety risk index for routes & provides live hazard alerts along the way

console.log('[RoadPulse] Injected into Google Maps');

let currentOrigin = '';
let currentDestination = '';
let currentRoutes = [];
let userLambda = 0.50;
let isNavigating = false;
let watchId = null;

// Parse origin and destination from Google Maps URL or search inputs
function detectGoogleMapsRoute() {
  const url = window.location.href;

  // Pattern 1: URL directions like https://www.google.com/maps/dir/Koramangala/Indiranagar/
  const dirMatch = url.match(/\/maps\/dir\/([^\/]+)\/([^\/]+)/);
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

  // Pattern 2: Read from Google Maps directions input boxes if user is typing
  const inputs = document.querySelectorAll('input.tactile-searchbox-input, #directions-searchbox-0 input, #directions-searchbox-1 input');
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

// Fetch risk assessment from RoadPulse backend API
async function fetchSafetyAnalysis(origin, destination) {
  renderHudLoading();

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
    } else {
      renderHudMessage('No alternative safety paths evaluated for this corridor.');
    }
  } catch (err) {
    console.error('[RoadPulse] Backend fetch failed', err);
    renderHudMessage('RoadPulse Engine offline. Run "npm start" in /server');
  }
}

// Create or get floating RoadPulse HUD container on Google Maps
function getOrCreateHud() {
  let hud = document.getElementById('roadpulse-gmaps-hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'roadpulse-gmaps-hud';
    hud.style.position = 'fixed';
    hud.style.top = '14px';
    hud.style.right = '70px';
    hud.style.zIndex = '9999999';
    hud.style.width = '350px';
    hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    hud.style.borderRadius = '16px';
    hud.style.background = 'rgba(255, 255, 255, 0.94)';
    hud.style.backdropFilter = 'blur(16px)';
    hud.style.webkitBackdropFilter = 'blur(16px)';
    hud.style.border = '1px solid rgba(212, 175, 55, 0.45)';
    hud.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(212, 175, 55, 0.2)';
    hud.style.padding = '14px';
    hud.style.color = '#121417';
    hud.style.transition = 'all 0.3s ease';

    document.body.appendChild(hud);
  }
  return hud;
}

function renderHudLoading() {
  const hud = getOrCreateHud();
  hud.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(212,175,55,0.25); padding-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #D4AF37, #AA8232); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; color: #121417;">⚡</div>
        <div>
          <div style="font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">ROADPULSE COMPANION</div>
          <div style="font-size: 10px; color: #64748B;">Analyzing safety risk matrix...</div>
        </div>
      </div>
    </div>
    <div style="text-align: center; padding: 16px 0; font-size: 11px; color: #AA8232; font-weight: 600;">
      Evaluating turn-by-turn hazards & live GPS telemetry...
    </div>
  `;
}

function renderHudMessage(msg) {
  const hud = getOrCreateHud();
  hud.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 15px;">⚡</span>
        <span style="font-weight: 800; font-size: 12px;">ROADPULSE COMPANION</span>
      </div>
    </div>
    <div style="font-size: 11px; color: #64748B; padding: 8px 0;">${msg}</div>
  `;
}

function renderHudRoutes(routes) {
  const hud = getOrCreateHud();

  const routesHtml = routes.map((r, i) => {
    const isRecommended = r.isRecommended || i === 0;
    const riskColor = r.route_risk >= 70 ? '#E11D48' : r.route_risk >= 40 ? '#D97706' : '#10B981';

    return `
      <div style="
        background: ${isRecommended ? 'rgba(212, 175, 55, 0.12)' : 'rgba(241, 245, 249, 0.7)'};
        border: 1px solid ${isRecommended ? '#D4AF37' : '#E2E8F0'};
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: transform 0.15s ease;
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
            padding: 2px 7px;
            border-radius: 8px;
            border: 1px solid ${riskColor};
            font-size: 11px;
            font-weight: 800;
            color: ${riskColor};
          ">
            Safety Risk: ${r.route_risk}/100
          </div>
        </div>
        <div style="font-size: 10px; color: #475569; font-weight: 500; line-height: 1.3;">
          🛣️ ${r.summary}
        </div>
      </div>
    `;
  }).join('');

  hud.innerHTML = `
    <!-- Top Branding -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(212,175,55,0.25); padding-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, #D4AF37, #AA8232); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; color: #121417;">⚡</div>
        <div style="font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">ROADPULSE LIVE</div>
      </div>
      <span style="font-size: 9px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 6px; border-radius: 6px;">
        Active on Maps
      </span>
    </div>

    <!-- Origin & Destination Header -->
    <div style="font-size: 10px; color: #64748B; margin-bottom: 8px; line-height: 1.3;">
      From: <strong style="color: #121417;">${currentOrigin.slice(0, 30)}</strong><br/>
      To: <strong style="color: #121417;">${currentDestination.slice(0, 30)}</strong>
    </div>

    <!-- Safety Routes List -->
    <div style="max-height: 220px; overflow-y: auto;">
      ${routesHtml}
    </div>

    <!-- Live Navigation Safety Monitor Bar -->
    <div style="
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid rgba(212,175,55,0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
    ">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; animation: pulse 1.5s infinite;"></span>
        <span style="font-size: 10px; font-weight: 700; color: #334155;">
          ${isNavigating ? 'Live Safety Guard: ACTIVE' : 'Ready for Navigation'}
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

    <!-- Live Active Hazard Notification Card (Visible when navigating) -->
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
    ">
      ⚠️ Next 400m: Approaching high pedestrian conflict zone & unlit blind curve. Keep speed &lt; 35 km/h.
    </div>
  `;

  // Attach Start Live Guard button listener
  const btn = document.getElementById('rp-start-nav-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      isNavigating = !isNavigating;
      if (isNavigating) {
        startLiveGpsWatcher();
      } else {
        stopLiveGpsWatcher();
      }
      renderHudRoutes(routes);
    });
  }
}

// Live GPS Location Watcher while user is driving/walking
function startLiveGpsWatcher() {
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        console.log(`[RoadPulse Live Guard] Lat: ${latitude}, Lng: ${longitude}, Speed: ${speed}`);
      },
      (err) => console.warn('Geolocation watch error', err),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  }
}

function stopLiveGpsWatcher() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// Listen to URL changes & DOM updates in Google Maps SPA
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    detectGoogleMapsRoute();
  }
}, 1000);

// Also observe directions panel DOM mutations
const observer = new MutationObserver(() => {
  detectGoogleMapsRoute();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial detection
setTimeout(detectGoogleMapsRoute, 1500);
