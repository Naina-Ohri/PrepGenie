/**
 * interviewService.js
 * Generates role-specific, resume-aware interview questions and (Day 7)
 * will score completed sessions. Reuses callClaude()/safeParseAIJson()
 * from aiService.js per ARCHITECTURE.md §6 (shared AI interaction layer).
 *
 * FREE-TIER NOTE:
 * The Anthropic API requires a key with available credits. To keep this
 * project runnable end-to-end on $0 (per project constraints), this
 * service falls back to a deterministic, template-based question bank
 * whenever ANTHROPIC_API_KEY is unset or the AI call fails for any reason.
 * This keeps the feature fully demoable without a paid key, while the
 * AI path is used automatically the moment a key is configured (e.g. via
 * Anthropic's free trial credits). No architecture change — same
 * function signature and response shape either way.
 */

const { callClaude, safeParseAIJson } = require('./aiService');

const QUESTION_COUNT = 6;

// ---------------------------------------------------------------------------
// Free, offline fallback question bank (used when no AI key / AI call fails)
// ---------------------------------------------------------------------------
const FALLBACK_QUESTIONS = {
  'SDE Intern': [
    { type: 'technical', question: 'Explain the difference between an array and a linked list. When would you use each?' },
    { type: 'technical', question: 'What is time complexity, and what is the time complexity of binary search?' },
    { type: 'technical', question: 'Explain the difference between REST and GraphQL APIs.' },
    { type: 'behavioral', question: 'Tell me about a challenging project you worked on and how you approached it.' },
    { type: 'resume', question: 'Walk me through the most complex project on your resume — what was your specific contribution?' },
    { type: 'hr', question: 'Why do you want to work as a software engineering intern at our company?' },
  ],
  'Data Analyst': [
    { type: 'technical', question: 'What is the difference between INNER JOIN and LEFT JOIN in SQL?' },
    { type: 'technical', question: 'How would you handle missing values in a dataset?' },
    { type: 'technical', question: 'Explain the difference between correlation and causation with an example.' },
    { type: 'behavioral', question: 'Describe a time you found an insight in data that changed a decision.' },
    { type: 'resume', question: 'Which data analysis project on your resume are you most proud of, and why?' },
    { type: 'hr', question: 'Why are you interested in a data analyst role?' },
  ],
  'Core Engineering': [
    { type: 'technical', question: 'Explain a fundamental principle from your core engineering discipline that you find most important.' },
    { type: 'technical', question: 'Describe a design or engineering trade-off you had to make in a project.' },
    { type: 'technical', question: 'How do you approach troubleshooting a system that is not behaving as expected?' },
    { type: 'behavioral', question: 'Tell me about a time you worked in a team to solve a technical problem.' },
    { type: 'resume', question: 'Walk me through the engineering project on your resume you learned the most from.' },
    { type: 'hr', question: 'Why did you choose this engineering discipline?' },
  ],
  'HR Round': [
    { type: 'hr', question: 'Tell me about yourself.' },
    { type: 'hr', question: 'What are your greatest strengths and weaknesses?' },
    { type: 'behavioral', question: 'Describe a conflict you had with a teammate and how you resolved it.' },
    { type: 'hr', question: 'Where do you see yourself in five years?' },
    { type: 'resume', question: 'Which achievement on your resume are you most proud of, and why?' },
    { type: 'hr', question: 'Why should we hire you?' },
  ],
};

function buildFallbackQuestions(role) {
  const bank = FALLBACK_QUESTIONS[role] || FALLBACK_QUESTIONS['SDE Intern'];
  return bank.slice(0, QUESTION_COUNT).map((q, idx) => ({
    id: `q${idx + 1}`,
    type: q.type,
    question: q.question,
  }));
}

function buildQuestionGenerationPrompt(role, resumeExcerpt) {
  const resumeContext = resumeExcerpt
    ? `The candidate's resume includes:\n"""\n${resumeExcerpt}\n"""\nUse this to personalize at least 1-2 questions.`
    : 'No resume was provided — generate general questions for this role.';

  return `You are an experienced technical interviewer conducting a mock interview for the role: ${role}.

${resumeContext}

Generate EXACTLY ${QUESTION_COUNT} interview questions with a mix of:
- 2-3 technical questions relevant to the role
- 1-2 behavioral questions
- 1 resume-specific question (only if resume context was provided, otherwise make it role-specific)
- 1 HR-style question

Return ONLY valid JSON (no markdown, no prose) with this EXACT shape:
{
  "questions": [
    { "id": "q1", "type": "technical" | "behavioral" | "resume" | "hr", "question": "string" }
  ]
}

The "questions" array MUST contain exactly ${QUESTION_COUNT} items, ids q1 through q${QUESTION_COUNT} in order.
Return ONLY the JSON object above. Nothing else.`;
}

function validateQuestionsShape(parsed) {
  return (
    parsed &&
    Array.isArray(parsed.questions) &&
    parsed.questions.length === QUESTION_COUNT &&
    parsed.questions.every(
      (q) => q && typeof q.id === 'string' && typeof q.type === 'string' && typeof q.question === 'string'
    )
  );
}

/**
 * Generate interview questions for a role, optionally personalized by resume text.
 * Falls back to a curated offline question bank if no AI key is configured
 * or if the AI call fails for any reason (network, rate limit, malformed JSON).
 *
 * @param {string} role - one of the 4 supported roles
 * @param {string} [resumeText] - raw resume text, truncated internally
 * @returns {Promise<{questions: Array, source: 'ai'|'fallback'}>}
 */
async function generateQuestions(role, resumeText) {
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasApiKey) {
    return { questions: buildFallbackQuestions(role), source: 'fallback' };
  }

  const resumeExcerpt = resumeText ? resumeText.slice(0, 1500) : null;
  const prompt = buildQuestionGenerationPrompt(role, resumeExcerpt);

  try {
    const raw = await callClaude(prompt, { temperature: 0.65, maxTokens: 1200 });
    const parsed = safeParseAIJson(raw, validateQuestionsShape);
    return { questions: parsed.questions, source: 'ai' };
  } catch (err) {
    // Any AI failure (rate limit, malformed JSON, network) gracefully
    // degrades to the fallback bank rather than breaking the feature.
    return { questions: buildFallbackQuestions(role), source: 'fallback' };
  }
}

module.exports = {
  generateQuestions,
  buildFallbackQuestions, // exported for tests / Day 6 reuse
};
