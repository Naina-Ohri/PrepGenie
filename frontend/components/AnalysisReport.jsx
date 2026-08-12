import React, { useState } from 'react';
import ScoreGauge from './ScoreGauge';

const SECTION_LABELS = {
  summary: 'Summary',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
};

function SectionAccordion({ sectionKey, section }) {
  const [open, setOpen] = useState(sectionKey === 'summary');

  return (
    <div className="border-b border-gray-200 py-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-gray-800">
          {SECTION_LABELS[sectionKey] || sectionKey}
        </span>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          {section.score}/10
          <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>
      {open && (
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-gray-600">
          {section.suggestions.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * AnalysisReport
 * Renders the structured AI feedback JSON returned by POST /api/resume/analyze.
 * Shape documented in API.md §2.2.
 */
export default function AnalysisReport({ analysis, onReanalyze }) {
  if (!analysis) return null;

  const { ats_score, missing_keywords, sections, overall_feedback } = analysis;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-6">
        <ScoreGauge score={ats_score} label="ATS Compatibility Score" />
        <p className="text-center text-sm text-gray-600">{overall_feedback}</p>
      </div>

      <div className="py-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Missing Keywords</h3>
        <div className="flex flex-wrap gap-2">
          {missing_keywords && missing_keywords.length > 0 ? (
            missing_keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
              >
                {kw}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No major keyword gaps found 🎉</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-gray-700">Section-by-Section Feedback</h3>
        {Object.keys(sections).map((key) => (
          <SectionAccordion key={key} sectionKey={key} section={sections[key]} />
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onReanalyze}
          className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Re-analyze
        </button>
      </div>
    </div>
  );
}
