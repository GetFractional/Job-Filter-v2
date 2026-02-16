import { useState, useCallback, type ChangeEvent } from 'react';
import { useStore } from '../store/useStore';
import {
  Save,
  Trash2,
  Download,
  FileText,
  Upload,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { db, seedDefaultProfile } from '../db';
import {
  extractClaimsImportWithMetadata,
  getClaimsImportAcceptValue,
  parseClaimsImport,
  validateClaimsImportFile,
  type ClaimsImportParseOptions,
} from '../lib/claimsImportPipeline';
import { ClaimsReviewEditor } from '../components/claims/ClaimsReviewEditor';
import {
  createClaimReviewItems,
  regroupClaimReviewItems,
  reviewItemToClaimInput,
  type ClaimReviewItem,
} from '../lib/claimsReview';
import { clearJobFilterLocalState } from '../lib/profileState';
import type { Claim, ParseDiagnostics } from '../types';
import type { ParseSegmentationMode } from '../lib/claimParser';

export function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const claims = useStore((s) => s.claims);
  const updateProfile = useStore((s) => s.updateProfile);
  const addClaim = useStore((s) => s.addClaim);
  const refreshData = useStore((s) => s.refreshData);

  const [activeSection, setActiveSection] = useState<'profile' | 'claims' | 'data'>('profile');

  return (
    <div className="space-y-5">
      <h1 className="text-h1 text-neutral-900">Settings</h1>

      {/* Section tabs */}
      <div className="flex gap-2">
        {(['profile', 'claims', 'data'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 text-sm rounded-lg font-medium capitalize ${
              activeSection === section
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {section === 'claims' ? 'Claim Ledger' : section}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && profile && <ProfileSection profile={profile} updateProfile={updateProfile} />}
      {activeSection === 'claims' && <ClaimsSection claims={claims} addClaim={addClaim} />}
      {activeSection === 'data' && <DataSection refreshData={refreshData} />}
    </div>
  );
}

function ProfileSection({ profile, updateProfile }: {
  profile: NonNullable<ReturnType<typeof useStore.getState>['profile']>;
  updateProfile: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    compFloor: profile.compFloor,
    compTarget: profile.compTarget,
    locationPreference: profile.locationPreference,
    targetRoles: profile.targetRoles.join('\n'),
    skills: profile.skills ?? [],
    tools: profile.tools ?? [],
    requiredBenefits: profile.requiredBenefits.join('\n'),
    preferredBenefits: profile.preferredBenefits.join('\n'),
    disqualifiers: profile.disqualifiers.join('\n'),
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateProfile({
      name: form.name,
      compFloor: form.compFloor,
      compTarget: form.compTarget,
      locationPreference: form.locationPreference,
      targetRoles: form.targetRoles.split('\n').filter(Boolean).map((s) => s.trim()),
      skills: form.skills.map((skill) => skill.trim()).filter(Boolean),
      tools: form.tools.map((tool) => tool.trim()).filter(Boolean),
      requiredBenefits: form.requiredBenefits.split('\n').filter(Boolean).map((s) => s.trim()),
      preferredBenefits: form.preferredBenefits.split('\n').filter(Boolean).map((s) => s.trim()),
      disqualifiers: form.disqualifiers.split('\n').filter(Boolean).map((s) => s.trim()),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm space-y-4">
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">Comp Floor ($)</label>
          <input
            type="number"
            value={form.compFloor}
            onChange={(e) => setForm({ ...form, compFloor: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">Comp Target ($)</label>
          <input
            type="number"
            value={form.compTarget}
            onChange={(e) => setForm({ ...form, compTarget: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Location Preference</label>
        <input
          value={form.locationPreference}
          onChange={(e) => setForm({ ...form, locationPreference: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Target Roles (one per line)</label>
        <textarea
          value={form.targetRoles}
          onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <TagInputField
        label="Skills"
        helperText="Add reusable strengths for matching and writing."
        values={form.skills}
        onChange={(values) => setForm({ ...form, skills: values })}
        placeholder="Type a skill and press Enter"
      />
      <TagInputField
        label="Tools"
        helperText="Add software/tools you want considered in matching and assets."
        values={form.tools}
        onChange={(values) => setForm({ ...form, tools: values })}
        placeholder="Type a tool and press Enter"
      />
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Required Benefits (one per line)</label>
        <textarea
          value={form.requiredBenefits}
          onChange={(e) => setForm({ ...form, requiredBenefits: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Preferred Benefits (one per line)</label>
        <textarea
          value={form.preferredBenefits}
          onChange={(e) => setForm({ ...form, preferredBenefits: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Disqualifiers (one per line)</label>
        <textarea
          value={form.disqualifiers}
          onChange={(e) => setForm({ ...form, disqualifiers: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <button
        onClick={handleSave}
        className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-brand-700"
      >
        <Save size={14} /> {saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  );
}

// ============================================================
// Claims Section — Structured Parser + Review Step
// ============================================================

type ClaimStep = 'input' | 'review' | 'done';
const SEGMENTATION_MODES: ParseSegmentationMode[] = ['default', 'newlines', 'bullets', 'headings'];
const SEGMENTATION_MODE_LABELS: Record<ParseSegmentationMode, string> = {
  default: 'Default',
  newlines: 'Newlines',
  bullets: 'Bullets',
  headings: 'Headings',
};

function ClaimsSection({ claims, addClaim }: {
  claims: Claim[];
  addClaim: (claim: Partial<Claim>) => Promise<Claim>;
}) {
  const [resumeText, setResumeText] = useState('');
  const [step, setStep] = useState<ClaimStep>('input');
  const [reviewItems, setReviewItems] = useState<ClaimReviewItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [importingFile, setImportingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [sourcePageCount, setSourcePageCount] = useState(0);
  const [segmentationMode, setSegmentationMode] = useState<ParseSegmentationMode>('default');
  const [parseDiagnostics, setParseDiagnostics] = useState<ParseDiagnostics | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);
  const showDiagnostics = import.meta.env.DEV;
  const aiStructuringEnabled = import.meta.env.VITE_ENABLE_AI_STRUCTURING === '1';

  const runParse = useCallback((mode: ParseSegmentationMode = segmentationMode) => {
    if (!resumeText.trim()) return;
    const parseOptions: ClaimsImportParseOptions = {
      segmentationMode: mode,
      pageCount: sourcePageCount,
    };
    const result = parseClaimsImport(resumeText, parseOptions);
    const nextItems = createClaimReviewItems(result.claims);
    setReviewItems(nextItems);
    setParseDiagnostics(result.diagnostics);
    setSegmentationMode(mode);
    setLowConfidence(result.lowConfidence || nextItems.length === 0);
    setStep('review');
  }, [resumeText, segmentationMode, sourcePageCount]);

  const handleParse = useCallback(() => {
    runParse(segmentationMode);
  }, [runParse, segmentationMode]);

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateClaimsImportFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFileName(null);
      return;
    }

    setImportingFile(true);
    setFileError(null);
    setSelectedFileName(file.name);

    try {
      const extracted = await extractClaimsImportWithMetadata(file);
      setResumeText(extracted.text);
      setSourcePageCount(extracted.pageCount);
      setParseDiagnostics(null);
      setLowConfidence(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read the file.';
      setFileError(message);
      setSelectedFileName(null);
      setSourcePageCount(0);
    } finally {
      setImportingFile(false);
    }
  }, []);

  const handleApprove = useCallback(async () => {
    const toImport = reviewItems.filter((item) => item.included);
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      for (const reviewItem of toImport) {
        await addClaim(reviewItemToClaimInput(reviewItem));
      }
      setImportCount(toImport.length);
      setResumeText('');
      setReviewItems([]);
      setSelectedFileName(null);
      setSourcePageCount(0);
      setFileError(null);
      setParseDiagnostics(null);
      setLowConfidence(false);
      setStep('done');
      setTimeout(() => setStep('input'), 3000);
    } finally {
      setImporting(false);
    }
  }, [addClaim, reviewItems]);

  const handleDiscard = useCallback(() => {
    setReviewItems([]);
    setParseDiagnostics(null);
    setLowConfidence(false);
    setStep('input');
  }, []);

  return (
    <div className="space-y-4">
      {step === 'input' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm">
          <h3 className="text-h3 text-neutral-900 mb-2 flex items-center gap-2">
            <FileText size={14} /> Import from Resume / LinkedIn
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            Upload a resume file or paste text. Both paths use the same parser and review flow before import.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">
              <Upload size={13} />
              {importingFile ? 'Reading file...' : 'Upload PDF, DOCX, or TXT'}
              <input
                type="file"
                accept={getClaimsImportAcceptValue()}
                onChange={handleImportFile}
                className="sr-only"
              />
            </label>
            {selectedFileName && (
              <span className="text-[11px] text-neutral-500 truncate">{selectedFileName}</span>
            )}
          </div>
          {fileError && <p className="text-xs text-red-600 mb-2">{fileError}</p>}
          <textarea
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              if (!e.target.value.trim()) {
                setParseDiagnostics(null);
                setLowConfidence(false);
              }
            }}
            placeholder={"Role at Company\nJan 2021 - Present\n- Led lifecycle marketing strategy across 4 channels\n- Increased qualified pipeline by 40%\n- Managed a cross-functional team\n\nRole at Example Inc\nMar 2018 - Dec 2020\n- Built demand generation engine from 0 to $5M pipeline\n- Launched ABM program targeting enterprise accounts"}
            rows={10}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <button
            onClick={handleParse}
            disabled={!resumeText.trim() || importingFile}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-700 flex items-center justify-center gap-2"
          >
            <FileText size={14} />
            Parse & Review Claims
          </button>
          {showDiagnostics && parseDiagnostics && (
            <details className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <summary className="cursor-pointer text-xs font-medium text-neutral-700">
                Advanced diagnostics (dev only)
              </summary>
              <DiagnosticsGrid diagnostics={parseDiagnostics} />
            </details>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          {reviewItems.length === 0 ? (
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-center">
                <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-amber-700">No claims could be parsed from the text.</p>
                <p className="text-xs text-amber-600 mt-1">
                  Try an alternate segmentation mode below or continue with Skip.
                </p>
              </div>

              {lowConfidence && (
                <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2">
                  <p className="text-xs font-medium text-neutral-700">Guided recovery</p>
                  <div className="flex flex-wrap gap-2">
                    {SEGMENTATION_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => runParse(mode)}
                        className={`px-2.5 py-1.5 rounded-md text-xs border ${
                          mode === segmentationMode
                            ? 'bg-brand-50 border-brand-300 text-brand-700'
                            : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        Try {SEGMENTATION_MODE_LABELS[mode]}
                      </button>
                    ))}
                    {aiStructuringEnabled && (
                      <button
                        type="button"
                        onClick={() => setFileError('AI structuring is enabled but not configured in this build.')}
                        className="px-2.5 py-1.5 rounded-md text-xs border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      >
                        Try AI structuring (beta)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showDiagnostics && parseDiagnostics && (
                <details className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-neutral-700">
                    Advanced diagnostics (dev only)
                  </summary>
                  <DiagnosticsGrid diagnostics={parseDiagnostics} />
                </details>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-3 py-2 text-xs border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
                >
                  Back to import
                </button>
              </div>
            </div>
          ) : (
            <ClaimsReviewEditor
              items={reviewItems}
              onChange={(items) => setReviewItems(regroupClaimReviewItems(items))}
              onApprove={handleApprove}
              onDiscard={handleDiscard}
              approving={importing}
              approveLabel="Approve & Save"
            />
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-5 text-center">
          <Check size={24} className="text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-800">
            {importCount} claim{importCount !== 1 ? 's' : ''} imported to ledger
          </p>
        </div>
      )}

      <div>
        <h3 className="text-h3 text-neutral-900 mb-2">Claims ({claims.length})</h3>
        {claims.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-4">No claims in ledger. Import from resume above.</p>
        )}
        {claims.map((claim) => (
          <div key={claim.id} className="bg-white rounded-lg border border-neutral-200 p-3 mb-2 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-medium text-neutral-900">{claim.role}</p>
                <p className="text-xs text-neutral-500">{claim.company} | {claim.startDate}{claim.endDate ? ` - ${claim.endDate}` : ' - Present'}</p>
              </div>
              {claim.reviewStatus && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  claim.reviewStatus === 'active'
                    ? 'bg-green-50 text-green-700'
                    : claim.reviewStatus === 'conflict'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {claim.reviewStatus}
                </span>
              )}
            </div>
            {claim.rawSnippet && (
              <p className="text-[11px] text-neutral-500 mb-1">Raw: {claim.rawSnippet}</p>
            )}
            {claim.claimText && (
              <p className="text-xs text-neutral-700 mb-1">Normalized: {claim.claimText}</p>
            )}
            {claim.responsibilities.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {claim.responsibilities.slice(0, 3).map((r, i) => (
                  <li key={i} className="text-xs text-neutral-600">* {r}</li>
                ))}
                {claim.responsibilities.length > 3 && (
                  <li className="text-[11px] text-neutral-400">+{claim.responsibilities.length - 3} more</li>
                )}
              </ul>
            )}
            {claim.outcomes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {claim.outcomes.map((o, i) => (
                  <span key={i} className={`text-[11px] px-1.5 py-0.5 rounded-md ${o.verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {o.description}
                  </span>
                ))}
              </div>
            )}
            {claim.tools.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {claim.tools.map((tool, i) => (
                  <span key={i} className="text-[11px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md">{tool}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticsGrid({ diagnostics }: { diagnostics: ParseDiagnostics }) {
  const rows: Array<[string, string | number]> = [
    ['Extracted text length', diagnostics.extractedTextLength],
    ['Page count', diagnostics.pageCount],
    ['Detected lines', diagnostics.detectedLinesCount],
    ['Bullet candidates', diagnostics.bulletCandidatesCount],
    ['Section headers', diagnostics.sectionHeadersDetected],
    ['Company candidates', diagnostics.companyCandidatesDetected],
    ['Role candidates', diagnostics.roleCandidatesDetected],
    ['Final companies', diagnostics.finalCompaniesCount],
    ['Final roles', diagnostics.rolesCount],
    ['Final bullets', diagnostics.bulletsCount],
    ['Reason codes', diagnostics.reasonCodes.join(', ') || 'None'],
  ];

  return (
    <div className="mt-3 space-y-3">
      <dl className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded border border-neutral-200 bg-white p-2">
            <dt className="text-[11px] text-neutral-500">{label}</dt>
            <dd className="text-xs font-medium text-neutral-800">{value}</dd>
          </div>
        ))}
      </dl>
      {diagnostics.previewLines.length > 0 && (
        <div className="rounded border border-neutral-200 bg-white p-2">
          <p className="text-[11px] text-neutral-500 mb-1">Preview lines (first 30)</p>
          <pre className="text-[11px] text-neutral-700 whitespace-pre-wrap break-words max-h-40 overflow-auto">
            {diagnostics.previewLines.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

function TagInputField({
  label,
  helperText,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  helperText: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const addTag = useCallback(() => {
    const normalized = draft.trim();
    if (!normalized) return;
    if (values.some((value) => value.toLowerCase() === normalized.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...values, normalized]);
    setDraft('');
  }, [draft, onChange, values]);

  const removeTag = useCallback((valueToRemove: string) => {
    onChange(values.filter((value) => value !== valueToRemove));
  }, [onChange, values]);

  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 mb-1 block">{label}</label>
      <p className="text-[11px] text-neutral-500 mb-2">{helperText}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-neutral-100 text-neutral-700">
            {value}
            <button
              type="button"
              onClick={() => removeTag(value)}
              className="text-neutral-500 hover:text-red-600"
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-2 text-xs border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function DataSection({ refreshData }: { refreshData: () => Promise<void> }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = async () => {
    const data = {
      jobs: await db.jobs.toArray(),
      companies: await db.companies.toArray(),
      contacts: await db.contacts.toArray(),
      activities: await db.activities.toArray(),
      assets: await db.assets.toArray(),
      claims: await db.claims.toArray(),
      profiles: await db.profiles.toArray(),
      generationLogs: await db.generationLogs.toArray(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-filter-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    await Promise.all([
      db.jobs.clear(),
      db.companies.clear(),
      db.contacts.clear(),
      db.contactJobLinks.clear(),
      db.activities.clear(),
      db.assets.clear(),
      db.claims.clear(),
      db.profiles.clear(),
      db.generationLogs.clear(),
      db.outcomes.clear(),
      db.experiments.clear(),
      db.applicationAnswers.clear(),
    ]);
    if (typeof window !== 'undefined') {
      clearJobFilterLocalState(window.localStorage);
    }
    await seedDefaultProfile();
    await refreshData();
    setConfirmClear(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm">
        <h3 className="text-h3 text-neutral-900 mb-2">Export Data</h3>
        <p className="text-xs text-neutral-500 mb-3">Download all your data as a JSON file.</p>
        <button
          onClick={handleExport}
          className="w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-800"
        >
          <Download size={14} /> Export All Data
        </button>
      </div>

      <div className="bg-white rounded-lg border border-red-200 p-5 shadow-sm">
        <h3 className="text-h3 text-red-700 mb-2">Reset / Clear all data</h3>
        <p className="text-xs text-neutral-500 mb-3">Permanently delete all local jobs, contacts, claims, profile data, and onboarding state. This cannot be undone.</p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100"
          >
            <Trash2 size={14} /> Reset / Clear all data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-medium">Are you sure? This is permanent.</p>
            <div className="flex gap-2">
              <button onClick={handleClear} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                Yes, Delete Everything
              </button>
              <button onClick={() => setConfirmClear(false)} className="flex-1 bg-neutral-100 text-neutral-700 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
