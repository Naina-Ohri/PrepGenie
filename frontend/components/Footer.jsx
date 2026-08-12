import React from 'react';

/**
 * Footer
 * Global footer rendered on every page via Layout. Must remain visible
 * on the deployed production build per Day 56 requirements.
 */
export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white py-4">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 text-center">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} PrepGenie — AI Career Prep Copilot
        </p>
        <p className="text-xs font-medium text-indigo-600">
          Built with Claude as part of the AB Talks 60-Day Claude AI Challenge.
        </p>
      </div>
    </footer>
  );
}
