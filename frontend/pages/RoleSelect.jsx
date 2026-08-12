import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState';
import apiClient from '../lib/apiClient';
import { SUPPORTED_ROLES, ROLE_DETAILS } from '../lib/constants';

/**
 * RoleSelect Page (/interview)
 * Day 7 refinements: accessible focusable cards, retry-able ErrorState.
 * Day 58 fix: now imports SUPPORTED_ROLES/ROLE_DETAILS from
 * lib/constants.js instead of a locally hardcoded array, keeping it in
 * sync with Analyzer.jsx and the backend's constants/roles.js.
 */
export default function RoleSelect() {
  const [loadingRole, setLoadingRole] = useState(null);
  const [lastFailedRole, setLastFailedRole] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSelectRole = async (role) => {
    setLoadingRole(role);
    setError(null);
    try {
      const res = await apiClient.post('/interview/start', { role });
      const { session_id, current_question, total_questions } = res.data.data;

      navigate(`/interview/${session_id}`, {
        state: { role, current_question, total_questions },
      });
    } catch (err) {
      const message = err?.response?.data?.error || 'Could not start the interview. Please try again.';
      setError(message);
      setLastFailedRole(role);
      toast.error(message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="mb-2 text-center text-xl font-bold text-gray-900 sm:text-2xl">
        Choose Your Interview Track
      </h1>
      <p className="mb-8 text-center text-sm text-gray-500">
        Pick a role and PrepGenie will generate a realistic mock interview for you.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SUPPORTED_ROLES.map((role) => {
          const { icon, description } = ROLE_DETAILS[role];
          return (
            <button
              key={role}
              type="button"
              onClick={() => handleSelectRole(role)}
              disabled={loadingRole !== null}
              aria-label={`Start a ${role} mock interview`}
              className="flex min-h-[44px] flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors duration-150 hover:border-indigo-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-3xl" aria-hidden="true">{icon}</span>
              <span className="text-lg font-semibold text-gray-900">{role}</span>
              <span className="text-sm text-gray-500">{description}</span>
              {loadingRole === role && (
                <span className="mt-2 text-xs font-medium text-indigo-600">Generating questions…</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorState
            title="Couldn't start the interview"
            description={error}
            onRetry={() => handleSelectRole(lastFailedRole)}
          />
        </div>
      )}
    </div>
  );
}
