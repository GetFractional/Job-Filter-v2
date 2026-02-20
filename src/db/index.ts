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
  ApplicationAnswer,
} from '../types';
import { createEmptyProfile } from '../lib/profileState';

export const DB_SCHEMA_VERSION = 3;

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
  applicationAnswers!: Table<ApplicationAnswer, string>;

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
      return tx.table('contacts').toCollection().modify((contact: Record<string, unknown>) => {
        const name = (contact.name as string) || '';
        const parts = name.trim().split(/\s+/);
        contact.firstName = parts[0] || '';
        contact.lastName = parts.slice(1).join(' ') || '';
      });
    });

    this.version(DB_SCHEMA_VERSION).stores({
      applicationAnswers: 'id, jobId, createdAt',
    });
  }
}

export const db = new JobFilterDB();

// ============================================================
// Ensure a baseline profile record exists
// ============================================================

export async function seedDefaultProfile(): Promise<void> {
  const existing = await db.profiles.count();
  if (existing === 0) {
    await db.profiles.add(createEmptyProfile());
  }
}

// ============================================================
// Helper: Generate ID
// ============================================================

export function generateId(): string {
  return crypto.randomUUID();
}
