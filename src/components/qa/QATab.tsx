import { useState, useMemo, useCallback } from 'react';
import {
  MessageSquareText,
  Check,
  Pencil,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getAutoUsableClaims } from '../../lib/claimAutoUse';
import { buildProfileEvidenceClaim } from '../../lib/profileEvidence';
import type { Job, AnswerSource } from '../../types';

interface QATabProps {
  job: Job;
}

export function QATab({ job }: QATabProps) {
  const claims = useStore((s) => s.claims);
  const profile = useStore((s) => s.profile);
  const autoUsableClaims = useMemo(() => getAutoUsableClaims(claims), [claims]);
  const claimsForAnswers = useMemo(() => {
    const profileEvidence = profile ? buildProfileEvidenceClaim(profile) : [];
    return [...autoUsableClaims, ...profileEvidence];
  }, [autoUsableClaims, profile]);
  const allAnswers = useStore((s) => s.applicationAnswers);
  const addApplicationAnswer = useStore((s) => s.addApplicationAnswer);
  const updateApplicationAnswer = useStore((s) => s.updateApplicationAnswer);
  const deleteApplicationAnswer = useStore((s) => s.deleteApplicationAnswer);

  const [newQuestion, setNewQuestion] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const jobAnswers = useMemo(
    () => allAnswers
      .filter((a) => a.jobId === job.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allAnswers, job.id]
  );

  const generateAnswer = useCallback((question: string): { answer: string; sources: AnswerSource[] } => {
    const q = question.toLowerCase();
    const sources: AnswerSource[] = [];
    const parts: string[] = [];

    // Find relevant claims
    const relevantClaims = claimsForAnswers.filter((claim) => {
      const allText = [
        claim.role,
        claim.company,
        ...claim.responsibilities,
        ...claim.outcomes.map((o) => o.description),
        ...claim.tools,
      ].join(' ').toLowerCase();

      // Check if the question topic overlaps with this claim
      const qWords = q.split(/\s+/).filter((w) => w.length > 3);
      const matches = qWords.filter((w) => allText.includes(w));
      return matches.length >= 1;
    });

    // Why interested / motivation questions
    if (q.includes('why') && (q.includes('interest') || q.includes('role') || q.includes('company') || q.includes('position') || q.includes('apply'))) {
      const research = job.researchBrief;
      if (research?.companyOverview) {
        const insight = research.companyOverview.split(/[.!]/)[0]?.trim();
        if (insight) {
          parts.push(`I'm drawn to this ${job.title} opportunity at ${job.company} because ${insight.toLowerCase()}.`);
          sources.push({ type: 'research', label: 'Company Overview', excerpt: insight });
        }
      }
      if (relevantClaims[0]) {
        parts.push(`My experience as ${relevantClaims[0].role} at ${relevantClaims[0].company} has given me direct exposure to the challenges this role addresses.`);
        sources.push({ type: 'claim', label: `${relevantClaims[0].role} at ${relevantClaims[0].company}`, excerpt: relevantClaims[0].responsibilities[0] || '' });
      }
      if (parts.length === 0) {
        parts.push(`The ${job.title} role at ${job.company} aligns with my career focus on building systematic growth infrastructure that drives measurable outcomes.`);
      }
    }
    // Experience / background questions
    else if (q.includes('experience') || q.includes('background') || q.includes('qualified') || q.includes('tell us about') || q.includes('describe your')) {
      for (const claim of relevantClaims.slice(0, 2)) {
        const topOutcome = claim.outcomes[0];
        if (topOutcome) {
          parts.push(`At ${claim.company}, as ${claim.role}, I ${topOutcome.description.charAt(0).toLowerCase()}${topOutcome.description.slice(1)}`);
          sources.push({ type: 'claim', label: `${claim.role} at ${claim.company}`, excerpt: topOutcome.description });
        } else if (claim.responsibilities[0]) {
          parts.push(`In my role as ${claim.role} at ${claim.company}, I ${claim.responsibilities[0].charAt(0).toLowerCase()}${claim.responsibilities[0].slice(1)}`);
          sources.push({ type: 'claim', label: `${claim.role} at ${claim.company}`, excerpt: claim.responsibilities[0] });
        }
      }
      if (parts.length === 0) {
        parts.push(`My background spans building growth systems from strategy through execution, with a focus on measurable revenue outcomes.`);
      }
    }
    // Salary / compensation questions
    else if (q.includes('salary') || q.includes('compensation') || q.includes('pay') || q.includes('rate')) {
      if (profile) {
        parts.push(`Based on my experience level and market rates, my target compensation is $${profile.compTarget.toLocaleString()}, with flexibility depending on the full package including equity, bonus, and benefits.`);
        sources.push({ type: 'profile', label: 'Compensation Target', excerpt: `$${profile.compTarget.toLocaleString()}` });
      }
    }
    // Strength questions
    else if (q.includes('strength') || q.includes('best at') || q.includes('superpower')) {
      if (relevantClaims[0]?.outcomes[0]) {
        parts.push(`My core strength is translating growth strategy into measurable execution. For example, at ${relevantClaims[0].company}, I ${relevantClaims[0].outcomes[0].description.charAt(0).toLowerCase()}${relevantClaims[0].outcomes[0].description.slice(1)}`);
        sources.push({ type: 'claim', label: `${relevantClaims[0].role} at ${relevantClaims[0].company}`, excerpt: relevantClaims[0].outcomes[0].description });
      } else {
        parts.push(`My core strength is building systematic growth infrastructure that compounds over time, connecting strategy directly to revenue outcomes.`);
      }
    }
    // Tools / technical questions
    else if (q.includes('tool') || q.includes('software') || q.includes('technology') || q.includes('tech stack')) {
      const allTools = [...new Set(claimsForAnswers.flatMap((c) => c.tools))];
      if (allTools.length > 0) {
        parts.push(`I have hands-on experience with ${allTools.slice(0, 6).join(', ')}${allTools.length > 6 ? `, and ${allTools.length - 6} more` : ''}.`);
        sources.push({ type: 'claim', label: 'Tools across roles', excerpt: allTools.join(', ') });
      }
    }
    // Generic fallback
    else {
      for (const claim of relevantClaims.slice(0, 2)) {
        const evidence = claim.outcomes[0]?.description || claim.responsibilities[0];
        if (evidence) {
          parts.push(`At ${claim.company} (${claim.role}), I ${evidence.charAt(0).toLowerCase()}${evidence.slice(1)}`);
          sources.push({ type: 'claim', label: `${claim.role} at ${claim.company}`, excerpt: evidence });
        }
      }
      if (parts.length === 0) {
        parts.push(`Drawing on my experience in growth leadership, I would approach this by first understanding the current state, then building systematic solutions that compound over time.`);
      }
    }

    // Add job-specific context
    if (parts.length > 0 && !parts[parts.length - 1].includes(job.company)) {
      parts.push(`I'm excited to bring this approach to ${job.company}'s specific context and challenges.`);
    }

    return { answer: parts.join('\n\n'), sources };
  }, [claimsForAnswers, profile, job]);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    const { answer, sources } = generateAnswer(newQuestion.trim());
    await addApplicationAnswer({
      jobId: job.id,
      question: newQuestion.trim(),
      answer,
      sources,
    });
    setNewQuestion('');
    // Auto-expand the new answer
    const latest = allAnswers[allAnswers.length - 1];
    if (latest) setExpandedId(latest.id);
  };

  const handleRegenerate = async (answerId: string) => {
    const existing = jobAnswers.find((a) => a.id === answerId);
    if (!existing) return;
    const { answer, sources } = generateAnswer(existing.question);
    await updateApplicationAnswer(answerId, {
      answer,
      sources,
      version: existing.version + 1,
      approved: false,
    });
  };

  const handleSaveEdit = async (answerId: string) => {
    if (!editText.trim()) return;
    await updateApplicationAnswer(answerId, { answer: editText.trim(), approved: false });
    setEditingId(null);
    setEditText('');
  };

  const handleApprove = async (answerId: string) => {
    const existing = jobAnswers.find((a) => a.id === answerId);
    if (!existing) return;
    await updateApplicationAnswer(answerId, { approved: !existing.approved });
  };

  const SOURCE_COLORS: Record<string, string> = {
    claim: 'bg-blue-50 text-blue-700 border-blue-200',
    research: 'bg-violet-50 text-violet-700 border-violet-200',
    profile: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="py-4 space-y-5">
      {/* Template Mode Banner */}
      <div className="template-mode-banner">
        <FileText size={14} />
        <span>Template Mode — Answers are generated from your claims + research. No AI API used.</span>
      </div>

      {/* Add Question */}
      <div className="card p-4">
        <h3 className="text-overline text-neutral-500 mb-3 flex items-center gap-1.5">
          <MessageSquareText size={14} />
          Application Question
        </h3>
        <div className="flex gap-2">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Paste an application question here... (e.g., 'Why are you interested in this role?')"
            rows={2}
            className="input resize-none flex-1"
          />
          <button
            onClick={handleAddQuestion}
            disabled={!newQuestion.trim()}
            className="btn-primary self-end shrink-0"
          >
            <Sparkles size={14} />
            Generate
          </button>
        </div>
      </div>

      {/* Context Status */}
      {claimsForAnswers.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            No claim or profile evidence available. Answers will be generic unless you review claims or add skills/tools in Settings.
          </p>
        </div>
      )}

      {/* Answer Cards */}
      {jobAnswers.length === 0 ? (
        <div className="card p-8 text-center">
          <MessageSquareText size={24} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 mb-1">No application questions yet</p>
          <p className="text-xs text-neutral-400">Paste a question above to generate a grounded answer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobAnswers.map((qa) => {
            const isExpanded = expandedId === qa.id;
            const isEditing = editingId === qa.id;

            return (
              <div key={qa.id} className={`card overflow-hidden ${qa.approved ? 'border-green-200' : ''}`}>
                {/* Question header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : qa.id)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-neutral-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 line-clamp-2">{qa.question}</p>
                    {!isExpanded && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{qa.answer}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {qa.approved && (
                      <span className="badge bg-green-50 text-green-700 border border-green-200">
                        <Check size={10} className="mr-1" />
                        Approved
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-400">v{qa.version}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-neutral-100">
                    <div className="px-4 py-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={6}
                            className="input resize-none text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setEditingId(null); setEditText(''); }} className="btn-ghost text-xs">
                              Cancel
                            </button>
                            <button onClick={() => handleSaveEdit(qa.id)} className="btn-primary text-xs">
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                          {qa.answer}
                        </div>
                      )}

                      {/* Sources */}
                      {!isEditing && qa.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <p className="text-overline text-neutral-400 mb-2">Sources</p>
                          <div className="flex flex-wrap gap-1.5">
                            {qa.sources.map((src, i) => (
                              <span
                                key={i}
                                className={`badge border text-[10px] ${SOURCE_COLORS[src.type] || 'bg-neutral-50 text-neutral-600 border-neutral-200'}`}
                                title={src.excerpt}
                              >
                                {src.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action bar */}
                    {!isEditing && (
                      <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(qa.id)}
                          className={`btn-ghost text-xs ${qa.approved ? 'text-green-600' : ''}`}
                        >
                          <Check size={12} />
                          {qa.approved ? 'Unapprove' : 'Approve'}
                        </button>
                        <button
                          onClick={() => { setEditingId(qa.id); setEditText(qa.answer); }}
                          className="btn-ghost text-xs"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button onClick={() => handleRegenerate(qa.id)} className="btn-ghost text-xs">
                          <RotateCcw size={12} />
                          Regenerate
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => deleteApplicationAnswer(qa.id)}
                          className="btn-ghost text-xs text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
