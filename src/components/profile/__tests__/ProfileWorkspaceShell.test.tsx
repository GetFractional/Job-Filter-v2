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

function createPersistedDraft(overrides?: Record<string, unknown>) {
  return {
    version: 5,
    activeStep: 'details',
    selectedPath: 'manual',
    resumeUploadInitiated: false,
    detailsSaved: false,
    experienceConfirmed: false,
    identity: {
      ...initialIdentity,
      firstName: 'Jordan',
      lastName: 'Lee',
    },
    selectedFileName: null,
    selectedFileMeta: null,
    extractionStage: 'idle',
    extractionStarted: false,
    importError: null,
    timelineCompanies: [],
    revealedGroupCount: 0,
    prefillState: 'idle',
    prefillMessage: null,
    ...overrides,
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
    expect(screen.getByText('Turn your work history into assets that can open the right doors')).toBeTruthy();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Start Here resume file'), {
        target: {
          files: [new File(['resume'], 'resume.txt', { type: 'text/plain' })],
        },
      });
    });

    expect(screen.getByText('Confirm your details')).toBeTruthy();
    expect(screen.queryByText('Confirm your experience')).toBeNull();

    const startStep = screen.getByTestId('step-start_here');
    expect(startStep.getAttribute('data-status')).toBe('completed');
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
    expect(detailsStep.getAttribute('data-status')).toBe('in_progress');

    fireEvent.click(continueButton);
    expect(detailsStep.getAttribute('data-status')).toBe('completed');

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(screen.getByText('Email is required.')).toBeTruthy();
    expect(detailsStep.getAttribute('data-status')).toBe('in_progress');
  });

  it('supports international-ready phone handling with US auto-formatting', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);
    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));

    fireEvent.change(screen.getByLabelText('Mobile phone number'), {
      target: { value: '4155551212' },
    });
    expect((screen.getByLabelText('Mobile phone number') as HTMLInputElement).value).toBe('(415) 555-1212');

    fireEvent.click(screen.getByRole('button', { name: 'Phone country code' }));
    fireEvent.click(screen.getByRole('button', { name: /United Kingdom/i }));
    fireEvent.change(screen.getByLabelText('Mobile phone number'), {
      target: { value: '020 7123 4567' },
    });
    expect((screen.getByLabelText('Mobile phone number') as HTMLInputElement).value).toBe('020 7123 4567');
  });

  it('blocks disposable email domains and incomplete mobile phone numbers', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);
    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@yopmail.com' } });
    fireEvent.change(screen.getByLabelText('Mobile phone number'), { target: { value: '415-55' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(screen.getByText(/disposable domains are not allowed/i)).toBeTruthy();
    expect(screen.getByText('Enter a complete mobile phone number.')).toBeTruthy();
    expect(screen.getByText('Confirm your details')).toBeTruthy();
  });

  it('restores existing end month when current role is toggled off', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);
    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    if (screen.queryAllByLabelText('Company name').length === 0) {
      fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    }

    const endMonthInput = screen.getAllByLabelText('End month')[0] as HTMLInputElement;
    const currentRoleCheckbox = screen.getAllByLabelText('Current role')[0] as HTMLInputElement;
    fireEvent.change(endMonthInput, { target: { value: '2024-01' } });
    fireEvent.click(currentRoleCheckbox);
    fireEvent.click(currentRoleCheckbox);
    expect((screen.getAllByLabelText('End month')[0] as HTMLInputElement).value).toBe('2024-01');
  });

  it('requires explicit timeline confirmation before Experience is marked complete', async () => {
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

    expect(screen.queryByText('Timeline state')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Go to Start Here' })).toBeNull();

    const experienceStep = screen.getByTestId('step-experience');
    expect(experienceStep.getAttribute('data-status')).toBe('in_progress');

    if (screen.queryAllByLabelText('Company name').length === 0) {
      fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    }

    const companyInput = screen.getAllByLabelText(/Assign company|Company name/)[0] as HTMLInputElement;
    const roleTitleInput = screen.getAllByLabelText('Role title')[0] as HTMLInputElement;
    const startDateInput = screen.getAllByLabelText('Start month')[0] as HTMLInputElement;
    const currentRoleCheckbox = screen.getAllByLabelText('Current role')[0] as HTMLInputElement;

    fireEvent.change(companyInput, { target: { value: companyInput.value || 'Acme Corp' } });
    fireEvent.change(roleTitleInput, { target: { value: roleTitleInput.value || 'Senior Marketing Director' } });
    fireEvent.change(startDateInput, { target: { value: startDateInput.value || '2021-01' } });
    if (!currentRoleCheckbox.checked) {
      fireEvent.click(currentRoleCheckbox);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Confirm timeline' }));
    expect(experienceStep.getAttribute('data-status')).toBe('completed');
  });

  it('keeps manual path selection on Start Here and removes redundant manual controls from Experience', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    expect(screen.getByText('Manual timeline setup')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'No resume? Start manually' })).toBeNull();
  });

  it('renders one progress readout, visible step labels, and a collapsible top path', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    expect(screen.getAllByText(/% complete/i)).toHaveLength(1);
    expect(document.getElementById('profile-step-list')?.className).toContain('lg:grid-cols-6');
    expect(screen.getByText('Skills & Tools')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collapse step path' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse step path' }));
    expect(screen.queryByTestId('step-start_here')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand step path' })).toBeTruthy();
  });

  it('preserves manual company order after move-down and edits', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));

    let companyInputs = screen.getAllByPlaceholderText('Acme Corp') as HTMLInputElement[];
    fireEvent.change(companyInputs[0], { target: { value: 'Alpha Co' } });
    fireEvent.change(companyInputs[1], { target: { value: 'Beta Co' } });
    expect((screen.getAllByLabelText('Company name') as HTMLInputElement[]).map((input) => input.value)).toEqual(['Alpha Co', 'Beta Co']);

    fireEvent.click(screen.getByLabelText('Move company 1 down'));
    companyInputs = screen.getAllByLabelText('Company name') as HTMLInputElement[];
    expect(companyInputs.map((input) => input.value)).toEqual(['Beta Co', 'Alpha Co']);

    fireEvent.change(companyInputs[0], { target: { value: 'Beta Co Updated' } });
    expect((screen.getAllByLabelText('Company name') as HTMLInputElement[]).map((input) => input.value)).toEqual(['Beta Co Updated', 'Alpha Co']);
  });

  it('requires delete confirmation, supports undo, and can persist do-not-ask-again', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.change((screen.getAllByPlaceholderText('Acme Corp')[0] as HTMLInputElement), { target: { value: 'Alpha Co' } });

    fireEvent.click(screen.getByLabelText('Remove company'));
    expect(screen.getByTestId('experience-delete-confirmation')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/don't ask again on this device/i));
    fireEvent.click(within(screen.getByTestId('experience-delete-confirmation')).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByTestId('experience-delete-confirmation')).toBeNull();
    expect(screen.getByTestId('experience-delete-undo')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByDisplayValue('Alpha Co')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Remove company'));
    expect(screen.queryByTestId('experience-delete-confirmation')).toBeNull();
    expect(screen.getByText('No timeline rows yet. Add a company to begin confirmation.')).toBeTruthy();
  });

  it('supports dismissible bottom toasts and auto-dismiss for delete feedback', () => {
    vi.useFakeTimers();
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.change((screen.getAllByPlaceholderText('Acme Corp')[0] as HTMLInputElement), { target: { value: 'Alpha Co' } });

    fireEvent.click(screen.getByLabelText('Remove company'));
    expect(screen.getByTestId('experience-delete-confirmation')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss delete confirmation' }));
    expect(screen.queryByTestId('experience-delete-confirmation')).toBeNull();

    fireEvent.click(screen.getByLabelText('Remove company'));
    fireEvent.click(within(screen.getByTestId('experience-delete-confirmation')).getByRole('button', { name: 'Delete' }));
    expect(screen.getByTestId('experience-delete-undo')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(7_100);
    });
    expect(screen.queryByTestId('experience-delete-undo')).toBeNull();
  });

  it('focuses the first invalid timeline field when confirmation fails validation', async () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));

    const companyInput = screen.getByLabelText(/Assign company|Company name/) as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Confirm timeline' }));

    await waitFor(() => {
      expect(document.activeElement).toBe(companyInput);
    });
  });

  it('scrolls back to top after Save and continue and Confirm timeline', () => {
    const scrollToSpy = vi.fn();
    const scrollIntoViewSpy = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Object.defineProperty(window, 'scrollTo', {
      value: scrollToSpy,
      configurable: true,
      writable: true,
    });
    Element.prototype.scrollIntoView = scrollIntoViewSpy as typeof Element.prototype.scrollIntoView;

    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.change((screen.getAllByLabelText(/Assign company|Company name/)[0] as HTMLInputElement), { target: { value: 'Alpha Co' } });
    fireEvent.change((screen.getAllByLabelText('Role title')[0] as HTMLInputElement), { target: { value: 'Marketing Director' } });
    fireEvent.change((screen.getAllByLabelText('Start month')[0] as HTMLInputElement), { target: { value: '2023-01' } });
    fireEvent.change((screen.getAllByLabelText('End month')[0] as HTMLInputElement), { target: { value: '2024-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm timeline' }));

    expect(scrollToSpy).toHaveBeenCalledTimes(2);
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(2);
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('shows unresolved placement explicitly instead of fake empty-company defaults', async () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Assign company')).toBeTruthy();
    });
    expect(screen.getByText(/Needs assignment/i)).toBeTruthy();
    expect(screen.queryByDisplayValue('TN | Jun 2020')).toBeNull();
  });

  it('surfaces AffordableInsuranceQuotes responsibilities and results in preview', async () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jordan@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add company' }));
    fireEvent.change(screen.getByLabelText(/Assign company|Company name/), { target: { value: 'AffordableInsuranceQuotes' } });
    fireEvent.change(screen.getByLabelText('Role title'), { target: { value: 'Growth Marketing Manager' } });
    fireEvent.change(screen.getByLabelText('Start month'), { target: { value: '2021-01' } });
    fireEvent.click(screen.getByLabelText('Current role'));
    fireEvent.change(screen.getByPlaceholderText('Led weekly growth planning with sales and CS'), {
      target: { value: 'Built paid search and SEO workflows across 15 state campaigns.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Increased qualified pipeline by 48%'), {
      target: { value: 'Increased quote conversion rate by 41% in two quarters.' },
    });

    await waitFor(() => {
      expect(screen.getAllByText('AffordableInsuranceQuotes').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.getByText(/Built paid search and SEO workflows/i)).toBeTruthy();
    expect(screen.getByText(/Increased quote conversion rate by 41%/i)).toBeTruthy();
  });

  it('restores in-progress workspace state after refresh', async () => {
    const { unmount } = render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Jordan' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lee' } });

    await waitFor(() => {
      expect(screen.getByText('Confirm your details')).toBeTruthy();
    });

    unmount();

    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    expect(screen.getByText('Confirm your details')).toBeTruthy();
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Jordan');
    expect((screen.getByLabelText(/Last name/i) as HTMLInputElement).value).toBe('Lee');
  });

  it('can bypass and clear restored setup drafts when forceFreshSetup is enabled', () => {
    window.localStorage.setItem(WORKSPACE_DRAFT_KEY, JSON.stringify(createPersistedDraft()));

    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} forceFreshSetup />);

    expect(screen.getByText('Turn your work history into assets that can open the right doors')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Alex');
    expect((screen.getByLabelText(/Last name/i) as HTMLInputElement).value).toBe('Morgan');
    expect(window.localStorage.getItem(WORKSPACE_DRAFT_KEY)).not.toContain('Jordan');
  });
});
