// Job Filter v2 — IndexedDB Database (via Dexie.js)
// Primary local store. Airtable sync layer will be added later.

import Dexie, { type Table } from 'dexie';
import type {
  Job,
  Company,
  Contact,
  Activity,
  Asset,
  Template,
  Experiment,
  Outcome,
  Profile,
  Claim,
  GenerationLog,
} from '../types';

export class JobFilterDB extends Dexie {
  jobs!: Table<Job, string>;
  companies!: Table<Company, string>;
  contacts!: Table<Contact, string>;
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
