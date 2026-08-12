/**
 * interviewController.js
 * Handles interview session lifecycle: start and answer submission.
 *
 * Day 58 fix: uses the shared SUPPORTED_ROLES constant instead of a
 * locally duplicated array (see constants/roles.js) — was previously
 * defined identically in resumeController.js, risking drift.
 */

const { supabaseAdmin } = require('../config/supabaseAdmin');
const { generateQuestions } = require('../services/interviewService');
const { SUPPORTED_ROLES } = require('../constants/roles');

/**
 * POST /api/interview/start
 * Body: { role, resume_id? }
 */
async function startInterviewHandler(req, res, next) {
  try {
    const { role, resume_id } = req.body;
    const userId = req.user.id;

    if (!role || !SUPPORTED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `role must be one of: ${SUPPORTED_ROLES.join(', ')}` });
    }

    let resumeText = null;
    if (resume_id) {
      const { data: resume, error } = await supabaseAdmin
        .from('resumes')
        .select('id, user_id, raw_text')
        .eq('id', resume_id)
        .single();

      if (error || !resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
      }
      if (resume.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'You do not have access to this resume' });
      }
      resumeText = resume.raw_text;
    }

    let generation;
    try {
      generation = await generateQuestions(role, resumeText);
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to generate interview questions' });
    }

    const { questions } = generation;

    const { data: session, error: insertError } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        user_id: userId,
        resume_id: resume_id || null,
        role,
        questions_json: questions,
        answers_json: [],
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (insertError || !session) {
      throw new Error(`DB_INSERT_FAILED: ${insertError ? insertError.message : 'unknown error'}`);
    }

    return res.status(201).json({
      success: true,
      data: {
        session_id: session.id,
        total_questions: questions.length,
        current_question: questions[0],
        question_source: generation.source, // 'ai' | 'fallback' — surfaced for transparency/debugging
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/interview/answer
 * Body: { session_id, question_id, answer_text }
 * Advances session state. Scoring is triggered separately by /complete.
 */
async function submitAnswerHandler(req, res, next) {
  try {
    const { session_id, question_id, answer_text } = req.body;
    const userId = req.user.id;

    if (!session_id || !question_id || !answer_text || !answer_text.trim()) {
      return res.status(400).json({ success: false, error: 'session_id, question_id, and answer_text are required' });
    }
    if (answer_text.length > 3000) {
      return res.status(400).json({ success: false, error: 'answer_text exceeds maximum length of 3000 characters' });
    }

    const { data: session, error: fetchError } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, user_id, status, questions_json, answers_json')
      .eq('id', session_id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }
    if (session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'You do not have access to this session' });
    }
    if (session.status !== 'in_progress') {
      return res.status(409).json({ success: false, error: 'This interview session is no longer in progress' });
    }

    const questions = session.questions_json;
    const questionExists = questions.some((q) => q.id === question_id);
    if (!questionExists) {
      return res.status(400).json({ success: false, error: 'Invalid question_id for this session' });
    }

    const updatedAnswers = [...(session.answers_json || []), { question_id, answer_text }];

    const { error: updateError } = await supabaseAdmin
      .from('interview_sessions')
      .update({ answers_json: updatedAnswers })
      .eq('id', session_id);

    if (updateError) {
      throw new Error(`DB_UPDATE_FAILED: ${updateError.message}`);
    }

    const answeredIds = new Set(updatedAnswers.map((a) => a.question_id));
    const nextQuestion = questions.find((q) => !answeredIds.has(q.id));

    if (nextQuestion) {
      return res.status(200).json({ success: true, data: { complete: false, next_question: nextQuestion } });
    }

    return res.status(200).json({
      success: true,
      data: { complete: true, message: 'All questions answered. Call /interview/complete to get results.' },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startInterviewHandler,
  submitAnswerHandler,
};
