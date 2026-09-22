import React from 'react';

export const ThreatBadge = ({ level, size = 'md' }) => {
  const normLevel = (level || 'LOW').toUpperCase();

  const colorMap = {
    LOW: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    MEDIUM: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    HIGH: 'bg-orange-950/80 text-orange-300 border-orange-500/40',
    CRITICAL: 'bg-red-950/90 text-red-300 border-red-500/60 animate-pulse',
  };

  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${
        colorMap[normLevel] || colorMap.LOW
      } ${sizeMap[size] || sizeMap.md}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          normLevel === 'CRITICAL'
            ? 'bg-red-500'
            : normLevel === 'HIGH'
            ? 'bg-orange-500'
            : normLevel === 'MEDIUM'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />
      {normLevel} ALERT
    </span>
  );
};

export default ThreatBadge;
