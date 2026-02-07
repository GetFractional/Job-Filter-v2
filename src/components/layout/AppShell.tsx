import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Settings,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const jobs = useStore((s) => s.jobs);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleAddJob = () => {
    window.dispatchEvent(new CustomEvent('open-capture-modal'));
    setMobileNavOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Desktop / Tablet Sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-20 md:w-16 lg:w-60 bg-white border-r border-neutral-200 flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-neutral-100 shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">JF</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 hidden lg:block">Job Filter</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0 mx-auto lg:mx-0" />
                <span className="hidden lg:block">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 pb-4 space-y-2 shrink-0">
          <button
            onClick={handleAddJob}
            className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            title="Add Job"
          >
            <Plus size={16} className="shrink-0" />
            <span className="hidden lg:block">Add Job</span>
          </button>
          <div className="hidden lg:flex items-center justify-between px-3 py-1">
            <span className="text-xs text-neutral-400">{jobs.length} jobs</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 safe-area-inset">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">JF</span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">Job Filter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">{jobs.length} jobs</span>
            <button
              onClick={handleAddJob}
              className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700"
              aria-label="Add job"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-out Nav ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            style={{ animation: 'fadeIn 200ms ease-out' }}
          />
          {/* Drawer */}
          <div
            className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col safe-area-inset"
            style={{ animation: 'slideInLeft 200ms ease-out' }}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">JF</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">Job Filter</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-3 px-3 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="px-3 pb-4">
              <button
                onClick={handleAddJob}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
              >
                <Plus size={16} />
                Add Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="md:pl-16 lg:pl-60 min-h-screen">
        <div className="max-w-[1200px] mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
