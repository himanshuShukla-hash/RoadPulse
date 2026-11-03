import React from 'react';
import { Check, X, Copy, Clock, ShieldCheck } from 'lucide-react';

export default function ReviewQueue({ reports = [], onReviewAction }) {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold-400/20">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-600">Decision Support</span>
          <h3 className="text-lg font-bold text-slate-900 font-serif">Reviewer Triage Queue</h3>
        </div>
        <div className="text-xs px-2.5 py-1 bg-white/80 border border-slate-200 rounded-lg text-slate-600 font-semibold">
          {reports.length} Total Submissions
        </div>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No pending submissions yet. Use the live form or click "Simulate Live Incident" to populate incoming reports.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-3.5 rounded-xl bg-white/70 border border-slate-200/90 hover:border-gold-400/50 transition-all space-y-2 text-xs shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-900 capitalize text-sm">
                    {report.category.replace('_', ' ')}
                  </span>
                  <div className="text-[11px] text-slate-500">{report.address}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    report.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {report.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-slate-600 text-xs italic">
                "{report.description}"
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(report.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onReviewAction(report.id, 'verified')}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Verify</span>
                  </button>

                  <button
                    onClick={() => onReviewAction(report.id, 'duplicate')}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => onReviewAction(report.id, 'rejected')}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
