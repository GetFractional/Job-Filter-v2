import { useCallback, useMemo, useState } from 'react';
import { Check, Download, Pencil, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { bindGenerationContext } from '../../lib/generationContext';
import {
  parseApplicationQuestions,
  generateApplicationAnswer,
  type AnswerTrace,
} from '../../lib/applicationQa';
import type { Job } from '../../types';

interface ApplicationQATabProps {
  job: Job;
}

interface QAItem {
  id: string;
  question: string;
  answer: string;
  approved: boolean;
  trace?: AnswerTrace;
}

function generateItemId(): string {
  return crypto.randomUUID();
}

export function ApplicationQATab({ job }: ApplicationQATabProps) {
  const claims = useStore((s) => s.claims);
  const [rawQuestions, setRawQuestions] = useState('');
  const [items, setItems] = useState<QAItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const approvedCount = useMemo(() => items.filter((item) => item.approved).length, [items]);

  const ensureContext = useCallback(() => {
    const binding = bindGenerationContext({
      flow: 'qa',
      job,
      claims,
      requireApprovedClaims: true,
      requireResearch: true,
    });
    if (!binding.ok) {
      setErrors(binding.errors.map((error) => error.message));
      return null;
    }
    setErrors([]);
    return binding.context;
  }, [job, claims]);

  const loadQuestions = useCallback(() => {
    const parsed = parseApplicationQuestions(rawQuestions);
    const next = parsed.map((question) => ({
      id: generateItemId(),
      question,
      answer: '',
      approved: false,
    }));
    setItems(next);
    setEditingId(null);
    setDraftAnswer('');
  }, [rawQuestions]);

  const generateForItem = useCallback((id: string) => {
    const context = ensureContext();
    if (!context) return;

    const target = items.find((item) => item.id === id);
    if (!target) return;

    setGeneratingId(id);
    const result = generateApplicationAnswer(target.question, context);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              answer: result.answer,
              approved: false,
              trace: result.trace,
            }
          : item
      )
    );
    setGeneratingId(null);
  }, [ensureContext, items]);

  const startEdit = useCallback((item: QAItem) => {
    setEditingId(item.id);
    setDraftAnswer(item.answer);
  }, []);

  const saveEdit = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              answer: draftAnswer.trim(),
              approved: false,
            }
          : item
      )
    );
    setEditingId(null);
    setDraftAnswer('');
  }, [draftAnswer]);

  const approve = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              approved: true,
            }
          : item
      )
    );
  }, []);

  const exportAnswers = useCallback(() => {
    if (items.length === 0) return;
    const lines: string[] = [`# Application Answers`, ``, `Role: ${job.title} at ${job.company}`, ``];
    for (const item of items) {
      lines.push(`## ${item.question}`);
      lines.push('');
      lines.push(item.answer || '_No answer generated yet_');
      lines.push('');
      if (item.trace) {
        lines.push(`Traceability:`);
        lines.push(`- Claims snapshot: ${item.trace.claimsSnapshotId}`);
        for (const evidence of item.trace.claimEvidence) {
          lines.push(`- Claim evidence: ${evidence}`);
        }
        for (const evidence of item.trace.researchEvidence) {
          lines.push(`- Research evidence: ${evidence}`);
        }
        lines.push('');
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${job.company}-application-answers.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [items, job.company, job.title]);

  return (
    <div className="py-4 space-y-4">
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">Application Q&A</h3>
        <p className="text-xs text-neutral-500">
          Paste application questions, generate grounded answers, then approve each response.
        </p>
        <textarea
          value={rawQuestions}
          onChange={(event) => setRawQuestions(event.target.value)}
          rows={6}
          placeholder={'Why do you want this role?\nDescribe a growth win you are proud of.\nHow do you handle ambiguity?'}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="flex gap-3">
          <button
            onClick={loadQuestions}
            disabled={!rawQuestions.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Sparkles size={14} />
            Load Questions
          </button>
          <button
            onClick={exportAnswers}
            disabled={items.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download size={14} />
            Export Answers
          </button>
        </div>
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs font-semibold text-red-700 mb-1">Generation blocked</p>
            <ul className="space-y-0.5">
              {errors.map((error) => (
                <li key={error} className="text-xs text-red-700">- {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
          <p className="text-xs text-neutral-500">
            Approved: <span className="font-semibold text-neutral-800">{approvedCount}</span> / {items.length}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-neutral-900">{item.question}</h4>
              {item.approved ? (
                <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  Approved
                </span>
              ) : (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Needs Approval
                </span>
              )}
            </div>

            {editingId === item.id ? (
              <textarea
                value={draftAnswer}
                onChange={(event) => setDraftAnswer(event.target.value)}
                rows={6}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            ) : (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <p className="whitespace-pre-wrap text-sm text-neutral-700">
                  {item.answer || 'No answer generated yet.'}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateForItem(item.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {generatingId === item.id ? (
                  <span className="h-3 w-3 rounded-full border border-neutral-300 border-t-neutral-700 animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {item.answer ? 'Regenerate' : 'Generate'}
              </button>
              {editingId === item.id ? (
                <>
                  <button
                    onClick={() => saveEdit(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    <Check size={12} />
                    Save Edit
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setDraftAnswer('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEdit(item)}
                  disabled={!item.answer}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
              <button
                onClick={() => approve(item.id)}
                disabled={!item.answer}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Check size={12} />
                Approve
              </button>
            </div>

            {item.trace && (
              <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <p className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                  Traceability
                </p>
                <p className="text-xs text-neutral-500">Claims snapshot: {item.trace.claimsSnapshotId}</p>
                {item.trace.claimEvidence.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.trace.claimEvidence.map((line) => (
                      <li key={line} className="text-xs text-neutral-600">- {line}</li>
                    ))}
                  </ul>
                )}
                {item.trace.researchEvidence.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.trace.researchEvidence.map((line) => (
                      <li key={line} className="text-xs text-neutral-600">- {line}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
