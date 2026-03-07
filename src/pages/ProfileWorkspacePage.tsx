import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileWorkspaceShell } from '../components/profile/ProfileWorkspaceShell';
import type { ProfileIdentityDraft } from '../components/profile/steps/ProfileDetailsStep';
import { useStore } from '../store/useStore';
import type { ProfileWorkspaceMode } from '../types';

const VALID_MODES: ProfileWorkspaceMode[] = ['setup', 'edit', 'complete'];

function parseMode(rawMode: string | null): ProfileWorkspaceMode {
  if (rawMode && VALID_MODES.includes(rawMode as ProfileWorkspaceMode)) {
    return rawMode as ProfileWorkspaceMode;
  }
  return 'setup';
}

function buildInitialIdentity(name: string | undefined): ProfileIdentityDraft {
  return {
    fullName: name ?? '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    website: '',
    portfolio: '',
  };
}

export function ProfileWorkspacePage() {
  const [searchParams] = useSearchParams();
  const profile = useStore((state) => state.profile);

  const mode = parseMode(searchParams.get('mode'));
  const initialIdentity = useMemo(() => buildInitialIdentity(profile?.name), [profile?.name]);

  return <ProfileWorkspaceShell mode={mode} initialIdentity={initialIdentity} />;
}
