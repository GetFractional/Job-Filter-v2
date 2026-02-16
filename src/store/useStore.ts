// Job Filter v2 — Global State Store (Zustand)
// Thin layer over IndexedDB. Keeps UI reactive with in-memory state
// synced from Dexie on load and after mutations.

import { create } from 'zustand';
import { db, generateId, seedDefaultProfile } from '../db';
import { scoreJob } from '../lib/scoring';
import { parseCompFromText } from '../lib/scoring';
import { isClosedWonDemotionBlocked } from '../lib/stageTransitions';
import { getAutoUsableClaims } from '../lib/claimAutoUse';
import { buildProfileEvidenceClaim } from '../lib/profileEvidence';
import type {
  Job,
  Company,
  Contact,
  ContactJobLink,
  Activity,
  Asset,
  Profile,
  Claim,
  PipelineStage,
  GenerationLog,
  ApplicationAnswer,
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
  applicationAnswers: ApplicationAnswer[];

  // UI state
  selectedJobId: string | null;
  activeTab: 'score' | 'requirements' | 'research' | 'assets' | 'crm' | 'qa';
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  addJob: (job: Partial<Job>) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  moveJobToStage: (id: string, stage: PipelineStage) => Promise<void>;
  scoreAndUpdateJob: (id: string) => Promise<void>;
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
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addGenerationLog: (log: Partial<GenerationLog>) => Promise<void>;
  addApplicationAnswer: (answer: Partial<ApplicationAnswer>) => Promise<ApplicationAnswer>;
  updateApplicationAnswer: (id: string, updates: Partial<ApplicationAnswer>) => Promise<void>;
  deleteApplicationAnswer: (id: string) => Promise<void>;
  setSelectedJob: (id: string | null) => void;
  setActiveTab: (tab: 'score' | 'requirements' | 'research' | 'assets' | 'crm' | 'qa') => void;
  refreshData: () => Promise<void>;
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
  applicationAnswers: [],
  selectedJobId: null,
  activeTab: 'score',
  isLoading: true,

  // --------------------------------------------------------
  // Initialize: load all data from IndexedDB
  // --------------------------------------------------------

  initialize: async () => {
    await seedDefaultProfile();
    const [jobs, companies, contacts, contactJobLinks, activities, assets, claims, generationLogs, applicationAnswers] = await Promise.all([
      db.jobs.orderBy('updatedAt').reverse().toArray(),
      db.companies.toArray(),
      db.contacts.toArray(),
      db.contactJobLinks.toArray(),
      db.activities.orderBy('createdAt').reverse().toArray(),
      db.assets.toArray(),
      db.claims.toArray(),
      db.generationLogs.orderBy('createdAt').reverse().toArray(),
      db.applicationAnswers.toArray(),
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
      applicationAnswers,
      isLoading: false,
    });
  },

  refreshData: async () => {
    const [jobs, companies, contacts, contactJobLinks, activities, assets, claims, generationLogs, applicationAnswers] = await Promise.all([
      db.jobs.orderBy('updatedAt').reverse().toArray(),
      db.companies.toArray(),
      db.contacts.toArray(),
      db.contactJobLinks.toArray(),
      db.activities.orderBy('createdAt').reverse().toArray(),
      db.assets.toArray(),
      db.claims.toArray(),
      db.generationLogs.orderBy('createdAt').reverse().toArray(),
      db.applicationAnswers.toArray(),
    ]);
    const profile = await db.profiles.get('default');
    set({ jobs, companies, contacts, contactJobLinks, activities, assets, profile: profile || null, claims, generationLogs, applicationAnswers });
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
    await db.jobs.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await get().refreshData();
  },

  deleteJob: async (id) => {
    await db.jobs.delete(id);
    // Clean up related records
    await db.activities.where('jobId').equals(id).delete();
    await db.assets.where('jobId').equals(id).delete();
    await db.outcomes.where('jobId').equals(id).delete();
    await db.contactJobLinks.where('jobId').equals(id).delete();
    await db.applicationAnswers.where('jobId').equals(id).delete();
    if (get().selectedJobId === id) {
      set({ selectedJobId: null });
    }
    await get().refreshData();
  },

  moveJobToStage: async (id, stage) => {
    const job = await db.jobs.get(id);
    if (!job) return;
    if (isClosedWonDemotionBlocked(job.stage, stage)) return;

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

    const claims = getAutoUsableClaims(get().claims);
    const profileEvidence = buildProfileEvidenceClaim(profile);
    const result = scoreJob(job, profile, [...claims, ...profileEvidence]);
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
    if (job.stage === 'Captured') {
      updates.stage = 'Scored';
      updates.stageTimestamps = { ...job.stageTimestamps, Scored: now };
    }

    await db.jobs.update(id, updates);
    await get().refreshData();
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
    const contact: Contact = {
      id: generateId(),
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      role: contactData.role,
      companyId: contactData.companyId,
      company: contactData.company,
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
    await db.assets.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await get().refreshData();
  },

  // --------------------------------------------------------
  // Claims / Profile
  // --------------------------------------------------------

  addClaim: async (claimData) => {
    const now = new Date().toISOString();
    const claim: Claim = {
      id: generateId(),
      company: claimData.company || '',
      role: claimData.role || '',
      startDate: claimData.startDate || '',
      endDate: claimData.endDate,
      claimText: claimData.claimText,
      rawSnippet: claimData.rawSnippet,
      reviewStatus: claimData.reviewStatus,
      autoUse: claimData.autoUse,
      metric: claimData.metric,
      responsibilities: claimData.responsibilities || [],
      tools: claimData.tools || [],
      outcomes: claimData.outcomes || [],
      createdAt: now,
    };
    await db.claims.add(claim);
    await get().refreshData();
    return claim;
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
  // Application Q&A
  // --------------------------------------------------------

  addApplicationAnswer: async (answerData) => {
    const now = new Date().toISOString();
    const answer: ApplicationAnswer = {
      id: generateId(),
      jobId: answerData.jobId || '',
      question: answerData.question || '',
      answer: answerData.answer || '',
      sources: answerData.sources || [],
      approved: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.applicationAnswers.add(answer);
    await get().refreshData();
    return answer;
  },

  updateApplicationAnswer: async (id, updates) => {
    await db.applicationAnswers.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await get().refreshData();
  },

  deleteApplicationAnswer: async (id) => {
    await db.applicationAnswers.delete(id);
    await get().refreshData();
  },

  // --------------------------------------------------------
  // UI State
  // --------------------------------------------------------

  setSelectedJob: (id) => set({ selectedJobId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
