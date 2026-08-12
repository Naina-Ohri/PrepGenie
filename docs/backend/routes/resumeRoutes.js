/**
 * resumeRoutes.js
 * Route wiring only — no business logic (see PROJECT-STRUCTURE.md convention).
 * Note: POST /upload was scaffolded on Day 3 (file upload skeleton).
 * Day 4 adds /analyze, /:id, and /history, and wires rate limiting on /analyze.
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const {
  analyzeResumeHandler,
  getResumeHandler,
  getResumeHistoryHandler,
} = require('../controllers/resumeController');

// All resume routes require authentication
router.use(authMiddleware);

// POST /api/resume/analyze  (AI call — rate limited)
router.post('/analyze', aiRateLimiter, analyzeResumeHandler);

// GET /api/resume/history  (must be registered BEFORE /:id to avoid route collision)
router.get('/history', getResumeHistoryHandler);

// GET /api/resume/:id
router.get('/:id', getResumeHandler);

module.exports = router;
