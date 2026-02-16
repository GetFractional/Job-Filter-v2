import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AppShell } from './components/layout/AppShell';
import { PipelinePage } from './pages/PipelinePage';
import { JobWorkspacePage } from './pages/JobWorkspacePage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaptureModal } from './components/jobs/CaptureModal';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ONBOARDING_STORAGE_KEY } from './lib/profileState';

export default function App() {
  const initialize = useStore((s) => s.initialize);
  const isLoading = useStore((s) => s.isLoading);
  const jobs = useStore((s) => s.jobs);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Derive onboarding state synchronously from loading/jobs state
  const dismissed =
    typeof window !== 'undefined' ? localStorage.getItem(ONBOARDING_STORAGE_KEY) : null;
  const showOnboarding = useMemo(
    () => !isLoading && !dismissed && jobs.length === 0,
    [isLoading, dismissed, jobs.length],
  );

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    // Force re-render: the useMemo will now see `dismissed` as truthy
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading Job Filter...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/pipeline" replace />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/job/:jobId" element={<JobWorkspacePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <CaptureModal />
    </AppShell>
  );
}
