import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

/**
 * InterviewResults Page (/interview/:sessionId/results)
 * Day 6 scope: a working completion screen the chat flow can land on.
 * Full AI-scored breakdown (correctness/clarity/confidence, weak topics)
 * is Day 7/57 scope — POST /api/interview/complete does not exist yet.
 * This screen intentionally shows an honest "scoring coming soon" state
 * rather than fake numbers, to keep the MVP demo truthful.
 */
export default function InterviewResults() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const role = location.state?.role || 'your selected role';
  const answeredCount = location.state?.answeredCount ?? null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-3 text-4xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Interview Complete!</h1>
        <p className="mb-1 text-sm text-gray-600">
          You finished your <span className="font-medium">{role}</span> mock interview
          {answeredCount ? ` — ${answeredCount} questions answered.` : '.'}
        </p>
        <div className="my-6 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          🎯 AI-powered scoring (correctness, clarity, confidence, and weak-topic
          breakdown) is arriving soon — this is on the roadmap for the very next
          build session.
        </div>
        <p className="mb-6 text-xs text-gray-400">Session ID: {sessionId}</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Practice Again
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
