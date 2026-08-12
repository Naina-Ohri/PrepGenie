/**
 * constants.js
 * Single source of truth for the 4 supported role tracks on the frontend.
 * Previously duplicated separately in Analyzer.jsx (as plain strings) and
 * RoleSelect.jsx (as objects with icon/description) — fixed on Day 58 so
 * both consume the same base list and can't drift apart.
 */

export const SUPPORTED_ROLES = ['SDE Intern', 'Data Analyst', 'Core Engineering', 'HR Round'];

export const ROLE_DETAILS = {
  'SDE Intern': { icon: '💻', description: 'Coding, DSA, and technical fundamentals' },
  'Data Analyst': { icon: '📊', description: 'SQL, statistics, and data storytelling' },
  'Core Engineering': { icon: '⚙️', description: 'Discipline fundamentals and design trade-offs' },
  'HR Round': { icon: '🤝', description: 'Behavioral and culture-fit questions' },
};
