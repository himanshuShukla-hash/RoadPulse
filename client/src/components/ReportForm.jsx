import React, { useState } from 'react';
import { Send, MapPin, Camera, AlertTriangle, User, Compass } from 'lucide-react';

export default function ReportForm({ onReportSubmitted, activePin, setActivePin }) {
  const [category, setCategory] = useState('blind_turn');
  const [description, setDescription] = useState('');
  const [roadUserType, setRoadUserType] = useState('two_wheeler');
  const [address, setAddress] = useState('Times Square & 7th Avenue Intersection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const categories = [
    { id: 'blind_turn', label: 'Blind Turn / Obstructed Corner', icon: Compass },
    { id: 'pedestrian_conflict', label: 'Pedestrian Crossing Conflict', icon: User },
    { id: 'sudden_braking', label: 'Sudden Braking Hotspot', icon: AlertTriangle },
    { id: 'poor_lighting', label: 'Poor Visibility / Inadequate Lighting', icon: Camera },
    { id: 'speeding_corridor', label: 'Uncontrolled Speeding Corridor', icon: AlertTriangle },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const lat = activePin ? activePin.lat : 40.7580 + (Math.random() - 0.5) * 0.003;
    const lng = activePin ? activePin.lng : -73.9855 + (Math.random() - 0.5) * 0.003;

    const payload = {
      category,
      description: description || 'Recurrent near-collision event captured during live audit walkthrough.',
      latitude: lat,
      longitude: lng,
      address,
      road_user_type: roadUserType,
      photo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessNotice(true);
        setTimeout(() => setSuccessNotice(false), 3000);
        setDescription('');
        if (onReportSubmitted) onReportSubmitted(data.data);
      }
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold-400/20">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-600">Citizen Intelligence</span>
          <h3 className="text-lg font-bold text-slate-900 font-serif">Submit Near-Miss Observation</h3>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-gold-400/10 rounded-full border border-gold-400/30 text-gold-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
          <span>Live Intake</span>
        </div>
      </div>

      {successNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Observation broadcast live! Clustering and risk score recalculated.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hazard Classification</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-center space-x-2 border ${
                    isSelected
                      ? 'bg-gold-400/15 border-gold-500 text-slate-900 font-semibold shadow-sm'
                      : 'bg-white/50 border-slate-200 text-slate-600 hover:border-gold-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-gold-600' : 'text-slate-400'}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Road User Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Road User</label>
            <select
              value={roadUserType}
              onChange={(e) => setRoadUserType(e.target.value)}
              className="w-full text-xs p-2.5 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium"
            >
              <option value="pedestrian">Pedestrian</option>
              <option value="cyclist">Bicycle / Micro-mobility</option>
              <option value="two_wheeler">Two-Wheeler / Scooter</option>
              <option value="car">Automobile</option>
              <option value="transit_bus">Public Transit / Bus</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location Coordinate Target</label>
            <div className="text-xs p-2.5 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-between text-slate-600 font-medium">
              <span className="truncate">
                {activePin ? `${activePin.lat.toFixed(4)}, ${activePin.lng.toFixed(4)}` : 'Click Map to Pin'}
              </span>
              <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Address / Landmark */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Corridor / Landmark Name</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs p-2.5 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:border-gold-500 font-medium"
            placeholder="e.g. 5th Ave & Pine St blind exit"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observation Details</label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the near-collision circumstance, traffic speed, or visual blockage..."
            className="w-full text-xs p-2.5 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:border-gold-500"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full gold-button py-3 rounded-xl text-xs flex items-center justify-center space-x-2 font-bold tracking-wide cursor-pointer uppercase shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Transmitting Observation...' : 'Transmit Live Observation'}</span>
        </button>
      </form>
    </div>
  );
}
