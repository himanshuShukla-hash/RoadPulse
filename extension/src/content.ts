// Content script for Google Maps integration (read-only helper badge)
// Strictly follows safety rules: does not manipulate Google Maps internals, inject fake lines, or scrape restricted data.

console.log('[RoadPulse] Content script active on Google Maps.');

// Add subtle non-intrusive RoadPulse status banner on Google Maps top-right
function injectRoadPulseStatusBadge() {
  if (document.getElementById('roadpulse-status-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'roadpulse-status-badge';
  badge.style.position = 'fixed';
  badge.style.top = '12px';
  badge.style.right = '70px';
  badge.style.zIndex = '999999';
  badge.style.backgroundColor = 'rgba(18, 20, 23, 0.92)';
  badge.style.color = '#FFFFFF';
  badge.style.padding = '8px 14px';
  badge.style.borderRadius = '12px';
  badge.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  badge.style.fontSize = '12px';
  badge.style.fontWeight = '600';
  badge.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  badge.style.border = '1px solid rgba(212, 175, 55, 0.5)';
  badge.style.display = 'flex';
  badge.style.alignItems = 'center';
  badge.style.gap = '8px';
  badge.style.cursor = 'pointer';
  badge.style.backdropFilter = 'blur(10px)';

  badge.innerHTML = `
    <span style="width: 8px; height: 8px; border-radius: 50%; background: #D4AF37; box-shadow: 0 0 10px #D4AF37;"></span>
    <span>RoadPulse Companion: <strong>Safety Routing Ready</strong></span>
  `;

  badge.title = 'Click to open RoadPulse Companion for risk-aware route selection';
  badge.addEventListener('click', () => {
    alert('Please click the RoadPulse icon in your Chrome toolbar to configure origin, destination, and safety slider (λ).');
  });

  document.body.appendChild(badge);
}

// Check every 2s if on Google Maps
if (window.location.hostname.includes('google.com') && window.location.pathname.includes('maps')) {
  setTimeout(injectRoadPulseStatusBadge, 1500);
}
