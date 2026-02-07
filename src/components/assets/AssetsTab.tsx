import { useState, useCallback, useMemo } from 'react';
import {
  FileText,
  Copy,
  Check,
  Pencil,
  ChevronDown,
  Sparkles,
  Mail,
  Linkedin,
  FileSignature,
  Send,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Shield,
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
};

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  'Outreach Email': 'bg-blue-50 text-blue-700 border-blue-200',
  'LinkedIn Connect': 'bg-sky-50 text-sky-700 border-sky-200',
  'Cover Letter': 'bg-violet-50 text-violet-700 border-violet-200',
  'Follow-up Email': 'bg-amber-50 text-amber-700 border-amber-200',
  'Growth Memo': 'bg-green-50 text-green-700 border-green-200',
  'Interview Prep': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Negotiation Script': 'bg-rose-50 text-rose-700 border-rose-200',
};

const GENERATE_OPTIONS: { type: AssetType; label: string; icon: typeof Mail }[] = [
  { type: 'Outreach Email', label: 'Outreach Email', icon: Mail },
  { type: 'LinkedIn Connect', label: 'LinkedIn Connect', icon: Linkedin },
  { type: 'Cover Letter', label: 'Cover Letter', icon: FileSignature },
  { type: 'Follow-up Email', label: 'Follow-up Email', icon: Send },
  { type: 'Growth Memo', label: 'Growth Memo', icon: BookOpen },
];

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

export function AssetsTab({ job }: AssetsTabProps) {
  const allAssets = useStore((s) => s.assets);
  const claims = useStore((s) => s.claims);
  const addAsset = useStore((s) => s.addAsset);
  const updateAsset = useStore((s) => s.updateAsset);
  const addGenerationLog = useStore((s) => s.addGenerationLog);

  const [showGenMenu, setShowGenMenu] = useState(false);
  const [generating, setGenerating] = useState<AssetType | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const jobAssets = useMemo(
    () => allAssets.filter((a) => a.jobId === job.id).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [allAssets, job.id]
  );

  const handleGenerate = useCallback(async (type: AssetType) => {
    setGenerating(type);
    setShowGenMenu(false);

    try {
      let content = '';
      const params = { job, claims, research: job.researchBrief };

      switch (type) {
        case 'Outreach Email':
          content = generateOutreachEmail({ job, claims });
          break;
        case 'LinkedIn Connect':
          content = generateLinkedInConnect({ job, claims });
          break;
        case 'Cover Letter':
          content = generateCoverLetter(params);
          break;
        case 'Follow-up Email':
          content = generateFollowUpEmail({ job });
          break;
        case 'Growth Memo':
          content = generateGrowthMemo(params);
          break;
        default:
          content = `[${type} generation coming soon]`;
      }

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
    } catch (err) {
      console.error('Failed to generate asset:', err);
    } finally {
      setGenerating(null);
    }
  }, [job, claims, addAsset, addGenerationLog]);

  const handleToggleApproved = useCallback(async (asset: Asset) => {
    await updateAsset(asset.id, { approved: !asset.approved });
    if (selectedAsset?.id === asset.id) {
      setSelectedAsset({ ...asset, approved: !asset.approved });
    }
  }, [updateAsset, selectedAsset]);

  const handleStartEdit = useCallback((asset: Asset) => {
    setEditingContent(asset.content);
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedAsset) return;
    await updateAsset(selectedAsset.id, { content: editingContent });
    setSelectedAsset({ ...selectedAsset, content: editingContent });
    setIsEditing(false);
  }, [selectedAsset, editingContent, updateAsset]);

  // Asset detail view
  if (selectedAsset) {
    const Icon = ASSET_TYPE_ICONS[selectedAsset.type] || FileText;
    const colorClass = ASSET_TYPE_COLORS[selectedAsset.type] || 'bg-neutral-50 text-neutral-700';

    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedAsset(null); setIsEditing(false); }}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${colorClass}`}>
              <Icon size={10} className="inline mr-1" />
              {selectedAsset.type}
            </span>
            <span className="text-[11px] text-neutral-400">v{selectedAsset.version}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton text={selectedAsset.content} />
            <button
              onClick={() => handleToggleApproved(selectedAsset)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${
                selectedAsset.approved
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-neutral-50 text-neutral-500 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <Shield size={10} />
              {selectedAsset.approved ? 'Approved' : 'Approve'}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              rows={20}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <pre className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed font-sans">
              {selectedAsset.content}
            </pre>
          </div>
        )}

        {!isEditing && (
          <button
            onClick={() => handleStartEdit(selectedAsset)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 shadow-sm"
          >
            <Pencil size={14} />
            Edit Content
          </button>
        )}

        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span>{selectedAsset.modelUsed} | {selectedAsset.modelTier}</span>
          <span>{new Date(selectedAsset.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    );
  }

  // Asset list view
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg z-10 overflow-hidden">
            {GENERATE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.type}
                  onClick={() => handleGenerate(opt.type)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 text-left"
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
            Generate outreach emails, cover letters, and more using the button above.
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
                onClick={() => setSelectedAsset(asset)}
                className="w-full text-left bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${colorClass}`}>
                    <Icon size={10} className="inline mr-1" />
                    {asset.type}
                  </span>
                  <span className="text-[11px] text-neutral-400">v{asset.version}</span>
                  {asset.approved && (
                    <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 flex items-center gap-0.5">
                      <CheckCircle2 size={10} />
                      Approved
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
