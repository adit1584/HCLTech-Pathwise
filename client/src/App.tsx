import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './stores/authContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SkillGraphPage } from './pages/SkillGraphPage';
import { PracticePage } from './pages/PracticePage';
import { CoursesPage } from './pages/CoursesPage';
import { ProofPassportPage } from './pages/ProofPassportPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-void)', color: 'var(--text-secondary)' }}>
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--primary-500)] border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full border-2 border-[var(--accent-500)] border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading Pathwise…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen text-slate-100 flex flex-col" style={{ background: 'var(--bg-void)' }}>
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/diagnostic"
                  element={
                    <ProtectedRoute>
                      <DiagnosticPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roadmap"
                  element={
                    <ProtectedRoute>
                      <RoadmapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/skill-graph"
                  element={
                    <ProtectedRoute>
                      <SkillGraphPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/practice"
                  element={
                    <ProtectedRoute>
                      <PracticePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses"
                  element={
                    <ProtectedRoute>
                      <CoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/passport"
                  element={
                    <ProtectedRoute>
                      <ProofPassportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/proof"
                  element={
                    <ProtectedRoute>
                      <ProofPassportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/what-if"
                  element={
                    <ProtectedRoute>
                      <WhatIfSimulatorPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
