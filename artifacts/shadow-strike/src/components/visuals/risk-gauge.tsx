import React from 'react';

export function RiskGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "text-emerald-500";
  let bgClass = "bg-emerald-50";
  if (score > 30) { color = "text-amber-500"; bgClass = "bg-amber-50"; }
  if (score > 60) { color = "text-orange-500"; bgClass = "bg-orange-50"; }
  if (score > 85) { color = "text-rose-500"; bgClass = "bg-rose-50"; }

  return (
    <div className={`relative flex items-center justify-center p-6 rounded-2xl ${bgClass} transition-colors duration-500`}>
      <svg className="transform -rotate-90 w-40 h-40">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-black/5"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-4xl font-display font-bold ${color}`}>
          {score}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">
          Risk Score
        </span>
      </div>
    </div>
  );
}
