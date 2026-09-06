import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, RefreshCw, Compass, ArrowLeft } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { settings } = useAppData();
  const portalName = settings?.portal_name || 'UPCOMM';

  const handleTryAgain = () => {
    window.location.reload();
  };

  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 select-none font-sans">
      <style>{`
        @keyframes float3D {
          0%, 100% {
            transform: perspective(1000px) rotateX(12deg) rotateY(-14deg) translateY(0px);
          }
          50% {
            transform: perspective(1000px) rotateX(8deg) rotateY(-8deg) translateY(-14px);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        .error-scene-3d {
          transform-style: preserve-3d;
          animation: float3D 6s ease-in-out infinite;
        }
        .glow-sphere {
          animation: pulseGlow 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .error-scene-3d, .glow-sphere {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="max-w-lg w-full text-center space-y-8">
        {/* 3D Animated Illustration Scene */}
        <div className="relative flex items-center justify-center py-6">
          {/* Subtle Ambient Glow */}
          <div className="glow-sphere absolute w-56 h-56 bg-emerald-500/15 dark:bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Floating Isometric Stage */}
          <div className="error-scene-3d relative w-48 h-48 flex items-center justify-center">
            {/* Isometric Base Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/90 dark:to-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center p-6 transform translate-z-10">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-2 shadow-sm">
                <Compass className="w-8 h-8 animate-spin-slow" />
              </div>
              <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                404
              </div>
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">
                Lost in Workspace
              </div>
            </div>

            {/* Orbiting geometric accents */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg transform rotate-12" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 shadow-md transform -rotate-12" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The link you followed doesn't exist, has been moved, or may have expired in {portalName}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={handleTryAgain}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
