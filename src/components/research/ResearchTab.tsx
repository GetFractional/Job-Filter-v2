import { useState, useCallback } from 'react';
import {
  Rocket,
  Copy,
  Check,
  ExternalLink,
  ClipboardPaste,
  Sparkles,
  Building2,
  DollarSign,
  Target,
  Swords,
  Megaphone,
  UsersRound,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateResearchPrompt, parseResearchPaste } from '../../lib/research';
import type { ResearchContext } from '../../lib/research';
import type { Job, ResearchBrief } from '../../types';

interface ResearchTabProps {
  job: Job;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        copied
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const BRIEF_SECTIONS: { key: keyof ResearchBrief; label: string; icon: typeof Building2 }[] = [
  { key: 'companyOverview', label: 'Company Overview', icon: Building2 },
  { key: 'businessModel', label: 'Business Model', icon: DollarSign },
  { key: 'icp', label: 'Ideal Customer Profile', icon: Target },
  { key: 'competitors', label: 'Competitors', icon: Swords },
  { key: 'gtmChannels', label: 'GTM Channels', icon: Megaphone },
  { key: 'orgLeadership', label: 'Organization & Leadership', icon: UsersRound },
  { key: 'risks', label: 'Risks', icon: AlertTriangle },
  { key: 'compSignals', label: 'Compensation Signals', icon: DollarSign },
];

export function ResearchTab({ job }: ResearchTabProps) {
  const updateJob = useStore((s) => s.updateJob);

  const [promptData, setPromptData] = useState<ReturnType<typeof generateResearchPrompt> | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [parsing, setParsing] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Disambiguation fields
  const [companyContext, setCompanyContext] = useState('');
  const [industry, setIndustry] = useState('');
  const [hqLocation, setHqLocation] = useState('');
  const [showDisambiguation, setShowDisambiguation] = useState(false);

  const hasBrief = !!job.researchBrief;

  const handleGeneratePrompt = useCallback(() => {
    const context: ResearchContext = {};
    if (companyContext.trim()) context.companyContext = companyContext.trim();
    if (industry.trim()) context.industry = industry.trim();
    if (hqLocation.trim()) context.hqLocation = hqLocation.trim();

    const prompt = generateResearchPrompt(job, context);
    setPromptData(prompt);
    setShowWorkflow(true);
  }, [job, companyContext, industry, hqLocation]);

  const handleParseResults = useCallback(async () => {
    if (!pasteContent.trim()) return;
    setParsing(true);
    try {
      const brief = parseResearchPaste(pasteContent);
      await updateJob(job.id, { researchBrief: brief });
      setPasteContent('');
      setShowWorkflow(false);
      setPromptData(null);
    } catch (err) {
      console.error('Failed to parse research:', err);
    } finally {
      setParsing(false);
    }
  }, [pasteContent, job.id, updateJob]);

  const handleRerun = useCallback(() => {
    setShowWorkflow(true);
    setShowDisambiguation(false);
    handleGeneratePrompt();
  }, [handleGeneratePrompt]);

  // Show existing research brief
  if (hasBrief && !showWorkflow) {
    const brief = job.researchBrief!;
    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
            <Sparkles size={16} className="text-brand-500" />
            Research Brief
          </h3>
          <button
            onClick={handleRerun}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            <RefreshCw size={12} />
            Re-run Research
          </button>
        </div>

        {BRIEF_SECTIONS.map(({ key, label, icon: Icon }) => {
          const content = brief[key];
          if (!content || typeof content !== 'string') return null;

          return (
            <div key={key} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon size={14} className="text-neutral-400" />
                {label}
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>
          );
        })}

        {/* Interview Hypotheses */}
        {brief.interviewHypotheses && brief.interviewHypotheses.length > 0 && (
          <div className="bg-white rounded-lg border border-brand-200 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb size={14} className="text-brand-500" />
              Interview Hypotheses
            </h4>
            <ul className="space-y-2">
              {brief.interviewHypotheses.map((h, i) => (
                <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-neutral-400 text-center">
          Research generated on {new Date(brief.createdAt).toLocaleDateString()}
        </p>
      </div>
    );
  }

  // Research workflow
  return (
    <div className="py-4 space-y-4">
      {!promptData ? (
        /* Initial state: disambiguation + generate */
        <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Rocket size={24} className="text-brand-600" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">Run Company Research</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              Generate a single research prompt for {job.company}. Run it in Perplexity Pro, then paste the results back.
            </p>
          </div>

          {/* Disambiguation toggle */}
          <button
            onClick={() => setShowDisambiguation(!showDisambiguation)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg mb-3"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle size={12} />
              Add context to disambiguate company
            </span>
            <span className="text-[11px] text-neutral-400">{showDisambiguation ? 'Hide' : 'Show'}</span>
          </button>

          {showDisambiguation && (
            <div className="space-y-3 mb-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <label className="text-[11px] font-medium text-neutral-600 mb-1 block">
                  Company context (e.g. "the B2B SaaS company, not the apparel brand")
                </label>
                <input
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  placeholder="Optional clarification..."
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-600 mb-1 block flex items-center gap-1">
                    <Target size={10} />
                    Industry
                  </label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. SaaS, E-commerce"
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-600 mb-1 block flex items-center gap-1">
                    <MapPin size={10} />
                    HQ Location
                  </label>
                  <input
                    value={hqLocation}
                    onChange={(e) => setHqLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGeneratePrompt}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
          >
            <Sparkles size={16} />
            Generate Research Prompt
          </button>
        </div>
      ) : (
        /* Prompt generated: show workflow */
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Research Prompt</h3>
            <button
              onClick={() => window.open('https://www.perplexity.ai/', '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
            >
              <ExternalLink size={12} />
              Open Perplexity
            </button>
          </div>

          <p className="text-xs text-neutral-500">
            Copy the prompt below, run it in Perplexity, then paste the full response into the text area.
          </p>

          {/* Single Prompt Card */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-neutral-800">{promptData.label}</h4>
              <CopyButton text={promptData.prompt} />
            </div>
            <pre className="text-xs text-neutral-500 whitespace-pre-wrap leading-relaxed bg-neutral-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              {promptData.prompt}
            </pre>
          </div>

          {/* Paste Results */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-neutral-800 mb-2 flex items-center gap-1.5">
              <ClipboardPaste size={14} className="text-neutral-400" />
              Paste Research Results
            </h4>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste the full Perplexity response here..."
              rows={10}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
            <button
              onClick={handleParseResults}
              disabled={!pasteContent.trim() || parsing}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Parse Results
                </>
              )}
            </button>
          </div>

          {hasBrief && (
            <button
              onClick={() => setShowWorkflow(false)}
              className="w-full text-center text-xs text-neutral-500 hover:text-neutral-700 py-2"
            >
              Cancel and view existing brief
            </button>
          )}
        </>
      )}
    </div>
  );
}
