import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Settings,
  Plus,
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

  return (
    <div className="min-h-screen bg-neutral-50 safe-area-inset flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">JF</span>
          </div>
          <h1 className="text-base font-semibold text-neutral-900">Job Filter</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{jobs.length} jobs</span>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-capture-modal'));
            }}
            className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 active:bg-brand-800"
            aria-label="Add job"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${
                  isActive
                    ? 'text-brand-600'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
