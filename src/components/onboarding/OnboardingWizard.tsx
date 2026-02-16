import { useState, useCallback, type ChangeEvent } from 'react';
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
  Settings2,
  Upload,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  extractClaimsImportText,
  getClaimsImportAcceptValue,
  parseClaimsImportText,
  validateClaimsImportFile,
} from '../../lib/claimsImportPipeline';
import { ClaimsReviewEditor } from '../claims/ClaimsReviewEditor';
import {
  createClaimReviewItems,
  regroupClaimReviewItems,
  reviewItemToClaimInput,
  type ClaimReviewItem,
} from '../../lib/claimsReview';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'profile' | 'claims' | 'preferences' | 'ready';

const STEPS: { id: Step; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'profile', label: 'Profile' },
  { id: 'claims', label: 'Resume' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'ready', label: 'Ready' },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const addClaim = useStore((s) => s.addClaim);

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);

  // Profile form state (slimmed down: Name + Target Roles only)
  const [name, setName] = useState(profile?.name || '');
  const [targetRoles, setTargetRoles] = useState(profile?.targetRoles?.join(', ') || '');

  // Preferences form state (moved from profile)
  const [compFloor, setCompFloor] = useState(profile?.compFloor ? profile.compFloor.toString() : '');
  const [compTarget, setCompTarget] = useState(profile?.compTarget ? profile.compTarget.toString() : '');
  const [locationPref, setLocationPref] = useState(profile?.locationPreference || '');
  const [disqualifiers, setDisqualifiers] = useState(profile?.disqualifiers?.join('\n') || '');

  // Resume paste state
  const [resumeText, setResumeText] = useState('');
  // Review items for explicit pre-commit review (null = not yet parsed)
  const [reviewItems, setReviewItems] = useState<ClaimReviewItem[] | null>(null);
  const [claimsImported, setClaimsImported] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileImportError, setFileImportError] = useState<string | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        targetRoles: targetRoles.split(',').map((r) => r.trim()).filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }, [name, targetRoles, updateProfile]);

  const handleSavePreferences = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        compFloor: parseInt(compFloor) || 0,
        compTarget: parseInt(compTarget) || 0,
        locationPreference: locationPref.trim(),
        disqualifiers: disqualifiers.split('\n').map((d) => d.trim()).filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }, [compFloor, compTarget, locationPref, disqualifiers, updateProfile]);

  const handleParseResume = useCallback(() => {
    if (!resumeText.trim()) return;
    const parsed = parseClaimsImportText(resumeText);
    const items = createClaimReviewItems(parsed);
    setReviewItems(items);
  }, [resumeText]);

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateClaimsImportFile(file);
    if (validationError) {
      setFileImportError(validationError);
      setSelectedFileName(null);
      return;
    }

    setReadingFile(true);
    setFileImportError(null);
    setSelectedFileName(file.name);

    try {
      const extractedText = await extractClaimsImportText(file);
      setResumeText(extractedText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read the selected file.';
      setFileImportError(message);
      setSelectedFileName(null);
    } finally {
      setReadingFile(false);
    }
  }, []);

  const handleDiscardReview = useCallback(() => {
    setReviewItems(null);
  }, []);

  const handleImportSelectedClaims = useCallback(async () => {
    if (!reviewItems) return;
    setSaving(true);
    try {
      let imported = 0;
      for (const item of reviewItems) {
        if (!item.included) continue;
        const data = reviewItemToClaimInput(item);
        await addClaim(data);
        imported++;
      }
      setClaimsImported(imported);
      setSelectedFileName(null);
      setFileImportError(null);
      setReviewItems(null);
    } finally {
      setSaving(false);
    }
  }, [reviewItems, addClaim]);

  const selectedClaimCount = reviewItems?.filter((item) => item.included).length ?? 0;
  const totalClaimCount = reviewItems?.length ?? 0;

  const handleNext = async () => {
    if (step === 'profile') {
      await handleSaveProfile();
    }
    if (step === 'claims') {
      // If user pasted text but hasn't parsed yet, parse first
      if (resumeText.trim() && !reviewItems) {
        handleParseResume();
        return; // Stay on claims step to show review UI
      }
      // If parsed but not yet imported, import selected
      if (reviewItems && claimsImported === 0) {
        await handleImportSelectedClaims();
      }
    }
    if (step === 'preferences') {
      await handleSavePreferences();
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
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    } else {
      onComplete();
    }
  };

  // Check whether required preferences are filled
  const missingRequiredPrefs = !compFloor.trim() || !locationPref.trim();
  const isClaimsReviewMode = step === 'claims' && reviewItems !== null && claimsImported === 0;

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
                    className={`w-12 sm:w-20 h-0.5 mx-1 ${
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
          {/* ============================================ */}
          {/* WELCOME STEP                                 */}
          {/* ============================================ */}
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

          {/* ============================================ */}
          {/* PROFILE STEP (Name + Target Roles only)      */}
          {/* ============================================ */}
          {step === 'profile' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Your Profile</h2>
                  <p className="text-xs text-neutral-500">Tell us who you are and what roles you're targeting.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                    Your Name
                    <span className="text-[11px] text-red-500 font-semibold">Required</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                    <Briefcase size={14} className="text-neutral-400" />
                    Target Roles
                    <span className="text-[11px] text-red-500 font-semibold">Required</span>
                    <span className="text-[11px] text-neutral-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={targetRoles}
                    onChange={(e) => setTargetRoles(e.target.value)}
                    placeholder="Growth Marketing Lead, Product Marketing Manager"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* CLAIMS STEP (with review/merge UI)           */}
          {/* ============================================ */}
          {step === 'claims' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Import Your Resume</h2>
                  <p className="text-xs text-neutral-500">Upload PDF/DOCX/TXT or paste text. Both paths feed the same claim parser.</p>
                </div>
              </div>

              {claimsImported > 0 ? (
                /* ---- Import complete ---- */
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
              ) : reviewItems ? (
                /* ---- Review / Merge UI ---- */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-neutral-800">Review Parsed Claims</h3>
                    <span className="text-[11px] font-medium text-neutral-500">
                      {selectedClaimCount} of {totalClaimCount} claims selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    <ClaimsReviewEditor
                      items={reviewItems}
                      onChange={(items) => setReviewItems(regroupClaimReviewItems(items))}
                      onApprove={handleImportSelectedClaims}
                      onDiscard={handleDiscardReview}
                      approving={saving}
                      approveLabel="Approve & Save"
                    />
                  </div>

                  {reviewItems.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-neutral-500">No claims could be parsed. Try a different format or skip this step.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* ---- Paste textarea ---- */
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                      <Upload size={13} />
                      {readingFile ? 'Reading file...' : 'Upload PDF, DOCX, or TXT'}
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
                  {fileImportError && (
                    <p className="text-xs text-red-600 mb-3">{fileImportError}</p>
                  )}
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here...

Example:
Head of Marketing at Example Co, Jan 2021 - Present
- Led lifecycle strategy across 4 channels
- Increased pipeline by 40%
- Managed a cross-functional growth team"
                    rows={12}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                  />
                  <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      The parser auto-detects roles, dates, tools, and metrics.
                      You can skip this and import later from Settings.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* PREFERENCES STEP                             */}
          {/* ============================================ */}
          {step === 'preferences' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Settings2 size={20} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Scoring Preferences</h2>
                  <p className="text-xs text-neutral-500">Set your compensation and location preferences for job scoring.</p>
                </div>
              </div>

              {/* Warning banner */}
              {missingRequiredPrefs && (
                <div className="flex items-start gap-2 mb-5 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Missing required preferences will reduce scoring quality.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                      <DollarSign size={14} className="text-neutral-400" />
                      Comp Floor
                      <span className="text-[11px] text-red-500 font-semibold">Required</span>
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
                    <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                      <DollarSign size={14} className="text-neutral-400" />
                      Comp Target
                      <span className="text-[11px] text-neutral-400 font-normal">Optional</span>
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
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                    <MapPin size={14} className="text-neutral-400" />
                    Location Preference
                    <span className="text-[11px] text-red-500 font-semibold">Required</span>
                  </label>
                  <input
                    type="text"
                    value={locationPref}
                    onChange={(e) => setLocationPref(e.target.value)}
                    placeholder="Remote preferred; hybrid/in-person OK around Nashville"
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1.5 block flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-neutral-400" />
                    Disqualifiers
                    <span className="text-[11px] text-neutral-400 font-normal">Optional, one per line</span>
                  </label>
                  <textarea
                    value={disqualifiers}
                    onChange={(e) => setDisqualifiers(e.target.value)}
                    placeholder="Requires security clearance
Must relocate to SF Bay Area
Contract-to-hire only"
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* READY STEP                                   */}
          {/* ============================================ */}
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
            {step !== 'welcome' && step !== 'ready' && !isClaimsReviewMode && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Skip
              </button>
            )}
            {!isClaimsReviewMode && (
              <button
                onClick={step === 'ready' ? onComplete : handleNext}
                disabled={saving || readingFile}
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
                ) : step === 'claims' && resumeText.trim() && !reviewItems ? (
                  <>
                    Parse & Review
                    <ChevronRight size={14} />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
