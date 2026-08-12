import React from 'react';

/**
 * SkeletonLoader
 * Generic pulsing placeholder used while the AI analysis call is in flight
 * (expected 8-10s per ARCHITECTURE.md). Reused across Analyzer + future
 * Interview screens.
 */
export default function SkeletonLoader({ rows = 4 }) {
  return (
    <div className="w-full animate-pulse space-y-4" role="status" aria-label="Loading">
      <div className="flex justify-center">
        <div className="h-36 w-36 rounded-full bg-gray-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-gray-200" />
        ))}
      </div>
      <p className="text-center text-sm text-gray-400">
        Analyzing your resume with AI… this can take up to 10 seconds.
      </p>
    </div>
  );
}
