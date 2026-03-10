import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileWorkspaceShell } from '../components/profile/ProfileWorkspaceShell';
import type { ProfileIdentityDraft } from '../components/profile/steps/ProfileDetailsStep';
import { DEFAULT_PHONE_COUNTRY_CODE } from '../components/profile/steps/profilePhone';
import { useStore } from '../store/useStore';
import type { ProfileWorkspaceMode } from '../types';

const VALID_MODES: ProfileWorkspaceMode[] = ['setup', 'edit', 'complete'];

function parseMode(rawMode: string | null): ProfileWorkspaceMode {
  if (rawMode && VALID_MODES.includes(rawMode as ProfileWorkspaceMode)) {
    return rawMode as ProfileWorkspaceMode;
  }
  return 'setup';
}

function parseFreshSetupFlag(searchParams: URLSearchParams): boolean {
  const raw = searchParams.get('fresh') ?? searchParams.get('reset');
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function splitNameParts(
  firstName: string | undefined,
  lastName: string | undefined,
  fallbackName: string | undefined,
): { firstName: string; lastName: string } {
  const providedFirst = (firstName ?? '').trim();
  const providedLast = (lastName ?? '').trim();
  if (providedFirst || providedLast) {
    return { firstName: providedFirst, lastName: providedLast };
  }

  const trimmed = (fallbackName ?? '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function buildInitialIdentity(
  name: string | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
): ProfileIdentityDraft {
  const resolvedName = splitNameParts(firstName, lastName, name);
  return {
    firstName: resolvedName.firstName,
    lastName: resolvedName.lastName,
    headline: '',
    email: '',
    phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
    phoneNational: '',
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
  const forceFreshSetup = mode === 'setup' && parseFreshSetupFlag(searchParams);
  const initialIdentity = useMemo(
    () => (mode === 'setup'
      ? buildInitialIdentity(undefined, undefined, undefined)
      : buildInitialIdentity(profile?.name, profile?.firstName, profile?.lastName)),
    [mode, profile?.firstName, profile?.lastName, profile?.name],
  );

  return <ProfileWorkspaceShell mode={mode} initialIdentity={initialIdentity} forceFreshSetup={forceFreshSetup} />;
}
