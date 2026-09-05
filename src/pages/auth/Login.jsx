import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REMEMBERED_EMAIL_KEY = 'upcomm_remembered_email';

export function Login() {
  const { login, currentUser, authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Check if user is already authenticated -> redirect to dashboard
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  // 2. Load remembered work email on initial mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your work email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await login(trimmedEmail, password);
      if (res.success) {
        // Handle Remember Me (safely stores only work email, never passwords)
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        // Navigate to intended destination or role dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Invalid email or password. Please verify credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between items-center px-4 py-8 sm:py-12 font-['Inter'] selection:bg-[#ECFDF5] selection:text-[#059669]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Spacer / Top container */}
      <div className="w-full flex-1 flex items-center justify-center py-4">
        {/* Main Authentication Card */}
        <div className="w-full max-w-[440px] bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_12px_36px_rgba(24,24,27,0.08)] p-7 sm:p-10 select-none animate-scale-up">
          {/* 1. Brand Lockup */}
          <div className="text-center mb-8 sm:mb-9">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <img
                src="/logo.png"
                alt="UPCOMM"
                className="w-8 h-8 object-contain rounded-[6px]"
              />
              <span className="font-bold text-[22px] tracking-tight text-[#18181B]">
                UPCOMM
              </span>
            </div>
            <p className="text-[13px] font-medium text-[#71717A]">
              Solutions Task Manager
            </p>
          </div>

          {/* 2. Welcome Headings */}
          <div className="text-left mb-6">
            <h1 className="text-[26px] sm:text-[28px] font-semibold text-[#18181B] tracking-tight">
              Welcome back
            </h1>
            <p className="text-[13.5px] text-[#71717A] mt-1">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* 3. Authentication Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-[12.5px] flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 4. Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Work Email Field */}
            <div>
              <label
                htmlFor="login-work-email"
                className="block text-[13px] font-medium text-[#18181B] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-work-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="name@upcomm.com"
                className="w-full h-11 sm:h-12 px-3.5 text-[14px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-[13px] font-medium text-[#18181B] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full h-11 sm:h-12 pl-3.5 pr-11 text-[14px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Row */}
            <div className="flex items-center justify-start pt-0.5 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer text-[#52525B] hover:text-[#18181B] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[4px] border-[#D4D4D8] text-[#059669] focus:ring-[#059669]/20 cursor-pointer accent-[#059669]"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Sign In Primary Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 sm:h-12 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-[14px] rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>

            {/* Reassurance Security Copy */}
            <div className="flex items-center justify-center gap-1.5 pt-2 text-[12px] text-[#8B8B95] select-none">
              <ShieldCheck className="w-4 h-4 text-[#8B8B95]" />
              <span>Secure employee workspace</span>
            </div>
          </form>
        </div>
      </div>

      {/* 5. Minimalist Page Footer */}
      <footer className="text-center text-[12px] text-[#8B8B95] select-none">
        © {new Date().getFullYear()} UPCOMM Solutions. Internal use only.
      </footer>
    </div>
  );
}
