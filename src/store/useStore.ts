// Job Filter v2 — Global State Store (Zustand)
// Thin layer over IndexedDB. Keeps UI reactive with in-memory state
// synced from Dexie on load and after mutations.

import { create } from 'zustand';
import { db, generateId, seedDefaultProfile } from '../db';
import { scoreJob } from '../lib/scoring';
import { parseCompFromText } from '../lib/scoring';
import { normalizeClaimText } from '../lib/claimLedger';
import { validateClaimContext } from '../lib/claimValidation';
import { PIPELINE_STAGES } from '../types';
import type {
  Job,
  Company,
  Contact,
  ContactJobLink,
  Activity,
  ActivityOutcome,
  Asset,
  Profile,
  Claim,
  PipelineStage,
  GenerationLog,
} from '../types';

interface AppState {
  // Data
  jobs: Job[];
  companies: Company[];
  contacts: Contact[];
  contactJobLinks: ContactJobLink[];
  activities: Activity[];
  assets: Asset[];
  profile: Profile | null;
  claims: Claim[];
  generationLogs: GenerationLog[];

  // UI state
  selectedJobId: string | null;
  activeTab: 'score' | 'requirements' | 'research' | 'assets' | 'qa' | 'crm';
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  addJob: (job: Partial<Job>) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  moveJobToStage: (id: string, stage: PipelineStage) => Promise<void>;
  scoreAndUpdateJob: (id: string) => Promise<void>;
  scoreJobsBulk: (jobIds?: string[]) => Promise<number>;
  addCompany: (company: Partial<Company>) => Promise<Company>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  addContact: (contact: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  linkContactToJob: (contactId: string, jobId: string) => Promise<void>;
  unlinkContactFromJob: (contactId: string, jobId: string) => Promise<void>;
  addActivity: (activity: Partial<Activity>) => Promise<Activity>;
  addAsset: (asset: Partial<Asset>) => Promise<Asset>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  addClaim: (claim: Partial<Claim>) => Promise<Claim>;
  updateClaim: (id: string, updates: Partial<Claim>) => Promise<void>;
  deleteClaim: (id: string) => Promise<void>;
  mergeClaims: (targetId: string, sourceId: string) => Promise<void>;
  approveClaims: (ids?: string[]) => Promise<number>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addGenerationLog: (log: Partial<GenerationLog>) => Promise<void>;
  setSelectedJob: (id: string | null) => void;
  setActiveTab: (tab: 'score' | 'requirements' | 'research' | 'assets' | 'qa' | 'crm') => void;
  refreshData: () => Promise<void>;
}

const TOOL_HINTS = new Set([
  'salesforce',
  'hubspot',
  'marketo',
  'pardot',
  'segment',
  'amplitude',
  'mixpanel',
  'google analytics',
  'ga4',
  'tableau',
  'looker',
  'dbt',
  'snowflake',
  'bigquery',
  'braze',
  'iterable',
  'klaviyo',
  'mailchimp',
  'meta ads',
  'google ads',
  'linkedin ads',
  'tiktok ads',
  'figma',
  'notion',
  'jira',
  'asana',
  'optimizely',
  'launchdarkly',
  'vwo',
  'hotjar',
  'fullstory',
  'intercom',
  'zendesk',
  'drift',
  'gong',
  'outreach',
  'salesloft',
  'clearbit',
  'zoominfo',
  '6sense',
  'demandbase',
  'power bi',
  'excel',
  'sql',
]);

function looksLikeOutcome(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const hasAction = /\b(increased|grew|reduced|improved|generated|drove|boosted|scaled|saved|achieved|delivered|exceeded|surpassed|doubled|tripled|cut|lifted)\b/i.test(normalized);
  const hasMetric = /(\d[\d,.]*\s*%|\$[\d,.]+[kKmMbB]?|\b\d+(\.\d+)?x\b|\b\d+\s*[kKmMbB]\b)/i.test(normalized);
  return hasAction && hasMetric;
}

function looksLikeTool(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeClaimText(text);
  for (const hint of TOOL_HINTS) {
    if (normalized === hint || normalized.includes(hint)) {
      return true;
    }
  }
  return false;
}

function inferClaimType(claim: Partial<Claim>): Claim['type'] {
  if (claim.type) return claim.type;
  if (claim.role || claim.company || claim.startDate || claim.endDate || (claim.responsibilities && claim.responsibilities.length > 0)) {
    return 'Experience';
  }
  if (claim.metric || claim.isNumeric || looksLikeOutcome(claim.text || '')) return 'Outcome';
  if (looksLikeTool(claim.text || '')) return 'Tool';
  return 'Skill';
}

function sanitizeClaimForType(type: Claim['type'], claimData: Partial<Claim>): Partial<Claim> {
  const sanitized: Partial<Claim> = { ...claimData };

  if (type === 'Experience') {
    sanitized.experienceId = undefined;
    sanitized.metric = undefined;
    sanitized.isNumeric = undefined;
    sanitized.tools = undefined;
    sanitized.outcomes = undefined;
    return sanitized;
  }

  sanitized.role = undefined;
  sanitized.company = undefined;
  sanitized.startDate = undefined;
  sanitized.endDate = undefined;
  sanitized.location = undefined;
  sanitized.responsibilities = undefined;
  sanitized.tools = undefined;
  sanitized.outcomes = undefined;

  if (type !== 'Outcome') {
    sanitized.metric = undefined;
    sanitized.isNumeric = undefined;
  }

  return sanitized;
}

function normalizeDateToken(value?: string): string {
  return (value || '').trim().toLowerCase();
}

const STAGE_INDEX: Record<PipelineStage, number> = PIPELINE_STAGES.reduce((acc, stage, index) => {
  acc[stage] = index;
  return acc;
}, {} as Record<PipelineStage, number>);

const AUTO_STAGE_FROM_ACTIVITY: Record<ActivityOutcome, PipelineStage | null> = {
  Sent: 'Outreach Sent',
  'Reply Received': 'Response/Screen',
  'Call Scheduled': 'Response/Screen',
  'Screen Scheduled': 'Response/Screen',
  'Interview Scheduled': 'Interviewing',
  'Referral Offered': 'Response/Screen',
  Rejected: 'Closed Lost',
  'No Response': null,
  Other: null,
};

function shouldAdvanceStage(currentStage: PipelineStage, nextStage: PipelineStage): boolean {
  return STAGE_INDEX[nextStage] > STAGE_INDEX[currentStage];
}

async function advanceJobStageIfNeeded(jobId: string, nextStage: PipelineStage, now: string): Promise<void> {
  const job = await db.jobs.get(jobId);
  if (!job) return;
  if (!shouldAdvanceStage(job.stage, nextStage)) return;

  await db.jobs.update(jobId, {
    stage: nextStage,
    stageTimestamps: { ...job.stageTimestamps, [nextStage]: now },
    updatedAt: now,
  });
  await db.outcomes.add({
    id: generateId(),
    jobId,
    stage: nextStage,
    occurredAt: now,
  });
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  jobs: [],
  companies: [],
  contacts: [],
  contactJobLinks: [],
  activities: [],
  assets: [],
  profile: null,
  claims: [],
  generationLogs: [],
  selectedJobId: null,
  activeTab: 'score',
  isLoading: true,

  // --------------------------------------------------------
  // Initialize: load all data from IndexedDB
  // --------------------------------------------------------

  initialize: async () => {
    await seedDefaultProfile();
    const [jobs, companies, contacts, contactJobLinks, activities, assets, claims, generationLogs] = await Promise.all([
      db.jobs.orderBy('updatedAt').reverse().toArray(),
      db.companies.toArray(),
      db.contacts.toArray(),
      db.contactJobLinks.toArray(),
      db.activities.orderBy('createdAt').reverse().toArray(),
      db.assets.toArray(),
      db.claims.toArray(),
      db.generationLogs.orderBy('createdAt').reverse().toArray(),
    ]);
    const profile = await db.profiles.get('default');

    set({
      jobs,
      companies,
      contacts,
      contactJobLinks,
      activities,
      assets,
      profile: profile || null,
      claims,
      generationLogs,
      isLoading: false,
    });
  },

  refreshData: async () => {
    const [jobs, companies, contacts, contactJobLinks, activities, assets, claims, generationLogs] = await Promise.all([
      db.jobs.orderBy('updatedAt').reverse().toArray(),
      db.companies.toArray(),
      db.contacts.toArray(),
      db.contactJobLinks.toArray(),
      db.activities.orderBy('createdAt').reverse().toArray(),
      db.assets.toArray(),
      db.claims.toArray(),
      db.generationLogs.orderBy('createdAt').reverse().toArray(),
    ]);
    const profile = await db.profiles.get('default');
    set({ jobs, companies, contacts, contactJobLinks, activities, assets, profile: profile || null, claims, generationLogs });
  },

  // --------------------------------------------------------
  // Jobs
  // --------------------------------------------------------

  addJob: async (jobData) => {
    const now = new Date().toISOString();
    const comp = parseCompFromText(jobData.jobDescription || '');

    const job: Job = {
      id: generateId(),
      title: jobData.title || '',
      company: jobData.company || '',
      companyId: jobData.companyId,
      url: jobData.url,
      location: jobData.location,
      locationType: jobData.locationType || 'Unknown',
      employmentType: jobData.employmentType || 'Full-time',
      compRange: jobData.compRange || comp.range,
      compMin: jobData.compMin || comp.min,
      compMax: jobData.compMax || comp.max,
      jobDescription: jobData.jobDescription || '',
      stage: jobData.jobDescription ? 'Captured' : 'Discovered',
      stageTimestamps: {
        [jobData.jobDescription ? 'Captured' : 'Discovered']: now,
      },
      fitScore: undefined,
      fitLabel: undefined,
      disqualifiers: [],
      reasonsToPursue: [],
      reasonsToPass: [],
      redFlags: [],
      requirementsExtracted: [],
      notes: jobData.notes,
      source: jobData.source,
      createdAt: now,
      updatedAt: now,
    };

    await db.jobs.add(job);

    // Auto-create company if not exists
    if (job.company) {
      const existingCompany = get().companies.find(
        (c) => c.name.toLowerCase() === job.company.toLowerCase()
      );
      if (!existingCompany) {
        const company: Company = {
          id: generateId(),
          name: job.company,
          stage: 'Unknown',
          riskFlags: [],
          createdAt: now,
          updatedAt: now,
        };
        await db.companies.add(company);
        job.companyId = company.id;
        await db.jobs.update(job.id, { companyId: company.id });
      } else {
        job.companyId = existingCompany.id;
        await db.jobs.update(job.id, { companyId: existingCompany.id });
      }
    }

    await get().refreshData();

    // Auto-score if we have a JD
    if (job.jobDescription) {
      await get().scoreAndUpdateJob(job.id);
    }

    return job;
  },

  updateJob: async (id, updates) => {
    const existing = await db.jobs.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const nextUpdates: Partial<Job> = { ...updates, updatedAt: now };
    let stageTransition: PipelineStage | null = null;

    if (updates.stage && shouldAdvanceStage(existing.stage, updates.stage)) {
      stageTransition = updates.stage;
      nextUpdates.stageTimestamps = {
        ...existing.stageTimestamps,
        [updates.stage]: now,
      };
    } else if (updates.researchBrief && !existing.researchBrief && shouldAdvanceStage(existing.stage, 'Researched')) {
      stageTransition = 'Researched';
      nextUpdates.stage = 'Researched';
      nextUpdates.stageTimestamps = {
        ...existing.stageTimestamps,
        Researched: now,
      };
    }

    await db.jobs.update(id, nextUpdates);

    if (stageTransition) {
      await db.outcomes.add({
        id: generateId(),
        jobId: id,
        stage: stageTransition,
        occurredAt: now,
      });
    }

    await get().refreshData();
  },

  deleteJob: async (id) => {
    await db.jobs.delete(id);
    // Clean up related records
    await db.activities.where('jobId').equals(id).delete();
    await db.assets.where('jobId').equals(id).delete();
    await db.outcomes.where('jobId').equals(id).delete();
    await db.contactJobLinks.where('jobId').equals(id).delete();
    if (get().selectedJobId === id) {
      set({ selectedJobId: null });
    }
    await get().refreshData();
  },

  moveJobToStage: async (id, stage) => {
    const job = await db.jobs.get(id);
    if (!job) return;

    if (!shouldAdvanceStage(job.stage, stage)) {
      return;
    }

    const now = new Date().toISOString();
    const timestamps = { ...job.stageTimestamps, [stage]: now };

    await db.jobs.update(id, {
      stage,
      stageTimestamps: timestamps,
      updatedAt: now,
    });

    // Record outcome
    await db.outcomes.add({
      id: generateId(),
      jobId: id,
      stage,
      occurredAt: now,
    });

    await get().refreshData();
  },

  scoreAndUpdateJob: async (id) => {
    const job = await db.jobs.get(id);
    const profile = get().profile;
    if (!job || !profile) return;

    const claims = get().claims;
    const result = scoreJob(job, profile, claims);
    const now = new Date().toISOString();

    const updates: Partial<Job> = {
      fitScore: result.fitScore,
      fitLabel: result.fitLabel,
      disqualifiers: result.disqualifiers,
      reasonsToPursue: result.reasonsToPursue,
      reasonsToPass: result.reasonsToPass,
      redFlags: result.redFlags,
      requirementsExtracted: result.requirementsExtracted,
      scoreBreakdown: result.breakdown,
      updatedAt: now,
    };

    // Auto-advance to Scored if currently Captured
    if (shouldAdvanceStage(job.stage, 'Scored')) {
      updates.stage = 'Scored';
      updates.stageTimestamps = { ...job.stageTimestamps, Scored: now };
    }

    await db.jobs.update(id, updates);
    await get().refreshData();
  },

  scoreJobsBulk: async (jobIds) => {
    const profile = get().profile;
    if (!profile) return 0;

    const scopedIds = new Set(jobIds || []);
    const targetJobs = get().jobs.filter((job) => {
      if (!job.jobDescription?.trim()) return false;
      if (scopedIds.size === 0) return true;
      return scopedIds.has(job.id);
    });

    if (targetJobs.length === 0) return 0;

    const now = new Date().toISOString();
    const claims = get().claims;

    await db.transaction('rw', db.jobs, async () => {
      for (const job of targetJobs) {
        const result = scoreJob(job, profile, claims);
        const updates: Partial<Job> = {
          fitScore: result.fitScore,
          fitLabel: result.fitLabel,
          disqualifiers: result.disqualifiers,
          reasonsToPursue: result.reasonsToPursue,
          reasonsToPass: result.reasonsToPass,
          redFlags: result.redFlags,
          requirementsExtracted: result.requirementsExtracted,
          scoreBreakdown: result.breakdown,
          updatedAt: now,
        };

        if (shouldAdvanceStage(job.stage, 'Scored')) {
          updates.stage = 'Scored';
          updates.stageTimestamps = { ...job.stageTimestamps, Scored: now };
        }

        await db.jobs.update(job.id, updates);
      }
    });

    await get().refreshData();
    return targetJobs.length;
  },

  // --------------------------------------------------------
  // Companies
  // --------------------------------------------------------

  addCompany: async (companyData) => {
    const now = new Date().toISOString();
    const company: Company = {
      id: generateId(),
      name: companyData.name || '',
      website: companyData.website,
      stage: companyData.stage || 'Unknown',
      industry: companyData.industry,
      businessModel: companyData.businessModel,
      notes: companyData.notes,
      riskFlags: companyData.riskFlags || [],
      createdAt: now,
      updatedAt: now,
    };
    await db.companies.add(company);
    await get().refreshData();
    return company;
  },

  updateCompany: async (id, updates) => {
    await db.companies.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await get().refreshData();
  },

  // --------------------------------------------------------
  // Contacts
  // --------------------------------------------------------

  addContact: async (contactData) => {
    const now = new Date().toISOString();
    let resolvedCompanyId = contactData.companyId;
    let resolvedCompany = contactData.company;

    if (!resolvedCompanyId && contactData.company?.trim()) {
      const existingCompany = get().companies.find(
        (company) => company.name.toLowerCase() === contactData.company!.trim().toLowerCase()
      );
      if (existingCompany) {
        resolvedCompanyId = existingCompany.id;
        resolvedCompany = existingCompany.name;
      }
    }

    const contact: Contact = {
      id: generateId(),
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      role: contactData.role,
      companyId: resolvedCompanyId,
      company: resolvedCompany,
      email: contactData.email,
      linkedIn: contactData.linkedIn,
      phone: contactData.phone,
      relationship: contactData.relationship || 'Other',
      notes: contactData.notes,
      createdAt: now,
      updatedAt: now,
    };
    await db.contacts.add(contact);
    await get().refreshData();
    return contact;
  },

  updateContact: async (id, updates) => {
    await db.contacts.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await get().refreshData();
  },

  linkContactToJob: async (contactId, jobId) => {
    // Check if link already exists
    const existing = get().contactJobLinks.find(
      (l) => l.contactId === contactId && l.jobId === jobId
    );
    if (existing) return;
    await db.contactJobLinks.add({
      id: generateId(),
      contactId,
      jobId,
      createdAt: new Date().toISOString(),
    });
    await get().refreshData();
  },

  unlinkContactFromJob: async (contactId, jobId) => {
    const link = get().contactJobLinks.find(
      (l) => l.contactId === contactId && l.jobId === jobId
    );
    if (link) {
      await db.contactJobLinks.delete(link.id);
      await get().refreshData();
    }
  },

  // --------------------------------------------------------
  // Activities
  // --------------------------------------------------------

  addActivity: async (activityData) => {
    const now = new Date().toISOString();
    const activity: Activity = {
      id: generateId(),
      jobId: activityData.jobId,
      contactId: activityData.contactId,
      companyId: activityData.companyId,
      channel: activityData.channel || 'Email',
      direction: activityData.direction || 'Outbound',
      subject: activityData.subject,
      content: activityData.content || '',
      templateId: activityData.templateId,
      outcome: activityData.outcome || 'Sent',
      followUpDate: activityData.followUpDate,
      createdAt: now,
    };
    await db.activities.add(activity);

    if (activity.jobId) {
      const stageFromOutcome = activity.outcome ? AUTO_STAGE_FROM_ACTIVITY[activity.outcome] : null;
      if (stageFromOutcome) {
        await advanceJobStageIfNeeded(activity.jobId, stageFromOutcome, now);
      } else if (activity.direction === 'Outbound') {
        await advanceJobStageIfNeeded(activity.jobId, 'Outreach Sent', now);
      }
    }

    await get().refreshData();
    return activity;
  },

  // --------------------------------------------------------
  // Assets
  // --------------------------------------------------------

  addAsset: async (assetData) => {
    const now = new Date().toISOString();

    // Get current version count for this job + type
    const existingCount = await db.assets
      .where('jobId')
      .equals(assetData.jobId || '')
      .filter((a) => a.type === assetData.type)
      .count();

    const asset: Asset = {
      id: generateId(),
      jobId: assetData.jobId || '',
      type: assetData.type || 'Outreach Email',
      version: existingCount + 1,
      content: assetData.content || '',
      templateId: assetData.templateId,
      modelUsed: assetData.modelUsed,
      modelTier: assetData.modelTier,
      approved: false,
      notes: assetData.notes,
      createdAt: now,
      updatedAt: now,
    };
    await db.assets.add(asset);
    await get().refreshData();
    return asset;
  },

  updateAsset: async (id, updates) => {
    const existing = await db.assets.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    await db.assets.update(id, { ...updates, updatedAt: now });

    if (!existing.approved && updates.approved && existing.jobId) {
      await advanceJobStageIfNeeded(existing.jobId, 'Assets Ready', now);
    }

    await get().refreshData();
  },

  // --------------------------------------------------------
  // Claims / Profile
  // --------------------------------------------------------

  addClaim: async (claimData) => {
    const now = new Date().toISOString();
    const type = inferClaimType(claimData);
    const sanitizedClaimData = sanitizeClaimForType(type, claimData);
    const textFromExperience =
      sanitizedClaimData.role && sanitizedClaimData.company
        ? `${sanitizedClaimData.role} at ${sanitizedClaimData.company}`
        : sanitizedClaimData.role || sanitizedClaimData.company || '';
    const text = (sanitizedClaimData.text || textFromExperience || '').trim();
    validateClaimContext({
      type,
      claims: get().claims,
      text,
      role: sanitizedClaimData.role,
      company: sanitizedClaimData.company,
      metric: sanitizedClaimData.metric,
      verificationStatus: sanitizedClaimData.verificationStatus,
      experienceId: sanitizedClaimData.experienceId,
    });
    const normalizedText = normalizeClaimText(text || `Imported ${type.toLowerCase()}`);
    const normalizedRole = (sanitizedClaimData.role || '').trim().toLowerCase();
    const normalizedCompany = (sanitizedClaimData.company || '').trim().toLowerCase();
    const normalizedStartDate = normalizeDateToken(sanitizedClaimData.startDate);
    const normalizedEndDate = normalizeDateToken(sanitizedClaimData.endDate);

    const duplicate = get().claims.find((existingClaim) => {
      if (existingClaim.type !== type) return false;
      if (existingClaim.normalizedText !== normalizedText) return false;

      if (type === 'Experience') {
        const existingRole = (existingClaim.role || '').trim().toLowerCase();
        const existingCompany = (existingClaim.company || '').trim().toLowerCase();
        const existingStartDate = normalizeDateToken(existingClaim.startDate);
        const existingEndDate = normalizeDateToken(existingClaim.endDate);
        return (
          existingRole === normalizedRole &&
          existingCompany === normalizedCompany &&
          existingStartDate === normalizedStartDate &&
          existingEndDate === normalizedEndDate
        );
      }

      return (existingClaim.experienceId || '') === (sanitizedClaimData.experienceId || '');
    });

    if (duplicate) {
      const shouldApproveDuplicate =
        duplicate.verificationStatus === 'Approved' ||
        (sanitizedClaimData.verificationStatus === 'Approved' && (sanitizedClaimData.confidence ?? 0) >= 0.9);
      const duplicateUpdates: Partial<Claim> = {
        confidence: Math.max(duplicate.confidence ?? 0, sanitizedClaimData.confidence ?? 0),
        verificationStatus: shouldApproveDuplicate ? 'Approved' : duplicate.verificationStatus,
        updatedAt: now,
      };
      await db.claims.update(duplicate.id, duplicateUpdates);
      await get().refreshData();
      return { ...duplicate, ...duplicateUpdates } as Claim;
    }

    const claim: Claim = {
      id: generateId(),
      type,
      text: text || `Imported ${type.toLowerCase()}`,
      normalizedText,
      source: sanitizedClaimData.source || 'Manual',
      evidenceSnippet: sanitizedClaimData.evidenceSnippet,
      confidence: sanitizedClaimData.confidence ?? 0.75,
      verificationStatus:
        sanitizedClaimData.verificationStatus === 'Approved' && (sanitizedClaimData.confidence ?? 0) >= 0.9
          ? 'Approved'
          : 'Review Needed',
      experienceId: sanitizedClaimData.experienceId,
      company: sanitizedClaimData.company,
      role: sanitizedClaimData.role,
      startDate: sanitizedClaimData.startDate,
      endDate: sanitizedClaimData.endDate,
      location: sanitizedClaimData.location,
      responsibilities: sanitizedClaimData.responsibilities,
      tools: sanitizedClaimData.tools,
      outcomes: sanitizedClaimData.outcomes,
      metric: sanitizedClaimData.metric,
      isNumeric: sanitizedClaimData.isNumeric,
      createdAt: now,
      updatedAt: now,
    };
    await db.claims.add(claim);
    await get().refreshData();
    return claim;
  },

  updateClaim: async (id, updates) => {
    const existing = await db.claims.get(id);
    if (!existing) return;

    const nextType = updates.type || existing.type;
    const sanitizedUpdates = sanitizeClaimForType(nextType, updates);
    const nextRole = sanitizedUpdates.role ?? existing.role;
    const nextCompany = sanitizedUpdates.company ?? existing.company;
    const nextMetric = sanitizedUpdates.metric ?? existing.metric;
    const nextVerificationStatus = sanitizedUpdates.verificationStatus ?? existing.verificationStatus;
    const nextText = (sanitizedUpdates.text ?? existing.text ?? '').trim();
    const nextExperienceId = sanitizedUpdates.experienceId ?? existing.experienceId;
    validateClaimContext({
      type: nextType,
      claims: get().claims,
      text: nextText,
      role: nextRole,
      company: nextCompany,
      metric: nextMetric,
      verificationStatus: nextVerificationStatus,
      experienceId: nextExperienceId,
      currentClaimId: id,
    });
    const nextUpdates: Partial<Claim> = { ...sanitizedUpdates, updatedAt: new Date().toISOString() };
    if (sanitizedUpdates.text) {
      nextUpdates.normalizedText = normalizeClaimText(sanitizedUpdates.text);
    }
    await db.claims.update(id, nextUpdates);
    await get().refreshData();
  },

  deleteClaim: async (id) => {
    await db.claims.delete(id);
    const linkedClaims = await db.claims.where('experienceId').equals(id).toArray();
    if (linkedClaims.length > 0) {
      await db.claims.bulkDelete(linkedClaims.map((claim) => claim.id));
    }
    await get().refreshData();
  },

  mergeClaims: async (targetId, sourceId) => {
    if (targetId === sourceId) return;
    const target = await db.claims.get(targetId);
    const source = await db.claims.get(sourceId);
    if (!target || !source) return;

    await db.claims.where('experienceId').equals(sourceId).modify({ experienceId: targetId });
    await db.claims.delete(sourceId);
    await db.claims.update(targetId, {
      confidence: Math.max(target.confidence ?? 0, source.confidence ?? 0),
      updatedAt: new Date().toISOString(),
    });
    await get().refreshData();
  },

  approveClaims: async (ids) => {
    const now = new Date().toISOString();
    const targetIds =
      ids && ids.length > 0
        ? ids
        : get()
            .claims.filter((claim) => claim.verificationStatus === 'Review Needed')
            .map((claim) => claim.id);

    if (targetIds.length === 0) return 0;

    await db.transaction('rw', db.claims, async () => {
      const claims = await db.claims.where('id').anyOf(targetIds).toArray();
      for (const claim of claims) {
        if (claim.verificationStatus === 'Approved') continue;
        await db.claims.update(claim.id, {
          verificationStatus: 'Approved',
          updatedAt: now,
        });
      }
    });

    await get().refreshData();
    return targetIds.length;
  },

  updateProfile: async (updates) => {
    await db.profiles.update('default', { ...updates, updatedAt: new Date().toISOString() });
    const profile = await db.profiles.get('default');
    set({ profile: profile || null });
  },

  // --------------------------------------------------------
  // Generation Logs
  // --------------------------------------------------------

  addGenerationLog: async (logData) => {
    const now = new Date().toISOString();
    const log: GenerationLog = {
      id: generateId(),
      jobId: logData.jobId,
      assetId: logData.assetId,
      templateId: logData.templateId,
      promptId: logData.promptId,
      modelUsed: logData.modelUsed || 'template-fill',
      modelTier: logData.modelTier || 'tier-0-free',
      estimatedCost: logData.estimatedCost || 0,
      inputTokens: logData.inputTokens,
      outputTokens: logData.outputTokens,
      createdAt: now,
    };
    await db.generationLogs.add(log);
    await get().refreshData();
  },

  // --------------------------------------------------------
  // UI State
  // --------------------------------------------------------

  setSelectedJob: (id) => set({ selectedJobId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
