import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { SakuMascot3D, MascotState } from '../../components/auth/SakuMascot3D.js';
import { AppIntroPreloader } from '../../components/common/AppIntroPreloader.js';
import { sound } from '../../lib/sound.js';
import confetti from 'canvas-confetti';
import {
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Intro Futuristic Preloader State
  const [showPreloader, setShowPreloader] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Audio mute state
  const [isMuted, setIsMuted] = useState(sound.muted);

  // Mouse tracking for mascot eye gaze
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Story Animation Sequence:
  // Phase 1 (0s - 2.0s): Mascot enters on the LEFT (muncul awal di sebelah kiri)
  // Phase 2 (2.0s - 4.8s): Mascot waves & says hello on the LEFT (say hello!)
  // Phase 3 (4.8s - 8.0s): Mascot walks SLOWLY to the bottom-right (jalan perlahan ke kanan bawah mengambil form)
  // Phase 4 (8.0s - 11.6s): Mascot pulls the form SLOWLY to the center (tarik perlahan ke tengah)
  // Phase 5 (11.6s - 15.0s): Form locked in CENTER, Mascot docks at POSISI KIRI SAMPING FORM!
  // Phase 6 (15.0s+): Permanent interactive idle state on the LEFT
  const [animPhase, setAnimPhase] = useState<number>(0);
  const [mascotState, setMascotState] = useState<MascotState>('walking_in');
  const [speechText, setSpeechText] = useState<string>('Halo teman-teman! Selamat datang di SAKUWISE AI! 👋');

  // Run the story choreography with cute animated character voice & cartoon effects
  const runAnimationSequence = () => {
    // 0s: Reset off-screen left
    setAnimPhase(0);
    setMascotState('walking_in');
    setSpeechText('Halo teman-teman! Selamat datang di SAKUWISE AI! 👋');

    // 0.2s: Phase 1 - Walk in from left
    const t0 = setTimeout(() => {
      setAnimPhase(1);
      sound.playCartoonGreeting();
      sound.speak('Halo teman-teman! Selamat datang di SAKUWISE AI!');
    }, 200);

    // 2.2s: Phase 2 - Welcome message on the left!
    const t1 = setTimeout(() => {
      setAnimPhase(2);
      setMascotState('greeting');
      setSpeechText('Aku asisten pintar keuanganmu, senang banget bisa bertemu kamu! ✨');
      sound.playCartoonChime();
      sound.speak('Aku asisten pintar keuanganmu, senang banget bisa bertemu kamu!');
    }, 2200);

    // 4.6s: Phase 3 - Announce before pulling: "Sebentar yaa, aku tarik..."
    const t2 = setTimeout(() => {
      setAnimPhase(3);
      setMascotState('walking_in');
      setSpeechText('Sebentar yaa, aku tarik formulirnya dulu! 🏃‍♂️💨');
      sound.playCartoonBoing();
      sound.playWoosh();
      sound.speak('Sebentar yaa, aku tarik formulirnya dulu!');
    }, 4600);

    // 8.0s: Phase 4 - Pulling slowly to center:
    const t3 = setTimeout(() => {
      setAnimPhase(4);
      setMascotState('pulling');
      setSpeechText('Heei-yaaa! Tarik perlahan ke tengah... 🦾✨');
      sound.playCartoonEffort();
      sound.speak('Heei-yaaa! Tarik perlahan ke tengah!');
    }, 8000);

    // 11.6s: Phase 5 - Pulled & locked in center! "Sudah saya tarik ya, silakan login!"
    const t4 = setTimeout(() => {
      setAnimPhase(5);
      setMascotState('presenting');
      setSpeechText('Sudah saya tarik ya, silakan login! 🚀');
      sound.playCartoonTada();
      sound.speak('Sudah saya tarik ya, silakan login!');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#635BFF', '#14B8A6', '#38BDF8'],
      });
    }, 11600);

    // 16.0s: Phase 6 - Permanent interactive idle mode on the LEFT
    const t5 = setTimeout(() => {
      setAnimPhase(6);
      setMascotState('idle');
      setSpeechText('');
    }, 16000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  };

  useEffect(() => {
    let cleanupAnim: (() => void) | undefined;
    if (!showPreloader) {
      cleanupAnim = runAnimationSequence();
    }

    const handleFirstGesture = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      if (cleanupAnim) cleanupAnim();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [showPreloader]);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  // Mouse move tracker for eye gaze
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Sound toggle
  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Handle Input Focus Reactions with animated cartoon character voice
  const handleEmailFocus = () => {
    if (animPhase >= 5) {
      setMascotState('idle');
      setSpeechText('Silakan ketik email kamu ya! 📧');
      sound.playCartoonPop();
      sound.speak('Silakan ketik email kamu ya!');
    }
  };

  const handlePasswordFocus = () => {
    if (animPhase >= 5) {
      if (showPassword) {
        setMascotState('peeking');
        setSpeechText('Wah, passwordnya terlihat! 👀');
        sound.speak('Wah, passwordnya terlihat!');
      } else {
        setMascotState('covering_eyes');
        setSpeechText('Tenang, aku tutup mata, nggak bakal ngintip kok! 🙈🔒');
        sound.speak('Tenang, aku tutup mata, nggak bakal ngintip kok!');
      }
      sound.playPeek();
    }
  };

  const handleInputBlur = () => {
    if (animPhase >= 5) {
      setMascotState('idle');
      setSpeechText('');
    }
  };

  const handleTogglePassword = () => {
    const nextShow = !showPassword;
    setShowPassword(nextShow);
    sound.playPeek();
    if (nextShow) {
      setMascotState('peeking');
      setSpeechText('Wah, passwordnya terlihat! 👀');
      sound.speak('Wah, passwordnya terlihat!');
    } else {
      setMascotState('covering_eyes');
      setSpeechText('Mata tertutup lagi, aman! 🙈');
      sound.speak('Mata tertutup lagi, aman!');
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Harap isi email dan kata sandi Anda.');
      setMascotState('error');
      setSpeechText('Ups, email dan passwordnya wajib diisi dulu ya! ⚠️');
      sound.speak('Ups, email dan passwordnya wajib diisi dulu ya!');
      return;
    }

    setIsLoading(true);
    setMascotState('typing');
    setSpeechText('Memverifikasi akun kamu, tunggu sebentar ya... 🔐');
    sound.speak('Memverifikasi akun kamu, tunggu sebentar ya!');

    try {
      await login(email, password);

      sound.playCartoonTada();
      setMascotState('celebrating');
      setSpeechText('Yeeeay, berhasil masuk! Selamat datang kembali! 🎉');
      sound.speak('Yeeeay, berhasil masuk! Selamat datang kembali!');

      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#635BFF', '#14B8A6', '#38BDF8', '#F59E0B'],
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa email atau kata sandi Anda.');
      setMascotState('error');
      setSpeechText('Ups, email atau passwordnya salah nih, coba dicek lagi ya! 🥺');
      sound.speak('Ups, email atau passwordnya salah nih, coba dicek lagi ya!');
      sound.playChirp(300, 0.2);
    } finally {
      setIsLoading(false);
    }
  };

  // Precise coordinate positioning for the mascot during each story phase
  const getMascotStyle = (): React.CSSProperties => {
    switch (animPhase) {
      case 0:
        // Off-screen left at start
        return {
          position: 'absolute',
          left: '-20%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'none',
          opacity: 0,
          zIndex: 40,
        };
      case 1:
        // Phase 1: Emerging into view on the left
        return {
          position: 'absolute',
          left: '14%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'all 1.9s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: 1,
          zIndex: 40,
        };
      case 2:
        // Phase 2: Standing on the left, saying hello
        return {
          position: 'absolute',
          left: '14%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.5s ease-out',
          opacity: 1,
          zIndex: 40,
        };
      case 3:
        // Phase 3: Walking slowly to the bottom-right corner!
        return {
          position: 'absolute',
          left: '82%',
          top: '74%',
          transform: 'translate(-50%, -50%) scale(0.95)',
          transition: 'all 3.2s ease-in-out',
          opacity: 1,
          zIndex: 40,
        };
      case 4:
        // Phase 4: Pulling the form slowly towards the center, moving backwards to the left side!
        return {
          position: 'absolute',
          left: '18%',
          top: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          transition: 'all 3.6s cubic-bezier(0.22, 1, 0.36, 1)',
          opacity: 1,
          zIndex: 40,
        };
      case 5:
      case 6:
      default:
        // Phase 5 & 6 (PERMANENT FINAL POSITION): DI POSISI KIRI SAMPING FORM LOGIN!
        return {
          position: 'absolute',
          left: '18%',
          top: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          transition: 'all 0.6s ease-out',
          opacity: 1,
          zIndex: 40,
        };
    }
  };

  // Precise positioning for the Login Card during each story phase
  const getCardStyle = (): React.CSSProperties => {
    if (animPhase < 4) {
      // Parked off-screen to the right in Phase 0, 1, 2, 3
      return {
        transform: 'translateX(100vw)',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'none',
      };
    }
    if (animPhase === 4) {
      // Phase 4: Gliding slowly into the center as mascot pulls it!
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 3.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease-in',
        pointerEvents: 'auto',
      };
    }
    // Phase 5 & 6: Permanently locked in the center!
    return {
      transform: 'translateX(0)',
      opacity: 1,
      pointerEvents: 'auto',
    };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 25%, rgba(99, 91, 255, 0.16) 0%, transparent 65%), radial-gradient(circle at 85% 85%, rgba(20, 184, 166, 0.12) 0%, transparent 55%)`,
      }}
    >
      {/* Futuristic Intro Holographic Preloader */}
      {showPreloader && <AppIntroPreloader onComplete={handlePreloaderComplete} />}

      {/* 3D Perspective Grid Background Floor */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(99, 91, 255, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 91, 255, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(600px) rotateX(45deg) translateY(120px)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/6 left-8 w-72 h-72 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />
      <div className="absolute bottom-10 right-8 w-80 h-80 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />

      {/* Main Experience Arena */}
      <main className="relative z-30 flex-1 w-full flex items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-6xl min-h-[640px] flex items-center justify-center overflow-hidden">

          {/* ============================================================
              DYNAMIC MASCOT ACTOR
              Story Flow:
              1. Muncul dari sebelah KIRI
              2. Say Hello di sebelah KIRI
              3. Jalan perlahan ke KANAN BAWAH mengambil form login
              4. Tarik perlahan form login menuju ke TENGAH
              5. Menetap di POSISI KIRI SAMPING FORM LOGIN!
              ============================================================ */}
          <div style={getMascotStyle()}>
            <div
              className="flex flex-col items-center cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95"
              onClick={() => {
                sound.playCartoonChime();
                sound.speak('Halo! Aku asisten pintar keuanganmu, senang bertemu denganmu!');
              }}
              title="Klik aku untuk mendengarkan suara!"
            >
              <SakuMascot3D
                state={mascotState}
                speechText={speechText}
                mousePos={mousePos}
              />

              {/* Status Badge below Mascot */}
              <div className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SAKUWISE AI • {animPhase === 4 ? 'Memuat Pusat Data...' : animPhase === 3 ? 'Mengamankan Sesi...' : 'Asisten Finansial Cerdas'}</span>
              </div>
            </div>
          </div>

          {/* ============================================================
              PULLING ENERGY TETHER / CABLE (Visible during Phase 4)
              Renders glowing neon holographic tether while pulling to center
              ============================================================ */}
          {animPhase === 4 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-35 overflow-visible"
              viewBox="0 0 1000 600"
            >
              <defs>
                <linearGradient id="tetherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#635BFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path
                d="M 280 320 Q 420 340 560 350"
                stroke="url(#tetherGrad)"
                strokeWidth="5"
                strokeDasharray="12 6"
                fill="none"
                filter="drop-shadow(0 0 12px #14B8A6)"
                className="animate-[energyPulse_0.8s_infinite_linear]"
              />
              <circle cx="280" cy="320" r="8" fill="#14B8A6" filter="drop-shadow(0 0 8px #14B8A6)" />
              <circle cx="560" cy="350" r="8" fill="#635BFF" filter="drop-shadow(0 0 8px #635BFF)" />
            </svg>
          )}

          {/* ============================================================
              THE ULTRA-LUXURY GLOWING GLASS LOGIN CARD
              - Parked off-screen in Phase 0, 1, 2, 3
              - Slowly pulled into center in Phase 4 (over 3.6s)
              - Solidly locked in CENTER in Phase 5 & 6 with Mascot on LEFT!
              ============================================================ */}
          <div
            style={getCardStyle()}
            className="w-full max-w-[420px] mx-auto z-20"
          >
            <div className="relative rounded-3xl p-[2px] bg-gradient-to-b from-brand-violet via-brand-teal/60 to-brand-cyan/30 animate-neon-glow shadow-2xl">
              {/* Tablet Frame & Glass Interior */}
              <div className="relative bg-[#0F172A]/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-8 border border-white/10 overflow-hidden">
                {/* Subtle Top Glass Sheen */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                {/* SAKUWISE Brand Header integrated into Card */}
                <div className="text-center mb-6">
                  {/* Brand Logo & Name */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-glow-violet">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                        SAKUWISE
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-brand-violet/25 border border-brand-violet/50 text-brand-cyan shadow-sm">
                        AI
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-brand-cyan/90 font-medium tracking-wide text-center mb-3">
                    Smart Finance, Brighter Future
                  </p>

                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Selamat Datang Kembali
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Masuk untuk mengelola keuangan cerdasmu hari ini.
                  </p>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2 animate-shake">
                    <span className="font-bold">⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={handleEmailFocus}
                        onBlur={handleInputBlur}
                        placeholder="nama@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Kata Sandi
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-brand-cyan hover:underline font-medium"
                      >
                        Lupa sandi?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handlePasswordFocus}
                        onBlur={handleInputBlur}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleTogglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-brand-violet focus:ring-brand-violet"
                      />
                      <span>Ingat saya di perangkat ini</span>
                    </label>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-violet via-purple-600 to-brand-teal text-white shadow-glow-violet hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Akun</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch to Register */}
                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    Belum memiliki akun SAKUWISE AI?{' '}
                    <Link
                      to="/register"
                      className="text-brand-teal font-bold hover:underline"
                    >
                      Daftar Gratis
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Minimal Controls (Bottom-Left Corner, NO TOP NAVBAR) */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-full shadow-lg">
        {/* Replay Animation */}
        <button
          onClick={runAnimationSequence}
          title="Putar Ulang Cerita Animasi"
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Replay Futuristic Loading Intro */}
        <button
          onClick={() => setShowPreloader(true)}
          title="Putar Animasi Loading Keren"
          className="p-1.5 rounded-full hover:bg-slate-800 text-brand-cyan hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-brand-teal" />}
        </button>
      </div>

      {/* Footer */}
      <footer className="relative z-20 py-3 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SAKUWISE AI. All rights reserved. • Smart Finance, Brighter Future
      </footer>
    </div>
  );
};
