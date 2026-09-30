import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { SakuMascot3D, MascotState } from '../../components/auth/SakuMascot3D.js';
import { sound } from '../../lib/sound.js';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Audio mute state
  const [isMuted, setIsMuted] = useState(sound.muted);

  // Mascot & speech states
  const [mascotState, setMascotState] = useState<MascotState>('greeting');
  const [speechText, setSpeechText] = useState('Halo teman baru! Ayo daftar bareng aku! 👋✨');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initial welcome voice & speech
    setMascotState('greeting');
    setSpeechText('Halo teman baru! Ayo daftar bareng aku! 👋✨');
    sound.playCartoonGreeting();
    sound.speak('Halo teman baru! Ayo daftar dan mulai masa depan finansialmu bareng aku!');

    const t = setTimeout(() => {
      setMascotState('idle');
      setSpeechText('');
    }, 4500);

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
      clearTimeout(t);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Input Focus Voice Reactions with cartoon audio cues
  const handleNameFocus = () => {
    setMascotState('idle');
    setSpeechText('Boleh tahu nama lengkapmu siapa? 😊');
    sound.playCartoonPop();
    sound.speak('Boleh tahu siapa nama lengkapmu?');
  };

  const handleEmailFocus = () => {
    setMascotState('idle');
    setSpeechText('Ketik email aktifmu untuk akses akun ya! 📧');
    sound.playCartoonPop();
    sound.speak('Ketik email aktifmu ya, biar akunmu aman!');
  };

  const handlePasswordFocus = () => {
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
  };

  const handleConfirmPasswordFocus = () => {
    if (showConfirmPassword) {
      setMascotState('peeking');
      setSpeechText('Ketik ulang kata sandi yang sama ya! 🔐');
      sound.speak('Ketik ulang kata sandi yang sama ya!');
    } else {
      setMascotState('covering_eyes');
      setSpeechText('Pastikan kata sandinya sama persis ya! 🔐');
      sound.speak('Pastikan kata sandinya sama persis ya!');
    }
    sound.playPeek();
  };

  const handleInputBlur = () => {
    setMascotState('idle');
    setSpeechText('');
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

  const handleToggleConfirmPassword = () => {
    const nextShow = !showConfirmPassword;
    setShowConfirmPassword(nextShow);
    sound.playPeek();
    if (nextShow) {
      setMascotState('peeking');
      setSpeechText('Konfirmasi kata sandi terlihat! 👀');
      sound.speak('Konfirmasi kata sandi terlihat!');
    } else {
      setMascotState('covering_eyes');
      setSpeechText('Mata tertutup lagi, aman! 🙈');
      sound.speak('Mata tertutup lagi, aman!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Harap masukkan nama lengkap Anda.');
      setMascotState('error');
      setSpeechText('Nama lengkapnya diisi dulu ya! ⚠️');
      sound.speak('Nama lengkapnya diisi dulu ya!');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Harap masukkan alamat email.');
      setMascotState('error');
      setSpeechText('Emailnya jangan lupa diisi ya! ⚠️');
      sound.speak('Emailnya jangan lupa diisi ya!');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi harus minimal 6 karakter.');
      setMascotState('error');
      setSpeechText('Kata sandi harus minimal 6 karakter ya! ⚠️');
      sound.speak('Kata sandi harus minimal 6 karakter ya!');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      setMascotState('error');
      setSpeechText('Konfirmasi kata sandi belum sama nih! ⚠️');
      sound.speak('Konfirmasi kata sandi belum sama nih!');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui syarat & ketentuan layanan.');
      setMascotState('error');
      setSpeechText('Centang persetujuan ketentuan layanan dulu ya! ⚠️');
      sound.speak('Centang persetujuan ketentuan layanan dulu ya!');
      return;
    }

    setIsLoading(true);
    setMascotState('typing');
    setSpeechText('Mendaftarkan akun barumu, tunggu sebentar ya... 🚀');
    sound.speak('Mendaftarkan akun barumu, tunggu sebentar ya!');

    try {
      await register(name, email, password);

      sound.playSuccess();
      setMascotState('celebrating');
      setSpeechText('Yeeeay, akun berhasil dibuat! Selamat datang! 🎉');
      sound.speak('Yeeeay, akun kamu berhasil dibuat! Selamat bergabung di SAKUWISE AI!');

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#635BFF', '#14B8A6', '#38BDF8', '#F59E0B'],
      });

      setTimeout(() => {
        navigate('/onboarding');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftar. Silakan coba lagi.');
      setMascotState('error');
      setSpeechText('Ups, pendaftaran gagal. Coba periksa kembali ya! 🥺');
      sound.playCartoonBoing();
      sound.speak('Ups, pendaftaran gagal. Coba periksa kembali ya!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#070B18] text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden select-none"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(99, 91, 255, 0.15) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(20, 184, 166, 0.12) 0%, transparent 50%),
          linear-gradient(to bottom, #070B18 0%, #0B1020 100%)
        `,
      }}
    >
      {/* Perspective 3D Grid Floor */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 91, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20, 184, 166, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: 'perspective(600px) rotateX(60deg) translateY(120px) scale(2)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/6 left-8 w-72 h-72 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />
      <div className="absolute bottom-10 right-8 w-80 h-80 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none animate-pulseGlow" />

      {/* ============================================================
          TOP NAVBAR HAS BEEN COMPLETELY REMOVED!
          NO HEADER / TOP BAR HERE
          ============================================================ */}

      {/* Main Container: Mascot (Left) & Luxury Register Card (Right) */}
      <main className="relative z-30 flex-1 w-full flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 my-auto">
          {/* LEFT: Cute Animated AI Mascot */}
          <div className="flex flex-col items-center select-none shrink-0 animate-fade-in-up">
            <div
              className="flex flex-col items-center cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95"
              onClick={() => {
                sound.playCartoonChime();
                sound.speak('Halo! Aku asisten pintar keuanganmu, siap mendampingimu!');
              }}
              title="Klik aku untuk bicara!"
            >
              <SakuMascot3D
                state={mascotState}
                speechText={speechText}
                mousePos={mousePos}
              />

              {/* Status Badge below Mascot */}
              <div className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SAKUWISE AI • Asisten Finansial Cerdas</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Ultra-Luxury Glowing Glass Register Card */}
          <div className="w-full max-w-[440px] z-20 animate-fade-in-up stagger-1">
            <div className="relative rounded-3xl p-[2px] bg-gradient-to-b from-brand-violet via-brand-teal/60 to-brand-cyan/30 animate-neon-glow shadow-2xl">
              <div className="relative bg-[#0F172A]/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-7 border border-white/10 overflow-hidden">
                {/* Subtle Glass Sheen */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                {/* Brand Logo & Header */}
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center gap-2 mb-1.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-glow-violet">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                        SAKUWISE
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-bold bg-brand-violet/25 border border-brand-violet/50 text-brand-cyan shadow-sm">
                        AI
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-cyan/90 font-medium tracking-wide text-center mb-2">
                    Smart Finance, Brighter Future
                  </p>

                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Mulai Langkah Finansialmu
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Daftar gratis & nikmati panduan asisten AI cerdas masa depanmu.
                  </p>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                    <span className="font-bold">⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Name Field */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={handleNameFocus}
                        onBlur={handleInputBlur}
                        placeholder="Contoh: Andrian Pratama"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={handleEmailFocus}
                        onBlur={handleInputBlur}
                        placeholder="nama@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handlePasswordFocus}
                        onBlur={handleInputBlur}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleTogglePassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={handleConfirmPasswordFocus}
                        onBlur={handleInputBlur}
                        placeholder="Ulangi kata sandi"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleToggleConfirmPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        title={showConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Privacy checkbox */}
                  <div className="flex items-start gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="register-terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-800 text-brand-violet focus:ring-brand-violet cursor-pointer"
                    />
                    <label htmlFor="register-terms" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                      Saya menyetujui Ketentuan Layanan & Kebijakan Privasi SAKUWISE AI.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="register-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-brand-violet via-purple-600 to-brand-teal text-white shadow-glow-violet hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mendaftarkan...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftar Akun Baru</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch to Login */}
                <div className="mt-4 pt-3.5 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    Sudah memiliki akun SAKUWISE AI?{' '}
                    <Link
                      to="/login"
                      className="text-brand-teal font-bold hover:underline"
                    >
                      Masuk ke Akun
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Minimal Controls (Bottom-Left Corner) */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-full shadow-lg">
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
