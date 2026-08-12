import React from 'react';

/**
 * ChatBubble
 * Renders a single message in the interview chat — either from the AI
 * interviewer ('bot') or the candidate ('user'). Styling per
 * UI-WIREFRAMES.md §3.5.
 */
export default function ChatBubble({ sender = 'bot', text }) {
  const isBot = sender === 'bot';

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isBot
            ? 'bg-gray-100 text-gray-800'
            : 'bg-indigo-600 text-white'
        }`}
      >
        {isBot && <span className="mr-1">🤖</span>}
        {text}
        {!isBot && <span className="ml-1">🧑</span>}
      </div>
    </div>
  );
}
