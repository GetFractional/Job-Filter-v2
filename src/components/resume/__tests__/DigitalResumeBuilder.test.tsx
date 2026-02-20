// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DigitalResumeBuilder } from '../DigitalResumeBuilder';
import type { ImportDraft } from '../../../types';

function makeDraft(): ImportDraft {
  return {
    companies: [
      {
        id: 'company-acme',
        name: 'Acme Corp',
        confidence: 0.88,
        status: 'accepted',
        sourceRefs: [],
        roles: [
          {
            id: 'role-growth',
            title: 'Growth Lead',
            startDate: 'Jan 2022',
            endDate: 'Present',
            confidence: 0.86,
            status: 'accepted',
            sourceRefs: [],
            highlights: [
              {
                id: 'highlight-acme-1',
                type: 'highlight',
                text: 'Built demand generation engine across paid and owned channels',
                confidence: 0.82,
                status: 'accepted',
                sourceRefs: [],
              },
            ],
            outcomes: [],
            tools: [
              {
                id: 'tool-acme-1',
                type: 'tool',
                text: 'HubSpot',
                confidence: 0.9,
                status: 'accepted',
                sourceRefs: [],
              },
            ],
            skills: [],
          },
        ],
      },
      {
        id: 'company-beta',
        name: 'Beta Inc',
        confidence: 0.9,
        status: 'accepted',
        sourceRefs: [],
        roles: [
          {
            id: 'role-marketing',
            title: 'Product Marketing Manager',
            startDate: 'Jan 2020',
            endDate: 'Dec 2021',
            confidence: 0.86,
            status: 'accepted',
            sourceRefs: [],
            highlights: [],
            outcomes: [],
            tools: [],
            skills: [],
          },
        ],
      },
      {
        id: 'company-unassigned',
        name: 'Unassigned',
        confidence: 0.41,
        status: 'needs_attention',
        sourceRefs: [],
        roles: [
          {
            id: 'role-unassigned',
            title: 'Unassigned',
            startDate: '',
            endDate: '',
            confidence: 0.4,
            status: 'needs_attention',
            sourceRefs: [],
            highlights: [
              {
                id: 'highlight-unassigned-1',
                type: 'highlight',
                text: 'Needs assignment item',
                confidence: 0.38,
                status: 'needs_attention',
                sourceRefs: [],
              },
            ],
            outcomes: [],
            tools: [],
            skills: [],
          },
        ],
      },
    ],
  };
}

function renderBuilder(initialDraft = makeDraft()) {
  let currentDraft = initialDraft;

  function Wrapper() {
    const [draft, setDraft] = useState(initialDraft);
    const [showAllStatuses, setShowAllStatuses] = useState(false);

    return (
      <DigitalResumeBuilder
        draft={draft}
        showAllStatuses={showAllStatuses}
        onShowAllStatusesChange={setShowAllStatuses}
        onDraftChange={(next) => {
          currentDraft = next;
          setDraft(next);
        }}
      />
    );
  }

  render(<Wrapper />);

  return {
    getDraft: () => currentDraft,
  };
}

describe('DigitalResumeBuilder', () => {
  it('supports add and delete company actions', () => {
    const { getDraft } = renderBuilder();

    fireEvent.click(screen.getByRole('button', { name: /Add Company/i }));
    expect(getDraft().companies.length).toBe(4);

    fireEvent.click(screen.getByLabelText('Delete company New Company'));
    expect(getDraft().companies.length).toBe(3);
  });

  it('moves a highlight between assigned roles', () => {
    const { getDraft } = renderBuilder();

    fireEvent.change(screen.getByTestId('move-select-highlight-acme-1'), {
      target: { value: 'company-beta::role-marketing' },
    });
    fireEvent.click(screen.getByTestId('move-button-highlight-acme-1'));

    const acmeHighlights = getDraft().companies[0].roles[0].highlights;
    const betaHighlights = getDraft().companies[1].roles[0].highlights;

    expect(acmeHighlights).toHaveLength(0);
    expect(betaHighlights.some((item) => item.text.includes('Built demand generation engine'))).toBe(true);
  });

  it('assigns selected unassigned items in bulk', () => {
    const { getDraft } = renderBuilder();

    fireEvent.click(screen.getByTestId('unassigned-toggle'));
    fireEvent.click(screen.getByRole('checkbox', { name: /Select/i }));
    fireEvent.change(screen.getByTestId('assign-selected-destination'), {
      target: { value: 'company-beta::role-marketing' },
    });
    fireEvent.click(screen.getByTestId('assign-selected-button'));

    const unassignedHighlights = getDraft().companies[2].roles[0].highlights;
    const betaHighlights = getDraft().companies[1].roles[0].highlights;

    expect(unassignedHighlights).toHaveLength(0);
    expect(betaHighlights.some((item) => item.text.includes('Needs assignment item'))).toBe(true);
  });
});
