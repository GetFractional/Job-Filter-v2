import { useState, useCallback, useMemo } from 'react';
import {
  FileText,
  Copy,
  Check,
  Pencil,
  ChevronDown,
  Mail,
  Linkedin,
  FileSignature,
  Send,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Shield,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  generateOutreachEmail,
  generateLinkedInConnect,
  generateCoverLetter,
  generateFollowUpEmail,
  generateGrowthMemo,
} from '../../lib/assets';
import type { Job, Asset, AssetType } from '../../types';

interface AssetsTabProps {
  job: Job;
}

const ASSET_TYPE_ICONS: Record<AssetType, typeof Mail> = {
  'Outreach Email': Mail,
  'LinkedIn Connect': Linkedin,
  'Cover Letter': FileSignature,
  'Follow-up Email': Send,
  'Growth Memo': BookOpen,
  'Interview Prep': FileText,
  'Negotiation Script': FileText,
  'Application Answer': FileText,
};

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  'Outreach Email': 'bg-blue-50 text-blue-700 border-blue-200',
  'LinkedIn Connect': 'bg-sky-50 text-sky-700 border-sky-200',
  'Cover Letter': 'bg-violet-50 text-violet-700 border-violet-200',
  'Follow-up Email': 'bg-amber-50 text-amber-700 border-amber-200',
  'Growth Memo': 'bg-green-50 text-green-700 border-green-200',
  'Interview Prep': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Negotiation Script': 'bg-rose-50 text-rose-700 border-rose-200',
  'Application Answer': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const GENERATE_OPTIONS: { type: AssetType; label: string; icon: typeof Mail }[] = [
  { type: 'Outreach Email', label: 'Outreach Email', icon: Mail },
  { type: 'LinkedIn Connect', label: 'LinkedIn Connect', icon: Linkedin },
  { type: 'Cover Letter', label: 'Cover Letter', icon: FileSignature },
  { type: 'Follow-up Email', label: 'Follow-up Email', icon: Send },
  { type: 'Growth Memo', label: 'Growth Memo', icon: BookOpen },
];

