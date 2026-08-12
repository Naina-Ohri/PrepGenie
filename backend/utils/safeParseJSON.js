/**
 * safeParseAIJson.js
 * Strips markdown code fences from an LLM response and safely parses JSON.
 * Throws a descriptive error if parsing fails, so callers can decide to retry.
 */

function stripCodeFences(raw) {
  if (typeof raw !== 'string') return raw;
  let text = raw.trim();

  // Remove ```json ... ``` or ``` ... ``` wrappers
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  }
  return text;
}

/**
 * @param {string} rawText - raw text returned by the AI model
 * @param {Function} [validator] - optional function(parsed) => boolean to validate shape
 * @returns {object} parsed JSON object
 * @throws {Error} if parsing or validation fails
 */
function safeParseAIJson(rawText, validator) {
  const cleaned = stripCodeFences(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI_JSON_PARSE_ERROR: ${err.message}`);
  }

  if (typeof validator === 'function' && !validator(parsed)) {
    throw new Error('AI_JSON_SHAPE_INVALID: parsed JSON did not match expected schema');
  }

  return parsed;
}

module.exports = { safeParseAIJson };
