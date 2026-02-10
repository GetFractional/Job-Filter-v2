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
  | 'Negotiation Script';

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
  jdEvidence?: string;
  userEvidence?: string;
  gapSeverity?: 'None' | 'Low' | 'Medium' | 'High';
  evidence?: string;
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

export interface Profile {
  id: string;
  name: string;
  targetRoles: string[];
  compFloor: number;
  compTarget: number;
  requiredBenefits: string[];
  preferredBenefits: string[];
  locationPreference: string;
  disqualifiers: string[];
  updatedAt: string;
}

export type ClaimType = 'Skill' | 'Tool' | 'Experience' | 'Outcome';

export type ClaimSource = 'Resume' | 'LinkedIn' | 'Manual' | 'Interview';

export type ClaimVerificationStatus = 'Approved' | 'Review Needed' | 'Rejected';

export interface Claim {
  id: string;
  type: ClaimType;
  text: string;
  normalizedText: string;
  source: ClaimSource;
  evidenceSnippet?: string;
  confidence: number; // 0..1
  verificationStatus: ClaimVerificationStatus;
  experienceId?: string;
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  tools?: string[];
  outcomes?: ClaimOutcome[];
  metric?: string;
  isNumeric?: boolean;
  createdAt: string;
  updatedAt: string;
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
  companyIdentity?: string;
  companyOverview?: string;
  businessModel?: string;
  icp?: string;
  competitors?: string;
  gtmChannels?: string;
  orgLeadership?: string;
  risks?: string;
  interviewHypotheses?: string[];
  compSignals?: string;
  rawPasteContent?: string;
  createdAt: string;
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
