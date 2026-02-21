// Job Filter v2 — Core Type Definitions
// All entities map to the data model in docs/SCHEMA.md

// ============================================================
// Enums & Constants
// ============================================================

export const PIPELINE_STAGES = [
  'Discovered',
  'Captured',
  'Scored',
  'Researched',
  'Assets Ready',
  'Outreach Sent',
  'Response/Screen',
  'Interviewing',
  'Offer',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_CATEGORIES: Record<string, PipelineStage[]> = {
  Sourcing: ['Discovered', 'Captured'],
  Qualification: ['Scored', 'Researched'],
  Conversion: ['Assets Ready', 'Outreach Sent', 'Response/Screen', 'Interviewing'],
  Revenue: ['Offer', 'Negotiation', 'Closed Won', 'Closed Lost'],
};

export type FitLabel = 'Pursue' | 'Maybe' | 'Pass';

export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time' | 'Freelance' | 'Unknown';

export type LocationType = 'Remote' | 'Hybrid' | 'In-person' | 'Unknown';

export type LocationPreferenceType = 'Remote' | 'Hybrid' | 'Onsite';

export type HardFilterEmploymentType = 'ft_only' | 'exclude_contract';

export type CompanyStage =
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C+'
  | 'Public'
  | 'Profitable/Private'
  | 'Unknown';

export type ContactRelationship = 'Recruiter' | 'Hiring Manager' | 'Referrer' | 'Peer' | 'Executive' | 'Other';

export type ActivityChannel = 'Email' | 'LinkedIn' | 'Text' | 'Phone' | 'In-person' | 'Other';

export type ActivityOutcome =
  | 'Sent'
  | 'Reply Received'
  | 'Call Scheduled'
  | 'Screen Scheduled'
  | 'Interview Scheduled'
  | 'Referral Offered'
  | 'Rejected'
  | 'No Response'
  | 'Other';

export type AssetType =
  | 'Growth Memo'
  | 'Cover Letter'
  | 'Outreach Email'
  | 'LinkedIn Connect'
  | 'Follow-up Email'
  | 'Interview Prep'
  | 'Negotiation Script'
  | 'Application Answer';

export type ModelTier = 'tier-0-free' | 'tier-1-low' | 'tier-2-premium';

// ============================================================
// Core Entities
// ============================================================

export interface Job {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  url?: string;
  location?: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  compRange?: string;
  compMin?: number;
  compMax?: number;
  jobDescription: string;
  stage: PipelineStage;
  stageTimestamps: Partial<Record<PipelineStage, string>>;
  fitScore?: number;
  fitLabel?: FitLabel;
  disqualifiers: string[];
  reasonsToPursue: string[];
  reasonsToPass: string[];
  redFlags: string[];
  requirementsExtracted: Requirement[];
  scoreBreakdown?: ScoreBreakdownStored;
  researchBrief?: ResearchBrief;
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequirementPriority = 'Must' | 'Preferred';
export type RequirementMatch = 'Met' | 'Partial' | 'Missing';

export interface Requirement {
  type: 'skill' | 'experience' | 'tool' | 'education' | 'certification' | 'other';
  description: string;
  yearsNeeded?: number;
  priority: RequirementPriority;
  match: RequirementMatch;
  evidence?: string;
  jdExcerpt?: string;
}

export interface ScoreBreakdownStored {
  roleScopeAuthority: number;
  compensationBenefits: number;
  companyStageAbility: number;
  domainFit: number;
  riskPenalty: number;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  stage: CompanyStage;
  industry?: string;
  businessModel?: string;
  notes?: string;
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  companyId?: string;
  company?: string;
  email?: string;
  linkedIn?: string;
  phone?: string;
  relationship: ContactRelationship;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactJobLink {
  id: string;
  contactId: string;
  jobId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  jobId?: string;
  contactId?: string;
  companyId?: string;
  channel: ActivityChannel;
  direction: 'Outbound' | 'Inbound';
  subject?: string;
  content: string;
  templateId?: string;
  outcome?: ActivityOutcome;
  followUpDate?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  jobId: string;
  type: AssetType;
  version: number;
  content: string;
  templateId?: string;
  modelUsed?: string;
  modelTier?: ModelTier;
  approved: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  assetType: AssetType;
  promptText: string;
  variablesRequired: string[];
  defaultModelTier: ModelTier;
  tone?: string;
  version: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Experiment {
  id: string;
  name: string;
  type: 'A/B' | 'Multivariate';
  variants: ExperimentVariant[];
  successMetric: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface ExperimentVariant {
  id: string;
  templateId: string;
  modelTier?: ModelTier;
  usageCount: number;
  successCount: number;
}

export interface Outcome {
  id: string;
  jobId: string;
  stage: PipelineStage;
  occurredAt: string;
  notes?: string;
  offerBase?: number;
  offerBonus?: number;
  offerEquity?: string;
  totalComp?: number;
}

// ============================================================
// Profile & Claim Ledger
// ============================================================

export interface LocationPreference {
  id: string;
  type: LocationPreferenceType;
  city?: string;
  radiusMiles?: number;
  willingToRelocate: boolean;
}

export interface HardFilters {
  requiresVisaSponsorship: boolean;
  minBaseSalary: number;
  maxOnsiteDaysPerWeek: number;
  maxTravelPercent: number;
  employmentType: HardFilterEmploymentType;
}

export interface Profile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  targetRoles: string[];
  compFloor: number;
  compTarget: number;
  requiredBenefits: string[];
  preferredBenefits: string[];
  locationPreference: string;
  disqualifiers: string[];
  locationPreferences: LocationPreference[];
  hardFilters: HardFilters;
  digitalResume?: ImportDraft;
  updatedAt: string;
}

export type ImportItemType = 'highlight' | 'outcome' | 'tool' | 'skill';
export type ImportItemStatus = 'accepted' | 'needs_attention' | 'rejected';
export type ParseReasonCode =
  | 'TEXT_EMPTY'
  | 'BULLET_DETECT_FAIL'
  | 'LAYOUT_COLLAPSE'
  | 'FILTERED_ALL'
  | 'ROLE_DETECT_FAIL'
  | 'COMPANY_DETECT_FAIL';

export type SegmentationMode = 'default' | 'newlines' | 'bullets' | 'headings';

export interface SourceRef {
  lineIndex: number;
}

export interface ImportDraftItem {
  id: string;
  type: ImportItemType;
  text: string;
  confidence: number;
  status: ImportItemStatus;
  sourceRefs: SourceRef[];
  metric?: string;
}

export interface ImportDraftRole {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  confidence: number;
  status: ImportItemStatus;
  sourceRefs: SourceRef[];
  highlights: ImportDraftItem[];
  outcomes: ImportDraftItem[];
  tools: ImportDraftItem[];
  skills: ImportDraftItem[];
}

export interface ImportDraftCompany {
  id: string;
  name: string;
  confidence: number;
  status: ImportItemStatus;
  sourceRefs: SourceRef[];
  roles: ImportDraftRole[];
}

export interface ImportDraft {
  companies: ImportDraftCompany[];
}

export interface ParseDiagnostics {
  mode?: SegmentationMode;
  selectedMode?: SegmentationMode;
  extractedTextLength: number;
  pageCount?: number;
  detectedLinesCount: number;
  bulletCandidatesCount: number;
  bulletOnlyLineCount: number;
  topBulletGlyphs?: { glyph: string; count: number }[];
  sectionHeadersDetected: number;
  companyCandidatesDetected: number;
  roleCandidatesDetected: number;
  timeframeCandidatesCount?: number;
  finalCompaniesCount: number;
  rolesCount: number;
  bulletsCount: number;
  reasonCodes: ParseReasonCode[];
  previewLines: string[];
  previewLinesWithNumbers?: { line: number; text: string }[];
  candidateModes?: Array<{
    mode: SegmentationMode;
    score: number;
    reasonCodes: ParseReasonCode[];
    counts: {
      companies: number;
      roles: number;
      items: number;
      bulletCandidates: number;
    };
  }>;
  extractionStage?: {
    pageCount?: number;
    extractedChars: number;
    detectedLinesCount: number;
    bulletCandidatesCount: number;
    bulletOnlyLineCount: number;
    topBulletGlyphs: { glyph: string; count: number }[];
  };
  segmentationStage?: {
    detectedLinesCount: number;
    bulletCandidatesCount: number;
    bulletOnlyLineCount: number;
    topBulletGlyphs: { glyph: string; count: number }[];
    sectionHeadersDetected: number;
  };
  mappingStage?: {
    companyCandidatesCount: number;
    roleCandidatesCount: number;
    timeframeCandidatesCount: number;
    finalCompaniesCount: number;
    finalRolesCount: number;
    finalItemsCount: number;
  };
}

export interface CompensationSuggestion {
  floor?: number;
  target?: number;
}

export interface HardFilterSuggestion {
  requiresVisaSponsorship?: boolean;
  minBaseSalary?: number;
  maxOnsiteDaysPerWeek?: number;
  maxTravelPercent?: number;
  employmentType?: 'full_time_only' | 'exclude_contract';
}

export interface ProfilePrefillSuggestion {
  firstName?: string;
  lastName?: string;
  targetRoles: string[];
  locationHints: string[];
  compensation?: CompensationSuggestion;
  hardFilterHints?: HardFilterSuggestion;
}

export interface ImportSourceMeta {
  inputKind: 'upload' | 'paste';
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface ImportSession {
  id: string;
  mode: SegmentationMode;
  selectedMode?: SegmentationMode;
  lowQuality?: boolean;
  troubleshootAvailableModes?: SegmentationMode[];
  sourceMeta?: ImportSourceMeta;
  draft: ImportDraft;
  diagnostics: ParseDiagnostics;
  profileSuggestion: ProfilePrefillSuggestion;
  state: 'parsed' | 'saved' | 'skipped';
  updatedAt: string;
  storage: 'localStorage' | 'sessionStorage' | 'memory';
}

export interface Claim {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  responsibilities: string[];
  tools: string[];
  outcomes: ClaimOutcome[];
  createdAt: string;
}

export interface ClaimOutcome {
  description: string;
  metric?: string;
  isNumeric: boolean;
  verified: boolean;
}

// ============================================================
// Research
// ============================================================

export interface ResearchBrief {
  companyOverview?: string;
  businessModel?: string;
  icp?: string;
  competitors?: string;
  gtmChannels?: string;
  orgLeadership?: string;
  risks?: string;
  interviewHypotheses?: string[];
  compSignals?: string;
  sources?: ResearchSource[];
  rawPasteContent?: string;
  createdAt: string;
}

export interface ResearchSource {
  label: string;
  url?: string;
  excerpt?: string;
}

// ============================================================
// Generation Log (for cost tracking)
// ============================================================

export interface GenerationLog {
  id: string;
  jobId?: string;
  assetId?: string;
  templateId?: string;
  promptId?: string;
  modelUsed: string;
  modelTier: ModelTier;
  estimatedCost: number;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: string;
}

// ============================================================
// Application Q&A
// ============================================================

export interface ApplicationAnswer {
  id: string;
  jobId: string;
  question: string;
  answer: string;
  sources: AnswerSource[];
  approved: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerSource {
  type: 'claim' | 'research' | 'profile';
  label: string;
  excerpt: string;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface FunnelMetrics {
  totalCaptured: number;
  pursueRate: number;
  outreachVolume: number;
  responseRate: number;
  screenRate: number;
  interviewRate: number;
  offerRate: number;
  pipelineByStage: Record<PipelineStage, number>;
  capturedThisWeek: number;
  capturedLastWeek: number;
}

export interface BottleneckMetrics {
  conversionByStage: Record<string, number>;
  medianTimeInStage: Record<PipelineStage, number>;
  stalledJobs: Job[];
}
