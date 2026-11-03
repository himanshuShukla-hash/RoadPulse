import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  PlusCircle, 
  ExternalLink,
  ShieldAlert,
  X
} from 'lucide-react';
import { ROHINI_HAZARDS, USER_REPORTED_HAZARDS, RohiniHazard } from './rohiniDataset';

export default function App() {
  const [origin, setOrigin] = useState<string>('Rithala Metro Station, Bhagwan Mahavir Marg');
  const [destination, setDestination] = useState<string>('M2K Cinemas Rohini, Sector 3, Delhi');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [hazardCategory, setHazardCategory] = useState<string>('pothole');
  const [hazardLoc, setHazardLoc] = useState<string>('Rohini Sector 3 Cut');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  // Popular Rohini Presets
  const PRESETS = [
    { from: 'Rithala Metro Station', to: 'M2K Cinemas Rohini, Sector 3' },
    { from: 'Rohini Sector 16', to: 'Madhuban Chowk, Pitampura' },
    { from: 'Japanese Park, Sector 10', to: 'Mangolpuri Flyover' }
  ];

  // Dispatches route directly into Google Maps
  const handleStartGoogleMapsNavigation = () => {
    if (!origin.trim() || !destination.trim()) return;

    const encodedOrig = encodeURIComponent(origin.trim());
    const encodedDest = encodeURIComponent(destination.trim());
    const gmapsUrl = `https://www.google.com/maps/dir/${encodedOrig}/${encodedDest}/`;

    // 1. If currently on a Google Maps tab, update it; otherwise open new tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url && (activeTab.url.includes('google.com/maps') || activeTab.url.includes('google.co.in/maps'))) {
          chrome.tabs.update(activeTab.id!, { url: gmapsUrl });
          window.close(); // close popup so user sees HUD on Google Maps
        } else {
          chrome.tabs.create({ url: gmapsUrl });
        }
      });
    } else {
      window.open(gmapsUrl, '_blank');
    }
  };

  const handleReportHazard = (e: React.FormEvent) => {
    e.preventDefault();
    const newHaz: RohiniHazard = {
      id: 'haz_' + Date.now(),
      category: hazardCategory as any,
      name: `User Reported ${hazardCategory.toUpperCase()} at ${hazardLoc}`,
      severity: 85,
      location: hazardLoc,
      lat: 28.7050,
      lng: 77.1000,
      verified: true,
      reportedAt: 'Just Now'
    };
    USER_REPORTED_HAZARDS.push(newHaz);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
    }, 1500);
  };

  return (
    <div className="w-[390px] min-h-[460px] flex flex-col p-4 text-xs select-none relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', top: '-60px', left: '-40px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', right: '-50px',
        width: '260px', height: '260px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* ── Extension Header ─────────────────────────────── */}
      <header className="glass-panel p-3 rounded-2xl flex items-center justify-between mb-3" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.9), rgba(170,130,50,0.85))', backdropFilter: 'blur(8px)' }}>
            <Compass className="w-5 h-5" style={{ color: '#0f0c29' }} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold tracking-widest text-sm" style={{ color: '#D4AF37', letterSpacing: '0.12em' }}>ROADPULSE</h1>
              <span className="px-1.5 rounded-full text-[9px] font-bold uppercase"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)' }}>
                Rohini Active
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(200,200,220,0.6)' }}>Google Maps Safety Route Companion</p>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center space-x-1 cursor-pointer transition-all"
          style={{
            padding: '5px 10px', borderRadius: '10px',
            background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)',
            color: '#D4AF37', backdropFilter: 'blur(6px)'
          }}
          title="Report Pothole, Blind Curve or Accident"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Report</span>
        </button>
      </header>

      {/* ── Origin & Destination ─────────────────────────── */}
      <section className="glass-panel p-3.5 rounded-2xl space-y-2.5 mb-3" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1" style={{ color: '#D4AF37' }}>
          <MapPin className="w-3.5 h-3.5" />
          <span>Route Location Selector</span>
        </div>

        <div>
          <label className="text-[10px] font-bold block mb-1" style={{ color: 'rgba(200,200,220,0.75)' }}>📍 Starting Point</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Rithala Metro Station"
            className="glass-input w-full p-2 text-[11px] font-medium"
            style={{ color: '#f0f0f0' }}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold block mb-1" style={{ color: 'rgba(200,200,220,0.75)' }}>🏁 Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. M2K Cinemas Rohini, Sector 3"
            className="glass-input w-full p-2 text-[11px] font-medium"
            style={{ color: '#f0f0f0' }}
          />
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1 pt-1 overflow-x-auto">
          <span className="text-[9px] uppercase font-bold shrink-0" style={{ color: 'rgba(200,200,220,0.45)' }}>Presets:</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setOrigin(p.from); setDestination(p.to); }}
              className="px-2 py-0.5 rounded text-[9px] font-medium whitespace-nowrap cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(200,200,220,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {p.from.split(' ')[0]} ➔ {p.to.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Start Route Button */}
        <button
          onClick={handleStartGoogleMapsNavigation}
          className="w-full gold-button py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 font-bold cursor-pointer mt-1"
        >
          <Navigation className="w-4 h-4 fill-current" />
          <span>Start Route on Google Maps</span>
        </button>
      </section>

      {/* ── Info Card ────────────────────────────────────── */}
      <section className="glass-panel p-3 rounded-2xl space-y-1 mt-auto" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center space-x-1.5 font-bold text-[11px]" style={{ color: '#D4AF37' }}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Automatic In-Page Safety Scoring</span>
        </div>
        <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(200,200,220,0.65)' }}>
          Click "Start Route" → Google Maps opens → RoadPulse HUD shows 3 alternative safety paths with live risk scores.
        </p>
      </section>

      {/* ── Hazard Reporting Modal ────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(10,8,30,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel p-4 rounded-2xl w-full shadow-2xl space-y-3" style={{ border: '1px solid rgba(212,175,55,0.45)' }}>
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold text-xs" style={{ color: '#D4AF37' }}>📍 Mark Road Hazard</span>
              <button onClick={() => setShowReportModal(false)} style={{ color: 'rgba(200,200,220,0.6)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-3 rounded-xl text-xs font-medium text-center"
                   style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✔ Hazard verified and logged into Rohini network!
              </div>
            ) : (
              <form onSubmit={handleReportHazard} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: 'rgba(200,200,220,0.75)' }}>Hazard Type</label>
                  <select
                    value={hazardCategory}
                    onChange={(e) => setHazardCategory(e.target.value)}
                    className="w-full p-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#f0f0f0' }}
                  >
                    <option value="pothole">🕳️ Pothole / Road Damage</option>
                    <option value="dangerous_turn">↪️ Sharp Blind Curve</option>
                    <option value="accident_zone">⚠️ Accident-Prone Junction</option>
                    <option value="poor_lighting">💡 Broken / Unlit Streetlamp</option>
                    <option value="near_miss">⚡ Recurrent Near-Miss Conflict</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: 'rgba(200,200,220,0.75)' }}>Landmark / Location</label>
                  <input
                    type="text"
                    value={hazardLoc}
                    onChange={(e) => setHazardLoc(e.target.value)}
                    className="glass-input w-full p-1.5 text-xs"
                    style={{ color: '#f0f0f0' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: 'rgba(200,200,220,0.75)' }}>📸 Photo Proof Upload</label>
                  <input type="file" accept="image/*" className="w-full text-[9px]" style={{ color: 'rgba(200,200,220,0.6)' }} />
                </div>

                <button type="submit" className="w-full gold-button py-2 rounded-xl text-xs font-bold cursor-pointer">
                  Submit Verified Hazard
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
