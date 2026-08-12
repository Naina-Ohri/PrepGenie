/**
 * roles.js
 * Single source of truth for the 4 supported role tracks, used by both
 * resumeController.js (target_role validation) and interviewController.js
 * (role validation). Previously this array was hardcoded separately in
 * both files — fixed on Day 58 to eliminate drift risk.
 */

const SUPPORTED_ROLES = ['SDE Intern', 'Data Analyst', 'Core Engineering', 'HR Round'];

module.exports = { SUPPORTED_ROLES };
