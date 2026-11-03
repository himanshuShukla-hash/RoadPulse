import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet marker icon assets path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to invalidate size when mounted or resized so Leaflet renders all tiles immediately
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// User-clicked custom pin drop
function LocationMarker({ onSelectLocation, selectedPos }) {
  useMapEvents({
    click(e) {
      if (onSelectLocation) onSelectLocation(e.latlng);
    },
  });

  if (!selectedPos) return null;

  const pinIcon = L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #E6CA65, #D4AF37);
          border: 3px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 6px 18px rgba(212,175,55,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 10px; height: 10px; background: #121417; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  return (
    <Marker position={[selectedPos.lat, selectedPos.lng]} icon={pinIcon}>
      <Popup>
        <div className="font-semibold text-slate-900 text-xs py-1">
          📍 Target Location Selected
          <div className="text-[10px] text-slate-500 font-normal">
            {selectedPos.lat.toFixed(4)}, {selectedPos.lng.toFixed(4)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function InteractiveMap({
  locations = [],
  selectedLocation,
  onSelectHotspot,
  onMapClick,
  pinTarget
}) {
  const defaultCenter = [40.7580, -73.9855];

  const createHotspotIcon = (loc) => {
    const isHigh = loc.risk_score >= 70;
    const isElevated = loc.risk_score >= 40 && loc.risk_score < 70;
    
    // Executive golden / amber / slate markers with high contrast
    const bgGradient = isHigh 
      ? 'linear-gradient(135deg, #B8860B, #D4AF37)' 
      : isElevated 
      ? 'linear-gradient(135deg, #D4AF37, #E6CA65)' 
      : 'linear-gradient(135deg, #64748B, #94A3B8)';

    const size = Math.min(54, Math.max(38, 32 + (loc.reports_count || 1) * 4));

    return L.divIcon({
      className: 'cluster-hotspot-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bgGradient};
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #121417;
          font-weight: 800;
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.5);
          cursor: pointer;
        " class="${isHigh ? 'beacon-pulse' : ''}">
          <span style="font-size: 13px; line-height: 1; font-weight: 900;">${loc.risk_score}</span>
          <span style="font-size: 8px; text-transform: uppercase; font-weight: 700; opacity: 0.85;">risk</span>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-gold-400/40 shadow-glass">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapResizer />

        {/* Free, crisp, no API key required ESRI World Street Map (Clear roads, buildings, labels) */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        <LocationMarker onSelectLocation={onMapClick} selectedPos={pinTarget} />

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={createHotspotIcon(loc)}
            eventHandlers={{
              click: () => onSelectHotspot && onSelectHotspot(loc)
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="text-[10px] font-bold text-gold-600 uppercase tracking-wider mb-1">
                  {loc.priorityBand}
                </div>
                <div className="font-bold text-slate-900 text-sm mb-1">{loc.title}</div>
                <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-1 mt-1">
                  <span>Reports: <b className="text-slate-900">{loc.reports_count}</b></span>
                  <span className="font-bold text-gold-700">Score: {loc.risk_score}/100</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Interactive Helper Banner */}
      <div className="absolute top-4 left-4 z-[1000] glass-panel px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 text-slate-800 shadow-md">
        <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-ping"></span>
        <span className="font-semibold">Interactive Map: Click anywhere to pin an incident location</span>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] glass-panel p-3.5 rounded-xl text-xs space-y-1.5 shadow-lg border border-gold-400/40 text-slate-800">
        <div className="text-[10px] font-bold tracking-wider uppercase text-gold-700 mb-1">Screening Bands</div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-gold-600 shadow-sm inline-block"></span>
          <span className="font-semibold text-slate-800">High Priority (70–100)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-gold-400 shadow-sm inline-block"></span>
          <span className="font-medium text-slate-700">Elevated (40–69)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm inline-block"></span>
          <span className="font-medium text-slate-600">Routine (&lt;40)</span>
        </div>
      </div>
    </div>
  );
}
