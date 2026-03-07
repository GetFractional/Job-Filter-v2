// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileWorkspaceShell } from '../ProfileWorkspaceShell';

const initialIdentity = {
  fullName: 'Alex Morgan',
  headline: 'Growth Lead',
  email: '',
  phone: '',
  location: '',
  linkedIn: '',
  website: '',
  portfolio: '',
};

describe('ProfileWorkspaceShell', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the intro copy and activation actions', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    expect(screen.getByText('Build your profile once. Use it everywhere.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Build from my resume' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No resume? Start manually' })).toBeTruthy();
  });

  it('updates preview content while editing details', () => {
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'No resume? Start manually' }));

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Jordan Lee' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jordan@example.com' },
    });

    expect(screen.getAllByText('Jordan Lee').length).toBeGreaterThan(0);
    expect(screen.getByText(/Email:/)).toBeTruthy();
    expect(screen.getByText('jordan@example.com')).toBeTruthy();
  });

  it('frames experience import and triggers preview build animation', () => {
    vi.useFakeTimers();
    render(<ProfileWorkspaceShell mode="setup" initialIdentity={initialIdentity} />);

    fireEvent.click(screen.getByRole('button', { name: 'Build from my resume' }));

    expect(screen.getByText('Confirm your experience')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No resume? Start manually' })).toBeTruthy();
    expect(screen.getByTestId('experience-sequence')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Resume file'), {
      target: {
        files: [new File(['resume text'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start extraction' }));
    expect(screen.getByRole('button', { name: 'Extracting...' })).toBeTruthy();
    expect(screen.getByTestId('preview-build-animation')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2300);
    });

    expect(screen.getByText(/Extraction shell complete/)).toBeTruthy();
  });
});
