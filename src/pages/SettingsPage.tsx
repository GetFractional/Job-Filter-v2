import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Save, Trash2, Download, FileText } from 'lucide-react';
import { db } from '../db';
import type { Claim, ClaimOutcome } from '../types';

export function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const claims = useStore((s) => s.claims);
  const updateProfile = useStore((s) => s.updateProfile);
  const addClaim = useStore((s) => s.addClaim);
  const refreshData = useStore((s) => s.refreshData);

  const [activeSection, setActiveSection] = useState<'profile' | 'claims' | 'data'>('profile');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">Settings</h2>

      {/* Section tabs */}
      <div className="flex gap-2">
        {(['profile', 'claims', 'data'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize ${
              activeSection === section
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600'
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
    <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">Comp Floor ($)</label>
          <input
            type="number"
            value={form.compFloor}
            onChange={(e) => setForm({ ...form, compFloor: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">Comp Target ($)</label>
          <input
            type="number"
            value={form.compTarget}
            onChange={(e) => setForm({ ...form, compTarget: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Location Preference</label>
        <input
          value={form.locationPreference}
          onChange={(e) => setForm({ ...form, locationPreference: e.target.value })}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Target Roles (one per line)</label>
        <textarea
          value={form.targetRoles}
          onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
          rows={4}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm resize-y"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Required Benefits (one per line)</label>
        <textarea
          value={form.requiredBenefits}
          onChange={(e) => setForm({ ...form, requiredBenefits: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm resize-y"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Preferred Benefits (one per line)</label>
        <textarea
          value={form.preferredBenefits}
          onChange={(e) => setForm({ ...form, preferredBenefits: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm resize-y"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600 mb-1 block">Disqualifiers (one per line)</label>
        <textarea
          value={form.disqualifiers}
          onChange={(e) => setForm({ ...form, disqualifiers: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm resize-y"
        />
      </div>
      <button
        onClick={handleSave}
        className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
      >
        <Save size={14} /> {saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  );
}

function ClaimsSection({ claims, addClaim }: {
  claims: Claim[];
  addClaim: (claim: Partial<Claim>) => Promise<Claim>;
}) {
  const [resumeText, setResumeText] = useState('');
  const [parsing, setParsing] = useState(false);

  const parseResume = async () => {
    if (!resumeText.trim()) return;
    setParsing(true);
    try {
      const parsedClaims = parseResumeText(resumeText);
      for (const claim of parsedClaims) {
        await addClaim(claim);
      }
      setResumeText('');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <FileText size={14} /> Import from Resume / LinkedIn
        </h3>
        <p className="text-xs text-neutral-500 mb-2">
          Paste your resume or LinkedIn experience text. Claims will be extracted and stored in the ledger.
        </p>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste resume or LinkedIn experience text here..."
          rows={8}
          className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm resize-y mb-2"
        />
        <button
          onClick={parseResume}
          disabled={!resumeText.trim() || parsing}
          className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {parsing ? 'Parsing...' : 'Parse & Import Claims'}
        </button>
      </div>

      {/* Claims list */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Claims ({claims.length})</h3>
        {claims.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-4">No claims in ledger. Import from resume above.</p>
        )}
        {claims.map((claim) => (
          <div key={claim.id} className="bg-white rounded-xl border border-neutral-200 p-3 mb-2">
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
              </ul>
            )}
            {claim.outcomes.length > 0 && (
              <div className="mt-1">
                {claim.outcomes.map((o, i) => (
                  <span key={i} className={`text-[10px] mr-1 px-1.5 py-0.5 rounded ${o.verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {o.description}
                  </span>
                ))}
              </div>
            )}
            {claim.tools.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {claim.tools.map((tool, i) => (
                  <span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">{tool}</span>
                ))}
              </div>
            )}
          </div>
        ))}
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
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Export Data</h3>
        <p className="text-xs text-neutral-500 mb-3">Download all your data as a JSON file.</p>
        <button
          onClick={handleExport}
          className="w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Download size={14} /> Export All Data
        </button>
      </div>

      <div className="bg-white rounded-xl border border-red-200 p-4">
        <h3 className="text-sm font-semibold text-red-700 mb-2">Clear All Data</h3>
        <p className="text-xs text-neutral-500 mb-3">Permanently delete all jobs, contacts, activities, and assets. This cannot be undone.</p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Clear Data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-medium">Are you sure? This is permanent.</p>
            <div className="flex gap-2">
              <button onClick={handleClear} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium">
                Yes, Delete Everything
              </button>
              <button onClick={() => setConfirmClear(false)} className="flex-1 bg-neutral-100 text-neutral-700 py-2 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Resume Parser (simple, local, no AI cost)
// ============================================================

function parseResumeText(text: string): Partial<Claim>[] {
  const claims: Partial<Claim>[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentClaim: Partial<Claim> | null = null;

  // Common patterns for role/company headers
  const rolePattern = /^(?:(.+?)\s+(?:at|@|-|,)\s+(.+?))\s*(?:\||,|\(|$)/i;
  const datePattern = /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)/i;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    const roleMatch = line.match(rolePattern);

    if (roleMatch || (dateMatch && currentClaim === null)) {
      // Save previous claim
      if (currentClaim && (currentClaim.role || currentClaim.company)) {
        claims.push(currentClaim);
      }

      currentClaim = {
        role: roleMatch?.[1]?.trim() || '',
        company: roleMatch?.[2]?.trim() || '',
        startDate: '',
        endDate: undefined,
        responsibilities: [],
        tools: [],
        outcomes: [],
      };
    }

    if (dateMatch && currentClaim) {
      currentClaim.startDate = dateMatch[1];
      const end = dateMatch[2];
      currentClaim.endDate = (end === 'Present' || end === 'Current') ? undefined : end;
    }

    // Bullet points or lines starting with - are responsibilities
    if (currentClaim && (line.startsWith('-') || line.startsWith('*') || line.startsWith('\u2022'))) {
      const text = line.replace(/^[-*\u2022]\s*/, '').trim();
      if (text) {
        // Check if it has a numeric metric
        const hasMetric = /\d+[%xX$]|\$\d|increased|grew|reduced|improved|generated|drove/i.test(text);
        if (hasMetric) {
          const outcome: ClaimOutcome = {
            description: text,
            isNumeric: /\d/.test(text),
            verified: false,
          };
          currentClaim.outcomes = [...(currentClaim.outcomes || []), outcome];
        } else {
          currentClaim.responsibilities = [...(currentClaim.responsibilities || []), text];
        }
      }
    }
  }

  // Save last claim
  if (currentClaim && (currentClaim.role || currentClaim.company)) {
    claims.push(currentClaim);
  }

  return claims;
}
