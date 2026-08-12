/**
 * aiService.js
 * All Claude API interaction lives here. Server-side only — API key never
 * reaches the client. Enforces strict JSON-only output per ARCHITECTURE.md.
 */

const { safeParseAIJson } = require('../utils/safeParseAIJson');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function buildResumeAnalysisPrompt(resumeText, targetRole) {
  return `You are an expert technical resume reviewer and ATS (Applicant Tracking System) simulator.

TARGET ROLE: ${targetRole}

RESUME TEXT:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown fences, no prose, no explanation) with this EXACT shape:
{
  "ats_score": number (0-100),
  "missing_keywords": string[] (max 8 items, relevant to the target role),
  "sections": {
    "summary": { "score": number (0-10), "suggestions": string[] (max 3) },
    "skills": { "score": number (0-10), "suggestions": string[] (max 3) },
    "projects": { "score": number (0-10), "suggestions": string[] (max 3) },
    "experience": { "score": number (0-10), "suggestions": string[] (max 3) }
  },
  "overall_feedback": string (max 2 sentences)
}

Scoring anchors: 0-3 = missing/very weak, 4-6 = present but needs improvement, 7-10 = strong.
Return ONLY the JSON object above. Nothing else.`;
}

function validateResumeAnalysisShape(parsed) {
  return (
    parsed &&
    typeof parsed.ats_score === 'number' &&
    Array.isArray(parsed.missing_keywords) &&
    parsed.sections &&
    ['summary', 'skills', 'projects', 'experience'].every(
      (key) =>
        parsed.sections[key] &&
        typeof parsed.sections[key].score === 'number' &&
        Array.isArray(parsed.sections[key].suggestions)
    ) &&
    typeof parsed.overall_feedback === 'string'
  );
}

async function callClaude(prompt, { temperature = 0.3, maxTokens = 1500 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('AI_CONFIG_ERROR: ANTHROPIC_API_KEY is not set in environment variables');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (response.status === 429) {
    throw new Error('AI_RATE_LIMIT: Anthropic API rate limit reached');
  }
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI_REQUEST_FAILED: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('AI_EMPTY_RESPONSE: No text content returned by model');
  }
  return textBlock.text;
}

/**
 * Analyze a resume against a target role. Retries once with a corrective
 * follow-up if the model returns malformed JSON.
 * @param {string} resumeText
 * @param {string} targetRole
 * @returns {Promise<object>} structured analysis JSON
 */
async function analyzeResume(resumeText, targetRole) {
  const prompt = buildResumeAnalysisPrompt(resumeText, targetRole);

  try {
    const raw = await callClaude(prompt, { temperature: 0.3, maxTokens: 1500 });
    return safeParseAIJson(raw, validateResumeAnalysisShape);
  } catch (firstError) {
    // Retry once with a corrective instruction
    const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON or did not match the required schema. Return ONLY the raw JSON object, with no markdown formatting, no code fences, and no additional text.`;
    const raw = await callClaude(retryPrompt, { temperature: 0.2, maxTokens: 1500 });
    return safeParseAIJson(raw, validateResumeAnalysisShape);
  }
}

module.exports = {
  analyzeResume,
  callClaude, // exported for reuse by interviewService.js (Day 5)
  safeParseAIJson,
};
