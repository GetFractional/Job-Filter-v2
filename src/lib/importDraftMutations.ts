import type { ImportDraft, ImportDraftCompany, ImportDraftItem, ImportDraftRole, ImportItemStatus, ImportItemType } from '../types';

export type RoleItemCollection = 'highlights' | 'outcomes' | 'tools' | 'skills';

interface RoleRef {
  companyId: string;
  roleId: string;
}

interface ItemRef extends RoleRef {
  collection: RoleItemCollection;
  itemId: string;
}

interface RoleUpdate {
  title?: string;
  startDate?: string;
  endDate?: string;
  status?: ImportItemStatus;
}

interface ItemUpdate {
  text?: string;
  metric?: string;
  status?: ImportItemStatus;
}

const MANUAL_CONFIDENCE = 0.92;

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}`;
}

function cloneDraft(draft: ImportDraft): ImportDraft {
  if (typeof structuredClone === 'function') {
    return structuredClone(draft);
  }
  return JSON.parse(JSON.stringify(draft)) as ImportDraft;
}

export function createEmptyRole(overrides: Partial<ImportDraftRole> = {}): ImportDraftRole {
  const id = overrides.id ?? createId('role');
  return {
    id,
    title: overrides.title ?? 'New Role',
    startDate: overrides.startDate ?? '',
    endDate: overrides.endDate ?? '',
    confidence: overrides.confidence ?? MANUAL_CONFIDENCE,
    status: overrides.status ?? 'accepted',
    sourceRefs: overrides.sourceRefs ?? [],
    highlights: overrides.highlights ?? [],
    outcomes: overrides.outcomes ?? [],
    tools: overrides.tools ?? [],
    skills: overrides.skills ?? [],
  };
}

export function createEmptyCompany(overrides: Partial<ImportDraftCompany> = {}): ImportDraftCompany {
  return {
    id: overrides.id ?? createId('company'),
    name: overrides.name ?? 'New Company',
    confidence: overrides.confidence ?? MANUAL_CONFIDENCE,
    status: overrides.status ?? 'accepted',
    sourceRefs: overrides.sourceRefs ?? [],
    roles: overrides.roles ?? [createEmptyRole()],
  };
}

export function createDraftItem(type: ImportItemType, text = ''): ImportDraftItem {
  return {
    id: createId(type),
    type,
    text,
    confidence: MANUAL_CONFIDENCE,
    status: text.trim() ? 'accepted' : 'needs_attention',
    sourceRefs: [],
  };
}

function collectionToItemType(collection: RoleItemCollection): ImportItemType {
  if (collection === 'highlights') return 'highlight';
  if (collection === 'outcomes') return 'outcome';
  if (collection === 'tools') return 'tool';
  return 'skill';
}

function withCompany(draft: ImportDraft, companyId: string, mutate: (company: ImportDraftCompany) => void): ImportDraft {
  const next = cloneDraft(draft);
  const company = next.companies.find((entry) => entry.id === companyId);
  if (!company) return draft;
  mutate(company);
  return next;
}

function withRole(draft: ImportDraft, ref: RoleRef, mutate: (role: ImportDraftRole, company: ImportDraftCompany) => void): ImportDraft {
  return withCompany(draft, ref.companyId, (company) => {
    const role = company.roles.find((entry) => entry.id === ref.roleId);
    if (!role) return;
    mutate(role, company);
  });
}

function getCollection(role: ImportDraftRole, collection: RoleItemCollection): ImportDraftItem[] {
  if (collection === 'highlights') return role.highlights;
  if (collection === 'outcomes') return role.outcomes;
  if (collection === 'tools') return role.tools;
  return role.skills;
}

function setCollection(role: ImportDraftRole, collection: RoleItemCollection, values: ImportDraftItem[]): void {
  if (collection === 'highlights') {
    role.highlights = values;
    return;
  }
  if (collection === 'outcomes') {
    role.outcomes = values;
    return;
  }
  if (collection === 'tools') {
    role.tools = values;
    return;
  }
  role.skills = values;
}

export function addCompany(draft: ImportDraft): ImportDraft {
  const next = cloneDraft(draft);
  next.companies.unshift(createEmptyCompany());
  return next;
}

export function updateCompanyName(draft: ImportDraft, companyId: string, name: string): ImportDraft {
  return withCompany(draft, companyId, (company) => {
    company.name = name;
    if (name.trim() && company.status === 'needs_attention') {
      company.status = 'accepted';
      company.confidence = Math.max(company.confidence, MANUAL_CONFIDENCE);
    }
  });
}

export function deleteCompany(draft: ImportDraft, companyId: string): ImportDraft {
  const next = cloneDraft(draft);
  next.companies = next.companies.filter((company) => company.id !== companyId);
  return next;
}

export function addRole(draft: ImportDraft, companyId: string): ImportDraft {
  return withCompany(draft, companyId, (company) => {
    company.roles.unshift(createEmptyRole());
  });
}

export function updateRole(draft: ImportDraft, ref: RoleRef, updates: RoleUpdate): ImportDraft {
  return withRole(draft, ref, (role) => {
    if (typeof updates.title === 'string') role.title = updates.title;
    if (typeof updates.startDate === 'string') role.startDate = updates.startDate;
    if (typeof updates.endDate === 'string') role.endDate = updates.endDate;
    if (updates.status) role.status = updates.status;
    if ((updates.title && updates.title.trim()) || updates.startDate || updates.endDate) {
      role.confidence = Math.max(role.confidence, MANUAL_CONFIDENCE);
      if (role.status === 'needs_attention' && updates.title?.trim()) {
        role.status = 'accepted';
      }
    }
  });
}

export function deleteRole(draft: ImportDraft, ref: RoleRef): ImportDraft {
  return withCompany(draft, ref.companyId, (company) => {
    company.roles = company.roles.filter((role) => role.id !== ref.roleId);
  });
}

export function addRoleItem(draft: ImportDraft, ref: RoleRef, collection: Extract<RoleItemCollection, 'highlights' | 'outcomes'>): ImportDraft {
  return withRole(draft, ref, (role) => {
    const nextItem = createDraftItem(collectionToItemType(collection), '');
    const current = getCollection(role, collection);
    setCollection(role, collection, [nextItem, ...current]);
  });
}

export function updateRoleItem(draft: ImportDraft, ref: ItemRef, updates: ItemUpdate): ImportDraft {
  return withRole(draft, ref, (role) => {
    const collection = getCollection(role, ref.collection);
    const index = collection.findIndex((item) => item.id === ref.itemId);
    if (index === -1) return;

    const item = collection[index];
    if (typeof updates.text === 'string') {
      item.text = updates.text;
      if (updates.text.trim()) {
        item.confidence = Math.max(item.confidence, MANUAL_CONFIDENCE);
        if (item.status === 'needs_attention') {
          item.status = 'accepted';
        }
      }
    }
    if (typeof updates.metric === 'string') {
      item.metric = updates.metric;
    }
    if (updates.status) {
      item.status = updates.status;
    }

    setCollection(role, ref.collection, [...collection]);
  });
}

export function deleteRoleItem(draft: ImportDraft, ref: ItemRef): ImportDraft {
  return withRole(draft, ref, (role) => {
    const collection = getCollection(role, ref.collection);
    setCollection(
      role,
      ref.collection,
      collection.filter((item) => item.id !== ref.itemId),
    );
  });
}

export function addRoleTag(draft: ImportDraft, ref: RoleRef, collection: Extract<RoleItemCollection, 'tools' | 'skills'>, text: string): ImportDraft {
  const normalized = text.trim();
  if (!normalized) return draft;

  return withRole(draft, ref, (role) => {
    const current = getCollection(role, collection);
    if (current.some((item) => item.text.toLowerCase() === normalized.toLowerCase())) {
      return;
    }
    setCollection(role, collection, [...current, createDraftItem(collectionToItemType(collection), normalized)]);
  });
}

export function deleteRoleTag(draft: ImportDraft, ref: ItemRef): ImportDraft {
  return deleteRoleItem(draft, ref);
}

export function moveRoleItem(draft: ImportDraft, source: ItemRef, destination: RoleRef): ImportDraft {
  let movedItem: ImportDraftItem | null = null;

  const removed = withRole(draft, source, (role) => {
    const collection = getCollection(role, source.collection);
    const index = collection.findIndex((item) => item.id === source.itemId);
    if (index === -1) return;
    movedItem = collection[index];
    setCollection(
      role,
      source.collection,
      collection.filter((item) => item.id !== source.itemId),
    );
  });

  if (!movedItem) {
    return draft;
  }

  return withRole(removed, destination, (role) => {
    const targetCollection = getCollection(role, source.collection);
    const moved = {
      ...movedItem!,
      confidence: Math.max(movedItem!.confidence, MANUAL_CONFIDENCE),
      status: movedItem!.status === 'rejected' ? 'needs_attention' : movedItem!.status,
    };
    setCollection(role, source.collection, [moved, ...targetCollection]);
  });
}

export function roleHasContent(role: ImportDraftRole): boolean {
  return role.highlights.length + role.outcomes.length + role.tools.length + role.skills.length > 0;
}

export function removeEmptyContainers(draft: ImportDraft): ImportDraft {
  const next = cloneDraft(draft);
  next.companies = next.companies
    .map((company) => ({
      ...company,
      roles: company.roles.filter((role) => roleHasContent(role) || role.title.trim() || role.startDate || role.endDate),
    }))
    .filter((company) => company.roles.length > 0 || company.name.trim());
  return next;
}

export function getRoleDestinationOptions(draft: ImportDraft, includeUnassigned = true): Array<{ companyId: string; roleId: string; label: string }> {
  const options: Array<{ companyId: string; roleId: string; label: string }> = [];

  for (const company of draft.companies) {
    if (!includeUnassigned && company.name.trim().toLowerCase() === 'unassigned') {
      continue;
    }

    for (const role of company.roles) {
      if (!includeUnassigned && role.title.trim().toLowerCase() === 'unassigned') {
        continue;
      }

      options.push({
        companyId: company.id,
        roleId: role.id,
        label: `${company.name} • ${role.title || 'Untitled role'}`,
      });
    }
  }

  return options;
}
