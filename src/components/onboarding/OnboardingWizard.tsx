import { useState, useCallback } from 'react';
import {
  Rocket,
  ChevronRight,
  ChevronLeft,
  User,
  FileText,
  Target,
  Check,
  Briefcase,
  DollarSign,
  MapPin,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { parseResumeStructured, parsedClaimToImport } from '../../lib/claimParser';
import type { ParsedClaim } from '../../lib/claimParser';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'profile' | 'claims' | 'provider' | 'ready';

const STEPS: { id: Step; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'profile', label: 'Profile' },
  { id: 'claims', label: 'Claims' },
  { id: 'provider', label: 'Provider' },
  { id: 'ready', label: 'Ready' },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const addClaim = useStore((s) => s.addClaim);

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [name, setName] = useState(profile?.name || '');
  const [targetRoles, setTargetRoles] = useState(profile?.targetRoles?.join(', ') || '');
  const [compFloor, setCompFloor] = useState(profile?.compFloor?.toString() || '150000');
  const [compTarget, setCompTarget] = useState(profile?.compTarget?.toString() || '180000');
  const [locationPref, setLocationPref] = useState(profile?.locationPreference || '');

  // Resume paste state
  const [resumeText, setResumeText] = useState('');
  const [parsedClaims, setParsedClaims] = useState<ParsedClaim[]>([]);
  const [claimsImported, setClaimsImported] = useState(0);
  const [providerName, setProviderName] = useState('OpenAI');
  const [providerApiKey, setProviderApiKey] = useState('');
  const [providerConfigured, setProviderConfigured] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const parsedCompFloor = parseInt(compFloor) || 0;
  const parsedCompTarget = parseInt(compTarget) || 0;
  const hasTargetRoles = targetRoles.split(',').map((role) => role.trim()).filter(Boolean).length > 0;
  const missingRequiredProfile: string[] = [];
  if (!name.trim()) missingRequiredProfile.push('Name');
  if (!hasTargetRoles) missingRequiredProfile.push('Target roles');
  if (!parsedCompFloor) missingRequiredProfile.push('Comp floor');
  if (!parsedCompTarget) missingRequiredProfile.push('Comp target');
  const reducedQualityMode = missingRequiredProfile.length > 0;

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        targetRoles: targetRoles.split(',').map((r) => r.trim()).filter(Boolean),
        compFloor: parseInt(compFloor) || 0,
        compTarget: parseInt(compTarget) || 0,
        locationPreference: locationPref.trim(),
      });
    } finally {
      setSaving(false);
    }
  }, [name, targetRoles, compFloor, compTarget, locationPref, updateProfile]);

  const handleImportResume = useCallback(async () => {
    const stagedClaims =
      parsedClaims.length > 0
        ? parsedClaims.filter((claim) => claim.included)
        : parseResumeStructured(resumeText).filter((claim) => claim.included);
    if (stagedClaims.length === 0) return;
    setSaving(true);
    try {
      let imported = 0;
      for (const claim of stagedClaims) {
        if (claim.role || claim.company) {
          const importedData = parsedClaimToImport(claim);
          const experience = await addClaim(importedData.experience);

          for (const skill of importedData.skillClaims) {
            await addClaim({ ...skill, experienceId: experience.id });
          }
          for (const tool of importedData.toolClaims) {
            await addClaim({ ...tool, experienceId: experience.id });
          }
          for (const outcome of importedData.outcomeClaims) {
            await addClaim({ ...outcome, experienceId: experience.id });
          }

          imported++;
        }
      }
      setClaimsImported(imported);
      setParsedClaims([]);
      setResumeText('');
    } finally {
      setSaving(false);
    }
  }, [resumeText, parsedClaims, addClaim]);

  const handleParseResume = useCallback(() => {
    if (!resumeText.trim()) return;
    const parsed = parseResumeStructured(resumeText);
    setParsedClaims(parsed);
  }, [resumeText]);

  const toggleParsedClaim = useCallback((key: string) => {
    setParsedClaims((current) =>
      current.map((claim) =>
        claim._key === key
          ? { ...claim, included: !claim.included }
          : claim
      )
    );
  }, []);

  const handleProviderSetup = useCallback(() => {
    const hasKey = providerApiKey.trim().length >= 20;
    const configured = hasKey;
    localStorage.setItem('jf2-provider-configured', configured ? 'true' : 'false');
    localStorage.setItem('jf2-provider-name', providerName);
    setProviderConfigured(configured);
  }, [providerApiKey, providerName]);

  const handleNext = async () => {
    if (step === 'profile') {
      await handleSaveProfile();
    }
    if (step === 'claims' && resumeText.trim() && claimsImported === 0) {
      if (parsedClaims.length === 0) {
        handleParseResume();
        return;
      }
      await handleImportResume();
    }
    if (step === 'provider') {
      handleProviderSetup();
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex].id);
    }
  };

  const handleSkip = () => {
    if (step === 'provider') {
      localStorage.setItem('jf2-provider-configured', 'false');
      localStorage.setItem('jf2-provider-name', 'Template Mode');
      setProviderConfigured(false);
    }
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    } else {
      onComplete();
    }
  };

  const selectedParsedClaims = parsedClaims.filter((claim) => claim.included);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < stepIndex
                      ? 'bg-green-500 text-white'
                      : i === stepIndex
                      ? 'bg-brand-600 text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {i < stepIndex ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-1 ${
                      i < stepIndex ? 'bg-green-500' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={`text-[11px] font-medium ${
                  s.id === step ? 'text-brand-600' : 'text-neutral-400'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Rocket size={36} className="text-brand-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-3">Welcome to Job Filter</h1>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-8 leading-relaxed">
                Your personal job revenue cockpit. Capture opportunities, score them against your preferences,
                research companies, and generate outreach assets — all offline-first.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Target size={18} className="text-green-600" />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-600">Score & Qualify</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Sparkles size={18} className="text-violet-600" />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-600">Research & Assets</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Briefcase size={18} className="text-blue-600" />
                  </div>
                  <p className="text-[11px] font-medium text-neutral-600">Track Pipeline</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                This quick setup takes about 2 minutes.
              </p>
            </div>
          )}

          {step === 'profile' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Your Profile</h2>
                  <p className="text-xs text-neutral-500">Set your preferences so we can score jobs against them.</p>
                </div>
              </div>

              {reducedQualityMode && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Reduced Quality Mode</p>
                  <p className="text-xs text-amber-700">
                    Missing required inputs: {missingRequiredProfile.join(', ')}. You can continue, but scoring and generated drafts will be lower quality.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                    Your Name <span className="text-red-500">*</span>
                    <span title="Used in personalized assets and communication drafts.">
                      <HelpCircle size={12} className="text-neutral-400" />
                    </span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Matt"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-neutral-400" />
                    Target Roles <span className="text-red-500">*</span>
                    <span className="text-[11px] text-neutral-400 font-normal">(comma-separated)</span>
                    <span title="Used for fit scoring and role-match recommendations.">
                      <HelpCircle size={12} className="text-neutral-400" />
                    </span>
                  </label>
                  <input
                    type="text"
                    value={targetRoles}
                    onChange={(e) => setTargetRoles(e.target.value)}
                    placeholder="VP of Growth, Director of Marketing, Head of Growth"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-neutral-400" />
                      Comp Floor <span className="text-red-500">*</span>
                      <span title="Jobs below this threshold are auto-flagged.">
                        <HelpCircle size={12} className="text-neutral-400" />
                      </span>
                    </label>
                    <input
                      type="number"
                      value={compFloor}
                      onChange={(e) => setCompFloor(e.target.value)}
                      placeholder="150000"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-neutral-400" />
                      Comp Target <span className="text-red-500">*</span>
                      <span title="Preferred upside range used in scoring breakdown.">
                        <HelpCircle size={12} className="text-neutral-400" />
                      </span>
                    </label>
                    <input
                      type="number"
                      value={compTarget}
                      onChange={(e) => setCompTarget(e.target.value)}
                      placeholder="180000"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={14} className="text-neutral-400" />
                    Location Preference
                    <span className="text-[11px] text-neutral-400 font-normal">(optional)</span>
                    <span title="Optional, used for role filtering only.">
                      <HelpCircle size={12} className="text-neutral-400" />
                    </span>
                  </label>
                  <input
                    type="text"
                    value={locationPref}
                    onChange={(e) => setLocationPref(e.target.value)}
                    placeholder="Remote preferred; hybrid/in-person OK around Nashville"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'claims' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Claims Import and Review</h2>
                  <p className="text-xs text-neutral-500">Parse your resume, review claims, then import into Skills, Tools, Experience, and Outcomes.</p>
                </div>
              </div>

              {claimsImported > 0 ? (
                <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-green-800 mb-1">
                    {claimsImported} claim{claimsImported !== 1 ? 's' : ''} imported
                  </h3>
                  <p className="text-xs text-green-600">
                    You can review and edit them later in Settings &rarr; Claim Ledger.
                  </p>
                </div>
              ) : (
                <>
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      setParsedClaims([]);
                      setClaimsImported(0);
                    }}
                    placeholder="Paste your resume text here...

Example:
VP of Growth at Pepper, Jan 2021 - Present
• Led GTM strategy for 3 product lines generating $12M ARR
• Built and managed team of 8 across growth, content, and demand gen
• Implemented Salesforce + HubSpot integration reducing lead response time by 40%"
                    rows={12}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleParseResume}
                      disabled={!resumeText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Parse Resume
                    </button>
                    {parsedClaims.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        {selectedParsedClaims.length}/{parsedClaims.length} selected for import
                      </span>
                    )}
                  </div>
                  {parsedClaims.length > 0 && (
                    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Parser Review
                        </p>
                        <button
                          onClick={handleImportResume}
                          disabled={selectedParsedClaims.length === 0 || saving}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          {saving ? 'Importing...' : `Import ${selectedParsedClaims.length} Claim${selectedParsedClaims.length === 1 ? '' : 's'}`}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {parsedClaims.map((claim) => (
                          <label
                            key={claim._key}
                            className={`flex items-start gap-2 rounded-md border px-2.5 py-2 cursor-pointer ${
                              claim.included ? 'border-brand-200 bg-brand-50/40' : 'border-neutral-200 bg-neutral-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={claim.included}
                              onChange={() => toggleParsedClaim(claim._key)}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 truncate">
                                {claim.role || 'Unknown Role'} {claim.company ? `@ ${claim.company}` : ''}
                              </p>
                              <p className="text-[11px] text-neutral-500">
                                {claim.startDate || 'Date missing'} {claim.endDate ? `- ${claim.endDate}` : claim.startDate ? '- Present' : ''}
                                {` | confidence ${Math.round(claim.confidence * 100)}%`}
                              </p>
                              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                                {claim.evidenceSnippet || claim.responsibilities[0] || 'No evidence snippet'}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      The parser auto-detects roles, dates, tools, and metrics.
                      Review before import to avoid fragmented claims. You can skip this and import later from Settings.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'provider' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <KeyRound size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Provider Setup (Optional)</h2>
                  <p className="text-xs text-neutral-500">Connect your provider key or stay in deterministic Template Mode.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                    Provider <span className="text-neutral-400 text-xs font-normal">(optional)</span>
                  </label>
                  <select
                    value={providerName}
                    onChange={(event) => setProviderName(event.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                    API Key <span className="text-neutral-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={providerApiKey}
                    onChange={(event) => setProviderApiKey(event.target.value)}
                    placeholder="Paste key if you want future AI provider support"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Keys are not sent anywhere in this setup step. We only store whether a provider was configured.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Template Mode remains active in this build</p>
                  <p className="text-xs text-amber-700">
                    Generation stays deterministic even if a key is provided, this prevents misleading AI claims until live provider integration is enabled.
                  </p>
                </div>
                {providerConfigured && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 flex items-start gap-2">
                    <ShieldCheck size={14} className="text-green-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700">
                      Provider preference saved for {providerName}. Template Mode is still active.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check size={36} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-3">You're All Set</h1>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-8 leading-relaxed">
                Your profile and claim ledger are ready. Start by capturing your first job opportunity
                — paste a job listing and we'll score it instantly.
              </p>
              <div className="bg-white rounded-lg border border-neutral-200 p-4 text-left max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">Quick Start</h4>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                    Click <span className="font-medium text-neutral-800">+ Add Job</span> in the sidebar
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                    Paste the job description for auto-scoring
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                    Run research, generate assets, track outreach
                  </li>
                </ol>
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-sm mx-auto text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">Template Mode Active</p>
                <p className="text-xs text-amber-700">
                  {providerConfigured
                    ? `Provider preference saved for ${providerName}. Drafts are still deterministic templates in this build.`
                    : 'No provider key configured. Drafts run in deterministic template mode.'}
                </p>
              </div>
              {reducedQualityMode && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-sm mx-auto text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Reduced Quality Mode</p>
                  <p className="text-xs text-amber-700">
                    You skipped required profile fields ({missingRequiredProfile.join(', ')}). You can update them later in Settings to improve scoring precision.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with nav buttons */}
      <div className="bg-white border-t border-neutral-200 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step !== 'welcome' && step !== 'ready' && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Skip
              </button>
            )}
            <button
              onClick={step === 'ready' ? onComplete : handleNext}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : step === 'ready' ? (
                <>
                  Let's Go
                  <Rocket size={14} />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
