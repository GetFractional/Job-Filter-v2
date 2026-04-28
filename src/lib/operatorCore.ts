import type {
  OperatorCoreState,
  OperatorLane,
  OperatorStory,
  OperatorStoryMetricMode,
  OperatorTargetJob,
  Profile,
} from '../types';

export interface TimelineRoleLike {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  currentRole?: boolean;
  responsibilities: string[];
  results: string[];
}

export interface TimelineCompanyLike {
  id: string;
  company: string;
  roles: TimelineRoleLike[];
}

interface BuildOperatorCoreOptions {
  headline?: string;
  targetRoles?: string[];
  timelineCompanies: TimelineCompanyLike[];
  previous?: OperatorCoreState | null;
}

interface StoryLineage {
  companyId: string;
  companyName: string;
  role: TimelineRoleLike;
  roleIndex: number;
}

const STOP_WORDS = new Set([
  'and',
  'of',
  'for',
  'the',
  'to',
  'in',
  'at',
  'on',
  'with',
  'lead',
  'senior',
  'principal',
  'head',
]);

const METRIC_RE = /(?:[$€£]\s?\d|\b\d+(?:[.,]\d+)?%|\b\d+(?:[.,]\d+)?x\b|\b\d+[kKmMbB]\b|\b\d{2,}\b)/;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sentenceCase(value: string): string {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function toLaneId(title: string): string {
  return `lane-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'operator'}`;
}

function uniqueTitles(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map(normalizeWhitespace).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function tokenize(value: string): string[] {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function overlapScore(left: string, right: string): number {
  const leftTokens = tokenize(left);
  const rightTokens = new Set(tokenize(right));
  return leftTokens.reduce((count, token) => count + (rightTokens.has(token) ? 1 : 0), 0);
}

function countLaneRoleMatches(title: string, companies: TimelineCompanyLike[]): { matchCount: number; sourceRoleTitles: string[] } {
  const roleTitles = companies.flatMap((company) => company.roles.map((role) => role.title));
  const sourceRoleTitles = roleTitles.filter((roleTitle) => overlapScore(title, roleTitle) > 0);
  return {
    matchCount: sourceRoleTitles.length,
    sourceRoleTitles: uniqueTitles(sourceRoleTitles),
  };
}

function buildLaneFitReasons(title: string, headline: string | undefined, matchCount: number, sourceRoleTitles: string[]): string[] {
  const reasons: string[] = [];
  if (headline && overlapScore(title, headline) > 0) {
    reasons.push('Matches the title direction already present in your profile truth.');
  }
  if (matchCount > 0) {
    reasons.push(`Backed by ${matchCount} role ${matchCount === 1 ? 'anchor' : 'anchors'} in your experience.`);
  }
  if (sourceRoleTitles.length > 0) {
    reasons.push(`Closest evidence comes from ${sourceRoleTitles.slice(0, 2).join(' and ')}.`);
  }
  if (reasons.length === 0) {
    reasons.push('Use this lane when it best reflects the roles you want populating in your search lanes.');
  }
  return reasons;
}

function buildLanes(headline: string | undefined, targetRoles: string[] | undefined, timelineCompanies: TimelineCompanyLike[]): OperatorLane[] {
  const roleTitles = timelineCompanies.flatMap((company) => company.roles.map((role) => role.title));
  const laneTitles = uniqueTitles([
    ...(targetRoles ?? []),
    headline ?? '',
    ...roleTitles,
  ]).slice(0, 4);

  const titles = laneTitles.length > 0
    ? laneTitles
    : uniqueTitles(roleTitles).slice(0, 3);

  return titles.map((title) => {
    const { matchCount, sourceRoleTitles } = countLaneRoleMatches(title, timelineCompanies);
    return {
      id: toLaneId(title),
      title,
      fitReasons: buildLaneFitReasons(title, headline, matchCount, sourceRoleTitles),
      sourceRoleTitles,
    };
  });
}

function hasNumericContent(value: string): boolean {
  return METRIC_RE.test(value);
}

function softenMetricText(value: string): string {
  const withoutMetrics = normalizeWhitespace(
    value
      .replace(/\b\d+(?:[.,]\d+)?%/g, 'meaningfully')
      .replace(/\b\d+(?:[.,]\d+)?x\b/gi, 'significantly')
      .replace(/\b\d+[kKmMbB]\b/g, 'at meaningful scale')
      .replace(/\b\d{2,}\b/g, 'measurable')
      .replace(/[$€£]\s?\d+(?:[.,]\d+)?/g, 'commercially meaningful'),
  );

  if (!withoutMetrics) {
    return 'Delivered measurable improvement that should be reviewed before sending.';
  }
  return sentenceCase(withoutMetrics);
}

function buildStoryId(lineage: StoryLineage, kind: 'result' | 'responsibility', itemIndex: number): string {
  return `${lineage.companyId}:${lineage.role.id}:${kind}:${itemIndex}`;
}

function resolveLaneIds(roleTitle: string, lanes: OperatorLane[]): string[] {
  const matched = lanes
    .filter((lane) => overlapScore(roleTitle, lane.title) > 0)
    .map((lane) => lane.id);
  if (matched.length > 0) return matched;
  return lanes.map((lane) => lane.id);
}

function buildProofNotes(hasNumericOutcome: boolean, hasResponsibilities: boolean): string[] {
  const notes: string[] = [];
  if (hasNumericOutcome) {
    notes.push('Numeric result defaults to safer wording until you explicitly approve exact phrasing.');
  }
  if (!hasResponsibilities) {
    notes.push('Outcome is present, but the action context is thin. Review before sending.');
  }
  return notes;
}

function buildStoryFromOutcome(lineage: StoryLineage, outcome: string, itemIndex: number, lanes: OperatorLane[], previousMap: Map<string, OperatorStory>): OperatorStory {
  const actions = lineage.role.responsibilities.map(sentenceCase).filter(Boolean).slice(0, 2);
  const storyId = buildStoryId(lineage, 'result', itemIndex);
  const previous = previousMap.get(storyId);
  const hasNumericOutcome = hasNumericContent(outcome);
  const metricMode: OperatorStoryMetricMode = previous?.metricMode ?? (hasNumericOutcome ? 'softened' : 'plain');
  const safeOutcome = hasNumericOutcome ? softenMetricText(outcome) : sentenceCase(outcome);

  return {
    id: storyId,
    title: `${lineage.companyName} · ${lineage.role.title}`,
    company: lineage.companyName,
    role: lineage.role.title,
    laneIds: resolveLaneIds(lineage.role.title, lanes),
    sourceRoleId: lineage.role.id,
    sourceCompanyId: lineage.companyId,
    challenge: actions[0] || `Led ${lineage.role.title.toLowerCase()} work that maps to this lane.`,
    actions,
    outcome: sentenceCase(outcome),
    safeOutcome,
    metricMode,
    approved: previous?.approved ?? true,
    hasNumericOutcome,
    proofNotes: buildProofNotes(hasNumericOutcome, actions.length > 0),
  };
}

function buildStoryFromResponsibility(lineage: StoryLineage, responsibility: string, itemIndex: number, lanes: OperatorLane[], previousMap: Map<string, OperatorStory>): OperatorStory {
  const storyId = buildStoryId(lineage, 'responsibility', itemIndex);
  const previous = previousMap.get(storyId);
  const cleaned = sentenceCase(responsibility);

  return {
    id: storyId,
    title: `${lineage.companyName} · ${lineage.role.title}`,
    company: lineage.companyName,
    role: lineage.role.title,
    laneIds: resolveLaneIds(lineage.role.title, lanes),
    sourceRoleId: lineage.role.id,
    sourceCompanyId: lineage.companyId,
    challenge: cleaned,
    actions: [cleaned],
    outcome: cleaned,
    safeOutcome: cleaned,
    metricMode: previous?.metricMode ?? 'plain',
    approved: previous?.approved ?? true,
    hasNumericOutcome: false,
    proofNotes: ['Use this as support context, not as a standalone proof spike.'],
  };
}

function buildStories(timelineCompanies: TimelineCompanyLike[], lanes: OperatorLane[], previousStories: OperatorStory[] = []): OperatorStory[] {
  const previousMap = new Map(previousStories.map((story) => [story.id, story]));

  return timelineCompanies.flatMap((company, companyIndex) => (
    company.roles.flatMap((role, roleIndex) => {
      const lineage: StoryLineage = {
        companyId: company.id || `company-${companyIndex}`,
        companyName: company.company,
        role,
        roleIndex,
      };
      const cleanedResults = role.results.map(sentenceCase).filter(Boolean);
      if (cleanedResults.length > 0) {
        return cleanedResults.map((result, resultIndex) => buildStoryFromOutcome(lineage, result, resultIndex, lanes, previousMap));
      }
      const cleanedResponsibilities = role.responsibilities.map(sentenceCase).filter(Boolean);
      return cleanedResponsibilities.slice(0, 1).map((responsibility, responsibilityIndex) => (
        buildStoryFromResponsibility(lineage, responsibility, responsibilityIndex, lanes, previousMap)
      ));
    })
  ));
}

function coerceTargetJob(previous?: OperatorTargetJob): OperatorTargetJob {
  return {
    title: previous?.title ?? '',
    company: previous?.company ?? '',
    url: previous?.url ?? '',
    location: previous?.location ?? '',
    jobDescription: previous?.jobDescription ?? '',
  };
}

export function buildOperatorCoreState({
  headline,
  targetRoles,
  timelineCompanies,
  previous,
}: BuildOperatorCoreOptions): OperatorCoreState {
  const lanes = buildLanes(headline, targetRoles, timelineCompanies);
  const selectedLaneId = previous?.selectedLaneId && lanes.some((lane) => lane.id === previous.selectedLaneId)
    ? previous.selectedLaneId
    : (lanes[0]?.id ?? null);
  const stories = buildStories(timelineCompanies, lanes, previous?.stories);
  const targetJob = coerceTargetJob(previous?.assetBrief?.targetJob);
  const approvedStoryIds = stories.filter((story) => story.approved).map((story) => story.id);
  const softenedStoryIds = stories.filter((story) => story.approved && story.metricMode === 'softened').map((story) => story.id);
  const excludedStoryIds = stories.filter((story) => !story.approved).map((story) => story.id);

  return {
    lanes,
    selectedLaneId,
    stories,
    assetBrief: {
      selectedLaneId,
      approvedStoryIds,
      softenedStoryIds,
      excludedStoryIds,
      targetJob,
      generatedJobId: previous?.assetBrief?.generatedJobId,
      resumeAssetId: previous?.assetBrief?.resumeAssetId,
      coverLetterAssetId: previous?.assetBrief?.coverLetterAssetId,
      generatedAt: previous?.assetBrief?.generatedAt,
    },
  };
}

export function buildOperatorReviewSummary(stories: OperatorStory[]) {
  return {
    approvedCount: stories.filter((story) => story.approved).length,
    softenedCount: stories.filter((story) => story.approved && story.metricMode === 'softened').length,
    exactCount: stories.filter((story) => story.approved && story.metricMode === 'exact').length,
    excludedCount: stories.filter((story) => !story.approved).length,
  };
}

function resolveStoryOutcome(story: OperatorStory): string {
  if (story.metricMode === 'exact') return story.outcome;
  return story.safeOutcome;
}

function buildContactLine(profile: Profile): string {
  return [
    profile.email,
    profile.phoneNational ? `${profile.phoneCountryCode ?? '+1'} ${profile.phoneNational}` : '',
    profile.location,
  ].filter(Boolean).join(' | ');
}

function buildLinkLine(profile: Profile): string {
  return [profile.linkedIn, profile.website || profile.portfolio].filter(Boolean).join(' | ');
}

function groupStoriesByCompany(stories: OperatorStory[]): Array<{ company: string; role: string; items: OperatorStory[] }> {
  const grouped = new Map<string, { company: string; role: string; items: OperatorStory[] }>();
  for (const story of stories) {
    const key = `${story.company}::${story.role}`;
    if (!grouped.has(key)) {
      grouped.set(key, { company: story.company, role: story.role, items: [] });
    }
    grouped.get(key)?.items.push(story);
  }
  return [...grouped.values()];
}

function buildProfessionalSummary(profile: Profile, lane: OperatorLane, job: OperatorTargetJob, stories: OperatorStory[]): string {
  const firstStory = stories[0];
  const summaryBits = [
    `${profile.name || 'Candidate'} is targeting ${lane.title} roles`,
    job.company ? `with a live focus on ${job.title} at ${job.company}` : '',
    firstStory ? `and brings evidence from ${firstStory.company} where they ${resolveStoryOutcome(firstStory).toLowerCase()}` : '',
  ].filter(Boolean);

  return sentenceCase(summaryBits.join(' ')) + '.';
}

export function buildResumeAssetContent(params: {
  profile: Profile;
  lane: OperatorLane;
  targetJob: OperatorTargetJob;
  stories: OperatorStory[];
}): string {
  const { profile, lane, targetJob, stories } = params;
  const contactLine = buildContactLine(profile);
  const linkLine = buildLinkLine(profile);
  const groupedStories = groupStoriesByCompany(stories);

  const sections = [
    `${profile.name || 'Candidate Name'}`,
    lane.title,
    contactLine,
    linkLine,
    '',
    'TARGET',
    `${targetJob.title || 'Target role'}${targetJob.company ? ` | ${targetJob.company}` : ''}${targetJob.location ? ` | ${targetJob.location}` : ''}`,
    '',
    'SUMMARY',
    buildProfessionalSummary(profile, lane, targetJob, stories),
    '',
    'GUIDED STORY PROOF',
    ...groupedStories.flatMap((group) => [
      `${group.role} | ${group.company}`,
      ...group.items.slice(0, 3).map((story) => `- ${story.challenge}${story.actions.length > 1 ? `; ${story.actions[1]}` : ''}. ${resolveStoryOutcome(story)}`),
      '',
    ]),
    'REVIEW BEFORE SEND',
    '- Only approved stories appear here.',
    '- Softened metric language is preserved unless exact wording was explicitly approved.',
    '- Unsupported or excluded claims stay out of this draft.',
  ];

  return sections.filter((line, index, list) => !(line === '' && list[index - 1] === '')).join('\n');
}

export function buildCoverLetterAssetContent(params: {
  profile: Profile;
  lane: OperatorLane;
  targetJob: OperatorTargetJob;
  stories: OperatorStory[];
}): string {
  const { profile, lane, targetJob, stories } = params;
  const opener = targetJob.company
    ? `I am applying for the ${targetJob.title} role at ${targetJob.company}.`
    : `I am applying for the ${targetJob.title || lane.title} role.`;
  const topStories = stories.slice(0, 3);

  const evidenceParagraph = topStories.length > 0
    ? topStories
      .map((story) => `At ${story.company}, as ${story.role}, I ${resolveStoryOutcome(story).replace(/\.$/, '')}.`)
      .join(' ')
    : `My background combines profile truth, lane clarity, and reviewed proof for ${lane.title} work.`;

  return [
    'Dear Hiring Team,',
    '',
    opener,
    '',
    `I am pursuing this through a ${lane.title} lane built from my canonical profile, approved stories, and review-before-send proof checks.`,
    '',
    evidenceParagraph,
    '',
    targetJob.jobDescription
      ? `What stands out in your target brief is the need to run the search with clear role targeting, credible evidence, and lightweight execution discipline. That is the operating posture I bring.`
      : `What I would bring immediately is a structured operator workflow: clear lane selection, grounded story proof, and assets that stay reviewable before anything is sent.`,
    '',
    'Thank you for your consideration.',
    `${profile.name || 'Candidate Name'}`,
  ].join('\n');
}

export function applyStoryApproval(stories: OperatorStory[], storyId: string, approved: boolean): OperatorStory[] {
  return stories.map((story) => (story.id === storyId ? { ...story, approved } : story));
}

export function applyStoryMetricMode(stories: OperatorStory[], storyId: string, metricMode: OperatorStoryMetricMode): OperatorStory[] {
  return stories.map((story) => (story.id === storyId ? { ...story, metricMode } : story));
}

export function updateTargetJob(targetJob: OperatorTargetJob, updates: Partial<OperatorTargetJob>): OperatorTargetJob {
  return {
    ...targetJob,
    ...updates,
  };
}

export function canGenerateOperatorAssets(targetJob: OperatorTargetJob, stories: OperatorStory[], selectedLaneId: string | null): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!selectedLaneId) missing.push('selected lane');
  if (!targetJob.title.trim()) missing.push('job title');
  if (!targetJob.company.trim()) missing.push('company');
  if (!targetJob.jobDescription.trim()) missing.push('job context');
  if (stories.filter((story) => story.approved).length === 0) missing.push('approved stories');

  return {
    valid: missing.length === 0,
    missing,
  };
}
