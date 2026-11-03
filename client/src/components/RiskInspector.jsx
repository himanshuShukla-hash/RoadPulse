import React from 'react';
import { ShieldAlert, Info, ArrowUpRight, CheckCircle, BarChart3 } from 'lucide-react';

export default function RiskInspector({ location, onCreateAudit }) {
  if (!location) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center h-[340px]">
        <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-600 mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h4 className="font-serif font-bold text-slate-800 mb-1">Priority Risk Inspector</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Select any clustered hotspot on the map or submit a live report to inspect the weighted 5-factor mathematical score.
        </p>
      </div>
    );
  }

  const { risk_score, priorityBand, breakdown, title, reports_count } = location;

  return (
    <div className="glass-panel p-6 rounded-2xl border-gold-400/40 relative">
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-gold-400/20">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-gold-600">
            {priorityBand || 'Priority Audit'}
          </span>
          <h3 className="text-base font-serif font-bold text-slate-900 leading-tight mt-0.5">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            <b>{reports_count}</b> contributing near-miss reports clustered within 180m radius
          </p>
        </div>

        <div className="flex flex-col items-end">
          <div className="px-3.5 py-1.5 rounded-xl bg-gold-400/20 border border-gold-500/40 text-slate-950 font-extrabold text-xl shadow-sm">
            {risk_score}<span className="text-xs font-normal text-slate-600">/100</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 font-medium">Screening Score</span>
        </div>
      </div>

      {/* 5-Factor Formula Explanation Card */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <BarChart3 className="w-3.5 h-3.5 text-gold-600" />
          <span>Screening Model: 0.30R + 0.25V + 0.20T + 0.15E + 0.10C</span>
        </div>

        <div className="space-y-2 bg-white/60 p-3 rounded-xl border border-gold-400/20">
          {breakdown && Object.entries(breakdown).map(([key, item]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  <strong className="text-gold-700">{key}</strong> ({item.weight * 100}%): {item.label}
                </span>
                <span className="font-semibold text-slate-900">
                  {item.value} / 100 <span className="text-[11px] text-slate-500 font-normal">(+{item.contribution} pts)</span>
                </span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-gold-400 to-gold-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Trigger */}
      <button
        onClick={() => onCreateAudit(location)}
        className="w-full py-2.5 px-4 rounded-xl border border-gold-500 bg-gold-400/10 hover:bg-gold-400/20 text-slate-900 font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
      >
        <ShieldAlert className="w-4 h-4 text-gold-600" />
        <span>Deploy Safety Audit Task for this Hotspot</span>
      </button>
    </div>
  );
}
