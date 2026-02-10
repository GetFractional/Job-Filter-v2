import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
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
  Zap,
  Trophy,
} from 'lucide-react';
import { db } from '../db';
import { parseResumeStructured, parsedClaimToImport } from '../lib/claimParser';
import type { ParsedClaim } from '../lib/claimParser';
import type { Claim, ClaimType, ClaimVerificationStatus } from '../types';
import {
  buildExperienceBundles,
  claimReviewQueue,
  findDuplicateClaimGroups,
  groupClaimsByType,
} from '../lib/claimLedger';

const BENEFIT_OPTIONS = [
  'Remote-first',
  'Hybrid flexibility',
  '401(k) match',
  'Health insurance',
  'Dental + vision',
  'Equity',
  'Performance bonus',
  'Learning stipend',
  'Home office stipend',
  'Parental leave',
  'PTO 20+ days',
  'Wellness stipend',
];

export function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const claims = useStore((s) => s.claims);
  const updateProfile = useStore((s) => s.updateProfile);
  const addClaim = useStore((s) => s.addClaim);
  const updateClaim = useStore((s) => s.updateClaim);
  const deleteClaim = useStore((s) => s.deleteClaim);
  const mergeClaims = useStore((s) => s.mergeClaims);
  const approveClaims = useStore((s) => s.approveClaims);
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
      {activeSection === 'claims' && (
        <ClaimsSection
          claims={claims}
          addClaim={addClaim}
          updateClaim={updateClaim}
          deleteClaim={deleteClaim}
          mergeClaims={mergeClaims}
          approveClaims={approveClaims}
        />
      )}
      {activeSection === 'data' && <DataSection refreshData={refreshData} />}
    </div>
  );
}

