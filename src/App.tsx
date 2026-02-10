import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AppShell } from './components/layout/AppShell';
import { MatchesPage } from './pages/MatchesPage';
import { PipelinePage } from './pages/PipelinePage';
import { JobWorkspacePage } from './pages/JobWorkspacePage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaptureModal } from './components/jobs/CaptureModal';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';

const ONBOARDING_KEY = 'jf2-onboarding-complete';

export default function App() {
  const initialize = useStore((s) => s.initialize);
  const isLoading = useStore((s) => s.isLoading);
  const jobs = useStore((s) => s.jobs);

  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === 'true'
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
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

  if (!onboardingComplete && jobs.length === 0) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/matches" replace />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/job/:jobId" element={<JobWorkspacePage />} />
        <Route path="/insights" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/insights" replace />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <CaptureModal />
    </AppShell>
  );
}
