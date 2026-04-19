import { useState, useRef } from 'react';
import { api } from '../../lib/api.js';
import AISuggestionCard from './AISuggestionCard.jsx';

export default function QuickAddBar({ companies, people, onTaskCreate }) {
  const [value, setValue] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = value.trim();
    if (!title || aiLoading) return;

    setAiLoading(true);
    setSuggestion(null);

    try {
      const result = await api.ai.suggest(title);
      setSuggestion(result);
    } catch {
      // AI failed — show card with blank defaults so user can fill manually
      setSuggestion({ company_id: null, category: 'operations', priority_quadrant: 2, estimated_hours: 1 });
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirm = async (taskData) => {
    await onTaskCreate(taskData);
    setValue('');
    setSuggestion(null);
    inputRef.current?.focus();
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setAiLoading(false);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 shrink-0">
      {/* Confirmation card slides up */}
      {(aiLoading || suggestion) && !aiLoading && suggestion && (
        <AISuggestionCard
          title={value}
          suggestion={suggestion}
          companies={companies}
          people={people}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
        />
      )}

      {/* Loading state above bar */}
      {aiLoading && (
        <div className="mx-4 mb-2 flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm text-slate-400">AI is thinking...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-lg leading-none pointer-events-none">+</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={aiLoading}
            placeholder="Type a task... e.g. Follow up with HDFC vendor on MDR"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim() || aiLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
        >
          {aiLoading ? 'AI is thinking...' : 'Add Task'}
        </button>
      </form>
    </div>
  );
}