function ProfileSection({ profile, updateProfile }: {
  profile: NonNullable<ReturnType<typeof useStore.getState>['profile']>;
  updateProfile: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const initialCustomBenefits = useMemo(
    () =>
      Array.from(
        new Set(
          [...profile.requiredBenefits, ...profile.preferredBenefits]
            .map((value) => value.trim())
            .filter((value) => value && !BENEFIT_OPTIONS.includes(value))
        )
      ),
    [profile.requiredBenefits, profile.preferredBenefits]
  );

  const [customBenefits, setCustomBenefits] = useState<string[]>(initialCustomBenefits);
  const [newBenefit, setNewBenefit] = useState('');
  const [form, setForm] = useState({
    name: profile.name,
    compFloor: profile.compFloor,
    compTarget: profile.compTarget,
    locationPreference: profile.locationPreference,
    targetRoles: profile.targetRoles.join('\n'),
    requiredBenefits: [...profile.requiredBenefits],
    preferredBenefits: [...profile.preferredBenefits],
    disqualifiers: profile.disqualifiers.join('\n'),
    followUpMode: (localStorage.getItem('jf2-followup-mode') as 'manual' | 'auto') || 'manual',
    followUpDays: parseInt(localStorage.getItem('jf2-followup-days') || '5', 10) || 5,
  });
  const [saved, setSaved] = useState(false);

  const benefitRows = useMemo(() => {
    const merged = new Set<string>([...BENEFIT_OPTIONS, ...customBenefits]);
    return Array.from(merged);
  }, [customBenefits]);

  const setBenefitPreference = (benefit: string, preference: 'off' | 'preferred' | 'required') => {
    setForm((prev) => {
      const required = prev.requiredBenefits.filter((value) => value !== benefit);
      const preferred = prev.preferredBenefits.filter((value) => value !== benefit);

      if (preference === 'required') required.push(benefit);
      if (preference === 'preferred') preferred.push(benefit);

      return {
        ...prev,
        requiredBenefits: required,
        preferredBenefits: preferred,
      };
    });
  };

  const addCustomBenefit = () => {
    const value = newBenefit.trim();
    if (!value) return;
    if (!BENEFIT_OPTIONS.includes(value) && !customBenefits.includes(value)) {
      setCustomBenefits((prev) => [...prev, value]);
    }
    setBenefitPreference(value, 'preferred');
    setNewBenefit('');
  };

  const handleSave = async () => {
    await updateProfile({
      name: form.name,
      compFloor: form.compFloor,
      compTarget: form.compTarget,
      locationPreference: form.locationPreference,
      targetRoles: form.targetRoles.split('\n').filter(Boolean).map((s) => s.trim()),
      requiredBenefits: form.requiredBenefits,
      preferredBenefits: form.preferredBenefits,
      disqualifiers: form.disqualifiers.split('\n').filter(Boolean).map((s) => s.trim()),
    });
    localStorage.setItem('jf2-followup-mode', form.followUpMode);
    localStorage.setItem('jf2-followup-days', String(form.followUpDays));
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

      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2">
          <p className="text-xs font-semibold text-neutral-700">Benefit Preferences</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Set each item as Required, Preferred, or Off.</p>
        </div>
        <div className="divide-y divide-neutral-100">
          {benefitRows.map((benefit) => {
            const isRequired = form.requiredBenefits.includes(benefit);
            const isPreferred = form.preferredBenefits.includes(benefit);
            return (
              <div key={benefit} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 items-center">
                <p className="text-sm text-neutral-700">{benefit}</p>
                <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
                  <button
                    onClick={() => setBenefitPreference(benefit, 'off')}
                    className={`px-2.5 py-1 text-xs font-medium ${
                      !isRequired && !isPreferred ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Off
                  </button>
                  <button
                    onClick={() => setBenefitPreference(benefit, 'preferred')}
                    className={`px-2.5 py-1 text-xs font-medium border-l border-neutral-200 ${
                      isPreferred ? 'bg-brand-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Preferred
                  </button>
                  <button
                    onClick={() => setBenefitPreference(benefit, 'required')}
                    className={`px-2.5 py-1 text-xs font-medium border-l border-neutral-200 ${
                      isRequired ? 'bg-red-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Required
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-neutral-200 bg-white px-3 py-2 flex items-center gap-2">
          <input
            value={newBenefit}
            onChange={(event) => setNewBenefit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomBenefit();
              }
            }}
            placeholder="Add custom benefit..."
            className="flex-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={addCustomBenefit}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Hard No Criteria (one per line)</label>
        <textarea
          value={form.disqualifiers}
          onChange={(e) => setForm({ ...form, disqualifiers: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 space-y-2">
        <p className="text-xs font-semibold text-neutral-700">Follow-up Reminder Defaults</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Mode</label>
            <select
              value={form.followUpMode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  followUpMode: event.target.value as 'manual' | 'auto',
                }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="manual">Manual reminder only</option>
              <option value="auto">Auto-suggest follow-up date</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Days</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.followUpDays}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  followUpDays: Math.min(30, Math.max(1, parseInt(event.target.value, 10) || 1)),
                }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
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

function parseBulkClaimInput(input: string): string[] {
  return input
    .split(/\r?\n|[;,]/)
    .map((line) => line.replace(/^[-*•◦▪▸►]\s*/, '').trim())
    .filter(Boolean);
}

function estimateManualConfidence(params: {
  type: ClaimType;
  text?: string;
  role?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  metric?: string;
}): number {
  const type = params.type;
  if (type === 'Experience') {
    let score = 0.58;
    if ((params.role || '').trim()) score += 0.14;
    if ((params.company || '').trim()) score += 0.14;
    if ((params.startDate || '').trim()) score += 0.06;
    if ((params.endDate || '').trim()) score += 0.03;
    if ((params.location || '').trim()) score += 0.03;
    if ((params.responsibilities || []).length > 0) score += 0.06;
    return Math.min(0.96, score);
  }

  if (type === 'Outcome') {
    let score = 0.63;
    if ((params.metric || '').trim()) score += 0.2;
    if (/\d/.test(params.text || '')) score += 0.07;
    return Math.min(0.96, score);
  }

  if (type === 'Tool') return 0.78;
  return 0.74;
}

function ClaimsSection({ claims, addClaim, updateClaim, deleteClaim, mergeClaims, approveClaims }: {
  claims: Claim[];
  addClaim: (claim: Partial<Claim>) => Promise<Claim>;
  updateClaim: (id: string, updates: Partial<Claim>) => Promise<void>;
  deleteClaim: (id: string) => Promise<void>;
  mergeClaims: (targetId: string, sourceId: string) => Promise<void>;
  approveClaims: (ids?: string[]) => Promise<number>;
}) {
  const [resumeText, setResumeText] = useState('');
  const [step, setStep] = useState<ClaimStep>('input');
  const [parsedClaims, setParsedClaims] = useState<ParsedClaim[]>([]);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<ClaimType>('Experience');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'review'>('all');
  const [manualType, setManualType] = useState<ClaimType>('Skill');
  const [manualText, setManualText] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualExperienceNotes, setManualExperienceNotes] = useState('');
  const [manualOutcomeMetric, setManualOutcomeMetric] = useState('');
  const [manualExperienceId, setManualExperienceId] = useState('');
  const [manualBulkText, setManualBulkText] = useState('');
  const [addingManual, setAddingManual] = useState(false);
  const [addingBulk, setAddingBulk] = useState(false);
  const [mergingDuplicates, setMergingDuplicates] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingAtomicId, setEditingAtomicId] = useState<string | null>(null);
  const [editingAtomicText, setEditingAtomicText] = useState('');
  const [editingAtomicMetric, setEditingAtomicMetric] = useState('');
  const [savingAtomic, setSavingAtomic] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [savingExperience, setSavingExperience] = useState(false);
  const [experienceDraft, setExperienceDraft] = useState({
    role: '',
    company: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  const handleParse = useCallback(() => {
    if (!resumeText.trim()) return;
    setImportError(null);
    const parsed = parseResumeStructured(resumeText);
    setParsedClaims(parsed);
    setStep(parsed.length > 0 ? 'review' : 'input');
  }, [resumeText]);

  const handleImport = useCallback(async () => {
    const includedClaims = parsedClaims.filter((c) => c.included);
    if (includedClaims.length === 0) return;
    const invalidIdentityClaims = includedClaims.filter(
      (claim) => !claim.role?.trim() || !claim.company?.trim()
    );
    const toImport = includedClaims.filter(
      (claim) => claim.role?.trim() && claim.company?.trim()
    );
    if (toImport.length === 0) {
      setImportError('No claims were imported. Ensure each included claim has both role and company.');
      return;
    }

    setImporting(true);
    setImportError(null);
    try {
      let importedCount = 0;
      let failedCount = 0;
      for (const parsed of toImport) {
        try {
          const importData = parsedClaimToImport(parsed);
          const experience = await addClaim(importData.experience);
          for (const skill of importData.skillClaims) {
            await addClaim({ ...skill, experienceId: experience.id });
          }
          for (const tool of importData.toolClaims) {
            await addClaim({ ...tool, experienceId: experience.id });
          }
          for (const outcome of importData.outcomeClaims) {
            await addClaim({ ...outcome, experienceId: experience.id });
          }
          importedCount += 1;
        } catch {
          failedCount += 1;
        }
      }
      setImportCount(importedCount);

      const notices: string[] = [];
      if (invalidIdentityClaims.length > 0) {
        notices.push(`Skipped ${invalidIdentityClaims.length} claim(s) missing role/company.`);
      }
      if (failedCount > 0) {
        notices.push(`${failedCount} claim(s) failed validation during import.`);
      }
      if (notices.length > 0) {
        setImportError(notices.join(' '));
      }

      if (importedCount > 0) {
        setResumeText('');
        setParsedClaims([]);
        setStep('done');
        setTimeout(() => setStep('input'), 3000);
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import parsed claims.');
    } finally {
      setImporting(false);
    }
  }, [parsedClaims, addClaim]);

  const handleBack = useCallback(() => {
    setStep('input');
    setImportError(null);
  }, []);

  const updateParsedClaim = useCallback((key: string, updates: Partial<ParsedClaim>) => {
    setParsedClaims((prev) =>
      prev.map((c) => (c._key === key ? { ...c, ...updates } : c))
    );
  }, []);

  const includedCount = parsedClaims.filter((c) => c.included).length;

  const reviewNeeded = claimReviewQueue(claims);
  const duplicateGroups = findDuplicateClaimGroups(claims);
  const duplicateClaimCount = duplicateGroups.reduce((total, group) => total + group.sourceIds.length, 0);
  const experiences = buildExperienceBundles(claims);
  const groupedClaims = groupClaimsByType(claims) as Record<ClaimType, Claim[]>;
  const claimCountsByType = {
    Skill: claims.filter((c) => c.type === 'Skill').length,
    Tool: claims.filter((c) => c.type === 'Tool').length,
    Experience: claims.filter((c) => c.type === 'Experience' || (c.role && c.company)).length,
    Outcome: claims.filter((c) => c.type === 'Outcome').length,
  } satisfies Record<ClaimType, number>;
  const experienceLabelById = new Map(
    experiences.map((experience) => [experience.id, `${experience.role} @ ${experience.company}`])
  );
  const categoryClaims = groupedClaims[activeCategory] || [];
  const visibleCategoryClaims =
    ledgerFilter === 'review'
      ? categoryClaims.filter((claim) => claim.verificationStatus === 'Review Needed')
      : categoryClaims;
  const unlinkedByType = {
    Skill: groupedClaims.Skill.filter((claim) => !claim.experienceId).length,
    Tool: groupedClaims.Tool.filter((claim) => !claim.experienceId).length,
    Outcome: groupedClaims.Outcome.filter((claim) => !claim.experienceId).length,
  };
  const totalUnlinkedAtomicClaims = unlinkedByType.Skill + unlinkedByType.Tool + unlinkedByType.Outcome;
  const firstExperienceId = experiences[0]?.id || '';
  const hasSelectedExperience = Boolean(manualExperienceId && experiences.some((experience) => experience.id === manualExperienceId));

  useEffect(() => {
    if (manualType === 'Experience') {
      if (manualExperienceId) setManualExperienceId('');
      return;
    }

    if (!firstExperienceId) {
      if (manualExperienceId) setManualExperienceId('');
      return;
    }

    if (!hasSelectedExperience) {
      setManualExperienceId(firstExperienceId);
    }
  }, [manualType, manualExperienceId, firstExperienceId, hasSelectedExperience]);

  const bucketMeta: Record<ClaimType, { label: string; icon: ReactNode; tone: string; helper: string }> = {
    Experience: {
      label: 'Experience',
      icon: <Briefcase size={14} />,
      tone: 'bg-neutral-900 text-white',
      helper: 'Role, company, timeline, responsibilities',
    },
    Skill: {
      label: 'Skills',
      icon: <Target size={14} />,
      tone: 'bg-violet-50 text-violet-700',
      helper: 'Reusable capability statements',
    },
    Tool: {
      label: 'Tools',
      icon: <Wrench size={14} />,
      tone: 'bg-blue-50 text-blue-700',
      helper: 'Platforms and systems you have operated',
    },
    Outcome: {
      label: 'Outcomes',
      icon: <Trophy size={14} />,
      tone: 'bg-green-50 text-green-700',
      helper: 'Measured business results and impact',
    },
  };

  const handleApproveAll = useCallback(async () => {
    if (reviewNeeded.length === 0) return;
    await approveClaims(reviewNeeded.map((claim) => claim.id));
  }, [reviewNeeded, approveClaims]);

  const handleMergeDuplicates = useCallback(async () => {
    if (duplicateGroups.length === 0) return;
    setMergingDuplicates(true);
    try {
      for (const group of duplicateGroups) {
        for (const sourceId of group.sourceIds) {
          await mergeClaims(group.targetId, sourceId);
        }
      }
    } finally {
      setMergingDuplicates(false);
    }
  }, [duplicateGroups, mergeClaims]);

  const handleAddManualClaim = useCallback(async () => {
    setManualError(null);
    if (manualType === 'Experience') {
      const role = manualRole.trim();
      const company = manualCompany.trim();
      if (!role || !company) return;
      const responsibilities = parseBulkClaimInput(manualExperienceNotes);
      const confidence = estimateManualConfidence({
        type: 'Experience',
        role,
        company,
        startDate: manualStartDate,
        endDate: manualEndDate,
        location: manualLocation,
        responsibilities,
      });
      setAddingManual(true);
      try {
        await addClaim({
          type: 'Experience',
          role,
          company,
          text: `${role} at ${company}`,
          startDate: manualStartDate.trim() || undefined,
          endDate: manualEndDate.trim() || undefined,
          location: manualLocation.trim() || undefined,
          responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
          source: 'Manual',
          confidence,
          verificationStatus: 'Review Needed',
        });
        setManualRole('');
        setManualCompany('');
        setManualStartDate('');
        setManualEndDate('');
        setManualLocation('');
        setManualExperienceNotes('');
      } catch (error) {
        setManualError(error instanceof Error ? error.message : 'Unable to add Experience claim.');
      } finally {
        setAddingManual(false);
      }
      return;
    }

    if (experiences.length === 0) {
      setManualError('Add at least one Experience claim before adding Skills, Tools, or Outcomes.');
      return;
    }

    if (!manualExperienceId) {
      setManualError('Select an Experience link before adding this claim.');
      return;
    }

    const text = manualText.trim();
    if (!text) return;
    const metricFromText = text.match(/(\$[\d,.]+[kKmMbB]?|\d[\d,.]*\s*%|\d+(\.\d+)?x)/i)?.[1];
    const metric = manualType === 'Outcome' ? (manualOutcomeMetric.trim() || metricFromText) : undefined;
    const isNumeric = manualType === 'Outcome' ? Boolean(metric) : undefined;
    const confidence = estimateManualConfidence({
      type: manualType,
      text,
      metric,
    });
    setAddingManual(true);
    try {
      await addClaim({
        type: manualType,
        text,
        experienceId: manualExperienceId || undefined,
        metric,
        isNumeric,
        source: 'Manual',
        confidence,
        verificationStatus: 'Review Needed',
      });
      setManualText('');
      setManualOutcomeMetric('');
    } catch (error) {
      setManualError(error instanceof Error ? error.message : `Unable to add ${manualType} claim.`);
    } finally {
      setAddingManual(false);
    }
  }, [
    manualType,
    manualRole,
    manualCompany,
    manualStartDate,
    manualEndDate,
    manualLocation,
    manualExperienceNotes,
    manualText,
    manualOutcomeMetric,
    manualExperienceId,
    experiences.length,
    addClaim,
  ]);

  const handleBulkImport = useCallback(async () => {
    if (manualType === 'Experience') return;
    setManualError(null);
    const entries = parseBulkClaimInput(manualBulkText);
    if (entries.length === 0) return;

    if (experiences.length === 0) {
      setManualError('Add at least one Experience claim before bulk importing Skills, Tools, or Outcomes.');
      return;
    }

    if (!manualExperienceId) {
      setManualError('Select an Experience link before running bulk import.');
      return;
    }

    setAddingBulk(true);
    try {
      for (const entry of entries) {
        const metricFromText = entry.match(/(\$[\d,.]+[kKmMbB]?|\d[\d,.]*\s*%|\d+(\.\d+)?x)/i)?.[1];
        const confidence = estimateManualConfidence({
          type: manualType,
          text: entry,
          metric: manualType === 'Outcome' ? metricFromText : undefined,
        });
        await addClaim({
          type: manualType,
          text: entry,
          experienceId: manualExperienceId || undefined,
          metric: manualType === 'Outcome' ? metricFromText : undefined,
          isNumeric: manualType === 'Outcome' ? Boolean(metricFromText) : undefined,
          source: 'Manual',
          confidence,
          verificationStatus: 'Review Needed',
        });
      }
      setManualBulkText('');
    } catch (error) {
      setManualError(error instanceof Error ? error.message : `Unable to bulk import ${manualType} claims.`);
    } finally {
      setAddingBulk(false);
    }
  }, [manualType, manualBulkText, manualExperienceId, experiences.length, addClaim]);

  const bulkEntries = parseBulkClaimInput(manualBulkText);

  const startEditAtomic = useCallback((claim: Claim) => {
    setEditingAtomicId(claim.id);
    setEditingAtomicText(claim.text || '');
    setEditingAtomicMetric(claim.metric || '');
  }, []);

  const cancelEditAtomic = useCallback(() => {
    setEditingAtomicId(null);
    setEditingAtomicText('');
    setEditingAtomicMetric('');
  }, []);

  const saveAtomicEdit = useCallback(async () => {
    if (!editingAtomicId) return;
    setSavingAtomic(true);
    try {
      const payload: Partial<Claim> = {
        text: editingAtomicText.trim(),
      };
      if (activeCategory === 'Outcome') {
        payload.metric = editingAtomicMetric.trim() || undefined;
        payload.isNumeric = Boolean(payload.metric);
      }
      await updateClaim(editingAtomicId, payload);
      cancelEditAtomic();
    } catch (error) {
      setManualError(error instanceof Error ? error.message : 'Unable to save claim edits.');
    } finally {
      setSavingAtomic(false);
    }
  }, [editingAtomicId, editingAtomicText, editingAtomicMetric, activeCategory, updateClaim, cancelEditAtomic]);

  const startEditExperience = useCallback((claim: {
    id: string;
    role?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }) => {
    setEditingExperienceId(claim.id);
    setExperienceDraft({
      role: claim.role || '',
      company: claim.company || '',
      startDate: claim.startDate || '',
      endDate: claim.endDate || '',
      location: claim.location || '',
    });
  }, []);

  const cancelEditExperience = useCallback(() => {
    setEditingExperienceId(null);
    setExperienceDraft({
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      location: '',
    });
  }, []);

  const saveExperienceEdit = useCallback(async () => {
    if (!editingExperienceId) return;
    if (!experienceDraft.role.trim() || !experienceDraft.company.trim()) {
      setManualError('Role and company are required for experience claims.');
      return;
    }
    setSavingExperience(true);
    try {
      await updateClaim(editingExperienceId, {
        role: experienceDraft.role.trim(),
        company: experienceDraft.company.trim(),
        text: `${experienceDraft.role.trim()} at ${experienceDraft.company.trim()}`,
        startDate: experienceDraft.startDate.trim() || undefined,
        endDate: experienceDraft.endDate.trim() || undefined,
        location: experienceDraft.location.trim() || undefined,
      });
      cancelEditExperience();
    } catch (error) {
      setManualError(error instanceof Error ? error.message : 'Unable to save experience edits.');
    } finally {
      setSavingExperience(false);
    }
  }, [editingExperienceId, experienceDraft, updateClaim, cancelEditExperience]);

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
            placeholder={"Director of Growth at Northstar Labs\nJan 2021 - Present\n- Led lifecycle strategy across paid, email, and product channels\n- Grew qualified pipeline 110% YoY through funnel optimization\n- Managed team of 8 using HubSpot, Segment, and Amplitude\n\nSenior Marketing Manager at Brightline\nMar 2018 - Dec 2020\n- Built demand engine from 0 to $4.2M qualified pipeline\n- Launched ABM program targeting enterprise accounts"}
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
                Make sure your text has role headers (e.g. "VP of Growth at Pepper")
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
              {importError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs font-semibold text-red-700">{importError}</p>
                </div>
              )}
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

      {/* Manual claim entry */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-h3 text-neutral-900 mb-3">Quick Add Claim</h3>
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-blue-700 mb-1">Canonical Ledger Flow</p>
          <p className="text-xs text-blue-700">
            1) Add Experience first, 2) link Skills/Tools/Outcomes to that Experience, 3) approve reviewed claims.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Category</label>
            <select
              value={manualType}
              onChange={(event) => {
                const nextType = event.target.value as ClaimType;
                setManualType(nextType);
                setManualText('');
                setManualBulkText('');
                setManualOutcomeMetric('');
                setManualError(null);
              }}
              className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
            >
              <option value="Experience">Experience</option>
              <option value="Skill">Skill</option>
              <option value="Tool">Tool</option>
              <option value="Outcome">Outcome</option>
            </select>
          </div>

          {manualType === 'Experience' ? (
            <>
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Role</label>
                <input
                  value={manualRole}
                  onChange={(event) => setManualRole(event.target.value)}
                  placeholder="Director of Growth"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Company</label>
                <input
                  value={manualCompany}
                  onChange={(event) => setManualCompany(event.target.value)}
                  placeholder="Current Company"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Start Date</label>
                <input
                  value={manualStartDate}
                  onChange={(event) => setManualStartDate(event.target.value)}
                  placeholder="Jan 2021"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">End Date</label>
                <input
                  value={manualEndDate}
                  onChange={(event) => setManualEndDate(event.target.value)}
                  placeholder="Present"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Location</label>
                <input
                  value={manualLocation}
                  onChange={(event) => setManualLocation(event.target.value)}
                  placeholder="Remote, Nashville, TN"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              <div className="md:col-span-4">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">
                  Core Experience Bullets (one per line)
                </label>
                <textarea
                  value={manualExperienceNotes}
                  onChange={(event) => setManualExperienceNotes(event.target.value)}
                  rows={3}
                  placeholder="Owned lifecycle strategy across B2B and PLG motions"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              <div className="md:col-span-4 flex items-end justify-end">
                <button
                  onClick={handleAddManualClaim}
                  disabled={!manualRole.trim() || !manualCompany.trim() || addingManual}
                  className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {addingManual ? 'Adding...' : 'Add Experience'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">
                  {manualType === 'Outcome' ? 'Outcome Statement' : `${manualType} Claim`}
                </label>
                <input
                  value={manualText}
                  onChange={(event) => setManualText(event.target.value)}
                  placeholder={
                    manualType === 'Skill'
                      ? 'Lifecycle Marketing'
                      : manualType === 'Tool'
                      ? 'HubSpot'
                      : 'Grew qualified pipeline by 140% YoY'
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                />
              </div>
              {manualType === 'Outcome' && (
                <div className="md:col-span-1">
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Metric (optional)</label>
                  <input
                    value={manualOutcomeMetric}
                    onChange={(event) => setManualOutcomeMetric(event.target.value)}
                    placeholder="140% YoY"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                  />
                </div>
              )}
              <div className="md:col-span-1">
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Link to Experience</label>
                <select
                  value={manualExperienceId}
                  onChange={(event) => {
                    setManualExperienceId(event.target.value);
                    setManualError(null);
                  }}
                  disabled={experiences.length === 0}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
                >
                  <option value="" disabled>
                    {experiences.length === 0 ? 'Add Experience first' : 'Select Experience'}
                  </option>
                  {experiences.map((experience) => (
                    <option key={experience.id} value={experience.id}>
                      {experience.role} @ {experience.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  onClick={handleAddManualClaim}
                  disabled={!manualText.trim() || addingManual || experiences.length === 0 || !manualExperienceId}
                  className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {addingManual ? 'Adding...' : `Add ${manualType}`}
                </button>
              </div>
            </>
          )}
        </div>

        {manualType !== 'Experience' && experiences.length === 0 && (
          <p className="mt-2 text-xs text-amber-700">
            Add an Experience entry before adding {manualType.toLowerCase()} claims.
          </p>
        )}

        {manualType !== 'Experience' && (
          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-700">Bulk Import {manualType}s</p>
              <span className="text-[11px] text-neutral-500">{bulkEntries.length} parsed</span>
            </div>
            <p className="text-[11px] text-neutral-500 mb-2">
              Paste one item per line or comma-separated. Useful for importing skills, tools, or outcomes quickly.
            </p>
            <textarea
              value={manualBulkText}
              onChange={(event) => setManualBulkText(event.target.value)}
              rows={4}
              placeholder={
                manualType === 'Skill'
                  ? 'Lifecycle Marketing\nDemand Generation\nRevenue Operations'
                  : manualType === 'Tool'
                  ? 'HubSpot\nSalesforce\nSegment'
                  : 'Grew qualified pipeline by 140% YoY\nReduced CAC by 22%'
              }
              className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-700"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleBulkImport}
                disabled={bulkEntries.length === 0 || addingBulk || experiences.length === 0 || !manualExperienceId}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {addingBulk ? 'Importing...' : `Import ${bulkEntries.length} ${manualType}${bulkEntries.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}

        {manualError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs font-semibold text-red-700">{manualError}</p>
          </div>
        )}
      </div>

      <div className="surface-card rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-h3 text-neutral-900">Ledger Overview</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Four canonical buckets only: Experience, Skills, Tools, Outcomes.
            </p>
          </div>
          <span className="metric-chip">{claims.length} total claims</span>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(bucketMeta) as ClaimType[]).map((type) => {
            const meta = bucketMeta[type];
            return (
              <button
                key={type}
                onClick={() => setActiveCategory(type)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  activeCategory === type
                    ? 'border-brand-300 bg-brand-50/40'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold ${meta.tone}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                  <span className="text-sm font-bold text-neutral-900">{claimCountsByType[type]}</span>
                </div>
                <p className="text-[11px] text-neutral-500">{meta.helper}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLedgerFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              ledgerFilter === 'all'
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Show All
          </button>
          <button
            onClick={() => setLedgerFilter('review')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              ledgerFilter === 'review'
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Review Needed ({reviewNeeded.length})
          </button>
          {reviewNeeded.length > 0 && (
            <button
              onClick={handleApproveAll}
              className="px-2.5 py-1 rounded-md text-xs font-medium border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            >
              Approve All
            </button>
          )}
          {duplicateGroups.length > 0 && (
            <button
              onClick={handleMergeDuplicates}
              disabled={mergingDuplicates}
              className="px-2.5 py-1 rounded-md text-xs font-medium border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
            >
              {mergingDuplicates ? 'Merging...' : `Merge ${duplicateClaimCount} Duplicates`}
            </button>
          )}
        </div>

        {reviewNeeded.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Review Queue: {reviewNeeded.length} claim{reviewNeeded.length !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-1">
              {reviewNeeded.slice(0, 5).map((claim) => (
                <li key={claim.id} className="text-[11px] text-amber-800">
                  {claim.type}: {claim.text} ({Math.round((claim.confidence || 0) * 100)}%)
                </li>
              ))}
            </ul>
          </div>
        )}

        {totalUnlinkedAtomicClaims > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              {totalUnlinkedAtomicClaims} claims need an Experience link
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                onClick={() => setActiveCategory('Skill')}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-amber-700 hover:bg-amber-100"
              >
                Skills: {unlinkedByType.Skill}
              </button>
              <button
                onClick={() => setActiveCategory('Tool')}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-amber-700 hover:bg-amber-100"
              >
                Tools: {unlinkedByType.Tool}
              </button>
              <button
                onClick={() => setActiveCategory('Outcome')}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-amber-700 hover:bg-amber-100"
              >
                Outcomes: {unlinkedByType.Outcome}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="surface-card rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-h3 text-neutral-900">{bucketMeta[activeCategory].label} Records</h3>
          <p className="text-[11px] text-neutral-500">{visibleCategoryClaims.length} visible</p>
        </div>

        {visibleCategoryClaims.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4">
            No {activeCategory.toLowerCase()} claims{ledgerFilter === 'review' ? ' pending review' : ''}.
          </p>
        ) : activeCategory === 'Experience' ? (
          <div className="space-y-2">
            {experiences
              .filter((experience) => (
                ledgerFilter === 'all' || experience.verificationStatus === 'Review Needed'
              ))
              .map((experience) => (
                <div key={experience.id} className="rounded-xl border border-neutral-200 bg-neutral-50/70 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{experience.role}</p>
                      <p className="text-xs text-neutral-500">
                        {experience.company}
                        {experience.startDate ? ` | ${experience.startDate}${experience.endDate ? ` - ${experience.endDate}` : ' - Present'}` : ''}
                        {experience.location ? ` | ${experience.location}` : ''}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Confidence {Math.round((experience.confidence || 0) * 100)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <VerificationSelect
                        value={experience.verificationStatus}
                        onChange={(status) => updateClaim(experience.id, { verificationStatus: status })}
                      />
                      <button
                        onClick={() =>
                          editingExperienceId === experience.id
                            ? cancelEditExperience()
                            : startEditExperience(experience)
                        }
                        className="p-1 text-neutral-400 hover:text-neutral-700"
                        aria-label="Edit experience claim"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteClaim(experience.id)}
                        className="p-1 text-neutral-400 hover:text-red-600"
                        aria-label="Delete experience claim"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {editingExperienceId === experience.id && (
                    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3 space-y-2">
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={experienceDraft.role}
                          onChange={(event) => setExperienceDraft((prev) => ({ ...prev, role: event.target.value }))}
                          placeholder="Role"
                          className="rounded border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700"
                        />
                        <input
                          value={experienceDraft.company}
                          onChange={(event) => setExperienceDraft((prev) => ({ ...prev, company: event.target.value }))}
                          placeholder="Company"
                          className="rounded border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700"
                        />
                        <input
                          value={experienceDraft.startDate}
                          onChange={(event) => setExperienceDraft((prev) => ({ ...prev, startDate: event.target.value }))}
                          placeholder="Start Date"
                          className="rounded border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700"
                        />
                        <input
                          value={experienceDraft.endDate}
                          onChange={(event) => setExperienceDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                          placeholder="End Date / Present"
                          className="rounded border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700"
                        />
                        <input
                          value={experienceDraft.location}
                          onChange={(event) => setExperienceDraft((prev) => ({ ...prev, location: event.target.value }))}
                          placeholder="Location"
                          className="rounded border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 md:col-span-2"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditExperience}
                          className="rounded border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveExperienceEdit}
                          disabled={savingExperience}
                          className="rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          {savingExperience ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div className="rounded border border-neutral-200 bg-white p-2">
                      <p className="text-[11px] font-medium text-neutral-500 mb-1 flex items-center gap-1">
                        <Zap size={11} />
                        Experience
                      </p>
                      <ul className="space-y-1">
                        {experience.responsibilities.slice(0, 3).map((responsibility, idx) => (
                          <li key={idx} className="text-xs text-neutral-600">- {responsibility}</li>
                        ))}
                        {experience.responsibilities.length === 0 && (
                          <li className="text-xs text-neutral-400 italic">No responsibilities logged</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded border border-neutral-200 bg-white p-2">
                      <p className="text-[11px] font-medium text-neutral-500 mb-1">Skills + Tools</p>
                      <div className="flex flex-wrap gap-1">
                        {[...experience.skills, ...experience.tools].map((item, idx) => (
                          <span key={idx} className="text-[11px] rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">{item}</span>
                        ))}
                        {experience.skills.length + experience.tools.length === 0 && (
                          <span className="text-xs text-neutral-400 italic">No linked skills or tools</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded border border-neutral-200 bg-white p-2">
                      <p className="text-[11px] font-medium text-neutral-500 mb-1">Outcomes</p>
                      <ul className="space-y-1">
                        {experience.outcomes.slice(0, 3).map((outcome, idx) => (
                          <li key={idx} className="text-xs text-neutral-600">
                            {outcome.metric ? <span className="font-medium text-green-700">{outcome.metric} </span> : null}
                            {outcome.description}
                          </li>
                        ))}
                        {experience.outcomes.length === 0 && (
                          <li className="text-xs text-neutral-400 italic">No linked outcomes</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500 uppercase tracking-wider">Claim</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500 uppercase tracking-wider">Linked Experience</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500 uppercase tracking-wider">Source</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500 uppercase tracking-wider">Confidence</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-right font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCategoryClaims.map((claim) => (
                  <tr key={claim.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2 text-neutral-800">
                      {editingAtomicId === claim.id ? (
                        <div className="space-y-1.5">
                          <input
                            value={editingAtomicText}
                            onChange={(event) => setEditingAtomicText(event.target.value)}
                            className="w-full rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
                          />
                          {activeCategory === 'Outcome' && (
                            <input
                              value={editingAtomicMetric}
                              onChange={(event) => setEditingAtomicMetric(event.target.value)}
                              placeholder="Metric (optional)"
                              className="w-full rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
                            />
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{claim.text}</p>
                          {claim.metric ? <p className="text-[11px] text-green-700 mt-0.5">Metric: {claim.metric}</p> : null}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">
                      <select
                        value={claim.experienceId || ''}
                        onChange={(event) =>
                          updateClaim(claim.id, {
                            experienceId: event.target.value || undefined,
                          })
                        }
                        className="w-full min-w-[180px] rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700"
                      >
                        <option value="">Unlinked</option>
                        {experiences.map((experience) => (
                          <option key={experience.id} value={experience.id}>
                            {experienceLabelById.get(experience.id)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{claim.source || 'Manual'}</td>
                    <td className="px-3 py-2 text-neutral-600">{Math.round((claim.confidence || 0) * 100)}%</td>
                    <td className="px-3 py-2">
                      <VerificationSelect
                        value={claim.verificationStatus}
                        onChange={(status) => updateClaim(claim.id, { verificationStatus: status })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        {editingAtomicId === claim.id ? (
                          <>
                            <button
                              onClick={saveAtomicEdit}
                              disabled={savingAtomic || !editingAtomicText.trim()}
                              className="inline-flex items-center gap-1 rounded border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                            >
                              {savingAtomic ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditAtomic}
                              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditAtomic(claim)}
                              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-50"
                              aria-label="Edit claim"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteClaim(claim.id)}
                              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-50 hover:text-red-600"
                              aria-label="Delete claim"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

          {/* Experience bullets */}
          {claim.responsibilities.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Experience ({claim.responsibilities.length})
              </p>
              <ul className="space-y-1">
                {claim.responsibilities.map((responsibility, i) => (
                  <li key={i} className="flex items-start gap-1.5 group">
                    <span className="text-xs text-neutral-600 flex-1">- {responsibility}</span>
                    <button
                      onClick={() => {
                        onUpdate({
                          responsibilities: claim.responsibilities.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 shrink-0"
                      aria-label="Remove experience bullet"
                    >
                      <Minus size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {claim.skills.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Skills ({claim.skills.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {claim.skills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700 group">
                    {skill}
                    <button
                      onClick={() => {
                        onUpdate({
                          skills: claim.skills.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-violet-400 hover:text-red-500"
                      aria-label="Remove skill"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
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

function VerificationSelect({
  value,
  onChange,
}: {
  value: ClaimVerificationStatus;
  onChange: (status: ClaimVerificationStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ClaimVerificationStatus)}
      className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
    >
      <option value="Review Needed">Review Needed</option>
      <option value="Approved">Approved</option>
      <option value="Rejected">Rejected</option>
    </select>
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
