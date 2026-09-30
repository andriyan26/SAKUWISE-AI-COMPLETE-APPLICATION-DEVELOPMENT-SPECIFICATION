import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Cpu, Zap, ArrowRight } from 'lucide-react';
import { sound } from '../../lib/sound.js';

interface AppIntroPreloaderProps {
  onComplete: () => void;
  durationMs?: number; // default ~2200ms
}

export const AppIntroPreloader: React.FC<AppIntroPreloaderProps> = ({
  onComplete,
  durationMs = 2400,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [statusText, setStatusText] = useState('Menginisialisasi Sistem Cerdas SAKUWISE AI...');
  const [phaseTag, setPhaseTag] = useState('INIT_CORE');

  useEffect(() => {
    const startTime = performance.now();
    let animId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));

      setProgress(rawProgress);

      if (rawProgress < 25) {
        setStatusText('Menginisialisasi Protokol Keamanan & SAKUWISE AI...');
        setPhaseTag('SYSTEM_INIT');
      } else if (rawProgress < 55) {
        setStatusText('Menghubungkan Neural Kernel & Proteksi Finansial...');
        setPhaseTag('NEURAL_CONNECT');
      } else if (rawProgress < 85) {
        setStatusText('Memuat Asisten Visual 3D & Karakter Animasi...');
        setPhaseTag('ASSETS_READY');
      } else if (rawProgress < 100) {
        setStatusText('Menyiapkan Ruang Kerja Digital Masa Depan...');
        setPhaseTag('CONFIGURING');
      } else {
        setStatusText('Sistem Siap! Selamat Datang di SAKUWISE AI! 🚀');
        setPhaseTag('READY');
      }

      if (elapsed < durationMs) {
        animId = requestAnimationFrame(tick);
      } else {
        // Completed 100%
        sound.playCyberChime();
        setIsFinishing(true);
        const timer = setTimeout(() => {
          onComplete();
        }, 550);
        return () => clearTimeout(timer);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFinishing(true);
    sound.playCartoonPop();
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-[#060913] text-white overflow-hidden transition-all duration-500 select-none ${
        isFinishing ? 'opacity-0 scale-105 pointer-events-none blur-sm' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(99, 91, 255, 0.22) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(20, 184, 166, 0.16) 0%, transparent 55%),
          radial-gradient(circle at 20% 75%, rgba(56, 189, 248, 0.14) 0%, transparent 50%),
          linear-gradient(to bottom, #060913 0%, #0B1020 100%)
        `,
      }}
    >
      {/* 3D Perspective Cyber Floor Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 91, 255, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20, 184, 166, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Ambient Pulsing Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />

      {/* Top Header: System status & Skip Button */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-200 font-bold tracking-wider">SAKUWISE // BOOT_SEQUENCE</span>
          <span className="text-brand-cyan hidden sm:inline">[{phaseTag}]</span>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-brand-teal/50 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md group"
          title="Lewati Loading"
        >
          <span>Lewati</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-brand-teal" />
        </button>
      </div>

      {/* CENTER: Futuristic Holographic HUD & Circular Loader */}
      <div className="relative z-10 my-auto flex flex-col items-center">
        {/* Holographic Ring Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Cyber Corner HUD Reticles */}
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-brand-cyan/60 rounded-tl-sm pointer-events-none" />
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr-sm pointer-events-none" />
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-brand-teal/60 rounded-bl-sm pointer-events-none" />
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-brand-teal/60 rounded-br-sm pointer-events-none" />

          {/* SVG Rotating Orbital Rings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 260 260">
            <defs>
              <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#635BFF" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Background static guide ring */}
            <circle
              cx="130"
              cy="130"
              r="118"
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="2"
            />

            {/* Outer Slow Clockwise Ring */}
            <circle
              cx="130"
              cy="130"
              r="118"
              fill="none"
              stroke="url(#ringGrad1)"
              strokeWidth="2.5"
              strokeDasharray="24 16 6 16"
              className="animate-[spin_12s_linear_infinite]"
              style={{ transformOrigin: 'center' }}
            />

            {/* Middle Counter-Clockwise Energy Arcs */}
            <circle
              cx="130"
              cy="130"
              r="102"
              fill="none"
              stroke="url(#ringGrad2)"
              strokeWidth="2"
              strokeDasharray="40 30 15 25"
              className="animate-[spin_8s_linear_infinite_reverse]"
              style={{ transformOrigin: 'center' }}
            />

            {/* Inner dynamic circular progress stroke */}
            <circle
              cx="130"
              cy="130"
              r="86"
              fill="none"
              stroke="#14B8A6"
              strokeWidth="4"
              strokeDasharray={540}
              strokeDashoffset={540 - (540 * progress) / 100}
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(20, 184, 166, 0.8))"
              className="transition-[stroke-dashoffset] duration-150 ease-out"
              transform="rotate(-90 130 130)"
            />
          </svg>

          {/* Central Glowing Core Container */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* SAKUWISE Brand Icon Badge */}
            <div className="relative mb-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-violet via-purple-600 to-brand-teal p-[2px] shadow-glow-violet animate-pulseGlow">
                <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-brand-cyan animate-pulse" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-cyan"></span>
              </span>
            </div>

            {/* Big Digital Percentage */}
            <div className="flex items-baseline justify-center font-black tracking-tight">
              <span className="text-3xl sm:text-4xl bg-gradient-to-r from-white via-cyan-100 to-brand-cyan bg-clip-text text-transparent font-mono">
                {progress}
              </span>
              <span className="text-lg sm:text-xl text-brand-teal ml-0.5 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Brand Title & App Name */}
        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              SAKUWISE
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-black bg-brand-violet/30 border border-brand-violet/50 text-brand-cyan shadow-sm">
              AI
            </span>
          </div>
          <p className="text-xs text-brand-cyan/80 font-medium tracking-widest uppercase">
            Smart Finance, Brighter Future
          </p>
        </div>

        {/* Dynamic Status Text */}
        <div className="mt-4 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 max-w-sm text-center backdrop-blur-md shadow-lg">
          <p className="text-xs sm:text-sm font-medium text-slate-200 animate-fade-in key={statusText}">
            {statusText}
          </p>
        </div>

        {/* Futuristic Cyber Progress Bar */}
        <div className="w-64 sm:w-80 mt-5">
          <div className="relative h-2 w-full rounded-full bg-slate-800/80 border border-slate-700/80 p-[1px] overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-violet via-brand-teal to-brand-cyan transition-all duration-150 ease-out shadow-[0_0_12px_rgba(20,184,166,0.8)] relative"
              style={{ width: `${progress}%` }}
            >
              {/* Moving light shimmer across the bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Diagnostics / Sci-Fi Badges */}
      <div className="relative z-10 w-full max-w-3xl flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-teal" />
          <span>ENCRYPTION: 256-BIT SSL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-brand-violet" />
          <span>AI ENGINE: NEURAL DUAL-CORE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>STATUS: ONLINE & SECURE</span>
        </div>
      </div>
    </div>
  );
};
