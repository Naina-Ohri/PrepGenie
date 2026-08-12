import React, { useState } from 'react';
import toast from 'react-hot-toast';
import UploadDropzone from '../components/UploadDropzone';
import AnalysisReport from '../components/AnalysisReport';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import Button from '../components/Button';
import apiClient from '../lib/apiClient';
import { SUPPORTED_ROLES } from '../lib/constants';

/**
 * Analyzer Page (/analyzer)
 * Day 7 refinements: ErrorState with retry, shared Button component.
 * Day 58 fix: now imports SUPPORTED_ROLES from lib/constants.js instead
 * of a locally hardcoded array, keeping it in sync with RoleSelect.jsx
 * and the backend's constants/roles.js.
 */
export default function Analyzer() {
  const [resumeId, setResumeId] = useState(null);
  const [textPreview, setTextPreview] = useState('');
  const [targetRole, setTargetRole] = useState(SUPPORTED_ROLES[0]);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const handleUploadSuccess = ({ resume_id, text_preview }) => {
    setResumeId(resume_id);
    setTextPreview(text_preview);
    setAnalysis(null);
    setAnalyzeError(null);
  };

  const handleAnalyze = async () => {
    if (!resumeId) {
      toast.error('Please upload a resume first.');
      return;
    }
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await apiClient.post('/resume/analyze', {
        resume_id: resumeId,
        target_role: targetRole,
      });
      setAnalysis(res.data.data);
      toast.success('Analysis complete!');
    } catch (err) {
      const message =
        err?.response?.data?.error || 'Something went wrong while analyzing your resume.';
      setAnalyzeError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
        Resume Analyzer
      </h1>

      {!analysis && (
        <div className="space-y-6">
          <UploadDropzone onUploadSuccess={handleUploadSuccess} />

          {textPreview && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="mb-1 font-medium text-gray-700">Extracted preview:</p>
              <p className="line-clamp-3">{textPreview}</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <label className="flex flex-col items-center gap-1 text-sm font-medium text-gray-700 sm:flex-row sm:gap-2">
              <span>Target Role</span>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                aria-label="Target role for resume analysis"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {SUPPORTED_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <Button
              onClick={handleAnalyze}
              disabled={!resumeId}
              isLoading={isAnalyzing}
              loadingText="Analyzing…"
              size="lg"
            >
              Analyze Resume
            </Button>
          </div>

          {isAnalyzing && <SkeletonLoader rows={5} />}

          {analyzeError && !isAnalyzing && (
            <ErrorState
              title="Analysis failed"
              description={analyzeError}
              onRetry={handleAnalyze}
            />
          )}
        </div>
      )}

      {analysis && !isAnalyzing && (
        <AnalysisReport analysis={analysis} onReanalyze={handleAnalyze} isReanalyzing={isAnalyzing} />
      )}
    </div>
  );
}
