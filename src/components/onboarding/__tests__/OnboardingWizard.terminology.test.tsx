import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from '../OnboardingWizard';

const mockState = {
  jobs: [],
  profile: {
    id: 'default',
    name: '',
    firstName: '',
    lastName: '',
    targetRoles: [],
    compFloor: 0,
    compTarget: 0,
    requiredBenefits: [],
    preferredBenefits: [],
    requiredBenefitIds: [],
    preferredBenefitIds: [],
    locationPreference: '',
    disqualifiers: [],
    locationPreferences: [],
    willingToRelocate: false,
    hardFilters: {
      requiresVisaSponsorship: false,
      minBaseSalary: 0,
      maxOnsiteDaysPerWeek: 5,
      maxTravelPercent: 100,
      employmentTypes: ['full_time_w2', 'contract', 'contract_to_hire', 'part_time', 'internship', 'temporary'],
    },
    updatedAt: new Date().toISOString(),
  },
  updateProfile: vi.fn(async () => {}),
  addClaim: vi.fn(async () => ({})),
  importSession: null,
  setImportSession: vi.fn(),
  hydrateImportSession: vi.fn(),
};

vi.mock('../../../store/useStore', () => ({
  useStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

describe('OnboardingWizard terminology guard', () => {
  it('starts onboarding with resume import after welcome', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy();
    });
    expect(screen.queryByRole('heading', { name: /Your Profile/i })).toBeNull();
  });

  it('does not expose engineering jargon on the resume step', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy();
    });

    const visibleText = document.body.textContent?.toLowerCase() || '';

    expect(/\\bclaims?\\b/.test(visibleText)).toBe(false);
    expect(/\\bbullets?\\b/.test(visibleText)).toBe(false);
    expect(/\\bhighlights?\\b/.test(visibleText)).toBe(false);
    expect(/\\bnormalized\\b/.test(visibleText)).toBe(false);
    expect(/\\bautouse\\b/.test(visibleText)).toBe(false);
    expect(/claim ledger/.test(visibleText)).toBe(false);
    expect(visibleText.includes('parsed locally in your browser')).toBe(false);
    expect(visibleText.includes('all inputs share one parser')).toBe(false);
    expect(visibleText.includes('automatically choose the best parsing method')).toBe(false);
  });

  it('includes the job feeds step before ready', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring Preferences/i })).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('150,000'), { target: { value: '150000' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Remote/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /Job Feeds/i })).toBeTruthy());
  });

  it('applies location rules by type in preferences', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring Preferences/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Remote/i }));
    expect(screen.getByText(/Remote roles do not need city or radius/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/City \(required\)/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /\+ Hybrid/i }));
    expect(screen.getByPlaceholderText(/City \(required\)/i)).toBeTruthy();
    expect(screen.getByText(/Radius \(miles\)/i)).toBeTruthy();
  });

  it('keeps location preferences empty by default and hides advanced preferences in onboarding', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring Preferences/i })).toBeTruthy());

    expect(screen.getByText(/Add at least one location preference/i)).toBeTruthy();
    expect(screen.queryByText(/Remote roles do not need city or radius/i)).toBeNull();
    expect(screen.queryByText(/Advanced Preferences/i)).toBeNull();
  });

  it('allows selecting 5 max onsite days per week', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring Preferences/i })).toBeTruthy());

    const label = screen.getByText(/Max onsite days per week/i);
    const maxOnsiteInput = label.parentElement?.querySelector('input');
    expect(maxOnsiteInput).toBeTruthy();
    fireEvent.change(maxOnsiteInput as HTMLInputElement, { target: { value: '5' } });
    expect((maxOnsiteInput as HTMLInputElement).value).toBe('5');
  });

  it('dedupes similar job feed roles using normalized keys', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Import Resume/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Scoring Preferences/i })).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('150,000'), { target: { value: '150000' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Remote/i }));

    const targetRoleInput = screen.getByPlaceholderText(/Add a role and press Enter/i);
    fireEvent.change(targetRoleInput, { target: { value: 'Marketing Director' } });
    fireEvent.keyDown(targetRoleInput, { key: 'Enter' });
    fireEvent.change(targetRoleInput, { target: { value: 'Director of Marketing' } });
    fireEvent.keyDown(targetRoleInput, { key: 'Enter' });

    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Job Feeds/i })).toBeTruthy());

    const roleInputs = screen.getAllByPlaceholderText(/Role name/i);
    expect(roleInputs).toHaveLength(1);
  });
});
