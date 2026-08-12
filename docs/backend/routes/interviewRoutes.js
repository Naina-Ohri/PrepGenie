/**
 * interviewRoutes.js
 * Route wiring only. /complete (scoring) is added on Day 7 per blueprint;
 * /start and /answer are Day 5-6 scope and are wired here now.
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { startInterviewHandler, submitAnswerHandler } = require('../controllers/interviewController');

router.use(authMiddleware);

// POST /api/interview/start  (AI call — rate limited; gracefully falls back if no key)
router.post('/start', aiRateLimiter, startInterviewHandler);

// POST /api/interview/answer  (no AI call, no rate limit needed)
router.post('/answer', submitAnswerHandler);

module.exports = router;
