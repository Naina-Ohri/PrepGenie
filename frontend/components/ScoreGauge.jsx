import React from 'react';

/**
 * ScoreGauge
 * Circular SVG gauge showing a 0-100 score with color coded by band:
 * red (0-49), amber (50-74), green (75-100) — per UI-WIREFRAMES.md design system.
 */
export default function ScoreGauge({ score = 0, label = 'ATS Score' }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 75 ? '#16a34a' : clamped >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text
          x="70"
          y="72"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="28"
          fontWeight="700"
          fill="#111827"
        >
          {clamped}
        </text>
      </svg>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}
