import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import Button from '../components/Button';
import useSpeechToText from '../hooks/useSpeechToText';
import apiClient from '../lib/apiClient';

/**
 * InterviewChat Page (/interview/:sessionId)
 * Day 5-7: sequential Q&A with voice input, skip, end-early, typing
 * indicator, accessible live region, results redirect.
 *
 * Day 58 fix: "End interview" button was previously enabled while an
 * answer submission was still in flight, allowing a race condition where
 * a user could click it mid-submit. It's now disabled during
 * isSubmitting/isThinking just like the other controls.
 */
export default function InterviewChat() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const { role, current_question: initialQuestion, total_questions } = location.state || {};

  const [messages, setMessages] = useState(
    initialQuestion ? [{ sender: 'bot', text: initialQuestion.question }] : []
  );
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion || null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  if (!initialQuestion) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-gray-500">
        <p>No active interview found. Please start a new interview.</p>
        <Button className="mt-4" onClick={() => navigate('/interview')}>
          Back to Role Selection
        </Button>
      </div>
    );
  }

  const goToResults = (finalAnsweredCount) => {
    navigate(`/interview/${sessionId}/results`, {
      state: { role, answeredCount: finalAnsweredCount },
    });
  };

  const advanceToNext = async (submitBody) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/interview/answer', submitBody);
      const { complete, next_question } = res.data.data;
      const newAnsweredCount = answeredCount + 1;
      setAnsweredCount(newAnsweredCount);

      if (complete) {
        toast.success('Interview complete!');
        goToResults(newAnsweredCount);
        return;
      }

      setIsThinking(true);
      setTimeout(() => {
        setCurrentQuestion(next_question);
        setMessages((prev) => [...prev, { sender: 'bot', text: next_question.question }]);
        setIsThinking(false);
      }, 900);
    } catch (err) {
      const message = err?.response?.data?.error || 'Could not submit your answer. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!inputValue.trim() || !currentQuestion || isSubmitting) return;
    const answerText = inputValue.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: answerText }]);
    setInputValue('');
    resetTranscript();
    advanceToNext({ session_id: sessionId, question_id: currentQuestion.id, answer_text: answerText });
  };

  const handleSkip = () => {
    if (!currentQuestion || isSubmitting) return;
    setMessages((prev) => [...prev, { sender: 'user', text: '(Skipped this question)' }]);
    advanceToNext({
      session_id: sessionId,
      question_id: currentQuestion.id,
      answer_text: '(Candidate skipped this question)',
    });
  };

  const handleEndEarly = () => {
    if (isSubmitting || isThinking) return; // Day 58 fix: prevent ending mid-submission
    setIsEnding(true);
    toast('Interview ended early.', { icon: '⏹️' });
    goToResults(answeredCount);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <div className="mx-auto flex min-h-[80svh] max-w-2xl flex-col px-4 py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
          Mock Interview — {role}
        </h1>
        <span className="text-sm text-gray-500">Q{answeredCount + 1} of {total_questions}</span>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto pb-4"
        role="log"
        aria-live="polite"
        aria-label="Interview conversation"
      >
        {messages.map((m, idx) => (
          <ChatBubble key={idx} sender={m.sender} text={m.text} />
        ))}
        {isThinking && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div className="flex items-end gap-2">
          <label htmlFor="interview-answer" className="sr-only">Your answer</label>
          <textarea
            id="interview-answer"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || isThinking}
            placeholder={isListening ? 'Listening…' : 'Type your answer…'}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={isSubmitting || isThinking}
              aria-pressed={isListening}
              aria-label={isListening ? 'Stop voice recording' : 'Answer by voice'}
              title={isListening ? 'Stop recording' : 'Answer by voice'}
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm ${
                isListening
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              🎤
            </button>
          )}
          <Button
            onClick={handleSubmitAnswer}
            disabled={!inputValue.trim()}
            isLoading={isSubmitting}
            loadingText="Sending…"
          >
            Send
          </Button>
        </div>

        <div className="flex justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting || isThinking}
            className="text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
          >
            Skip question
          </button>
          <button
            type="button"
            onClick={handleEndEarly}
            disabled={isEnding || isSubmitting || isThinking}
            className="text-red-500 underline hover:text-red-700 disabled:opacity-50"
          >
            End interview
          </button>
        </div>
      </div>
    </div>
  );
}