type WorkflowStep = 'list' | 'evaluate' | 'edit' | 'detail';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
        copied
          ? 'bg-green-50 text-green-700'
          : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
      }`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// Quality gates for asset evaluation
const QUALITY_CHECKS: Record<string, string[]> = {
  'Outreach Email': [
    'References the specific company by name',
    'Includes a specific claim or outcome from your experience',
    'Has a clear call-to-action',
    'Tone is professional and concise',
  ],
  'LinkedIn Connect': [
    'Under 300 characters',
    'Mentions the specific role',
    'Includes a value proposition',
  ],
  'Cover Letter': [
    'Company-specific opening (not generic)',
    'Includes 2+ specific claims with outcomes',
    'Mentions the growth plan / unique value-add',
    'Professional closing with next step',
  ],
  'Follow-up Email': [
    'References the original outreach',
    'Provides new value or insight',
    'Has a clear ask',
  ],
  'Growth Memo': [
    'Company context is filled in (not placeholder brackets)',
    'Claims from ledger are populated',
    'Quarterly plan is realistic for this company',
    'Assumptions table is filled in',
  ],
};

export function AssetsTab({ job }: AssetsTabProps) {
  const allAssets = useStore((s) => s.assets);
  const claims = useStore((s) => s.claims);
  const profile = useStore((s) => s.profile);
  const addAsset = useStore((s) => s.addAsset);
  const updateAsset = useStore((s) => s.updateAsset);
  const addGenerationLog = useStore((s) => s.addGenerationLog);

  const userName = profile?.name || 'Candidate';

  const [showGenMenu, setShowGenMenu] = useState(false);
  const [generating, setGenerating] = useState<AssetType | null>(null);
  const [step, setStep] = useState<WorkflowStep>('list');
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [qualityChecked, setQualityChecked] = useState<Set<number>>(new Set());

  const jobAssets = useMemo(
    () => allAssets.filter((a) => a.jobId === job.id).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [allAssets, job.id]
  );

  const generateContent = useCallback((type: AssetType): string => {
    const baseCtx = { job, userName, claims, research: job.researchBrief };

    switch (type) {
      case 'Outreach Email':
        return generateOutreachEmail({ ...baseCtx });
      case 'LinkedIn Connect':
        return generateLinkedInConnect({ job, userName, claims });
      case 'Cover Letter':
        return generateCoverLetter(baseCtx);
      case 'Follow-up Email':
        return generateFollowUpEmail({ job, userName });
      case 'Growth Memo':
        return generateGrowthMemo(baseCtx);
      default:
        return `[${type} generation coming soon]`;
    }
  }, [job, userName, claims]);

  const handleGenerate = useCallback(async (type: AssetType) => {
    setGenerating(type);
    setShowGenMenu(false);

    try {
      const content = generateContent(type);

      const asset = await addAsset({
        jobId: job.id,
        type,
        content,
        modelUsed: 'template-fill',
        modelTier: 'tier-0-free',
      });

      await addGenerationLog({
        jobId: job.id,
        assetId: asset.id,
        modelUsed: 'template-fill',
        modelTier: 'tier-0-free',
        estimatedCost: 0,
      });

      // Move to evaluate step
      setCurrentAsset(asset);
      setQualityChecked(new Set());
      setStep('evaluate');
    } catch (err) {
      console.error('Failed to generate asset:', err);
    } finally {
      setGenerating(null);
    }
  }, [job, generateContent, addAsset, addGenerationLog]);

  const handleRegenerate = useCallback(async () => {
    if (!currentAsset) return;
    setGenerating(currentAsset.type);

    try {
      const content = generateContent(currentAsset.type);
      await updateAsset(currentAsset.id, { content });
      setCurrentAsset({ ...currentAsset, content });
      setQualityChecked(new Set());
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setGenerating(null);
    }
  }, [currentAsset, generateContent, updateAsset]);

  const handleStartEdit = useCallback(() => {
    if (!currentAsset) return;
    setEditingContent(currentAsset.content);
    setStep('edit');
  }, [currentAsset]);

  const handleSaveEdit = useCallback(async () => {
    if (!currentAsset) return;
    await updateAsset(currentAsset.id, { content: editingContent });
    setCurrentAsset({ ...currentAsset, content: editingContent });
    setStep('evaluate');
  }, [currentAsset, editingContent, updateAsset]);

  const handleApprove = useCallback(async () => {
    if (!currentAsset) return;
    await updateAsset(currentAsset.id, { approved: true });
    setCurrentAsset({ ...currentAsset, approved: true });
    setStep('list');
    setCurrentAsset(null);
  }, [currentAsset, updateAsset]);

  const handleViewDetail = useCallback((asset: Asset) => {
    setCurrentAsset(asset);
    setQualityChecked(new Set());
    setStep('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setStep('list');
    setCurrentAsset(null);
    setEditingContent('');
  }, []);

  const checks = currentAsset ? (QUALITY_CHECKS[currentAsset.type] || []) : [];
  const allChecked = checks.length > 0 && qualityChecked.size === checks.length;

  // ============================================================
  // EVALUATE step — review generated content with quality gates
  // ============================================================
  if (step === 'evaluate' && currentAsset) {
    const Icon = ASSET_TYPE_ICONS[currentAsset.type] || FileText;
    const colorClass = ASSET_TYPE_COLORS[currentAsset.type] || 'bg-neutral-50 text-neutral-700';

    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToList} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${colorClass}`}>
              <Icon size={10} className="inline mr-1" />
              {currentAsset.type}
            </span>
            <span className="text-[11px] text-neutral-400">v{currentAsset.version}</span>
            <span className="text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md font-medium">
              Template Mode
            </span>
          </div>
        </div>

        {/* Generated content */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-neutral-700">Generated Content</h4>
            <CopyButton text={currentAsset.content} />
          </div>
          <pre className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto">
            {currentAsset.content}
          </pre>
        </div>

        {/* Quality checklist */}
        {checks.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertCircle size={12} />
              Quality Check
            </h4>
            <p className="text-[11px] text-neutral-500 mb-3">
              Review each item before approving. All checks must pass.
            </p>
            <div className="space-y-2">
              {checks.map((check, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQualityChecked((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    });
                  }}
                  className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg hover:bg-neutral-50"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    qualityChecked.has(i)
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-neutral-300'
                  }`}>
                    {qualityChecked.has(i) && <Check size={10} />}
                  </span>
                  <span className={`text-xs ${qualityChecked.has(i) ? 'text-neutral-500 line-through' : 'text-neutral-700'}`}>
                    {check}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-3">
            <button
              onClick={handleRegenerate}
              disabled={generating !== null}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 shadow-sm disabled:opacity-50"
            >
              {generating ? (
                <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Regenerate
            </button>
            <button
              onClick={handleStartEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 shadow-sm"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
          <button
            onClick={handleApprove}
            disabled={!allChecked}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Shield size={14} />
            {allChecked ? 'Approve Asset' : `Complete ${checks.length - qualityChecked.size} check${checks.length - qualityChecked.size !== 1 ? 's' : ''} to approve`}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // EDIT step — edit content, then back to evaluate
  // ============================================================
  if (step === 'edit' && currentAsset) {
    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('evaluate')} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100">
            <ArrowLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold text-neutral-900">Edit {currentAsset.type}</h3>
        </div>

        <textarea
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          rows={20}
          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setStep('evaluate')}
            className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            Save & Review
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // DETAIL step — view existing asset with approve/edit
  // ============================================================
  if (step === 'detail' && currentAsset) {
    const Icon = ASSET_TYPE_ICONS[currentAsset.type] || FileText;
    const colorClass = ASSET_TYPE_COLORS[currentAsset.type] || 'bg-neutral-50 text-neutral-700';

    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToList} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${colorClass}`}>
              <Icon size={10} className="inline mr-1" />
              {currentAsset.type}
            </span>
            <span className="text-[11px] text-neutral-400">v{currentAsset.version}</span>
            {currentAsset.approved && (
              <span className="text-[11px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200 flex items-center gap-0.5">
                <CheckCircle2 size={10} />
                Approved
              </span>
            )}
            <span className="text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md font-medium">
              Template Mode
            </span>
          </div>
          <CopyButton text={currentAsset.content} />
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
          <pre className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed font-sans">
            {currentAsset.content}
          </pre>
        </div>

        <div className="space-y-2">
          {!currentAsset.approved && (
            <button
              onClick={() => {
                setQualityChecked(new Set());
                setStep('evaluate');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <Shield size={14} />
              Review & Approve
            </button>
          )}
          <button
            onClick={() => {
              setEditingContent(currentAsset.content);
              setStep('edit');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 shadow-sm"
          >
            <Pencil size={14} />
            Edit Content
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span>template-fill | {currentAsset.modelTier}</span>
          <span>{new Date(currentAsset.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // LIST step — main asset list view
  // ============================================================
  return (
    <div className="py-4 space-y-4">
      {/* Generate Button */}
      <div className="relative">
        <button
          onClick={() => setShowGenMenu(!showGenMenu)}
          disabled={generating !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 shadow-sm"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating {generating}...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate Asset
              <ChevronDown size={14} />
            </>
          )}
        </button>

        {showGenMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowGenMenu(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg z-20 overflow-hidden">
              <p className="text-[11px] text-neutral-400 px-4 py-2 border-b border-neutral-100 font-medium uppercase tracking-wider">
                Template Mode — no AI cost
              </p>
              {GENERATE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    onClick={() => handleGenerate(opt.type)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 text-left"
                  >
                    <Icon size={14} className="text-neutral-400" />
                    {opt.label}
                  </button>
                );
              })}
              {claims.length === 0 && (
                <p className="text-[11px] text-amber-600 px-4 py-2 border-t border-neutral-100">
                  Add claims in Settings for personalized assets
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Existing Assets */}
      {jobAssets.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 mb-1">No assets generated yet</p>
          <p className="text-xs text-neutral-400">
            Generate outreach emails, cover letters, and more using template mode above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobAssets.map((asset) => {
            const Icon = ASSET_TYPE_ICONS[asset.type] || FileText;
            const colorClass = ASSET_TYPE_COLORS[asset.type] || 'bg-neutral-50 text-neutral-700';

            return (
              <button
                key={asset.id}
                onClick={() => handleViewDetail(asset)}
                className="w-full text-left bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${colorClass}`}>
                    <Icon size={10} className="inline mr-1" />
                    {asset.type}
                  </span>
                  <span className="text-[11px] text-neutral-400">v{asset.version}</span>
                  {asset.approved ? (
                    <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 flex items-center gap-0.5">
                      <CheckCircle2 size={10} />
                      Approved
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Needs Review
                    </span>
                  )}
                  <div className="ml-auto">
                    <CopyButton text={asset.content} />
                  </div>
                </div>
                <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                  {asset.content.slice(0, 200)}{asset.content.length > 200 ? '...' : ''}
                </p>
                <p className="text-[11px] text-neutral-400 mt-2">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
