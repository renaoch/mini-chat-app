import React from 'react';
import { Wrench, ShieldAlert, RefreshCw, Lock, Sparkles, Server } from 'lucide-react';

interface MaintenanceViewProps {
  onOpenAdmin: () => void;
  onCheckStatus?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onOpenAdmin, onCheckStatus }) => {
  return (
    <div className="min-h-screen bg-[#06040b] text-white font-sans flex items-center justify-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#0f0a1c] border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 text-center backdrop-blur-xl">
        {/* Animated Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-purple-600/30 to-pink-500/20 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-500/10 animate-pulse">
          <Wrench className="w-10 h-10 text-amber-400" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>MAINTENANCE MODE ACTIVE</span>
          </span>

          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-slate-300 tracking-tight pt-1">
            System Under Scheduled Maintenance
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Our technical operations team is performing scheduled database maintenance & core system updates. Platform operations will be restored shortly.
          </p>
        </div>

        {/* Live Metrics / Status Box */}
        <div className="bg-[#17102b] border border-white/10 rounded-2xl p-4 space-y-3 text-left text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center space-x-2 text-slate-300">
              <Server className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">Core Services</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold">PAUSED</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center space-x-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Data Integrity & Sync</span>
            </div>
            <span className="text-emerald-400 text-[10px] font-bold">SAFE & SECURED</span>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-1">
            🔄 Auto-refreshing status every 5 seconds...
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {onCheckStatus && (
            <button
              onClick={onCheckStatus}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center space-x-2 shadow-md active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Check Server Status Now</span>
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <ShieldAlert className="w-4 h-4 text-pink-300" />
            <span>Administrator Console Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
