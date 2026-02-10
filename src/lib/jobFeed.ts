import type { Job, Profile } from '../types';

export interface FeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'Remote' | 'Hybrid' | 'In-person';
  source: string;
  url: string;
  jobDescription: string;
  tags: string[];
}

export interface JobMatch extends FeedJob {
  fitScore: number;
  fitLabel: 'High' | 'Medium' | 'Low';
  reasons: string[];
}

interface MatchOptions {
  query?: string;
  source?: string;
}

const MOCK_FEED: FeedJob[] = [
  {
    id: 'feed-1',
    title: 'Director of Lifecycle Marketing',
    company: 'Pepper',
    location: 'Remote (US)',
    locationType: 'Remote',
    source: 'Greenhouse',
    url: 'https://boards.greenhouse.io/pepper/jobs/director-lifecycle-marketing',
    tags: ['Lifecycle', 'B2B SaaS', 'CRM'],
    jobDescription:
      'Lead lifecycle strategy across onboarding, retention, and expansion. Own segmentation, experimentation, and cross-functional GTM planning with Product and Sales.',
  },
  {
    id: 'feed-2',
    title: 'Head of Growth Marketing',
    company: 'Northstar Labs',
    location: 'New York, NY',
    locationType: 'Hybrid',
    source: 'Lever',
    url: 'https://jobs.lever.co/northstar/head-growth-marketing',
    tags: ['Growth', 'Demand Gen', 'Leadership'],
    jobDescription:
      'Own acquisition and lifecycle growth channels. Build experiment roadmap, drive funnel performance, and lead demand generation and paid strategy.',
  },
  {
    id: 'feed-3',
    title: 'VP, Revenue Marketing',
    company: 'Arcbyte',
    location: 'Remote (US)',
    locationType: 'Remote',
    source: 'Ashby',
    url: 'https://jobs.ashbyhq.com/arcbyte/vp-revenue-marketing',
    tags: ['Revenue', 'GTM', 'Pipeline'],
    jobDescription:
      'Build enterprise revenue marketing motion. Partner with Sales leadership, own pipeline targets, and optimize full-funnel conversion.',
  },
  {
    id: 'feed-4',
    title: 'Director, Demand Generation',
    company: 'Signalpath',
    location: 'Austin, TX',
    locationType: 'Hybrid',
    source: 'Greenhouse',
    url: 'https://boards.greenhouse.io/signalpath/jobs/director-demand-generation',
    tags: ['Demand Gen', 'B2B', 'ABM'],
    jobDescription:
      'Lead integrated campaigns and ABM programs across paid, owned, and partner channels. Partner with RevOps to improve lead quality and conversion.',
  },
  {
    id: 'feed-5',
    title: 'Senior Growth Marketing Manager',
    company: 'Brightcart',
    location: 'Remote (US)',
    locationType: 'Remote',
    source: 'Company Site',
    url: 'https://careers.brightcart.com/senior-growth-marketing-manager',
    tags: ['Growth', 'Ecommerce', 'Experimentation'],
    jobDescription:
      'Own acquisition and retention tests for ecommerce growth. Analyze attribution data, optimize channels, and collaborate with Product and Analytics.',
  },
  {
    id: 'feed-6',
    title: 'Lifecycle Marketing Lead',
    company: 'Relay',
    location: 'Chicago, IL',
    locationType: 'Hybrid',
    source: 'Workday',
    url: 'https://relay.wd1.myworkdayjobs.com/en-US/relay/lifecycle-marketing-lead',
    tags: ['Lifecycle', 'Retention', 'Automation'],
    jobDescription:
      'Design customer lifecycle strategy and automate CRM journeys. Improve retention and monetization through lifecycle experimentation.',
  },
  {
    id: 'feed-7',
    title: 'Director of Product Marketing',
    company: 'Vector AI',
    location: 'San Francisco, CA',
    locationType: 'In-person',
    source: 'Lever',
    url: 'https://jobs.lever.co/vectorai/director-product-marketing',
    tags: ['Product Marketing', 'Messaging', 'Launches'],
    jobDescription:
      'Define positioning, messaging, and launch strategy for AI platform products. Partner with sales and growth to drive pipeline impact.',
  },
  {
    id: 'feed-8',
    title: 'Head of Marketing Operations',
    company: 'NimbleOps',
    location: 'Remote (US)',
    locationType: 'Remote',
    source: 'Greenhouse',
    url: 'https://boards.greenhouse.io/nimbleops/jobs/head-marketing-operations',
    tags: ['RevOps', 'Analytics', 'Automation'],
    jobDescription:
      'Lead marketing operations and lifecycle data quality. Own HubSpot + Salesforce integration, attribution, and dashboard standards.',
  },
  {
    id: 'feed-9',
    title: 'Director, Growth and Lifecycle',
    company: 'Pineworks',
    location: 'Remote (US)',
    locationType: 'Remote',
    source: 'Ashby',
    url: 'https://jobs.ashbyhq.com/pineworks/director-growth-lifecycle',
    tags: ['Growth', 'Lifecycle', 'B2C'],
    jobDescription:
      'Own growth and lifecycle strategy with strong focus on activation and retention. Build experimentation culture and performance loop.',
  },
  {
    id: 'feed-10',
    title: 'VP Marketing',
    company: 'SummitPeak',
    location: 'Denver, CO',
    locationType: 'Hybrid',
    source: 'Company Site',
    url: 'https://careers.summitpeak.io/vp-marketing',
    tags: ['Executive', 'Leadership', 'Strategy'],
    jobDescription:
      'Lead full marketing function, including demand generation, product marketing, and lifecycle programs. Own annual planning and budget.',
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function buildRoleTokenSet(profile: Profile | null): Set<string> {
  const tokens = new Set<string>();
  if (!profile) return tokens;

  for (const role of profile.targetRoles || []) {
    for (const token of tokenize(role)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function computeTitleScore(title: string, roleTokens: Set<string>): number {
  if (roleTokens.size === 0) return 35;
  const titleTokens = tokenize(title);
  if (titleTokens.length === 0) return 0;

  let hits = 0;
  for (const token of titleTokens) {
    if (roleTokens.has(token)) hits += 1;
  }
  return Math.min(55, Math.round((hits / titleTokens.length) * 55));
}

function computeLocationScore(job: FeedJob, profile: Profile | null): number {
  if (!profile) return job.locationType === 'Remote' ? 25 : 16;
  const pref = normalize(profile.locationPreference || '');
  const isRemotePreferred = pref.includes('remote');
  const mentionsHybrid = pref.includes('hybrid');
  const mentionsInPerson = pref.includes('in-person') || pref.includes('in person');
  const jobLocation = normalize(job.location);

  if (isRemotePreferred && job.locationType === 'Remote') return 30;
  if (job.locationType === 'Hybrid' && (isRemotePreferred || mentionsHybrid)) return 24;
  if (job.locationType === 'In-person' && mentionsInPerson) return 22;
  if (pref && jobLocation.includes(pref)) return 24;
  if (job.locationType === 'Remote') return 20;
  return 14;
}

function deriveReasons(job: FeedJob, score: number, profile: Profile | null): string[] {
  const reasons: string[] = [];
  const pref = normalize(profile?.locationPreference || '');
  if (job.locationType === 'Remote' && pref.includes('remote')) {
    reasons.push('Matches remote location preference');
  }
  if (job.tags.some((tag) => /lifecycle|growth|revenue|demand/i.test(tag))) {
    reasons.push('Aligned with growth/lifecycle role themes');
  }
  if (/director|head|vp/i.test(job.title)) {
    reasons.push('Leadership-level scope');
  }
  if (score >= 70) {
    reasons.push('High title and context alignment');
  }
  if (reasons.length === 0) {
    reasons.push('Potential fit worth quick review');
  }
  return reasons.slice(0, 3);
}

export function buildJobMatches(
  profile: Profile | null,
  existingJobs: Job[],
  options: MatchOptions = {}
): JobMatch[] {
  const query = normalize(options.query || '');
  const source = options.source || 'all';
  const existingKeys = new Set(
    existingJobs.map((job) => `${normalize(job.title)}::${normalize(job.company)}`)
  );
  const roleTokens = buildRoleTokenSet(profile);

  const matches: JobMatch[] = [];

  for (const job of MOCK_FEED) {
    const dedupeKey = `${normalize(job.title)}::${normalize(job.company)}`;
    if (existingKeys.has(dedupeKey)) continue;
    if (source !== 'all' && job.source !== source) continue;

    if (query) {
      const haystack = `${job.title} ${job.company} ${job.location} ${job.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) continue;
    }

    const titleScore = computeTitleScore(job.title, roleTokens);
    const locationScore = computeLocationScore(job, profile);
    const tagScore = Math.min(15, job.tags.length * 3);
    const fitScore = Math.min(99, titleScore + locationScore + tagScore);
    const fitLabel: JobMatch['fitLabel'] =
      fitScore >= 75 ? 'High' : fitScore >= 55 ? 'Medium' : 'Low';

    matches.push({
      ...job,
      fitScore,
      fitLabel,
      reasons: deriveReasons(job, fitScore, profile),
    });
  }

  return matches.sort((a, b) => b.fitScore - a.fitScore);
}

export function getFeedSources(): string[] {
  return ['all', ...Array.from(new Set(MOCK_FEED.map((job) => job.source))).sort((a, b) => a.localeCompare(b))];
}
