import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, useRouter, type Route } from './lib/router';
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

function Shell() {
  const { route, navigate } = useRouter();
  const { user, loading } = useAuth();

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
      navigate('landing');
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
