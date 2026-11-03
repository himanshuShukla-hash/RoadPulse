import React, { useState, useEffect } from 'react';
import InteractiveMap from './components/InteractiveMap';
import ReportForm from './components/ReportForm';
import RiskInspector from './components/RiskInspector';
import ReviewQueue from './components/ReviewQueue';
import InterventionTracker from './components/InterventionTracker';
import { 
  Activity, 
  ShieldAlert, 
  MapPin, 
  Play, 
  RotateCcw, 
  CheckCircle,
  FileText,
  Wrench,
  Radio,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

export default function App() {
  const [locations, setLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [audits, setAudits] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pinTarget, setPinTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'queue', 'interventions'
  const [liveStreamAlert, setLiveStreamAlert] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [locRes, repRes, audRes, intRes] = await Promise.all([
        fetch('/api/locations').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
        fetch('/api/audits').then(r => r.json()),
        fetch('/api/interventions').then(r => r.json()),
      ]);
      if (locRes.success) setLocations(locRes.locations);
      if (repRes.success) setReports(repRes.reports);
      if (audRes.success) setAudits(audRes.audits);
      if (intRes.success) setInterventions(intRes.interventions);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // SSE Stream
    const eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'REPORT_CREATED') {
          setReports((prev) => [payload.payload.report, ...prev]);
          setLocations((prev) => {
            const locIndex = prev.findIndex(l => l.id === payload.payload.location.id);
            if (locIndex >= 0) {
              const updated = [...prev];
              updated[locIndex] = payload.payload.location;
              return updated;
            } else {
              return [...prev, payload.payload.location];
            }
          });
          setSelectedLocation(payload.payload.location);

          setLiveStreamAlert({
            title: payload.payload.report.category.replace('_', ' ').toUpperCase(),
            address: payload.payload.report.address,
            score: payload.payload.location.risk_score
          });
          setTimeout(() => setLiveStreamAlert(null), 5000);
        } else if (payload.type === 'STATE_CLEARED') {
          setLocations([]);
          setReports([]);
          setSelectedLocation(null);
          setAudits([]);
          setInterventions([]);
        }
      } catch (e) {
        console.error('SSE error:', e);
      }
    };

    return () => eventSource.close();
  }, []);

  const handleSimulateIncident = async () => {
    try {
      const res = await fetch('/api/demo/simulate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Simulation error:', e);
    }
  };

  const handleResetDemo = async () => {
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setLocations([]);
      setReports([]);
      setSelectedLocation(null);
      setAudits([]);
      setInterventions([]);
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const handleReviewAction = async (reportId, status) => {
    try {
      await fetch(`/api/reports/${reportId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (e) {
      console.error('Review update error:', e);
    }
  };

  const handleCreateAudit = async (loc) => {
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: loc.id, notes: `Prioritized field inspection for score ${loc.risk_score}` })
      });
      const data = await res.json();
      if (data.success) {
        setAudits((prev) => [data.audit, ...prev]);
        setActiveTab('interventions');
      }
    } catch (e) {
      console.error('Audit error:', e);
    }
  };

  const handleRecordIntervention = async (item) => {
    try {
      const res = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          location_id: selectedLocation ? selectedLocation.id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setInterventions((prev) => [data.intervention, ...prev]);
      }
    } catch (e) {
      console.error('Intervention error:', e);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col bg-cream-50 selection:bg-gold-400 selection:text-white">
      {/* Top Header / Executive Command Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gold-400/30 px-6 py-3.5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 via-gold-500 to-gold-400 flex items-center justify-center text-slate-950 font-black shadow-gold-glow">
              <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold font-serif text-slate-900 tracking-tight">ROADPULSE</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold-400/20 text-gold-700 border border-gold-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse"></span>
                  <span>Live Matrix</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Near-Miss Intelligence & Road-Safety Prioritization</p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center space-x-1.5 bg-white/70 p-1 rounded-xl border border-gold-400/30 shadow-inner">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'overview'
                  ? 'bg-gold-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Map & Live Intake</span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'queue'
                  ? 'bg-gold-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reviewer Queue ({reports.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'interventions'
                  ? 'bg-gold-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Audits & Interventions</span>
            </button>
          </div>

          {/* Judge Live Pitch Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateIncident}
              className="gold-button px-4 py-2 rounded-xl text-xs flex items-center space-x-2 font-bold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Live Incident</span>
            </button>

            <button
              onClick={handleResetDemo}
              title="Reset state to clear slate"
              className="p-2 rounded-xl bg-white/70 border border-slate-300 hover:border-gold-400 text-slate-600 hover:text-slate-900 text-xs flex items-center cursor-pointer transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Live Stream Alert Toast */}
      {liveStreamAlert && (
        <div className="max-w-[1600px] w-full mx-auto px-6 mt-3 animate-bounce">
          <div className="glass-panel p-3 rounded-xl border border-gold-500/60 flex items-center justify-between text-xs bg-gold-400/15 shadow-md">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-ping"></span>
              <span className="font-bold text-slate-900">INCIDENT BROADCAST INGESTED:</span>
              <span className="text-slate-800 font-medium">{liveStreamAlert.title} at {liveStreamAlert.address}</span>
            </div>
            <div className="font-bold text-slate-900 bg-white/80 px-2.5 py-0.5 rounded-lg border border-gold-400/30">
              Risk Recalculated: <span className="text-gold-700 font-extrabold">{liveStreamAlert.score}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <section className="max-w-[1600px] w-full mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-3.5 rounded-2xl border-gold-400/25 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clustered Hotspots</span>
              <div className="text-2xl font-black font-serif text-slate-900">{locations.length}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-700">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border-gold-400/25 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Near-Miss Reports</span>
              <div className="text-2xl font-black font-serif text-slate-900">{reports.length}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-700">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border-gold-400/25 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Safety Audits</span>
              <div className="text-2xl font-black font-serif text-slate-900">{audits.length}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border-gold-400/25 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Interventions</span>
              <div className="text-2xl font-black font-serif text-slate-900">{interventions.length}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-700">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Layout */}
      <main className="max-w-[1600px] w-full mx-auto px-6 pb-12 flex-1">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Full Map & Inspector */}
            <div className="lg:col-span-8 space-y-5">
              <InteractiveMap
                locations={locations}
                selectedLocation={selectedLocation}
                onSelectHotspot={(loc) => setSelectedLocation(loc)}
                onMapClick={(latlng) => setPinTarget(latlng)}
                pinTarget={pinTarget}
              />

              <RiskInspector
                location={selectedLocation}
                onCreateAudit={handleCreateAudit}
              />
            </div>

            {/* Right 4 Cols: Streamlined Citizen Form */}
            <div className="lg:col-span-4 sticky top-20">
              <ReportForm
                activePin={pinTarget}
                setActivePin={setPinTarget}
                onReportSubmitted={() => fetchData()}
              />
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="max-w-4xl mx-auto">
            <ReviewQueue
              reports={reports}
              onReviewAction={handleReviewAction}
            />
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="max-w-4xl mx-auto">
            <InterventionTracker
              audits={audits}
              interventions={interventions}
              onRecordIntervention={handleRecordIntervention}
            />
          </div>
        )}
      </main>
    </div>
  );
}
