// Job Filter v2 — IndexedDB Database (via Dexie.js)
// Primary local store. Airtable sync layer will be added later.

import Dexie, { type Table } from 'dexie';
import type {
  Job,
  Company,
  Contact,
  ContactJobLink,
  Activity,
  Asset,
  Template,
  Experiment,
  Outcome,
  Profile,
  Claim,
  GenerationLog,
} from '../types';

type LegacyClaimRecord = Record<string, unknown> & {
  type?: string;
  text?: string;
  role?: string;
  company?: string;
  startDate?: string;
  metric?: string;
  isNumeric?: boolean;
  responsibilities?: unknown;
  outcomes?: unknown;
  normalizedText?: string;
  source?: string;
  confidence?: number;
  verificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

const TOOL_HINTS = new Set([
  'salesforce', 'hubspot', 'marketo', 'pardot', 'segment', 'amplitude', 'mixpanel',
  'google analytics', 'ga4', 'tableau', 'looker', 'dbt', 'snowflake', 'bigquery',
  'braze', 'iterable', 'klaviyo', 'mailchimp', 'meta ads', 'google ads', 'linkedin ads',
  'tiktok ads', 'figma', 'notion', 'jira', 'asana', 'optimizely', 'launchdarkly',
  'vwo', 'hotjar', 'fullstory', 'intercom', 'zendesk', 'drift', 'gong', 'outreach',
  'salesloft', 'clearbit', 'zoominfo', '6sense', 'demandbase', 'power bi', 'excel',
  'sql', 'shopify', 'magento', 'stripe',
]);

function normalizeClaimText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function inferLegacyClaimType(claim: LegacyClaimRecord): Claim['type'] {
  const text = String(claim.text || '').trim();
  const normalized = text.toLowerCase();
  const hasExperienceSignals =
    Boolean(claim.role) ||
    Boolean(claim.company) ||
    Boolean(claim.startDate) ||
    (Array.isArray(claim.responsibilities) && claim.responsibilities.length > 0) ||
    (Array.isArray(claim.outcomes) && claim.outcomes.length > 0);

  if (hasExperienceSignals) return 'Experience';

  if (
    Boolean(claim.metric) ||
    Boolean(claim.isNumeric) ||
    /\b(\d+%|\$[\d,.]+|\d+x|grew|increased|reduced|improved|saved|generated|drove|boosted|scaled|launched)\b/i.test(normalized)
  ) {
    return 'Outcome';
  }

  if (normalized && [...TOOL_HINTS].some((tool) => normalized === tool || normalized.includes(tool))) {
    return 'Tool';
  }

  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  if (tokenCount > 0 && tokenCount <= 5) return 'Skill';

  return 'Skill';
}

export class JobFilterDB extends Dexie {
  jobs!: Table<Job, string>;
  companies!: Table<Company, string>;
  contacts!: Table<Contact, string>;
  contactJobLinks!: Table<ContactJobLink, string>;
  activities!: Table<Activity, string>;
  assets!: Table<Asset, string>;
  templates!: Table<Template, string>;
  experiments!: Table<Experiment, string>;
  outcomes!: Table<Outcome, string>;
  profiles!: Table<Profile, string>;
  claims!: Table<Claim, string>;
  generationLogs!: Table<GenerationLog, string>;

  constructor() {
    super('JobFilterV2');

    this.version(1).stores({
      jobs: 'id, company, stage, fitLabel, createdAt, updatedAt',
      companies: 'id, name, stage, createdAt',
      contacts: 'id, companyId, name, createdAt',
      activities: 'id, jobId, contactId, companyId, channel, createdAt',
      assets: 'id, jobId, type, templateId, createdAt',
      templates: 'id, assetType, active',
      experiments: 'id, status, createdAt',
      outcomes: 'id, jobId, stage, occurredAt',
      profiles: 'id',
      claims: 'id, company, createdAt',
      generationLogs: 'id, jobId, assetId, modelTier, createdAt',
    });

    this.version(2).stores({
      contacts: 'id, companyId, firstName, lastName, createdAt',
      contactJobLinks: 'id, contactId, jobId, createdAt',
    }).upgrade((tx) => {
      // Migrate existing contacts: split name into firstName/lastName
      return tx.table('contacts').toCollection().modify((contact: Record<string, unknown>) => {
        const name = (contact.name as string) || '';
        const parts = name.trim().split(/\s+/);
        contact.firstName = parts[0] || '';
        contact.lastName = parts.slice(1).join(' ') || '';
      });
    });

    this.version(3).stores({
      jobs: 'id, company, stage, fitLabel, createdAt, updatedAt',
      companies: 'id, name, stage, createdAt',
      contacts: 'id, companyId, firstName, lastName, createdAt',
      contactJobLinks: 'id, contactId, jobId, createdAt',
      activities: 'id, jobId, contactId, companyId, channel, createdAt',
      assets: 'id, jobId, type, templateId, createdAt',
      templates: 'id, assetType, active',
      experiments: 'id, status, createdAt',
      outcomes: 'id, jobId, stage, occurredAt',
      profiles: 'id',
      claims: 'id, type, verificationStatus, source, confidence, experienceId, createdAt, updatedAt',
      generationLogs: 'id, jobId, assetId, modelTier, createdAt',
    }).upgrade((tx) => {
      return tx.table('claims').toCollection().modify((claim: LegacyClaimRecord) => {
        const now = new Date().toISOString();
        const role = ((claim.role as string) || '').trim();
        const company = ((claim.company as string) || '').trim();
        const baseText = role && company ? `${role} at ${company}` : role || company;
        claim.type = 'Experience';
        claim.text = baseText || 'Imported experience';
        claim.normalizedText = ((claim.text as string) || '').toLowerCase().trim();
        claim.source = 'Resume';
        claim.confidence = 0.7;
        claim.verificationStatus = 'Review Needed';
        claim.updatedAt = claim.updatedAt || now;
      });
    });

    this.version(4).stores({
      jobs: 'id, company, stage, fitLabel, createdAt, updatedAt',
      companies: 'id, name, stage, createdAt',
      contacts: 'id, companyId, firstName, lastName, createdAt',
      contactJobLinks: 'id, contactId, jobId, createdAt',
      activities: 'id, jobId, contactId, companyId, channel, createdAt',
      assets: 'id, jobId, type, templateId, createdAt',
      templates: 'id, assetType, active',
      experiments: 'id, status, createdAt',
      outcomes: 'id, jobId, stage, occurredAt',
      profiles: 'id',
      claims: 'id, type, verificationStatus, source, confidence, experienceId, normalizedText, createdAt, updatedAt',
      generationLogs: 'id, jobId, assetId, modelTier, createdAt',
    }).upgrade((tx) => {
      return tx.table('claims').toCollection().modify((claim: LegacyClaimRecord) => {
        const now = new Date().toISOString();
        const role = String(claim.role || '').trim();
        const company = String(claim.company || '').trim();
        const textFromExperience = role && company ? `${role} at ${company}` : role || company;
        const existingText = String(claim.text || '').trim();
        const nextText = existingText || textFromExperience || 'Imported claim';
        const inferredType = inferLegacyClaimType({ ...claim, text: nextText });
        const existingType = String(claim.type || '');
        const hasExperienceSignals =
          Boolean(role) ||
          Boolean(company) ||
          Boolean(claim.startDate) ||
          (Array.isArray(claim.responsibilities) && claim.responsibilities.length > 0) ||
          (Array.isArray(claim.outcomes) && claim.outcomes.length > 0);

        claim.text = nextText;
        claim.normalizedText = normalizeClaimText(nextText);

        if (!['Skill', 'Tool', 'Experience', 'Outcome'].includes(existingType)) {
          claim.type = inferredType;
        } else if (existingType === 'Experience' && !hasExperienceSignals && inferredType !== 'Experience') {
          // Repair older data where non-experience claims were forced to Experience.
          claim.type = inferredType;
        }

        claim.source = String(claim.source || 'Manual');
        claim.verificationStatus = String(claim.verificationStatus || 'Review Needed');
        if (typeof claim.confidence !== 'number' || Number.isNaN(claim.confidence)) {
          claim.confidence = 0.7;
        }
        claim.confidence = Math.max(0, Math.min(1, claim.confidence));
        claim.createdAt = String(claim.createdAt || now);
        claim.updatedAt = String(claim.updatedAt || now);
      });
    });
  }
}

export const db = new JobFilterDB();

// ============================================================
// Seed default profile
// ============================================================

export async function seedDefaultProfile(): Promise<void> {
  const existing = await db.profiles.count();
  if (existing === 0) {
    await db.profiles.add({
      id: 'default',
      name: 'Matt',
      targetRoles: [
        'Director of Marketing',
        'Director of Growth',
        'Head of Marketing',
        'Head of Growth',
        'VP of Marketing',
        'VP of Growth',
        'VP of Revenue',
      ],
      compFloor: 150000,
      compTarget: 180000,
      requiredBenefits: ['Medical (self + dependents)', 'Dental (self + dependents)'],
      preferredBenefits: ['401(k)', 'Bonus', 'Equity/Shares'],
      locationPreference: 'Remote preferred; hybrid/in-person OK around Nashville; any timezone OK',
      disqualifiers: [
        'Performance-marketing-operator expectations (hands-on paid account mgmt as core)',
        'Seed-stage companies (unless explicit override)',
      ],
      updatedAt: new Date().toISOString(),
    });
  }
}

// ============================================================
// Helper: Generate ID
// ============================================================

export function generateId(): string {
  return crypto.randomUUID();
}
