import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  X,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const REMEMBERED_EMAIL_KEY = 'upcomm_remembered_email';

export function Login() {
  const { login, currentUser, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

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

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotSubmitting(true);
    setTimeout(() => {
      setForgotSubmitting(false);
      setForgotSent(true);
    }, 600);
  };

  const handleCloseForgotPassword = () => {
    setIsForgotPasswordOpen(false);
    setForgotSent(false);
    setForgotEmail('');
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

            {/* Remember Me + Forgot Password Row */}
            <div className="flex items-center justify-between pt-0.5 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer text-[#52525B] hover:text-[#18181B] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[4px] border-[#D4D4D8] text-[#059669] focus:ring-[#059669]/20 cursor-pointer accent-[#059669]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setIsForgotPasswordOpen(true);
                }}
                className="text-[#059669] hover:underline font-medium cursor-pointer"
              >
                Forgot password?
              </button>
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

      {/* 6. Forgot Password Modal Dialog */}
      {isForgotPasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#18181B]/15 transition-opacity"
            onClick={handleCloseForgotPassword}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-[440px] bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_18px_50px_rgba(24,24,27,0.16)] p-6 z-10 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3
                id="forgot-password-modal-title"
                className="text-[16px] font-semibold text-[#18181B]"
              >
                Password Recovery
              </h3>
              <button
                type="button"
                onClick={handleCloseForgotPassword}
                className="w-7 h-7 rounded-[6px] hover:bg-[#F4F4F5] text-[#8B8B95] hover:text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#059669] mx-auto" />
                <h4 className="text-[15px] font-semibold text-[#18181B]">
                  Instructions Sent
                </h4>
                <p className="text-[12.5px] text-[#52525B] leading-relaxed max-w-xs mx-auto">
                  If an account exists for <span className="font-semibold text-[#18181B]">{forgotEmail}</span>, password reset instructions have been dispatched, or contact your UPCOMM Administrator for assistance.
                </p>
                <button
                  type="button"
                  onClick={handleCloseForgotPassword}
                  className="mt-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-[8px] transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-4">
                <p className="text-[12.5px] text-[#52525B] leading-relaxed">
                  Enter your work email address to receive password reset instructions, or reach out to your UPCOMM Administrator.
                </p>

                <div>
                  <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                    Work email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@upcomm.com"
                      className="w-full h-10 pl-9 pr-3 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none text-[#18181B]"
                    />
                    <Mail className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={handleCloseForgotPassword}
                    className="px-4 py-2 text-[13px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-[8px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {forgotSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{forgotSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
