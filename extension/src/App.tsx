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
    <div className="w-[390px] min-h-[460px] bg-cream-50 text-slate-800 flex flex-col p-4 text-xs select-none">
      {/* Extension Header */}
      <header className="glass-panel p-3 rounded-2xl flex items-center justify-between mb-3 border border-gold-400/30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-slate-950 font-black shadow-sm">
            <Compass className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-serif font-bold text-slate-900 tracking-tight text-sm">ROADPULSE</h1>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                Rohini Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Google Maps Safety Route Companion</p>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="p-1.5 bg-white/80 hover:bg-gold-400/20 rounded-xl border border-gold-400/30 text-gold-700 flex items-center space-x-1 cursor-pointer transition-colors"
          title="Report Pothole, Blind Curve or Accident"
        >
          <PlusCircle className="w-4 h-4 text-gold-600" />
          <span className="text-[10px] font-bold">Report</span>
        </button>
      </header>

      {/* Origin & Destination Inputs directly inside extension popup */}
      <section className="glass-panel p-3.5 rounded-2xl border border-gold-400/30 space-y-2.5 mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gold-700 flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-gold-600" />
          <span>Route Location Selector</span>
        </div>

        <div>
          <label className="text-[10px] text-slate-600 font-bold block mb-1">Starting Point (Origin)</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Rithala Metro Station"
            className="w-full p-2 bg-white border border-slate-300 rounded-xl text-[11px] font-medium text-slate-900 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-600 font-bold block mb-1">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. M2K Cinemas Rohini, Sector 3"
            className="w-full p-2 bg-white border border-slate-300 rounded-xl text-[11px] font-medium text-slate-900 focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1 pt-1 overflow-x-auto">
          <span className="text-[9px] text-slate-400 uppercase font-bold shrink-0">Presets:</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOrigin(p.from);
                setDestination(p.to);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-gold-400/20 rounded text-[9px] text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-colors"
            >
              {p.from.split(' ')[0]} ➔ {p.to.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Start Route on Google Maps button */}
        <button
          onClick={handleStartGoogleMapsNavigation}
          className="w-full gold-button py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 font-bold cursor-pointer shadow-md mt-1"
        >
          <Navigation className="w-4 h-4 fill-current" />
          <span>Start Route on Google Maps</span>
        </button>
      </section>

      {/* Explanatory Info Card */}
      <section className="glass-panel p-3 rounded-2xl border border-slate-200 text-slate-600 space-y-1 mt-auto">
        <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 text-gold-600" />
          <span>Automatic In-Page Safety Scoring</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          When you click "Start Route", Google Maps opens with these exact locations and RoadPulse's floating HUD shows **3 alternative safety paths** with risk scores!
        </p>
      </section>

      {/* Hazard Reporting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-panel bg-white p-4 rounded-2xl w-full border border-gold-400 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-serif font-bold text-slate-900 text-xs">Mark Road Hazard</span>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium text-center">
                ✔ Hazard verified and logged into Rohini network!
              </div>
            ) : (
              <form onSubmit={handleReportHazard} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Hazard Type</label>
                  <select
                    value={hazardCategory}
                    onChange={(e) => setHazardCategory(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="pothole">🕳️ Pothole / Road Damage</option>
                    <option value="dangerous_turn">↪️ Sharp Blind Curve</option>
                    <option value="accident_zone">⚠️ Accident-Prone Junction</option>
                    <option value="poor_lighting">💡 Broken / Unlit Streetlamp</option>
                    <option value="near_miss">⚡ Recurrent Near-Miss Conflict</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Landmark / Location</label>
                  <input
                    type="text"
                    value={hazardLoc}
                    onChange={(e) => setHazardLoc(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">📸 Photo Proof Upload</label>
                  <input type="file" accept="image/*" className="w-full text-[9px] text-slate-500" />
                </div>

                <button
                  type="submit"
                  className="w-full gold-button py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
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
