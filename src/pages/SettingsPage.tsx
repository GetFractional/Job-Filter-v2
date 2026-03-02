import { useCallback, useEffect, useState } from 'react';
import { Save, Trash2, Download, AlertTriangle, MapPin, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db, generateId, seedDefaultProfile } from '../db';
import { clearJobFilterLocalState } from '../lib/profileState';
import {
  applyGlobalRelocationPreference,
  createLocationPreference,
  DEFAULT_HARD_FILTERS,
  EMPLOYMENT_TYPE_OPTIONS,
  sanitizeHardFilters,
  sanitizeLocationPreferences,
  summarizeLocationPreferences,
  STANDARD_RADIUS_MILES,
} from '../lib/profilePreferences';
import {
  BENEFITS_CATALOG,
  benefitIdsToLabels,
  legacyBenefitsToIds,
  sanitizeBenefitIds,
  searchBenefitCatalog,
} from '../lib/benefitsCatalog';
import { getCityTypeaheadOptions, loadRecentCities, saveRecentCity } from '../lib/cityOptions';
import { DigitalResumeBuilder } from '../components/resume/DigitalResumeBuilder';
import { hasUsableImportDraft } from '../lib/importDraftBuilder';
import { UI_TERMS } from '../lib/terminology';
import type { Claim, ImportDraftRole, ImportSession, LocationPreference, Profile } from '../types';

function parseIntegerInput(value: string): number {
  const digitsOnly = value.replace(/[^\d]/g, '');
  return digitsOnly ? Number.parseInt(digitsOnly, 10) : 0;
}

function formatIntegerInput(value: number): string {
  if (!value || Number.isNaN(value) || value <= 0) return '';
  return value.toLocaleString();
}

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

