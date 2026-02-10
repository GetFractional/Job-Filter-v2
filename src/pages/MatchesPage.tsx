import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, ExternalLink, Filter, BriefcaseBusiness } from 'lucide-react';
import { useStore } from '../store/useStore';
import { buildJobMatches, getFeedSources, type JobMatch } from '../lib/jobFeed';

const MATCH_BADGE: Record<JobMatch['fitLabel'], string> = {
  High: 'bg-green-50 text-green-700 border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export function MatchesPage() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const jobs = useStore((s) => s.jobs);
  const addJob = useStore((s) => s.addJob);

  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [addingMatchId, setAddingMatchId] = useState<string | null>(null);

  const sources = useMemo(() => getFeedSources(), []);
  const matches = useMemo(() => buildJobMatches(profile, jobs, { query, source }), [profile, jobs, query, source]);
  const highFitCount = matches.filter((match) => match.fitLabel === 'High').length;

  const handleSaveMatch = async (match: JobMatch) => {
    setAddingMatchId(match.id);
    try {
      const job = await addJob({
        title: match.title,
        company: match.company,
        location: match.location,
        locationType: match.locationType,
        source: match.source,
        url: match.url,
        jobDescription: match.jobDescription,
      });
      navigate(`/job/${job.id}`);
    } finally {
      setAddingMatchId(null);
    }
  };

  const handleSaveTop = async () => {
    const top = matches.slice(0, 3);
    for (const match of top) {
      await addJob({
        title: match.title,
        company: match.company,
        location: match.location,
        locationType: match.locationType,
        source: match.source,
        url: match.url,
        jobDescription: match.jobDescription,
      });
    }
    navigate('/pipeline');
  };

  return (
    <div className="space-y-5">
      <div className="surface-card rounded-2xl p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1">Matches</p>
            <h1 className="text-h1 text-neutral-900">Recommended job feed</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Compliant feed prototype, ranked against your role and location preferences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="metric-chip">{matches.length} available</span>
            <span className="metric-chip">{highFitCount} high fit</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Role, company, tags..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            />
          </label>
          <label>
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Source</span>
            <div className="relative">
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-8 text-sm text-neutral-700"
              >
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? 'All feed sources' : value}
                  </option>
                ))}
              </select>
              <Filter size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSaveTop}
              disabled={matches.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Plus size={12} />
              Save Top 3
            </button>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center">
          <Sparkles size={20} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-600">No new matches for current filters.</p>
          <p className="text-xs text-neutral-400 mt-1">
            Change search/source filters or save new roles in profile targets.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {matches.map((match) => (
            <div key={match.id} className="surface-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{match.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{match.company} • {match.location}</p>
                </div>
                <span className={`text-[11px] font-semibold rounded-md border px-2 py-0.5 ${MATCH_BADGE[match.fitLabel]}`}>
                  {match.fitLabel} {match.fitScore}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {match.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">
                    {tag}
                  </span>
                ))}
              </div>

              <ul className="mt-3 space-y-1">
                {match.reasons.map((reason) => (
                  <li key={reason} className="text-xs text-neutral-600 flex items-start gap-1.5">
                    <BriefcaseBusiness size={11} className="mt-0.5 text-brand-500 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={match.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  View listing
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => handleSaveMatch(match)}
                  disabled={addingMatchId === match.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <Plus size={12} />
                  {addingMatchId === match.id ? 'Saving...' : 'Save to Pipeline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
