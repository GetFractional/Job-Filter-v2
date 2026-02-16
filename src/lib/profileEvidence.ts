import type { Claim, Profile } from '../types';

export function buildProfileEvidenceClaim(profile: Profile): Claim[] {
  const normalizedSkills = profile.skills
    .map((skill) => skill.trim())
    .filter(Boolean);
  const normalizedTools = profile.tools
    .map((tool) => tool.trim())
    .filter(Boolean);

  if (normalizedSkills.length === 0 && normalizedTools.length === 0) {
    return [];
  }

  return [{
    id: '__profile-evidence__',
    company: 'Profile Preferences',
    role: 'Candidate Profile',
    startDate: '',
    claimText: normalizedSkills.length > 0
      ? `Core skills: ${normalizedSkills.join(', ')}`
      : undefined,
    responsibilities: normalizedSkills.length > 0
      ? [`Core skills: ${normalizedSkills.join(', ')}`]
      : [],
    tools: normalizedTools,
    outcomes: [],
    createdAt: profile.updatedAt,
    reviewStatus: 'active',
    autoUse: true,
  }];
}
