import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api-client.js';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim instruksi pemulihan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <header className="w-full max-w-md mx-auto py-4">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Halaman Masuk
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#0F172A]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-violet/20 border border-brand-violet/40 text-brand-cyan flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white">Lupa Kata Sandi?</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Masukkan email akunmu. Kami akan mengirimkan tautan reset kata sandi jika terdaftar.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Akun</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-violet"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-white">Instruksi Terkirim</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Jika alamat <span className="font-semibold text-brand-cyan">{email}</span> terdaftar, tautan pemulihan kata sandi telah dikirimkan ke kotak masukmu.
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-block py-2.5 px-6 rounded-xl text-xs font-bold bg-brand-violet text-white"
                >
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SAKUWISE AI
      </footer>
    </div>
  );
};
