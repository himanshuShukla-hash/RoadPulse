import React, { useState } from 'react';
import { Wrench, CheckCircle2, TrendingDown, Calendar, Plus } from 'lucide-react';

export default function InterventionTracker({
  audits = [],
  interventions = [],
  onRecordIntervention
}) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [actionType, setActionType] = useState('convex_mirror');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    onRecordIntervention({
      title,
      action_type: actionType,
      baseline_count: Math.floor(Math.random() * 4 + 3)
    });
    setTitle('');
    setShowModal(false);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold-400/20">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-600">Intervention Audit</span>
          <h3 className="text-lg font-bold text-slate-900 font-serif">Road Safety Interventions & Outcomes</h3>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 gold-button rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Intervention</span>
        </button>
      </div>

      {/* Intervention Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel-dark text-white p-6 rounded-2xl max-w-md w-full border border-gold-400/40 shadow-2xl">
            <h4 className="text-base font-bold font-serif mb-3 text-gold-300">Log Physical Safety Intervention</h4>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Intervention Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Convex Mirror & Raised Pedestrian Crosswalk"
                  className="w-full p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Intervention Category</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                >
                  <option value="convex_mirror">Convex Mirror Installation</option>
                  <option value="speed_table">Speed Table / Raised Crosswalk</option>
                  <option value="high_lumen_lighting">High-Lumen LED Luminaire</option>
                  <option value="signal_retiming">Traffic Signal Phase Retiming</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 gold-button rounded-xl text-slate-900 font-bold cursor-pointer"
                >
                  Confirm & Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List of active interventions with Before & After outcome comparison */}
      <div className="space-y-3">
        {interventions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No interventions logged yet. Complete audits and record physical safety countermeasures here.
          </div>
        ) : (
          interventions.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 hover:border-gold-400/40 transition-all text-xs space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{item.action_type.replace('_', ' ')}</div>
                </div>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Deployed</span>
                </span>
              </div>

              {/* Before vs After Metric */}
              <div className="p-2.5 bg-gold-400/10 rounded-xl border border-gold-400/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Baseline Period</span>
                  <span className="font-bold text-slate-800">{item.baseline_incidents_count} Near-Misses</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Post-Intervention</span>
                  <span className="font-bold text-emerald-700 flex items-center space-x-1 justify-end">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.post_intervention_count} Near-Misses</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
