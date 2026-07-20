import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, useRouter, type Route } from './lib/router';
import { isSupabaseConfigured } from './lib/supabase';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportPage } from './pages/ReportPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { SOSPage } from './pages/SOSPage';
import { DisasterMapPage } from './pages/DisasterMapPage';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { Loader2 } from 'lucide-react';

const PROTECTED: Route[] = ['citizen', 'report', 'ai-analysis', 'sos', 'map', 'volunteer', 'admin', 'command-center'];
const ROUTES: Route[] = ['landing', 'login', ...PROTECTED];

function Shell() {
  const { route, navigate } = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!ROUTES.includes(route)) {
      navigate('landing');
    }
  }, [route, navigate]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="glass-card max-w-lg p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-white mb-3">Supabase configuration required</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Create a <code className="text-electric-400">.env</code> file in the project root with your Supabase
            credentials:
          </p>
          <pre className="mt-4 text-left text-xs font-mono text-slate-300 bg-command-surface/80 border border-command-border rounded-xl p-4 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="text-xs text-slate-500 mt-4">Restart the dev server after adding environment variables.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emergency-400" />
          <span className="text-sm">Initializing Rakshak AI…</span>
        </div>
      </div>
    );
  }

  if (PROTECTED.includes(route) && !user) {
    return <LoginPage />;
  }

  switch (route) {
    case 'landing':
      return <LandingPage />;
    case 'login':
      return user ? <CitizenDashboard /> : <LoginPage />;
    case 'citizen':
      return <CitizenDashboard />;
    case 'report':
      return <ReportPage />;
    case 'ai-analysis':
      return <AIAnalysisPage />;
    case 'sos':
      return <SOSPage />;
    case 'map':
      return <DisasterMapPage />;
    case 'volunteer':
      return <VolunteerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'command-center':
      return <CommandCenterPage />;
    default:
      return <LandingPage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
