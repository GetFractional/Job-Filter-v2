import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  Sparkles,
  Users,
  Settings,
  Plus,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/matches', label: 'Matches', icon: Sparkles, countKey: 'matches' as const },
  { path: '/pipeline', label: 'Pipeline', icon: KanbanSquare, countKey: 'jobs' as const },
  { path: '/insights', label: 'Insights', icon: LayoutDashboard },
  { path: '/contacts', label: 'Contacts', icon: Users, countKey: 'contacts' as const },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function isNavActive(pathname: string, navPath: string): boolean {
  if (navPath === '/pipeline') {
    return pathname.startsWith('/pipeline') || pathname.startsWith('/job/');
  }
  return pathname.startsWith(navPath);
}

function readAiStatus(): { label: string; tone: 'connected' | 'disconnected' } {
  const configured = localStorage.getItem('jf2-provider-configured') === 'true';
  const providerName = localStorage.getItem('jf2-provider-name') || 'Provider';
  if (configured) {
    return {
      label: `${providerName} key configured`,
      tone: 'connected',
    };
  }
  return {
    label: 'Template outputs only (connect AI in Settings)',
    tone: 'disconnected',
  };
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const jobs = useStore((s) => s.jobs);
  const contacts = useStore((s) => s.contacts);
  const companies = useStore((s) => s.companies);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState(() => readAiStatus());
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncStatus = () => setAiStatus(readAiStatus());
    window.addEventListener('storage', syncStatus);
    window.addEventListener('focus', syncStatus);
    return () => {
      window.removeEventListener('storage', syncStatus);
      window.removeEventListener('focus', syncStatus);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (searchRef.current.contains(event.target as Node)) return;
      setSearchOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const pageLabel = useMemo(() => {
    if (location.pathname.startsWith('/job/')) return 'Pipeline / Job Workspace';
    const matched = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
    return matched?.label || 'Workspace';
  }, [location.pathname]);

  const globalResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (query.length < 2) {
      return { jobs: [], contacts: [], companies: [] };
    }

    const jobResults = jobs
      .filter((job) =>
        `${job.title} ${job.company} ${job.source || ''}`.toLowerCase().includes(query)
      )
      .slice(0, 5);
    const contactResults = contacts
      .filter((contact) =>
        `${contact.firstName} ${contact.lastName} ${contact.company || ''} ${contact.email || ''}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 5);
    const companyResults = companies
      .filter((company) => company.name.toLowerCase().includes(query))
      .slice(0, 5);

    return {
      jobs: jobResults,
      contacts: contactResults,
      companies: companyResults,
    };
  }, [globalSearch, jobs, contacts, companies]);

  const hasGlobalResults =
    globalResults.jobs.length > 0 ||
    globalResults.contacts.length > 0 ||
    globalResults.companies.length > 0;

  const handleOpenSearchResult = (target: { type: 'job' | 'contact' | 'company'; id?: string; value: string }) => {
    if (target.type === 'job' && target.id) {
      navigate(`/job/${target.id}`);
    } else if (target.type === 'contact' && target.id) {
      navigate(`/contacts?contact=${target.id}`);
    } else {
      navigate(`/pipeline?q=${encodeURIComponent(target.value)}`);
    }
    setGlobalSearch('');
    setSearchOpen(false);
  };

  const handleAddJob = () => {
    window.dispatchEvent(new CustomEvent('open-capture-modal'));
    setMobileNavOpen(false);
    setGlobalSearch('');
    setSearchOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
    setGlobalSearch('');
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen text-neutral-900">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 md:w-[72px] lg:w-[260px] flex-col border-r border-white/10 bg-neutral-900/95 text-white backdrop-blur-xl">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-500/90 text-white flex items-center justify-center shadow-lg shadow-brand-900/30">
            <span className="text-xs font-extrabold tracking-wide">JF</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-300">Job Filter</p>
            <p className="text-sm font-semibold">Revenue Cockpit</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavActive(location.pathname, item.path);
            const Icon = item.icon;
            const count =
              item.countKey === 'jobs'
                ? jobs.length
                : item.countKey === 'matches'
                ? jobs.filter((job) => job.fitLabel === 'Pursue').length
                : item.countKey === 'contacts'
                ? contacts.length
                : undefined;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/14 text-white shadow-inner shadow-white/10'
                    : 'text-neutral-300 hover:bg-white/8 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} className="shrink-0 mx-auto lg:mx-0" />
                <span className="hidden lg:block font-semibold">{item.label}</span>
                {count !== undefined && (
                  <span className="hidden lg:inline-flex ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-100">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-2.5 shrink-0">
          <button
            onClick={handleAddJob}
            className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 brand-glow"
            title="Add Job"
          >
            <Plus size={16} className="shrink-0" />
            <span className="hidden lg:block">Add Job</span>
          </button>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 bg-neutral-900/95 text-white border-b border-white/10 safe-area-inset backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg text-neutral-200 hover:bg-white/10"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">JF</span>
            </div>
            <span className="text-sm font-semibold text-white">Job Filter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-200">{jobs.length} jobs</span>
            <button
              onClick={handleAddJob}
              className="bg-brand-500 text-white p-2 rounded-lg hover:bg-brand-400"
              aria-label="Add job"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            style={{ animation: 'fadeIn 200ms ease-out' }}
          />
          <div
            className="absolute inset-y-0 left-0 w-72 bg-neutral-900 text-white shadow-xl flex flex-col safe-area-inset"
            style={{ animation: 'slideInLeft 200ms ease-out' }}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">JF</span>
                </div>
                <span className="text-sm font-semibold text-white">Job Filter</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-3 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = isNavActive(location.pathname, item.path);
                const Icon = item.icon;
                const count =
                  item.countKey === 'jobs'
                    ? jobs.length
                    : item.countKey === 'matches'
                    ? jobs.filter((job) => job.fitLabel === 'Pursue').length
                    : item.countKey === 'contacts'
                    ? contacts.length
                    : undefined;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/14 text-white'
                        : 'text-neutral-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                    {item.label}
                    {count !== undefined && (
                      <span className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-100">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="px-3 pb-4">
              <button
                onClick={handleAddJob}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-400"
              >
                <Plus size={16} />
                Add Job
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="md:pl-[72px] lg:pl-[260px] min-h-screen">
        <div className="sticky top-0 z-20 hidden md:flex items-center justify-between gap-4 px-5 lg:px-7 py-3 bg-gradient-to-r from-[#f5f8ff]/95 to-[#f3f5fb]/95 backdrop-blur border-b border-neutral-200/80">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Workspace</p>
            <p className="text-sm font-bold text-neutral-800">{pageLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <div ref={searchRef} className="relative w-[330px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setGlobalSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  const firstJob = globalResults.jobs[0];
                  if (firstJob) {
                    handleOpenSearchResult({ type: 'job', id: firstJob.id, value: firstJob.title });
                    return;
                  }
                  const firstContact = globalResults.contacts[0];
                  if (firstContact) {
                    handleOpenSearchResult({
                      type: 'contact',
                      id: firstContact.id,
                      value: `${firstContact.firstName} ${firstContact.lastName}`.trim(),
                    });
                    return;
                  }
                  const firstCompany = globalResults.companies[0];
                  if (firstCompany) {
                    handleOpenSearchResult({ type: 'company', value: firstCompany.name });
                  }
                }}
                placeholder="Search jobs, companies, contacts..."
                className="w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 py-2 text-xs text-neutral-700 shadow-sm focus:border-brand-400"
              />

              {searchOpen && globalSearch.trim().length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-xl border border-neutral-200 bg-white shadow-lg z-30 max-h-[360px] overflow-y-auto">
                  {hasGlobalResults ? (
                    <div className="p-2 space-y-2">
                      {globalResults.jobs.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Jobs</p>
                          {globalResults.jobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => handleOpenSearchResult({ type: 'job', id: job.id, value: job.title })}
                              className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-neutral-50"
                            >
                              <p className="text-xs font-semibold text-neutral-800 truncate">{job.title}</p>
                              <p className="text-[11px] text-neutral-500 truncate">{job.company}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {globalResults.contacts.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Contacts</p>
                          {globalResults.contacts.map((contact) => {
                            const name = `${contact.firstName} ${contact.lastName}`.trim() || 'Unnamed';
                            return (
                              <button
                                key={contact.id}
                                onClick={() =>
                                  handleOpenSearchResult({ type: 'contact', id: contact.id, value: name })
                                }
                                className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-neutral-50"
                              >
                                <p className="text-xs font-semibold text-neutral-800 truncate">{name}</p>
                                <p className="text-[11px] text-neutral-500 truncate">{contact.company || 'No company set'}</p>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {globalResults.companies.length > 0 && (
                        <div>
                          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Companies</p>
                          {globalResults.companies.map((company) => (
                            <button
                              key={company.id}
                              onClick={() => handleOpenSearchResult({ type: 'company', value: company.name })}
                              className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-neutral-50 text-xs font-semibold text-neutral-800 truncate"
                            >
                              {company.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="px-3 py-2.5 text-xs text-neutral-500">No matches found.</p>
                  )}
                </div>
              )}
            </div>
            <span
              className={`metric-chip ${
                aiStatus.tone === 'connected'
                  ? '!text-green-700 !border-green-200 !bg-green-50'
                  : '!text-amber-700 !border-amber-200 !bg-amber-50'
              }`}
            >
              {aiStatus.label}
            </span>
            <button
              onClick={handleAddJob}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
            >
              <Plus size={12} />
              Add Job
            </button>
          </div>
        </div>

        <div className="max-w-[1360px] mx-auto p-4 lg:px-7 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
