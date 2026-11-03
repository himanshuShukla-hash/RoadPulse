import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Milestone,
  PlusCircle,
  X,
  Compass,
  Search,
  Sparkles
} from 'lucide-react';
import { DemoLocation, CandidateRoute, RouteResponse } from './types';

const API_BASE = 'http://localhost:5001/api';

export default function App() {
  const [originInput, setOriginInput] = useState<string>('Koramangala 5th Block');
  const [destInput, setDestInput] = useState<string>('Indiranagar 100ft Road');
  const [lambda, setLambda] = useState<number>(0.50);
  
  const [routes, setRoutes] = useState<CandidateRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<CandidateRoute | null>(null);
  const [gmapsUrl, setGmapsUrl] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  
  const [showHazardModal, setShowHazardModal] = useState<boolean>(false);
  const [hazardCategory, setHazardCategory] = useState<string>('pothole');
  const [hazardSeverity, setHazardSeverity] = useState<number>(60);
  const [hazardDesc, setHazardDesc] = useState<string>('');
  const [hazardSuccess, setHazardSuccess] = useState<boolean>(false);

  // Quick preset real routes
  const PRESETS = [
    { from: 'Koramangala 5th Block', to: 'Indiranagar 100ft Road' },
    { from: 'HSR Layout Sector 1', to: 'MG Road Metro Station' },
    { from: 'Indiranagar 100ft Road', to: 'Whitefield Main Road' }
  ];

  useEffect(() => {
    // Initial fetch to verify connection
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleCalculateRoutes = async () => {
    if (!originInput.trim() || !destInput.trim()) {
      setError('Please enter both origin and destination addresses.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/routes/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_query: originInput,
          dest_query: destInput,
          lambda
        })
      });

      const data: RouteResponse = await res.json();
      if (data.success && data.routes) {
        setRoutes(data.routes);
        setSelectedRoute(data.routes[0]);
        setGmapsUrl(data.google_maps_url);
      } else {
        setError('No navigable routes found between these locations.');
      }
    } catch {
      setError('Failed to fetch real-world road network. Make sure server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleLambdaChange = async (newVal: number) => {
    setLambda(newVal);
    if (routes.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/routes/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routes,
          lambda: newVal
        })
      });
      const data = await res.json();
      if (data.success && data.routes) {
        setRoutes(data.routes);
        setSelectedRoute(data.routes[0]);
      }
    } catch (e) {
      console.error('Recalculate error:', e);
    }
  };

  const handleReportHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/hazards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: hazardCategory,
          severity: hazardSeverity,
          description: hazardDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setHazardSuccess(true);
        setTimeout(() => {
          setHazardSuccess(false);
          setShowHazardModal(false);
          setHazardDesc('');
          handleCalculateRoutes();
        }, 1200);
      }
    } catch (err) {
      console.error('Hazard submit error:', err);
    }
  };

  const getLambdaLabel = (val: number) => {
    if (val <= 0.15) return '0.00 — Pure Fastest';
    if (val <= 0.35) return '0.25 — Slight Safety Preference';
    if (val <= 0.65) return '0.50 — Balanced';
    if (val <= 0.85) return '0.75 — Strong Safety Preference';
    return '1.00 — Safety-Prioritized';
  };

  return (
    <div className="w-[420px] min-h-[580px] bg-cream-50 text-slate-800 flex flex-col p-4 text-xs select-none">
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
                Live GPS Routing
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Real-World Safety Companion for Google Maps</p>
          </div>
        </div>

        <button
          onClick={() => setShowHazardModal(true)}
          className="p-1.5 bg-white/80 hover:bg-gold-400/20 rounded-xl border border-gold-400/30 text-gold-700 flex items-center space-x-1 transition-colors cursor-pointer"
          title="Submit new road hazard observation"
        >
          <PlusCircle className="w-4 h-4 text-gold-600" />
          <span className="text-[10px] font-bold">Report</span>
        </button>
      </header>

      {/* Backend Status Warning */}
      {!backendOnline && (
        <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Backend routing engine offline. Run "npm start" in /server.</span>
        </div>
      )}

      {/* Real-World Address Inputs */}
      <section className="glass-panel p-3 rounded-2xl border border-gold-400/20 space-y-2 mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gold-700 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Search className="w-3 h-3" />
            <span>Enter Real Addresses</span>
          </div>
          <span className="text-[9px] text-slate-400 font-normal">Real Roads & Turn Steps</span>
        </div>

        <div className="space-y-1.5">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Origin Location</label>
            <input
              type="text"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              placeholder="e.g. Koramangala, Connaught Place, Times Square"
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Destination Location</label>
            <input
              type="text"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              placeholder="e.g. Indiranagar, Cyber City, Brooklyn"
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1 pt-1 overflow-x-auto">
          <span className="text-[9px] text-slate-400 uppercase font-bold shrink-0">Presets:</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOriginInput(p.from);
                setDestInput(p.to);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-gold-400/20 rounded text-[9px] text-slate-600 font-medium whitespace-nowrap cursor-pointer transition-colors"
            >
              {p.from.split(' ')[0]} ➔ {p.to.split(' ')[0]}
            </button>
          ))}
        </div>

        <button
          onClick={handleCalculateRoutes}
          disabled={loading}
          className="w-full gold-button py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 font-bold cursor-pointer mt-1"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{loading ? 'Routing Real Roads...' : 'Analyze Real-World Safety Alternatives'}</span>
        </button>
      </section>

      {/* Safety Preference Slider (Lambda λ) */}
      <section className="glass-panel p-3 rounded-2xl border border-gold-400/20 space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 flex items-center space-x-1">
            <Sliders className="w-3 h-3" />
            <span>Safety Preference λ: {lambda.toFixed(2)}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-900 bg-gold-400/20 px-2 py-0.5 rounded-md border border-gold-400/30">
            {getLambdaLabel(lambda).split(' — ')[1]}
          </span>
        </div>

        <input
          type="range"
          min="0.00"
          max="1.00"
          step="0.05"
          value={lambda}
          onChange={(e) => handleLambdaChange(parseFloat(e.target.value))}
          className="w-full accent-gold-500 cursor-pointer"
        />

        <div className="flex justify-between text-[9px] text-slate-500 font-medium">
          <span>0.00 (Fastest)</span>
          <span>0.50 (Balanced)</span>
          <span>1.00 (Safest)</span>
        </div>

        <div className="p-1.5 bg-white/70 rounded-lg border border-slate-100 text-[10px] text-slate-600 leading-tight">
          Generalized cost: <strong className="text-slate-800">J = T_norm + (λ × R_norm)</strong>. Real routes rerank dynamically as λ shifts.
        </div>
      </section>

      {/* Real Candidate Route Results */}
      <section className="flex-1 space-y-2 mb-3">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px]">
            {error}
          </div>
        )}

        {routes.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Real Road Alternatives ({routes.length} Computed)
            </div>

            {routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    route.isRecommended
                      ? 'bg-amber-50/70 border-gold-500 shadow-sm'
                      : isSelected
                      ? 'bg-white border-slate-400'
                      : 'bg-white/70 border-slate-200 hover:border-gold-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        route.isRecommended ? 'bg-gold-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {route.isRecommended ? '★ Recommended' : route.routeLabel}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {route.travel_time_minutes} min
                      </span>
                      {route.extra_time_seconds > 0 && (
                        <span className="text-[10px] text-amber-700 font-medium">
                          (+{route.extra_time_minutes}m)
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-extrabold text-slate-900">
                        Risk: {route.route_risk}
                      </span>
                      <span className="text-[9px] text-slate-400 block">/100</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 mb-1.5 font-medium leading-relaxed">
                    🛣️ {route.summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Milestone className="w-3 h-3 text-slate-400" />
                      <span>{(route.distance_meters / 1000).toFixed(1)} km</span>
                    </span>
                    <span className="font-medium text-slate-700">
                      Cost J: <strong>{route.cost}</strong>
                    </span>
                    <span className="text-[9px] text-slate-400">
                      (T: {route.T_norm} + λR: {(lambda * route.R_norm).toFixed(2)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Continue in Google Maps Action Button */}
      {selectedRoute && (
        <section className="glass-panel p-3 rounded-2xl border border-gold-400/40 space-y-2 mt-auto">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-slate-900">
                {selectedRoute.routeLabel} Real Route Ready
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {selectedRoute.explanation}
              </p>
            </div>
          </div>

          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <span>Navigate Route in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
          </a>

          <p className="text-[9px] text-slate-400 text-center leading-tight">
            *Opens official Google Maps directions for your exact real-world start & destination points.
          </p>
        </section>
      )}

      {/* Hazard Report Modal */}
      {showHazardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-panel bg-white p-4 rounded-2xl w-full max-w-xs border border-gold-400 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-serif font-bold text-slate-900 text-xs">Log Real Road Hazard</span>
              <button onClick={() => setShowHazardModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {hazardSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium text-center">
                Observation logged! Real risk recalculated.
              </div>
            ) : (
              <form onSubmit={handleReportHazard} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Hazard Category</label>
                  <select
                    value={hazardCategory}
                    onChange={(e) => setHazardCategory(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="pothole">Pothole / Road Defect</option>
                    <option value="near_miss">Near-Miss Collision Hotspot</option>
                    <option value="poor_lighting">Poor Lighting / Inadequate Lamp</option>
                    <option value="dangerous_turn">Dangerous Curve / Blind Junction</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Severity: {hazardSeverity}/100</label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={hazardSeverity}
                    onChange={(e) => setHazardSeverity(parseInt(e.target.value))}
                    className="w-full accent-gold-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">Notes / Street</label>
                  <textarea
                    rows={2}
                    value={hazardDesc}
                    onChange={(e) => setHazardDesc(e.target.value)}
                    placeholder="Describe exact street or road landmark..."
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full gold-button py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Submit to Risk Network
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
