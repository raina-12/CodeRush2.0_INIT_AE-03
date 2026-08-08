import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { Layers, User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the terms of service.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate({ to: '/dashboard' });
    }, 600);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate({ to: '/dashboard' });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-[#e0e0e6] font-sans flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
      </div>

      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10 relative">
        <div 
          onClick={() => navigate({ to: '/' })}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-xl text-white group-hover:text-cyan-300 transition-colors uppercase">
            ORQUESTRA
          </span>
        </div>

        <button
          onClick={() => navigate({ to: '/' })}
          className="text-xs font-mono text-white/60 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Back to Home
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 z-10 relative my-4">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="text-xs text-white/50">
              Start building dynamic multi-agent workflows in seconds.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/80">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/80">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/80">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/80 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/80">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-400/80 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center text-xs text-white/50 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-[1.02] hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#030308] px-3 text-[10px] font-mono uppercase text-white/40 absolute rounded-full border border-white/5">
              or quick launch
            </span>
          </div>

          <button
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 text-white/80 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Instant Demo Access</span>
          </button>

          <div className="text-center text-xs text-white/50 pt-1">
            <span>Already have an account? </span>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-white/30 font-mono relative z-10">
        ORQUESTRA Engine © {new Date().getFullYear()}
      </footer>
    </div>
  );
}