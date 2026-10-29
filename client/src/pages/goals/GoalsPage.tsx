import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo } from '../../lib/dates.js';
import { sound } from '../../lib/sound.js';
import { voiceService } from '../../lib/voice-service.js';
import { parseVoiceGoal, parseVoiceContribution } from '../../lib/voice-parser.js';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  ShieldCheck,
  Laptop,
  Palmtree,
  Car,
  Home,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  X,
  Edit2,
  Trash2,
  Mic,
  Sparkles,
} from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [contributionGoal, setContributionGoal] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [icon, setIcon] = useState('ShieldCheck');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contribution State
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [contribError, setContribError] = useState<string | null>(null);
  const [isContribSubmitting, setIsContribSubmitting] = useState(false);

  // In-App Toast & Confirmation
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Voice Note states for Goals & Contributions
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'GOAL' | 'CONTRIB'>('GOAL');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/goals');
      if (res.success) {
        setGoals(res.data);
      }
    } catch (error) {
      console.error('fetchGoals error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setDescription('');
    setTargetAmount('');
    setCurrentAmount('0');
    setFormError(null);
    setVoiceSuccessMsg(null);
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    setTargetDate(future.toISOString().split('T')[0]);
    setPriority('MEDIUM');
    setIcon('ShieldCheck');
    setIsCreateOpen(true);
  };

  const openEditModal = (g: any) => {
    setEditingGoal(g);
    setName(g.name);
    setDescription(g.description || '');
    setTargetAmount(g.targetAmount ? g.targetAmount.toString() : '');
    setCurrentAmount(g.currentAmount ? g.currentAmount.toString() : '0');
    setFormError(null);
    setVoiceSuccessMsg(null);
    setTargetDate(g.targetDate ? g.targetDate.split('T')[0] : '');
    setPriority(g.priority || 'MEDIUM');
    setIcon(g.icon || 'Target');
    setIsCreateOpen(true);
  };

  const openVoiceGoalModal = () => {
    setVoiceMode('GOAL');
    setVoiceTranscript('');
    setVoiceSuccessMsg(null);
    setIsVoiceModalOpen(true);
    startVoiceListening('GOAL');
  };

  const openVoiceContribModal = () => {
    setVoiceMode('CONTRIB');
    setVoiceTranscript('');
    setVoiceSuccessMsg(null);
    setIsVoiceModalOpen(true);
    startVoiceListening('CONTRIB');
  };

  const startVoiceListening = (mode: 'GOAL' | 'CONTRIB') => {
    setVoiceTranscript('');
    setIsVoiceListening(true);
    sound.playChirp(800, 0.08);

    voiceService.startListening({
      lang: 'id-ID',
      continuous: false,
      interimResults: true,
      onStart: () => setIsVoiceListening(true),
      onResult: (text, isFinal) => {
        setVoiceTranscript(text);
        if (isFinal) {
          setIsVoiceListening(false);
          setIsVoiceModalOpen(false);
          if (mode === 'GOAL') {
            applyVoiceGoal(text);
          } else {
            applyVoiceContrib(text);
          }
        }
      },
      onError: (err) => {
        setIsVoiceListening(false);
        setToast({ type: 'error', message: err });
      },
      onEnd: () => setIsVoiceListening(false),
    });
  };

  const stopVoiceListening = () => {
    voiceService.stopListening();
    setIsVoiceListening(false);
  };

  const applyVoiceGoal = (text: string) => {
    const parsed = parseVoiceGoal(text);
    if (parsed.name) setName(parsed.name);
    if (parsed.targetAmount) setTargetAmount(parsed.targetAmount.toString());
    if (parsed.targetDate) setTargetDate(parsed.targetDate);
    if (parsed.priority) setPriority(parsed.priority);
    if (parsed.icon) setIcon(parsed.icon);
    if (parsed.description) setDescription(parsed.description);

    setVoiceSuccessMsg(
      `Terdeteksi: ${parsed.name} (Target: ${
        parsed.targetAmount ? formatIDR(parsed.targetAmount) : '-'
      })`
    );
    sound.playSuccess();
    setIsCreateOpen(true);
  };

  const applyVoiceContrib = (text: string) => {
    const parsed = parseVoiceContribution(text);
    if (parsed.amount) setContribAmount(parsed.amount.toString());
    if (parsed.note) setContribNote(parsed.note);

    setVoiceSuccessMsg(
      `Terdeteksi: Setoran ${parsed.amount ? formatIDR(parsed.amount) : '-'}`
    );
    sound.playSuccess();
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedTarget = parseFloat(targetAmount);

    if (!name.trim()) {
      setFormError('Harap masukkan nama tujuan finansial.');
      return;
    }
    if (!parsedTarget || parsedTarget <= 0) {
      setFormError('Target nominal tabungan harus lebih dari 0.');
      return;
    }
    if (!targetDate) {
      setFormError('Harap tentukan target tanggal pencapaian.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGoal) {
        await api.patch(`/goals/${editingGoal.id}`, {
          name: name.trim(),
          description: description.trim(),
          targetAmount: parsedTarget,
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          priority,
          icon,
        });
        setToast({ type: 'success', message: 'Tujuan finansial berhasil diperbarui!' });
      } else {
        await api.post('/goals', {
          name: name.trim(),
          description: description.trim(),
          targetAmount: parsedTarget,
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          priority,
          icon,
        });
        setToast({ type: 'success', message: 'Tujuan finansial baru berhasil dibuat!' });
      }

      sound.playSuccess();
      setIsCreateOpen(false);
      fetchGoals();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan target tabungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContribError(null);
    if (!contributionGoal) return;
    const parsed = parseFloat(contribAmount);

    if (!parsed || parsed <= 0) {
      setContribError('Nominal setoran tabungan harus lebih dari 0.');
      return;
    }

    setIsContribSubmitting(true);
    try {
      const res = await api.post(`/goals/${contributionGoal.id}/contributions`, {
        amount: parsed,
        note: contribNote || 'Setoran tabungan rutin',
      });

      if (res.success) {
        sound.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setToast({
          type: 'success',
          message: `Berhasil menambahkan setoran ${formatIDR(parsed)} ke "${contributionGoal.name}"!`,
        });
        setContributionGoal(null);
        setContribAmount('');
        setContribNote('');
        fetchGoals();
      } else {
        setContribError(res.message || 'Gagal menambahkan setoran tabungan.');
      }
    } catch (err: any) {
      setContribError(err.message || 'Gagal menambahkan setoran tabungan.');
    } finally {
      setIsContribSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/goals/${deleteTarget.id}`);
      sound.playChirp(400, 0.1);
      setToast({ type: 'success', message: `Target "${deleteTarget.name}" berhasil dihapus.` });
      setDeleteTarget(null);
      fetchGoals();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal menghapus target.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'HIGH') return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
    if (p === 'MEDIUM') return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tujuan Finansial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Wujudkan impian dan rencanakan tabungan masa depan dengan panduan target presisi.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => {
              openCreateModal();
              openVoiceGoalModal();
            }}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan border border-slate-200 dark:border-brand-violet/30 shadow-sm transition-all flex items-center gap-1.5 group"
          >
            <Mic className="w-4 h-4 text-brand-violet dark:text-brand-cyan group-hover:scale-110 transition-transform" />
            <span>Voice Target AI</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Target Finansial</span>
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g, idx) => {
          const isCompleted = g.percentage >= 100;

          return (
            <div
              key={g.id}
              style={{ animationDelay: `${idx * 60}ms` }}
              className={`p-6 rounded-3xl bg-white dark:bg-[#151D30] border transition-all shadow-sm dark:shadow-xl flex flex-col justify-between animate-fade-in-up ${
                isCompleted
                  ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : 'border-slate-200 dark:border-[#293449] hover:border-brand-violet/50'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-violet/10 text-brand-violet dark:text-brand-cyan flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{g.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(
                            g.priority
                          )}`}
                        >
                          {g.priority === 'HIGH' ? 'Prioritas Tinggi' : g.priority === 'MEDIUM' ? 'Prioritas Sedang' : 'Rendah'}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Tercapai 100%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-violet dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Target"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(g)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {g.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 mb-3 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>
                )}

                {/* Progress Visual */}
                <div className="my-4">
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{formatIDR(g.currentAmount)}</span>
                    <span className="text-brand-violet dark:text-brand-cyan">{g.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-brand-violet to-brand-teal'
                      }`}
                      style={{ width: `${Math.min(100, g.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    <span>Target: {formatIDR(g.targetAmount)}</span>
                    <span>Sisa: {formatIDR(g.remainingAmount)}</span>
                  </div>
                </div>

                {/* Calculation Info */}
                {!isCompleted && g.monthlySavingsNeeded > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />
                      Estimasi Nabung:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatIDR(g.monthlySavingsNeeded)} / bulan
                    </span>
                  </div>
                )}
              </div>

              {/* Action: Add Contribution */}
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#293449] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target: {formatDateIndo(g.targetDate)} ({g.daysRemaining} hari lagi)
                </span>
                <button
                  onClick={() => {
                    setContributionGoal(g);
                    setContribAmount('');
                    setContribNote('');
                    setContribError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet/90 text-white flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Setor Tabungan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Goal Modal */}
      {isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg my-auto max-h-[92vh] flex flex-col bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-200">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 shrink-0">
                {editingGoal ? 'Edit Tujuan Finansial' : 'Tambah Tujuan Finansial Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 shrink-0">
                Wujudkan impian finansialmu dengan perencanaan target yang terukur dan rapi.
              </p>

              {/* Voice Note AI Quick Fill Button */}
              <button
                type="button"
                onClick={openVoiceGoalModal}
                className="w-full py-2.5 px-3.5 mb-3 rounded-2xl bg-gradient-to-r from-brand-violet/15 via-purple-500/10 to-brand-teal/15 hover:from-brand-violet/25 hover:to-brand-teal/25 border border-brand-violet/40 text-brand-violet dark:text-brand-cyan font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group shrink-0 active:scale-[0.99]"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span>Bicara / Rekam Target Finansial (Voice AI)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-violet/20 text-brand-violet dark:text-brand-cyan ml-auto font-mono">
                  Auto-Fill ✨
                </span>
              </button>

              {/* Voice Detection Success Banner */}
              {voiceSuccessMsg && (
                <div className="p-2.5 mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="flex-1 font-semibold">{voiceSuccessMsg}</span>
                  <button
                    type="button"
                    onClick={() => setVoiceSuccessMsg(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* In-Modal Error Alert Banner */}
              {formError && (
                <div className="p-3.5 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fadeIn shrink-0">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium leading-relaxed">{formError}</span>
                </div>
              )}

              <form onSubmit={handleGoalSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Target</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dana Darurat, Beli Rumah, MacBook M3..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ikon Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'Target', label: 'Umum', Icon: Target },
                      { id: 'ShieldCheck', label: 'Darurat', Icon: ShieldCheck },
                      { id: 'Laptop', label: 'Gadget', Icon: Laptop },
                      { id: 'Palmtree', label: 'Liburan', Icon: Palmtree },
                      { id: 'Car', label: 'Kendaraan', Icon: Car },
                      { id: 'Home', label: 'Rumah', Icon: Home },
                      { id: 'GraduationCap', label: 'Edukasi', Icon: GraduationCap },
                    ].map((item) => {
                      const IconComp = item.Icon;
                      const isSelected = icon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setIcon(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-brand-violet text-white shadow-sm ring-2 ring-brand-violet/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Nominal (IDR)</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-brand-violet transition-all"
                  />
                  {parseFloat(targetAmount) > 0 && (
                    <p className="text-[11px] font-semibold text-brand-teal dark:text-brand-cyan mt-1">
                      Target: {formatIDR(parseFloat(targetAmount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Saldo Awal Terkumpul</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                  />
                  {parseFloat(currentAmount) > 0 && (
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Saldo awal: {formatIDR(parseFloat(currentAmount))}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Tanggal</label>
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tingkat Prioritas</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                    >
                      <option value="HIGH">Tinggi (Paling Mendesak)</option>
                      <option value="MEDIUM">Sedang (Prioritas Standar)</option>
                      <option value="LOW">Rendah (Fleksibel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Keterangan / Rencana</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Tujuan tabungan ini untuk keperluan masa depan..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>

                <div className="pt-2 sticky bottom-0 bg-white dark:bg-[#151D30] pb-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : (editingGoal ? 'Simpan Perubahan' : 'Buat Target Finansial')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Add Contribution Modal with Explicit Balance Note */}
      {contributionGoal &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md my-auto max-h-[92vh] flex flex-col bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-200">
              <button
                onClick={() => setContributionGoal(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 shrink-0">Setor Tabungan</h3>
              <p className="text-xs text-brand-violet dark:text-brand-cyan font-semibold mb-3 shrink-0">{contributionGoal.name}</p>

              {/* Voice Note AI Button for Contribution */}
              <button
                type="button"
                onClick={openVoiceContribModal}
                className="w-full py-2.5 px-3.5 mb-3 rounded-2xl bg-gradient-to-r from-brand-violet/15 via-purple-500/10 to-brand-teal/15 hover:from-brand-violet/25 hover:to-brand-teal/25 border border-brand-violet/40 text-brand-violet dark:text-brand-cyan font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group shrink-0 active:scale-[0.99]"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span>Bicara Nominal Setoran (Voice AI)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-violet/20 text-brand-violet dark:text-brand-cyan ml-auto font-mono">
                  Auto-Fill ✨
                </span>
              </button>

              {/* In-Modal Error Notification */}
              {contribError && (
                <div className="p-3 mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-start gap-2 animate-fadeIn shrink-0">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium leading-relaxed">{contribError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs mb-4 leading-relaxed shrink-0">
                💡 <strong>Catatan:</strong> Menambahkan setoran di sini mencatat progres target tabunganmu. Untuk mencatat mutasi pengeluaran kas sebenarnya, pastikan kamu juga mencatatnya di menu Transaksi.
              </div>

              <form onSubmit={handleContributionSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nominal Setoran (IDR)</label>
                  <input
                    type="number"
                    required
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-brand-violet transition-all"
                  />
                  {parseFloat(contribAmount) > 0 && (
                    <p className="text-[11px] font-semibold text-brand-teal dark:text-brand-cyan mt-1">
                      Setoran: {formatIDR(parseFloat(contribAmount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Setoran</label>
                  <input
                    type="text"
                    value={contribNote}
                    onChange={(e) => setContribNote(e.target.value)}
                    placeholder="Contoh: Sisihan gaji bulan ini"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>

                <div className="pt-2 sticky bottom-0 bg-white dark:bg-[#151D30] pb-1">
                  <button
                    type="submit"
                    disabled={isContribSubmitting}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {isContribSubmitting ? 'Menyimpan...' : 'Simpan Setoran Tabungan'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Custom Confirmation Modal for Delete */}
      {deleteTarget &&
        createPortal(
          <div className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hapus Target Finansial?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Yakin ingin menghapus target <strong className="text-slate-800 dark:text-slate-200">"{deleteTarget.name}"</strong>? Data transaksi mutasi Anda tetap aman.
              </p>
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Floating Toast Notification */}
      {toast &&
        createPortal(
          <div className="fixed top-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] animate-bounce-in">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>,
          document.body
        )}

      {/* Voice Recognition Modal for Goals & Contributions */}
      {isVoiceModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 p-4 sm:p-6 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-md my-auto bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
              <button
                onClick={() => {
                  stopVoiceListening();
                  setIsVoiceModalOpen(false);
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white mx-auto mb-4 shadow-glow-violet animate-pulse ring-4 ring-brand-violet/20">
                <Mic className="w-8 h-8" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {voiceMode === 'GOAL'
                  ? 'Rekam Target Finansial AI'
                  : 'Rekam Setoran Tabungan'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                {isVoiceListening
                  ? 'Mendengarkan... Silakan bicara sekarang:'
                  : 'Ketuk mikrofon atau pilih contoh di bawah:'}
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 min-h-[56px] text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center mb-4">
                {voiceTranscript ? (
                  <span>"{voiceTranscript}"</span>
                ) : (
                  <span className="text-slate-400 italic">
                    {isVoiceListening ? 'Bicara sekarang...' : 'Belum ada suara terdeteksi'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-left mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Contoh yang bisa diucapkan:
                </span>
                {(voiceMode === 'GOAL'
                  ? [
                      'Target beli MacBook 20 juta 1 tahun lagi prioritas tinggi',
                      'Rencana dana darurat 15 juta untuk 2 tahun lagi',
                      'Beli mobil 150 juta target 3 tahun ke depan',
                    ]
                  : [
                      'Setor 500 ribu tabungan rutin gaji',
                      'Setor satu juta dari bonus akhir tahun',
                      'Tabung 250 ribu uang saku',
                    ]
                ).map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      stopVoiceListening();
                      setIsVoiceModalOpen(false);
                      if (voiceMode === 'GOAL') {
                        applyVoiceGoal(cmd);
                      } else {
                        applyVoiceContrib(cmd);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/60 hover:bg-brand-violet/10 hover:text-brand-violet dark:hover:text-brand-cyan transition-all border border-transparent hover:border-brand-violet/30"
                  >
                    👉 "{cmd}"
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    stopVoiceListening();
                    setIsVoiceModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (isVoiceListening) {
                      stopVoiceListening();
                    } else {
                      startVoiceListening(voiceMode);
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                    isVoiceListening ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-violet hover:bg-brand-violet/90'
                  }`}
                >
                  {isVoiceListening ? 'Berhenti' : 'Mulai Bicara'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
