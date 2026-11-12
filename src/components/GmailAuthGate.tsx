import React, { useState } from 'react';
import { User } from '../types';
import { WinterSnowCanvas } from './WinterSnowCanvas';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  User as UserIcon,
  Snowflake,
  Sparkles,
} from 'lucide-react';

interface GmailAuthGateProps {
  onLoginSuccess: (user: User) => void;
}

export const GmailAuthGate: React.FC<GmailAuthGateProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your Gmail address.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a complete email address (e.g. name@gmail.com).');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload =
        mode === 'signin'
          ? { email: trimmedEmail, password }
          : { email: trimmedEmail, password, displayName };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setSuccessMsg(data.message || 'Authenticated successfully.');
      localStorage.setItem('url_checker_user', JSON.stringify(data.user));

      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-b from-[#f0f7ff] via-[#e0f2fe] to-[#f8fafc] rounded-3xl border border-blue-200/80 shadow-2xl shadow-blue-500/10">
      {/* Dynamic Winter Snow Falling Effect (Always On) */}
      <WinterSnowCanvas isSnowing={true} />

      {/* Gentle Blue and Azure Aurora Glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[360px] bg-sky-300/30 blur-[130px] rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[340px] bg-blue-300/25 blur-[110px] rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -left-20 w-[380px] h-[320px] bg-cyan-200/30 blur-[100px] rounded-full"
        aria-hidden="true"
      />

      {/* Subtle Winter Frost Grid Pattern in Soft Blue */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Crisp White & Frost Blue Glass Card */}
        <div className="relative bg-white/90 backdrop-blur-2xl border border-blue-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(59,130,246,0.12),0_4px_16px_rgba(186,230,253,0.3)] overflow-hidden">
          {/* Top Ice Blue Rim Light */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400" />

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-blue-100 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'border-blue-600 text-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.2)]'
                  : 'border-transparent text-slate-500 hover:text-blue-600'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-blue-500" />
              <span>Sign In with Gmail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'border-blue-600 text-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.2)]'
                  : 'border-transparent text-slate-500 hover:text-blue-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error / Success Notifications */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 backdrop-blur-sm shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 backdrop-blur-sm shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Analyst Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Bharaneedharan"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/90 border border-blue-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Gmail Input (Blank by default) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Gmail Address</span>
                <span className="text-[10px] text-blue-600 font-mono">@gmail.com</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50/90 border border-blue-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Input (Blank by default) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-slate-500">Min 6 characters</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50/90 border border-blue-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button with Crisp Blue Gradient */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-700 hover:via-sky-700 hover:to-blue-800 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all whitespace-nowrap shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.4)] border border-blue-400/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Snowflake className="w-4 h-4 text-sky-200" />
                  <span>
                    {mode === 'signin' ? 'Sign In with Gmail' : 'Create Account & Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Switch Helper */}
            <div className="pt-2 text-center text-xs text-slate-500">
              {mode === 'signin' ? (
                <span>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Create Account
                  </button>
                </span>
              ) : (
                <span>
                  Already registered your Gmail?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </form>

          {/* Winter Trust Security Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Secure Authentication · TLS 1.3 Encryption · Gmail Protection</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
