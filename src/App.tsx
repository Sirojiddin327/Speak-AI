import { useState } from 'react';
import { DemoProvider, useDemo } from '@/context/DemoContext';
import { Sidebar } from '@/components/Sidebar';
import type { PageKey } from '@/types';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SpeakingPage } from '@/pages/SpeakingPage';
import { PronunciationPage } from '@/pages/PronunciationPage';
import { WritingPage } from '@/pages/WritingPage';
import { CefrPage } from '@/pages/CefrPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { SettingsPage } from '@/pages/SettingsPage';

function Shell() {
  const { user, enterDemo } = useDemo();
  const [page, setPage] = useState<PageKey>('landing');

  if (!user || page === 'landing') {
    return (
      <LandingPage
        onEnter={() => {
          if (!user) enterDemo();
          setPage('dashboard');
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
          {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
          {page === 'speaking' && <SpeakingPage />}
          {page === 'pronunciation' && <PronunciationPage />}
          {page === 'writing' && <WritingPage />}
          {page === 'cefr' && <CefrPage />}
          {page === 'progress' && <ProgressPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}
