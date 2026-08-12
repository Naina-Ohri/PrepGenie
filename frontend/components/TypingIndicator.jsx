import React from 'react';

/**
 * TypingIndicator
 * Shown briefly between questions to simulate interviewer pacing.
 *
 * Day 7 refinements: announced to screen readers via aria-live so it
 * doesn't feel like a silent freeze, and the bounce animation is
 * automatically disabled for users with prefers-reduced-motion set
 * (handled globally in tokens.css).
 */
export default function TypingIndicator() {
  return (
    <div className="flex w-full justify-start" aria-live="polite">
      <span className="sr-only">Interviewer is typing</span>
      <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-3 shadow-sm">
        <span className="mr-1 text-sm" aria-hidden="true">🤖</span>
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" aria-hidden="true" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" aria-hidden="true" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" aria-hidden="true" />
      </div>
    </div>
  );
}
