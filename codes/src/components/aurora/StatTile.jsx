import React from 'react';

export function StatTile({ value, label, trend, icon: Icon, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-[20px] p-6 border border-aurora-border shadow-aurora-card hover:shadow-aurora-card-hover transition-all duration-200 ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-aurora-glow opacity-60 rounded-full blur-2xl -mr-10 -mt-10" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="text-[48px] font-extrabold font-heading text-aurora-text-high leading-none">{value}</div>
          {Icon && <div className="text-aurora-text-low bg-aurora-surface-1 p-2 rounded-full"><Icon className="h-5 w-5 text-aurora-blue" /></div>}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-aurora-text-low mb-3">{label}</div>
        {trend && (
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold shadow-sm">
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
