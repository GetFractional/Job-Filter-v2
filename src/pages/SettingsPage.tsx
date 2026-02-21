import { useEffect, useState } from 'react';
import { Save, Trash2, Download, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db, generateId, seedDefaultProfile } from '../db';
import { clearJobFilterLocalState } from '../lib/profileState';
import { DigitalResumeBuilder } from '../components/resume/DigitalResumeBuilder';
import { hasUsableImportDraft } from '../lib/importDraftBuilder';
import type { Claim, ImportDraftRole, ImportSession, Profile } from '../types';

export function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const importSession = useStore((s) => s.importSession);
  const setImportSession = useStore((s) => s.setImportSession);
  const hydrateImportSession = useStore((s) => s.hydrateImportSession);
  const refreshData = useStore((s) => s.refreshData);

  const [activeSection, setActiveSection] = useState<'profile' | 'resume' | 'data'>('profile');

  useEffect(() => {
    hydrateImportSession();
  }, [hydrateImportSession]);

  return (
    <div className="space-y-5">
      <h1 className="text-h1 text-neutral-900">Settings</h1>

      <div className="flex gap-2">
        {(['profile', 'resume', 'data'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 text-sm rounded-lg font-medium capitalize ${
              activeSection === section
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {section === 'resume' ? 'Digital Resume' : section}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && profile && <ProfileSection profile={profile} updateProfile={updateProfile} />}
      {activeSection === 'resume' && (
        <DigitalResumeSection
          profile={profile}
          updateProfile={updateProfile}
          importSession={importSession}
          setImportSession={setImportSession}
          refreshData={refreshData}
        />
      )}
      {activeSection === 'data' && <DataSection refreshData={refreshData} />}
    </div>
  );
}

function ProfileSection({
  profile,
  updateProfile,
}: {
  profile: Profile;
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
            onChange={(e) => setForm({ ...form, compFloor: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">Comp Target ($)</label>
          <input
            type="number"
            value={form.compTarget}
            onChange={(e) => setForm({ ...form, compTarget: parseInt(e.target.value, 10) || 0 })}
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

function roleToEvidenceRecord(role: ImportDraftRole, companyName: string): Claim | null {
  const acceptedHighlights = role.highlights
    .filter((item) => item.status === 'accepted')
    .map((item) => item.text.trim())
    .filter(Boolean);
  const acceptedOutcomes = role.outcomes
    .filter((item) => item.status === 'accepted')
    .map((item) => item.text.trim())
    .filter(Boolean);
  const acceptedTools = role.tools
    .filter((item) => item.status === 'accepted')
    .map((item) => item.text.trim())
    .filter(Boolean);

  if (acceptedHighlights.length === 0 && acceptedOutcomes.length === 0 && acceptedTools.length === 0) {
    return null;
  }

  return {
    id: generateId(),
    company: companyName,
    role: role.title,
    startDate: role.startDate,
    endDate: role.endDate,
    responsibilities: acceptedHighlights,
    tools: acceptedTools,
    outcomes: acceptedOutcomes.map((description) => ({
      description,
      metric: undefined,
      isNumeric: /\d/.test(description),
      verified: false,
    })),
    createdAt: new Date().toISOString(),
  };
}

function DigitalResumeSection({
  profile,
  updateProfile,
  importSession,
  setImportSession,
  refreshData,
}: {
  profile: Profile | null;
  updateProfile: (updates: Record<string, unknown>) => Promise<void>;
  importSession: ImportSession | null;
  setImportSession: (session: ImportSession | null) => void;
  refreshData: () => Promise<void>;
}) {
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [localDraft, setLocalDraft] = useState(profile?.digitalResume ?? null);

  useEffect(() => {
    if (!importSession && profile?.digitalResume) {
      setLocalDraft(profile.digitalResume);
    }
    if (!importSession && !profile?.digitalResume) {
      setLocalDraft(null);
    }
  }, [importSession, profile?.digitalResume]);

  const currentDraft = importSession?.draft ?? localDraft ?? profile?.digitalResume ?? null;

  const handleSave = async () => {
    const draftToSave = currentDraft;
    if (!draftToSave) return;

    setSaving(true);
    try {
      const records: Claim[] = [];
      for (const company of draftToSave.companies) {
        for (const role of company.roles) {
          const record = roleToEvidenceRecord(role, company.name);
          if (record) {
            records.push(record);
          }
        }
      }

      await db.claims.clear();
      if (records.length > 0) {
        await db.claims.bulkAdd(records);
      }
      await refreshData();
      await updateProfile({ digitalResume: draftToSave });

      if (importSession) {
        setImportSession({
          ...importSession,
          draft: draftToSave,
          state: 'saved',
          updatedAt: new Date().toISOString(),
        });
      }
      setSaveNotice(`Saved ${records.length} evidence record${records.length === 1 ? '' : 's'}.`);
    } finally {
      setSaving(false);
    }
  };

  if (!currentDraft) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm space-y-2">
        <h3 className="text-h3 text-neutral-900">Digital Resume</h3>
        <p className="text-xs text-neutral-500">
          Complete onboarding import first, then edit the same company-first resume here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-h3 text-neutral-900">Digital Resume</h3>
            <p className="text-xs text-neutral-500">Update companies, roles, highlights, outcomes, tools, and skills.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {importSession && (
              <button
                type="button"
                onClick={() => {
                  setImportSession(null);
                  setSaveNotice(null);
                }}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                Reset import session
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save updates'}
            </button>
          </div>
        </div>

        {saveNotice && (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
            {saveNotice}
          </p>
        )}

        {!hasUsableImportDraft(currentDraft) && (
          <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5" />
            <span>Resume structure is empty. Re-run import in onboarding to populate your digital resume.</span>
          </div>
        )}

        <DigitalResumeBuilder
          draft={currentDraft}
          showAllStatuses={showAllStatuses}
          onShowAllStatusesChange={setShowAllStatuses}
          onDraftChange={(nextDraft) => {
            setSaveNotice(null);
            if (importSession) {
              setImportSession({
                ...importSession,
                draft: nextDraft,
                state: 'parsed',
                updatedAt: new Date().toISOString(),
              });
              return;
            }
            setLocalDraft(nextDraft);
          }}
        />
      </div>
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
        <p className="text-xs text-neutral-500 mb-3">Permanently delete all local jobs, contacts, experience records, profile data, and onboarding state. This cannot be undone.</p>
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
