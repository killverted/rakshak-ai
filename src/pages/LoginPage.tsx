import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff,
  UserPlus, LogIn, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard } from '../components/ui';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function LoginPage() {
  const { navigate } = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true);
    setError(null);
    const fn = mode === 'login' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate('citizen');
  };

  return (
    <div className="min-h-screen pt-20 relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 grid-bg opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emergency-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-electric-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-md mx-auto px-5 py-12">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-emergency-500/15 border border-emergency-500/30 shadow-glow mb-4">
                <ShieldAlert className="w-7 h-7 text-emergency-400" />
              </span>
              <h1 className="font-display font-bold text-2xl text-white">
                {mode === 'login' ? 'Access Command Center' : 'Join Rakshak AI'}
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                {mode === 'login' ? 'Sign in to the disaster response platform.' : 'Create an account to get started.'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex p-1 rounded-xl bg-command-surface/60 border border-command-border mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    mode === m ? 'bg-emergency-500/15 text-white border border-emergency-500/30'
                    : 'text-slate-400 hover:text-white'
                  }`}>
                  {m === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {m === 'login' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emergency-500/10 border border-emergency-500/30 mb-4 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-emergency-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emergency-300">{error}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="glass-input pl-11" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={showPwd ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="glass-input pl-11 pr-11" />
                  <button type="button" onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3.5 text-base">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-3.5 rounded-xl bg-electric-500/5 border border-electric-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-electric-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Demo credentials
              </div>
              <p className="text-xs text-slate-400 font-mono">demo@rakshak.ai · rakshak123</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
