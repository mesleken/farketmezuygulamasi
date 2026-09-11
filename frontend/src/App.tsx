import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { MobileFrame } from './components/MobileFrame.js';
import { Navbar } from './components/Navbar.js';
import { Suspense, lazy } from 'react';
const Home = lazy(() => import('./pages/Home.js').then(module => ({ default: module.Home })));
const GroupSession = lazy(() => import('./pages/GroupSession.js').then(module => ({ default: module.GroupSession })));
const CoupleMode = lazy(() => import('./pages/CoupleMode.js').then(module => ({ default: module.CoupleMode })));
const ActivityHistory = lazy(() => import('./pages/ActivityHistory.js').then(module => ({ default: module.ActivityHistory })));
const Profile = lazy(() => import('./pages/Profile.js').then(module => ({ default: module.Profile })));
const Onboarding = lazy(() => import('./pages/Onboarding.js').then(module => ({ default: module.Onboarding })));
import { ErrorBoundary } from './components/ErrorBoundary.js';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-emerald-400">Farketmez Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileFrame>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      <main className="flex-1">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          {activeTab === 'home' && <Home />}
          {activeTab === 'groups' && <GroupSession />}
          {activeTab === 'couple' && <CoupleMode />}
          {activeTab === 'history' && <ActivityHistory />}
          {activeTab === 'profile' && <Profile onRetakeQuiz={() => setShowOnboarding(true)} />}
        </Suspense>
      </main>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        </Suspense>
      )}
    </MobileFrame>
  );
};

export function App() {
  return (
    <ErrorBoundary fallbackTitle="Farketmez Uygulaması Başlatılamadı">
      <AuthProvider>
        <ThemeProvider>
          <MainApp />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
