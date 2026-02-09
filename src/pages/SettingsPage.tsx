import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  Save,
  Trash2,
  Download,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Minus,
  AlertTriangle,
  Wrench,
  Target,
  Briefcase,
} from 'lucide-react';
import { db } from '../db';
import { parseResumeStructured, parsedClaimToImport } from '../lib/claimParser';
import type { ParsedClaim } from '../lib/claimParser';
import type { Claim } from '../types';

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

function ClaimsSection({ claims, addClaim }: {
  claims: Claim[];
  addClaim: (claim: Partial<Claim>) => Promise<Claim>;
}) {
  const [resumeText, setResumeText] = useState('');
  const [step, setStep] = useState<ClaimStep>('input');
  const [parsedClaims, setParsedClaims] = useState<ParsedClaim[]>([]);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const handleParse = useCallback(() => {
    if (!resumeText.trim()) return;
    const parsed = parseResumeStructured(resumeText);
    setParsedClaims(parsed);
    setStep(parsed.length > 0 ? 'review' : 'input');
  }, [resumeText]);

  const handleImport = useCallback(async () => {
    const toImport = parsedClaims.filter((c) => c.included);
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      for (const parsed of toImport) {
        await addClaim(parsedClaimToImport(parsed));
      }
      setImportCount(toImport.length);
      setResumeText('');
      setParsedClaims([]);
      setStep('done');
      setTimeout(() => setStep('input'), 3000);
    } finally {
      setImporting(false);
    }
  }, [parsedClaims, addClaim]);

  const handleBack = useCallback(() => {
    setStep('input');
  }, []);

  const updateParsedClaim = useCallback((key: string, updates: Partial<ParsedClaim>) => {
    setParsedClaims((prev) =>
      prev.map((c) => (c._key === key ? { ...c, ...updates } : c))
    );
  }, []);

  const includedCount = parsedClaims.filter((c) => c.included).length;

  return (
    <div className="space-y-4">
      {/* Import Section */}
      {step === 'input' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm">
          <h3 className="text-h3 text-neutral-900 mb-2 flex items-center gap-2">
            <FileText size={14} /> Import from Resume / LinkedIn
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            Paste your resume or LinkedIn experience text. The parser will extract structured claims
            for you to review and edit before importing.
          </p>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder={"VP of Growth at Previous Company\nJan 2021 - Present\n- Led lifecycle marketing strategy across 4 channels\n- Grew revenue 150% YoY through funnel optimization\n- Managed team of 8 using HubSpot, Segment, Amplitude\n\nDirector of Marketing - Widget Inc\nMar 2018 - Dec 2020\n- Built demand gen engine from 0 to $5M pipeline\n- Launched ABM program targeting enterprise accounts"}
            rows={10}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <button
            onClick={handleParse}
            disabled={!resumeText.trim()}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-700 flex items-center justify-center gap-2"
          >
            <FileText size={14} />
            Parse & Review Claims
          </button>
        </div>
      )}

      {/* Review Step */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 text-neutral-900 flex items-center gap-2">
                <Pencil size={14} />
                Review Parsed Claims
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {parsedClaims.length} claim{parsedClaims.length !== 1 ? 's' : ''} found.
                Edit fields, toggle inclusion, then import.
              </p>
            </div>
            <button
              onClick={handleBack}
              className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
            >
              <X size={12} /> Back to paste
            </button>
          </div>

          {parsedClaims.length === 0 ? (
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-center">
              <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-amber-700">No claims could be parsed from the text.</p>
              <p className="text-xs text-amber-600 mt-1">
                Make sure your text has role headers (e.g. "VP of Growth at Previous Company")
                followed by bullet points.
              </p>
            </div>
          ) : (
            <>
              {parsedClaims.map((claim) => (
                <ReviewCard
                  key={claim._key}
                  claim={claim}
                  onUpdate={(updates) => updateParsedClaim(claim._key, updates)}
                />
              ))}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={includedCount === 0 || importing}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Import {includedCount} Claim{includedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Done Step */}
      {step === 'done' && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-5 text-center">
          <Check size={24} className="text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-800">
            {importCount} claim{importCount !== 1 ? 's' : ''} imported to ledger
          </p>
        </div>
      )}

      {/* Existing Claims List */}
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
            </div>
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

// ============================================================
// Review Card — editable parsed claim
// ============================================================

function ReviewCard({
  claim,
  onUpdate,
}: {
  claim: ParsedClaim;
  onUpdate: (updates: Partial<ParsedClaim>) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);

  const toggleIncluded = () => onUpdate({ included: !claim.included });

  return (
    <div
      className={`rounded-lg border shadow-sm transition-colors ${
        claim.included
          ? 'bg-white border-neutral-200'
          : 'bg-neutral-50 border-neutral-200 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={toggleIncluded}
          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
            claim.included
              ? 'bg-brand-600 border-brand-600 text-white'
              : 'border-neutral-300 bg-white'
          }`}
          aria-label={claim.included ? 'Exclude claim' : 'Include claim'}
        >
          {claim.included && <Check size={12} />}
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          {expanded ? <ChevronDown size={14} className="text-neutral-400 shrink-0" /> : <ChevronRight size={14} className="text-neutral-400 shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {claim.role || <span className="text-neutral-400 italic">No role</span>}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {claim.company || <span className="text-neutral-400 italic">No company</span>}
              {claim.startDate && ` | ${claim.startDate}${claim.endDate ? ` - ${claim.endDate}` : ' - Present'}`}
            </p>
          </div>
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && claim.included && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
          {/* Editable Role & Company */}
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              label="Role"
              icon={<Briefcase size={12} className="text-neutral-400" />}
              value={claim.role}
              editing={editingField === 'role'}
              onStartEdit={() => setEditingField('role')}
              onSave={(v) => { onUpdate({ role: v }); setEditingField(null); }}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="Company"
              icon={<Target size={12} className="text-neutral-400" />}
              value={claim.company}
              editing={editingField === 'company'}
              onStartEdit={() => setEditingField('company')}
              onSave={(v) => { onUpdate({ company: v }); setEditingField(null); }}
              onCancel={() => setEditingField(null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <EditableField
              label="Start Date"
              value={claim.startDate}
              editing={editingField === 'startDate'}
              onStartEdit={() => setEditingField('startDate')}
              onSave={(v) => { onUpdate({ startDate: v }); setEditingField(null); }}
              onCancel={() => setEditingField(null)}
            />
            <EditableField
              label="End Date"
              value={claim.endDate}
              placeholder="Present"
              editing={editingField === 'endDate'}
              onStartEdit={() => setEditingField('endDate')}
              onSave={(v) => { onUpdate({ endDate: v }); setEditingField(null); }}
              onCancel={() => setEditingField(null)}
            />
          </div>

          {/* Responsibilities */}
          {claim.responsibilities.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Responsibilities ({claim.responsibilities.length})
              </p>
              <ul className="space-y-1">
                {claim.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 group">
                    <span className="text-xs text-neutral-600 flex-1">- {r}</span>
                    <button
                      onClick={() => {
                        onUpdate({
                          responsibilities: claim.responsibilities.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 shrink-0"
                      aria-label="Remove responsibility"
                    >
                      <Minus size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Outcomes */}
          {claim.outcomes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Outcomes ({claim.outcomes.length})
              </p>
              <div className="space-y-1">
                {claim.outcomes.map((o, i) => (
                  <div key={i} className="flex items-start gap-1.5 group">
                    <span className="text-xs text-neutral-600 flex-1">
                      <span className="inline-flex items-center gap-1">
                        {o.metric && (
                          <span className="text-[11px] font-medium text-green-700 bg-green-50 px-1 py-0.5 rounded">
                            {o.metric}
                          </span>
                        )}
                        {o.description}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        onUpdate({
                          outcomes: claim.outcomes.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 shrink-0"
                      aria-label="Remove outcome"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Wrench size={11} />
              Tools ({claim.tools.length})
            </p>
            {claim.tools.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {claim.tools.map((tool, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 group"
                  >
                    {tool}
                    <button
                      onClick={() => {
                        onUpdate({
                          tools: claim.tools.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-red-500"
                      aria-label={`Remove ${tool}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 italic">No tools detected</p>
            )}
          </div>

          {/* Warning if incomplete */}
          {(!claim.role || !claim.company) && (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle size={12} />
              <span className="text-[11px]">
                {!claim.role && !claim.company
                  ? 'Missing role and company — edit above before importing.'
                  : !claim.role
                  ? 'Missing role — edit above before importing.'
                  : 'Missing company — edit above before importing.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Editable Field (inline edit)
// ============================================================

function EditableField({
  label,
  icon,
  value,
  placeholder,
  editing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  placeholder?: string;
  editing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div>
        <label className="text-[11px] font-medium text-neutral-500 mb-0.5 block flex items-center gap-1">
          {icon}
          {label}
        </label>
        <div className="flex gap-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(draft);
              if (e.key === 'Escape') onCancel();
            }}
            className="flex-1 px-2 py-1 border border-brand-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button onClick={() => onSave(draft)} className="p-1 text-brand-600 hover:text-brand-700">
            <Check size={12} />
          </button>
          <button onClick={onCancel} className="p-1 text-neutral-400 hover:text-neutral-600">
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-medium text-neutral-500 mb-0.5 block flex items-center gap-1">
        {icon}
        {label}
      </label>
      <button
        onClick={() => {
          setDraft(value);
          onStartEdit();
        }}
        className="w-full text-left px-2 py-1 rounded text-xs text-neutral-800 hover:bg-neutral-50 border border-transparent hover:border-neutral-200 flex items-center justify-between group"
      >
        <span className={value ? '' : 'text-neutral-400 italic'}>{value || placeholder || 'Empty'}</span>
        <Pencil size={10} className="text-neutral-300 opacity-0 group-hover:opacity-100" />
      </button>
    </div>
  );
}

// ============================================================
// Data Section
// ============================================================

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
      db.activities.clear(),
      db.assets.clear(),
      db.claims.clear(),
      db.generationLogs.clear(),
      db.outcomes.clear(),
      db.experiments.clear(),
    ]);
    await refreshData();
    setConfirmClear(false);
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
        <h3 className="text-h3 text-red-700 mb-2">Clear All Data</h3>
        <p className="text-xs text-neutral-500 mb-3">Permanently delete all jobs, contacts, activities, and assets. This cannot be undone.</p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100"
          >
            <Trash2 size={14} /> Clear Data
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
