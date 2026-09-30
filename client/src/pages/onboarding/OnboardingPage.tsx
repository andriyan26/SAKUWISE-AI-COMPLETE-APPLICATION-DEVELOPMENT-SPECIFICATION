import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../lib/api-client.js';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Target, DollarSign, Wallet, ShieldCheck, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [goal, setGoal] = useState<string>('Menyiapkan dana darurat');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('Rp 5.000.000 - Rp 10.000.000');
  const [savingsTarget, setSavingsTarget] = useState<string>('Rp 1.000.000 - Rp 2.500.000');
  const [currency, setCurrency] = useState<string>('IDR');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const goalOptions = [
    { id: 'Mengatur pengeluaran', icon: Wallet, desc: 'Mencegah pemborosan dan melacak pos belanja rutin' },
    { id: 'Menabung untuk membeli sesuatu', icon: Target, desc: 'Membeli gadget, kendaraan, atau liburan impian' },
    { id: 'Menyiapkan dana darurat', icon: ShieldCheck, desc: 'Menyiapkan cadangan 3-6 bulan pengeluaran hidup' },
    { id: 'Mengelola keuangan bulanan', icon: DollarSign, desc: 'Menyeimbangkan pemasukan gaji dan cicilan/tagihan' },
    { id: 'Memahami kebiasaan keuangan', icon: Compass, desc: 'Mendapatkan analisis AI tentang pola pengeluaran' },
  ];

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/onboarding', {
        financialGoal: goal,
        monthlyIncome,
        savingsTarget,
        currency,
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });

      await refreshUser();
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding submit error:', error);
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1020] text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg text-white">SAKUWISE AI</span>
        </div>
        <div className="text-xs text-slate-400 font-semibold">
          Langkah {step} dari 6
        </div>
      </header>

      {/* Center Wizard Container */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-xl bg-[#0F172A]/90 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-violet to-brand-teal transition-all duration-300 rounded-full"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>

          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-violet/20 border border-brand-violet/40 text-brand-cyan flex items-center justify-center mx-auto mb-5 shadow-glow-violet">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Selamat Datang, {user?.name || 'Kawan'}! 👋
              </h2>
              <p className="text-sm text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
                Mari kita luangkan waktu 1 menit untuk menyesuaikan preferensi keuanganmu agar asisten SAKUWISE AI dapat memberikan rekomendasi yang presisi.
              </p>
              <button
                onClick={() => setStep(2)}
                className="mt-8 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all inline-flex items-center gap-2"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Main Goal */}
          {step === 2 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Apa tujuan finansial utamamu?
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Pilih fokus yang paling relevan dengan kondisimu saat ini.
              </p>
              <div className="space-y-3">
                {goalOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = goal === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setGoal(opt.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-brand-violet/15 border-brand-violet shadow-glow-violet'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-brand-violet text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{opt.id}</div>
                        <div className="text-xs text-slate-400">{opt.desc}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-teal" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-violet hover:bg-brand-violet/90 text-white flex items-center gap-1.5"
                >
                  <span>Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Monthly Income Range */}
          {step === 3 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Kisaran Penghasilan Bulananmu (Opsional)
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Data ini hanya digunakan untuk mengkalibrasi rasio tabungan idealmu.
              </p>
              <div className="space-y-3">
                {[
                  '< Rp 3.000.000',
                  'Rp 3.000.000 - Rp 5.000.000',
                  'Rp 5.000.000 - Rp 10.000.000',
                  'Rp 10.000.000 - Rp 25.000.000',
                  '> Rp 25.000.000',
                ].map((range) => (
                  <div
                    key={range}
                    onClick={() => setMonthlyIncome(range)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      monthlyIncome === range
                        ? 'bg-brand-violet/15 border-brand-violet'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">{range}</span>
                    {monthlyIncome === range && <CheckCircle2 className="w-5 h-5 text-brand-teal" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-violet hover:bg-brand-violet/90 text-white flex items-center gap-1.5"
                >
                  <span>Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Monthly Savings Target */}
          {step === 4 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Target Tabungan Bulanan (Opsional)
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Berapa estimasi nominal yang ingin kamu sisihkan setiap bulannya?
              </p>
              <div className="space-y-3">
                {[
                  'Rp 500.000 - Rp 1.000.000',
                  'Rp 1.000.000 - Rp 2.500.000',
                  'Rp 2.500.000 - Rp 5.000.000',
                  '> Rp 5.000.000',
                  'Belum ada target khusus',
                ].map((target) => (
                  <div
                    key={target}
                    onClick={() => setSavingsTarget(target)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      savingsTarget === target
                        ? 'bg-brand-violet/15 border-brand-violet'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">{target}</span>
                    {savingsTarget === target && <CheckCircle2 className="w-5 h-5 text-brand-teal" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-violet hover:bg-brand-violet/90 text-white flex items-center gap-1.5"
                >
                  <span>Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Currency */}
          {step === 5 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Pilih Mata Uang Utama
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Format mata uang untuk seluruh saldo, transaksi, dan laporan.
              </p>
              <div className="space-y-3">
                {[
                  { code: 'IDR', name: 'Rupiah Indonesia (Rp)', symbol: 'Rp' },
                  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
                  { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$' },
                ].map((cur) => (
                  <div
                    key={cur.code}
                    onClick={() => setCurrency(cur.code)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      currency === cur.code
                        ? 'bg-brand-violet/15 border-brand-violet'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold text-white">{cur.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{cur.code}</span>
                    </div>
                    {currency === cur.code && <CheckCircle2 className="w-5 h-5 text-brand-teal" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-violet hover:bg-brand-violet/90 text-white flex items-center gap-1.5"
                >
                  <span>Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Ready & Finish */}
          {step === 6 && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Semua Telah Siap! 🎉</h2>
              <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                Preferensimu telah tersimpan. SAKUWISE AI siap mendampingi setiap keputusan finansialmu.
              </p>
              <div className="my-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-left text-xs space-y-1.5 text-slate-300">
                <div>🎯 Fokus: <span className="text-brand-cyan font-bold">{goal}</span></div>
                <div>💰 Mata Uang: <span className="text-brand-cyan font-bold">{currency}</span></div>
              </div>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Menyiapkan Dashboard...' : 'Buka Dashboard Sekarang'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        &copy; {new Date().getFullYear()} SAKUWISE AI
      </footer>
    </div>
  );
};
