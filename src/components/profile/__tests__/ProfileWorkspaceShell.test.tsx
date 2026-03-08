// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ProfileWorkspaceShell } from '../ProfileWorkspaceShell';
import * as claimsImportPipeline from '../../../lib/claimsImportPipeline';
import * as importDraftBuilder from '../../../lib/importDraftBuilder';

const WORKSPACE_DRAFT_KEY = 'jf2-profile-workspace-draft:setup';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

vi.mock('../../../lib/claimsImportPipeline', () => ({
  validateClaimsImportFile: vi.fn(() => null),
  extractClaimsImportTextWithMetrics: vi.fn(async () => ({
    text: 'Acme Corp\nSenior Marketing Director\nJan 2021 - Present',
    diagnostics: {},
  })),
}));

vi.mock('../../../lib/importDraftBuilder', () => ({
  buildBestImportDraftFromText: vi.fn(() => ({
    draft: {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          confidence: 0.95,
          status: 'active',
          sourceRefs: [],
          roles: [
            {
              id: 'role-1',
              title: 'Senior Marketing Director',
              startDate: 'Jan 2021',
              endDate: '',
              currentRole: true,
              confidence: 0.91,
              status: 'active',
              sourceRefs: [],
              highlights: [],
              outcomes: [],
              tools: [],
              skills: [],
            },
          ],
        },
      ],
    },
    diagnostics: {
      extractedTextLength: 62,
      detectedLinesCount: 3,
      bulletCandidatesCount: 0,
      bulletOnlyLineCount: 0,
      sectionHeadersDetected: 0,
      companyCandidatesDetected: 1,
      roleCandidatesDetected: 1,
      finalCompaniesCount: 1,
      rolesCount: 1,
      bulletsCount: 0,
      reasonCodes: [],
      previewLines: ['Acme Corp', 'Senior Marketing Director', 'Jan 2021 - Present'],
    } as never,
    normalizedText: 'Acme Corp',
  })),
}));

const mockExtractClaimsImportTextWithMetrics = claimsImportPipeline.extractClaimsImportTextWithMetrics as unknown as Mock;
const mockBuildBestImportDraftFromText = importDraftBuilder.buildBestImportDraftFromText as unknown as Mock;

const initialIdentity = {
  firstName: 'Alex',
  lastName: 'Morgan',
  headline: 'Growth Lead',
  email: '',
  phoneCountryCode: '+1',
  phoneNational: '',
  location: '',
  linkedIn: '',
  website: '',
  portfolio: '',
};

describe('ProfileWorkspaceShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    window.localStorage.removeItem(WORKSPACE_DRAFT_KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at Start Here and resume upload initiates directly from this step', async () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    expect(screen.getAllByText('Start Here').length).toBeGreaterThan(0);
    expect(screen.getByText('Build the profile behind every strong application')).toBeTruthy();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Start Here resume file'), {
        target: {
          files: [new File(['resume'], 'resume.txt', { type: 'text/plain' })],
        },
      });
    });

    expect(screen.getByText('Your details')).toBeTruthy();
    expect(screen.queryByText('Confirm your experience')).toBeNull();

    const startStep = screen.getByTestId('step-start_here');
    expect(within(startStep).getByText('Completed')).toBeTruthy();
  });

  it('details completion is criteria-based and reversible with inline validation', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    const continueButton = screen.getByRole('button', { name: 'Save and continue' });
    fireEvent.click(continueButton);
    expect(screen.getByText('Email is required.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: '' } });
    fireEvent.click(continueButton);
    expect(screen.getByText('First name is required.')).toBeTruthy();
    expect(screen.getByText('Last name is required.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    const detailsStep = screen.getByTestId('step-details');
    expect(within(detailsStep).getByText('In progress')).toBeTruthy();

    fireEvent.click(continueButton);
    expect(within(detailsStep).getByText('Completed')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(screen.getByText('Email is required.')).toBeTruthy();
    expect(within(detailsStep).getByText('In progress')).toBeTruthy();
  });

  it('supports international-ready phone handling with US auto-formatting', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);
    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));

    fireEvent.change(screen.getByLabelText('Phone number'), {
      target: { value: '4155551212' },
    });
    expect((screen.getByLabelText('Phone number') as HTMLInputElement).value).toBe('(415) 555-1212');

    fireEvent.change(screen.getByLabelText('Phone country code'), {
      target: { value: '+44' },
    });
    fireEvent.change(screen.getByLabelText('Phone number'), {
      target: { value: '020 7123 4567' },
    });
    expect((screen.getByLabelText('Phone number') as HTMLInputElement).value).toBe('020 7123 4567');
  });

  it('starts extraction from Start Here upload and reaches ready state without a second extraction action', async () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Start Here resume file'), {
        target: {
          files: [new File(['resume'], 'resume.txt', { type: 'text/plain' })],
        },
      });
    });
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Morgan' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'alex@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(screen.getByText('resume.txt')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start extraction' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'No resume? Start manually' })).toBeNull();

    expect(mockExtractClaimsImportTextWithMetrics).toHaveBeenCalled();
    expect(mockBuildBestImportDraftFromText).toHaveBeenCalled();
    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      });
    });

    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('Senior Marketing Director')).toBeTruthy();
    expect(screen.getByText('Jan 2021 - Present')).toBeTruthy();
    const experienceStep = screen.getByTestId('step-experience');
    expect(within(experienceStep).getByText('Completed')).toBeTruthy();
  });

  it('keeps manual path selection on Start Here and removes redundant manual controls from Experience', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(screen.getByText('Manual setup path selected on Start Here')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'No resume? Start manually' })).toBeNull();
  });

  it('restores in-progress workspace state after refresh', async () => {
    const { unmount } = render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });

    await waitFor(() => {
      expect(screen.getByText('Your details')).toBeTruthy();
    });

    unmount();

    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    expect(screen.getByText('Your details')).toBeTruthy();
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Jordan');
    expect((screen.getByLabelText(/Last name/i) as HTMLInputElement).value).toBe('Lee');
  });
});
