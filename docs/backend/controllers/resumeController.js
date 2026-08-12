/**
 * resumeController.js
 * Thin request/response layer for resume endpoints. Delegates business
 * logic to services/. Response envelope follows API.md: { success, data, error }.
 *
 * Day 58 fixes:
 * - Uses the shared SUPPORTED_ROLES constant instead of a locally
 *   duplicated array (see constants/roles.js).
 * - Missing ANTHROPIC_API_KEY now returns a clear, actionable 503 instead
 *   of falling through to a generic 500 (real production edge case: this
 *   endpoint has no offline fallback by design, per PRD §5.2, so it must
 *   fail clearly rather than confusingly).
 */

const { supabaseAdmin } = require('../config/supabaseAdmin');
const { analyzeResume } = require('../services/aiService');
const { SUPPORTED_ROLES } = require('../constants/roles');

/**
 * POST /api/resume/analyze
 * Body: { resume_id, target_role }
 */
async function analyzeResumeHandler(req, res, next) {
  try {
    const { resume_id, target_role } = req.body;
    const userId = req.user.id;

    if (!resume_id || !target_role) {
      return res.status(400).json({ success: false, error: 'resume_id and target_role are required' });
    }
    if (!SUPPORTED_ROLES.includes(target_role)) {
      return res.status(400).json({ success: false, error: `target_role must be one of: ${SUPPORTED_ROLES.join(', ')}` });
    }

    // Fetch resume, enforce ownership
    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('id, user_id, raw_text')
      .eq('id', resume_id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    if (resume.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'You do not have access to this resume' });
    }
    if (!resume.raw_text || resume.raw_text.trim().length === 0) {
      return res.status(422).json({ success: false, error: 'Resume has no extractable text' });
    }

    let analysis;
    try {
      analysis = await analyzeResume(resume.raw_text, target_role);
    } catch (aiError) {
      if (aiError.message.startsWith('AI_CONFIG_ERROR')) {
        return res.status(503).json({
          success: false,
          error: 'Resume analysis is temporarily unavailable (AI service not configured). Please try again later.',
        });
      }
      if (aiError.message.startsWith('AI_RATE_LIMIT')) {
        return res.status(429).json({ success: false, error: 'AI service rate limit reached. Please try again shortly.' });
      }
      if (aiError.message.startsWith('AI_JSON')) {
        return res.status(422).json({ success: false, error: 'AI returned an unexpected format. Please retry.' });
      }
      throw aiError; // unexpected error type — bubble up to centralized error handler for 500
    }

    const { error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        ats_score: analysis.ats_score,
        feedback_json: analysis,
      })
      .eq('id', resume_id);

    if (updateError) {
      throw new Error(`DB_UPDATE_FAILED: ${updateError.message}`);
    }

    return res.status(200).json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/resume/:id
 */
async function getResumeHandler(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: resume, error } = await supabaseAdmin
      .from('resumes')
      .select('id, file_name, raw_text, ats_score, feedback_json, created_at, user_id')
      .eq('id', id)
      .single();

    if (error || !resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    if (resume.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'You do not have access to this resume' });
    }

    const { user_id, raw_text, ...safeResume } = resume;
    return res.status(200).json({ success: true, data: safeResume });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/resume/history?limit=10&offset=0
 */
async function getResumeHistoryHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = parseInt(req.query.offset, 10) || 0;

    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('id, file_name, ats_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`DB_QUERY_FAILED: ${error.message}`);
    }

    const formatted = data.map((r) => ({
      resume_id: r.id,
      file_name: r.file_name,
      ats_score: r.ats_score,
      created_at: r.created_at,
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyzeResumeHandler,
  getResumeHandler,
  getResumeHistoryHandler,
};
