import React from 'react';

/**
 * ErrorState
 * Inline error pattern shown when a request fails in a way the user can
 * act on (e.g. retry). Distinct from ErrorBoundary, which catches
 * unexpected render crashes — this is for expected, recoverable API errors.
 */
export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <span className="text-3xl" aria-hidden="true">⚠️</span>
      <h3 className="text-base font-semibold text-red-700">{title}</h3>
      <p className="max-w-sm text-sm text-red-600">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
