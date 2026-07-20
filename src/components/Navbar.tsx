import { useEffect, useState } from 'react';
import { Menu, X, ShieldAlert, ChevronRight, Radio } from 'lucide-react';
import { useRouter, type Route } from '../lib/router';
import { useAuth } from '../lib/auth';

const NAV_ITEMS: { label: string; route: Route; protected: boolean }[] = [
  { label: 'Citizen', route: 'citizen', protected: true },
  { label: 'Report', route: 'report', protected: true },
  { label: 'AI Analysis', route: 'ai-analysis', protected: true },
  { label: 'SOS', route: 'sos', protected: true },
  { label: 'Disaster Map', route: 'map', protected: true },
  { label: 'Command Center', route: 'command-center', protected: true },
  { label: 'Volunteers', route: 'volunteer', protected: true },
  { label: 'Admin', route: 'admin', protected: true },
];

export function Navbar() {
  const { route, navigate } = useRouter();
  const { user, profile,signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (r: Route) => { navigate(r); setOpen(false); };

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass shadow-glass border-b border-command-border' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={() => go('landing')} className="flex items-center gap-2.5 group">
          <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-emergency-500/15 border border-emergency-500/30 shadow-glow group-hover:shadow-glow-pulse transition">
            <ShieldAlert className="w-5 h-5 text-emergency-400" />
          </span>
          <span className="font-display font-bold text-white tracking-tight text-lg">
            Rakshak<span className="text-emergency-500"> AI</span>
          </span>
        </button>

        <div className="hidden lg:flex items-center gap-1">
       
        {NAV_ITEMS
  .filter((item) => {
    if (item.route === "command-center" || item.route === "admin") {
      return profile?.role === "admin";
    }
    return true;
  })
  .map((item) => (
    <button
      key={item.route}
      onClick={() => go(item.route)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        route === item.route
          ? "text-white bg-white/10 border border-command-border"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {item.label}
    </button>
  ))}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <span className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                <span className="live-dot live-dot-emerald" /> Active
              </span>
              <button onClick={signOut} className="btn-ghost px-4 py-2 text-xs">Sign out</button>
            </>
          ) : (
            <button onClick={() => go('login')} className="btn-primary px-4 py-2 text-xs">
              Sign in <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <button className="lg:hidden grid place-items-center w-10 h-10 rounded-lg bg-white/5 border border-command-border"
          onClick={() => setOpen((o) => !o)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden glass border-t border-command-border animate-fade-in">
          <div className="px-5 py-4 flex flex-col gap-1">
          {NAV_ITEMS
  .filter((item) => {
    if (item.route === "command-center" || item.route === "admin") {
      return profile?.role === "admin";
    }
    return true;
  })
  .map((item) => (
    <button
      key={item.route}
      onClick={() => go(item.route)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        route === item.route
          ? "text-white bg-white/10 border border-command-border"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {item.label}
    </button>
  ))}
            <div className="h-px bg-command-border my-2" />
            {user ? (
              <button onClick={signOut} className="btn-ghost text-sm">Sign out ({user.email})</button>
            ) : (
              <button onClick={() => go('login')} className="btn-primary text-sm">Sign in</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { navigate } = useRouter();
  return (
    <footer className="relative mt-24 border-t border-command-border bg-command-surface/60">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-emergency-500/15 border border-emergency-500/30">
              <ShieldAlert className="w-5 h-5 text-emergency-400" />
            </span>
            <span className="font-display font-bold text-white text-lg">
              Rakshak<span className="text-emergency-500"> AI</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            AI-powered disaster management platform helping citizens, volunteers, and
            authorities respond faster during emergencies. Built for resilience.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Platform</h4>
          <ul className="space-y-2 text-sm">
            {['citizen', 'report', 'ai-analysis', 'map'].map((r) => (
              <li key={r}>
                <button onClick={() => navigate(r as Route)} className="text-slate-400 hover:text-white transition capitalize">
                  {r.replace('-', ' ')}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Emergency</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-emergency-400" /> NDRF: 1070</li>
            <li className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-emergency-400" /> Fire: 101</li>
            <li className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-emergency-400" /> Ambulance: 108</li>
            <li className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-emergency-400" /> Helpline: 112</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-command-border py-5 px-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Rakshak AI — Disaster Management Platform. For demonstration purposes.
      </div>
    </footer>
  );
}
