export interface BenefitCatalogItem {
  id: string;
  label: string;
  category: 'Health' | 'Financial' | 'Time Off' | 'Flexibility' | 'Family';
  keywords: string[];
}

export const BENEFITS_CATALOG: BenefitCatalogItem[] = [
  { id: 'health_medical', label: 'Medical insurance', category: 'Health', keywords: ['medical', 'health insurance'] },
  { id: 'health_dental', label: 'Dental insurance', category: 'Health', keywords: ['dental'] },
  { id: 'health_vision', label: 'Vision insurance', category: 'Health', keywords: ['vision'] },
  { id: 'health_hsa_fsa', label: 'HSA/FSA', category: 'Health', keywords: ['hsa', 'fsa'] },
  { id: 'financial_401k_match', label: '401(k) match', category: 'Financial', keywords: ['401k', '401(k)', 'retirement match'] },
  { id: 'financial_equity', label: 'Equity / stock', category: 'Financial', keywords: ['equity', 'stock', 'rsu', 'options'] },
  { id: 'financial_bonus', label: 'Annual bonus', category: 'Financial', keywords: ['bonus', 'incentive'] },
  { id: 'financial_commission', label: 'Commission', category: 'Financial', keywords: ['commission'] },
  { id: 'financial_life_insurance', label: 'Life insurance', category: 'Financial', keywords: ['life insurance'] },
  { id: 'timeoff_pto', label: 'Paid time off (PTO)', category: 'Time Off', keywords: ['pto', 'paid time off', 'vacation'] },
  { id: 'timeoff_sick', label: 'Paid sick leave', category: 'Time Off', keywords: ['sick leave', 'sick time'] },
  { id: 'timeoff_parental', label: 'Parental leave', category: 'Family', keywords: ['parental leave', 'maternity', 'paternity'] },
  { id: 'timeoff_holidays', label: 'Paid holidays', category: 'Time Off', keywords: ['holidays'] },
  { id: 'flex_remote', label: 'Remote-friendly', category: 'Flexibility', keywords: ['remote', 'work from home'] },
  { id: 'flex_hybrid', label: 'Hybrid schedule', category: 'Flexibility', keywords: ['hybrid'] },
  { id: 'flex_flexible_hours', label: 'Flexible hours', category: 'Flexibility', keywords: ['flexible hours', 'flex schedule'] },
  { id: 'family_childcare', label: 'Childcare support', category: 'Family', keywords: ['childcare'] },
  { id: 'family_fertility', label: 'Fertility support', category: 'Family', keywords: ['fertility'] },
  { id: 'learning_budget', label: 'Learning budget', category: 'Financial', keywords: ['learning budget', 'education stipend'] },
  { id: 'wellness_stipend', label: 'Wellness stipend', category: 'Health', keywords: ['wellness stipend', 'wellness'] },
];

const BENEFIT_BY_ID = new Map(BENEFITS_CATALOG.map((item) => [item.id, item]));

function normalizeLabel(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

export function sanitizeBenefitIds(ids: string[] | undefined): string[] {
  if (!ids) return [];
  return [...new Set(ids.filter((id) => BENEFIT_BY_ID.has(id)))];
}

export function benefitIdsToLabels(ids: string[] | undefined): string[] {
  return sanitizeBenefitIds(ids).map((id) => BENEFIT_BY_ID.get(id)?.label ?? id);
}

export function legacyBenefitsToIds(values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];

  const normalizedCatalog = BENEFITS_CATALOG.map((item) => ({
    ...item,
    normalizedLabel: normalizeLabel(item.label),
    normalizedKeywords: item.keywords.map(normalizeLabel),
  }));

  const ids: string[] = [];
  for (const value of values) {
    const normalized = normalizeLabel(value);
    if (!normalized) continue;

    const exact = normalizedCatalog.find((item) => item.normalizedLabel === normalized);
    if (exact) {
      ids.push(exact.id);
      continue;
    }

    const keyword = normalizedCatalog.find((item) => item.normalizedKeywords.some((term) => normalized.includes(term)));
    if (keyword) {
      ids.push(keyword.id);
    }
  }

  return sanitizeBenefitIds(ids);
}

export function searchBenefitCatalog(query: string, selectedIds: string[], limit = 8): BenefitCatalogItem[] {
  const normalized = normalizeLabel(query);
  const selected = new Set(selectedIds);

  const filtered = BENEFITS_CATALOG.filter((item) => {
    if (selected.has(item.id)) return false;
    if (!normalized) return true;

    return (
      normalizeLabel(item.label).includes(normalized)
      || item.keywords.some((keyword) => normalizeLabel(keyword).includes(normalized))
      || normalizeLabel(item.category).includes(normalized)
    );
  });

  return filtered.slice(0, limit);
}