function BenefitCatalogPicker({
  label,
  selectedIds,
  onChange,
}: {
  label: string;
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const suggestions = searchBenefitCatalog(query, selectedIds, 10);
  const selected = selectedIds
    .map((id) => BENEFITS_CATALOG.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 mb-1 block">{label}</label>
      <div className="rounded-lg border border-neutral-300 bg-white px-3 py-2">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-700 text-xs px-2.5 py-1">
              {item.label}
              <button type="button" onClick={() => onChange(selectedIds.filter((id) => id !== item.id))} className="text-neutral-600 hover:text-neutral-900">×</button>
            </span>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search benefits..."
          className="w-full border-0 p-0 text-xs focus:outline-none"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange([...selectedIds, item.id]);
                  setQuery('');
                }}
                className="w-full rounded px-2 py-1 text-left text-xs text-neutral-700 hover:bg-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
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
  const initialHardFilters = sanitizeHardFilters({
    ...DEFAULT_HARD_FILTERS,
    ...(profile.hardFilters ?? {}),
    minBaseSalary: profile.hardFilters?.minBaseSalary ?? profile.compFloor ?? 0,
  });

  const [form, setForm] = useState({
    name: profile.name,
    firstName: profile.firstName ?? profile.name.split(' ')[0] ?? '',
    lastName: profile.lastName ?? profile.name.split(' ').slice(1).join(' ') ?? '',
    compTarget: profile.compTarget ? profile.compTarget.toLocaleString() : '',
    targetRoles: profile.targetRoles,
    requiredBenefitIds: sanitizeBenefitIds(
      profile.requiredBenefitIds?.length ? profile.requiredBenefitIds : legacyBenefitsToIds(profile.requiredBenefits),
    ),
    preferredBenefitIds: sanitizeBenefitIds(
      profile.preferredBenefitIds?.length ? profile.preferredBenefitIds : legacyBenefitsToIds(profile.preferredBenefits),
    ),
    locationPreferences: profile.locationPreferences?.length ? profile.locationPreferences : [],
    willingToRelocate: Boolean(profile.willingToRelocate || profile.locationPreferences?.some((entry) => entry.willingToRelocate)),
    hardFilters: initialHardFilters,
    seedStagePolicy: profile.scoringPolicy?.seedStagePolicy ?? 'warn',
  });
  const [drafts, setDrafts] = useState({
    targetRole: '',
  });
  const [recentCities, setRecentCities] = useState<string[]>(() => loadRecentCities());
  const [showAdvancedBenefits, setShowAdvancedBenefits] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const addTag = (field: 'targetRoles', key: keyof typeof drafts) => {
    const value = drafts[key].trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field] : [...prev[field], value],
    }));
    setDrafts((prev) => ({ ...prev, [key]: '' }));
  };

  const removeTag = (field: 'targetRoles', value: string) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((entry) => entry !== value) }));
  };

  const rememberCity = useCallback((city: string) => {
    const next = saveRecentCity(city);
    setRecentCities(next);
  }, []);

  const updateLocationPreference = (id: string, updates: Partial<LocationPreference>) => {
    setForm((prev) => ({
      ...prev,
      locationPreferences: prev.locationPreferences.map((preference) => (
        preference.id === id
          ? {
              ...preference,
              ...updates,
              city: (updates.type ?? preference.type) === 'Remote' ? '' : (updates.city ?? preference.city),
              radiusMiles: (updates.type ?? preference.type) === 'Remote'
                ? undefined
                : (updates.radiusMiles ?? preference.radiusMiles),
            }
          : preference
      )),
    }));
  };

  const validate = () => {
    const nextErrors: string[] = [];
    if (form.hardFilters.minBaseSalary < 0) nextErrors.push('Minimum base salary must be 0 or higher.');
    if (form.hardFilters.maxOnsiteDaysPerWeek < 0 || form.hardFilters.maxOnsiteDaysPerWeek > 5) {
      nextErrors.push('Max onsite days per week must be between 0 and 5.');
    }
    if (form.hardFilters.maxTravelPercent < 0 || form.hardFilters.maxTravelPercent > 100) {
      nextErrors.push('Max travel percent must be between 0 and 100.');
    }
    if (form.hardFilters.employmentTypes.length === 0) {
      nextErrors.push('Select at least one employment type.');
    }
    if (form.locationPreferences.length === 0) {
      nextErrors.push('Add at least one location preference.');
    }

    form.locationPreferences.forEach((preference, index) => {
      if (preference.type === 'Remote') return;
      if (!preference.city?.trim()) {
        nextErrors.push(`Location preference ${index + 1}: city is required for ${preference.type.toLowerCase()} roles.`);
      }
      if (preference.radiusMiles === undefined || Number.isNaN(preference.radiusMiles)) {
        nextErrors.push(`Location preference ${index + 1}: radius is required for ${preference.type.toLowerCase()} roles.`);
      } else if (preference.radiusMiles < 1 || preference.radiusMiles > 500) {
        nextErrors.push(`Location preference ${index + 1}: radius must be between 1 and 500 miles.`);
      }
    });

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const normalizedHardFilters = sanitizeHardFilters(form.hardFilters);
    const normalizedLocations = applyGlobalRelocationPreference(
      sanitizeLocationPreferences(form.locationPreferences),
      form.willingToRelocate,
    );
    const normalizedRequiredBenefitIds = sanitizeBenefitIds(form.requiredBenefitIds);
    const normalizedPreferredBenefitIds = sanitizeBenefitIds(form.preferredBenefitIds);

    await updateProfile({
      name: `${form.firstName} ${form.lastName}`.trim() || form.name,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      compFloor: normalizedHardFilters.minBaseSalary,
      compTarget: parseIntegerInput(form.compTarget),
      locationPreference: summarizeLocationPreferences(normalizedLocations),
      targetRoles: form.targetRoles.map((entry) => entry.trim()).filter(Boolean),
      requiredBenefits: benefitIdsToLabels(normalizedRequiredBenefitIds),
      preferredBenefits: benefitIdsToLabels(normalizedPreferredBenefitIds),
      requiredBenefitIds: normalizedRequiredBenefitIds,
      preferredBenefitIds: normalizedPreferredBenefitIds,
      disqualifiers: [],
      locationPreferences: normalizedLocations,
      willingToRelocate: form.willingToRelocate,
      hardFilters: normalizedHardFilters,
      scoringPolicy: {
        seedStagePolicy: form.seedStagePolicy,
      },
    });
    setErrors([]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">First name</label>
          <input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="First name"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">Last name</label>
          <input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Last name"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-600 block">Target Roles</label>
        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.targetRoles.map((value) => (
              <span key={value} className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 text-xs px-2.5 py-1">
                {value}
                <button type="button" onClick={() => removeTag('targetRoles', value)} className="text-brand-700 hover:text-brand-900">×</button>
              </span>
            ))}
          </div>
          <input
            value={drafts.targetRole}
            onChange={(event) => setDrafts((prev) => ({ ...prev, targetRole: event.target.value }))}
            onBlur={() => addTag('targetRoles', 'targetRole')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addTag('targetRoles', 'targetRole');
              }
            }}
            placeholder="Add a role and press Enter"
            className="w-full border-0 p-0 text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-600 block flex items-center gap-1">
          <MapPin size={12} /> Location Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, locationPreferences: [...prev.locationPreferences, createLocationPreference('Remote')] }))} className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50">+ Remote</button>
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, locationPreferences: [...prev.locationPreferences, createLocationPreference('Hybrid')] }))} className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50">+ Hybrid</button>
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, locationPreferences: [...prev.locationPreferences, createLocationPreference('Onsite')] }))} className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50">+ Onsite</button>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, willingToRelocate: !prev.willingToRelocate }))}
            className={`rounded-full border px-3 py-1 text-xs ${
              form.willingToRelocate
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            + Willing to relocate
          </button>
        </div>

        {form.locationPreferences.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
            No location preferences added.
          </p>
        )}
        <div className="space-y-2">
          {form.locationPreferences.map((preference) => {
            const cityListId = `settings-city-options-${preference.id}`;
            const cityOptions = getCityTypeaheadOptions(preference.city ?? '', recentCities);
            const usesCustomRadius = preference.radiusMiles !== undefined
              && !STANDARD_RADIUS_MILES.includes(preference.radiusMiles as (typeof STANDARD_RADIUS_MILES)[number]);

            return (
              <div key={preference.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr_170px_auto] gap-2 items-end">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Mode</label>
                    <select
                      value={preference.type}
                      onChange={(event) => updateLocationPreference(preference.id, {
                        type: event.target.value as LocationPreference['type'],
                        radiusMiles: event.target.value === 'Remote' ? undefined : (preference.radiusMiles ?? 25),
                      })}
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>
                  {preference.type === 'Remote' ? (
                    <div className="sm:col-span-2 rounded-lg border border-dashed border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-500 h-10 flex items-center">
                      Remote roles do not require city or radius.
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">City</label>
                        <input
                          value={preference.city ?? ''}
                          onChange={(event) => updateLocationPreference(preference.id, { city: event.target.value })}
                          onBlur={() => rememberCity(preference.city ?? '')}
                          list={cityListId}
                          placeholder="City (required)"
                          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                        />
                        <datalist id={cityListId}>
                          {cityOptions.map((option, index) => (
                            <option key={`${option}-${index}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Radius (miles)</label>
                        <select
                          value={
                            preference.radiusMiles && STANDARD_RADIUS_MILES.includes(preference.radiusMiles as (typeof STANDARD_RADIUS_MILES)[number])
                              ? String(preference.radiusMiles)
                              : (preference.radiusMiles ? 'custom' : '')
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!value) {
                              updateLocationPreference(preference.id, { radiusMiles: undefined });
                              return;
                            }
                            if (value === 'custom') {
                              updateLocationPreference(preference.id, { radiusMiles: preference.radiusMiles ?? 25 });
                              return;
                            }
                            updateLocationPreference(preference.id, { radiusMiles: Number(value) });
                          }}
                          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select radius</option>
                          {STANDARD_RADIUS_MILES.map((miles) => (
                            <option key={miles} value={miles}>{miles} miles</option>
                          ))}
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      locationPreferences: prev.locationPreferences.filter((entry) => entry.id !== preference.id),
                    }))}
                    className="h-10 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    Remove
                  </button>
                </div>
                {preference.type !== 'Remote' && usesCustomRadius && (
                  <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-2 items-center">
                    <label className="text-[11px] font-medium text-neutral-600">Custom radius (miles)</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={preference.radiusMiles ?? ''}
                      onChange={(event) => updateLocationPreference(preference.id, {
                        radiusMiles: event.target.value ? Number(event.target.value) : undefined,
                      })}
                      placeholder="Enter miles"
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-3">
        <div className="text-sm font-semibold text-neutral-800">Hard Filters</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block flex items-center gap-1">
              <DollarSign size={12} /> Minimum Base Salary
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.hardFilters.minBaseSalary > 0 ? form.hardFilters.minBaseSalary.toLocaleString() : ''}
              onChange={(event) => setForm((prev) => ({
                ...prev,
                hardFilters: { ...prev.hardFilters, minBaseSalary: parseIntegerInput(event.target.value) },
              }))}
              placeholder="150,000"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">Comp Target ($)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.compTarget}
              onChange={(event) => setForm((prev) => ({ ...prev, compTarget: formatIntegerInput(parseIntegerInput(event.target.value)) }))}
              placeholder="180,000"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">Employment Types</label>
            <div className="rounded-lg border border-neutral-300 bg-white p-2 flex flex-wrap gap-1.5">
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => {
                const selected = form.hardFilters.employmentTypes.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      hardFilters: {
                        ...prev.hardFilters,
                        employmentTypes: selected
                          ? prev.hardFilters.employmentTypes.filter((id) => id !== option.id)
                          : [...prev.hardFilters.employmentTypes, option.id],
                      },
                    }))}
                    className={`rounded-full px-2.5 py-1 text-[11px] border ${
                      selected
                        ? 'border-brand-300 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">Max Onsite Days / Week</label>
            <input
              type="number"
              min={0}
              max={5}
              value={form.hardFilters.maxOnsiteDaysPerWeek}
              onChange={(event) => setForm((prev) => ({
                ...prev,
                hardFilters: {
                  ...prev.hardFilters,
                  maxOnsiteDaysPerWeek: event.target.value === ''
                    ? DEFAULT_HARD_FILTERS.maxOnsiteDaysPerWeek
                    : Math.max(0, Math.min(5, Number(event.target.value))),
                },
              }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">Max Travel Percent</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.hardFilters.maxTravelPercent === DEFAULT_HARD_FILTERS.maxTravelPercent ? '' : form.hardFilters.maxTravelPercent}
              onChange={(event) => setForm((prev) => ({
                ...prev,
                hardFilters: {
                  ...prev.hardFilters,
                  maxTravelPercent: event.target.value === ''
                    ? DEFAULT_HARD_FILTERS.maxTravelPercent
                    : Number(event.target.value),
                },
              }))}
              placeholder="100"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setForm((prev) => ({
            ...prev,
            hardFilters: { ...prev.hardFilters, requiresVisaSponsorship: !prev.hardFilters.requiresVisaSponsorship },
          }))}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
            form.hardFilters.requiresVisaSponsorship
              ? 'border-brand-300 bg-brand-50 text-brand-700'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          I will need visa sponsorship
        </button>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600 block">Early-stage company policy</label>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'warn', label: 'Warn (default)' },
              { id: 'disqualify', label: 'Hard disqualify' },
              { id: 'ignore', label: 'Ignore stage' },
            ] as const).map((option) => {
              const selected = form.seedStagePolicy === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, seedStagePolicy: option.id }))}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selected
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-500">
            Controls whether seed-stage companies are warnings, blockers, or ignored in scoring.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <BenefitCatalogPicker
          label="Required Benefits"
          selectedIds={form.requiredBenefitIds}
          onChange={(next) => setForm((prev) => ({ ...prev, requiredBenefitIds: next }))}
        />
        <p className="text-[11px] text-neutral-500">
          Jobs with missing benefits stay in an unknown state instead of failing automatically.
        </p>
        <div className="rounded-lg border border-neutral-200">
          <button
            type="button"
            onClick={() => setShowAdvancedBenefits((open) => !open)}
            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Advanced preferences
            {showAdvancedBenefits ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showAdvancedBenefits && (
            <div className="border-t border-neutral-200 p-3">
              <BenefitCatalogPicker
                label="Preferred Benefits"
                selectedIds={form.preferredBenefitIds}
                onChange={(next) => setForm((prev) => ({ ...prev, preferredBenefitIds: next }))}
              />
            </div>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <ul className="text-xs text-red-700 list-disc pl-4 space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
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
            <p className="text-xs text-neutral-500">Update companies, roles, {UI_TERMS.accountabilityPlural.toLowerCase()}, outcomes, tools, and skills.</p>
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
