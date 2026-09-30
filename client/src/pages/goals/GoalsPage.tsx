import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo } from '../../lib/dates.js';
import { sound } from '../../lib/sound.js';
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

  // Contribution State
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

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
    setTargetAmount(g.targetAmount.toString());
    setCurrentAmount(g.currentAmount.toString());
    setTargetDate(g.targetDate.split('T')[0]);
    setPriority(g.priority);
    setIcon(g.icon || 'Target');
    setIsCreateOpen(true);
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (!parsedTarget || parsedTarget <= 0) return;

    try {
      if (editingGoal) {
        await api.patch(`/goals/${editingGoal.id}`, {
          name,
          description,
          targetAmount: parsedTarget,
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          priority,
          icon,
        });
      } else {
        await api.post('/goals', {
          name,
          description,
          targetAmount: parsedTarget,
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          priority,
          icon,
        });
      }

      sound.playSuccess();
      setIsCreateOpen(false);
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan target tabungan.');
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionGoal) return;
    const parsed = parseFloat(contribAmount);
    if (!parsed || parsed <= 0) return;

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
        setContributionGoal(null);
        setContribAmount('');
        setContribNote('');
        fetchGoals();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan setoran tabungan.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus tujuan finansial ini?')) return;
    try {
      await api.delete(`/goals/${id}`);
      sound.playChirp(400, 0.1);
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus.');
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

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Target Finansial</span>
        </button>
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
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
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
                  onClick={() => setContributionGoal(g)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-violet hover:bg-brand-violet/90 text-white flex items-center gap-1 shadow-sm"
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
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-colors duration-200">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingGoal ? 'Edit Tujuan Finansial' : 'Tambah Tujuan Finansial Baru'}
            </h3>

            <form onSubmit={handleGoalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Target</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dana Darurat, MacBook M3..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                />
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Saldo Awal Terkumpul</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="HIGH">Tinggi (Paling Penting)</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="LOW">Rendah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Keterangan / Rencana</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Tujuan tabungan ini untuk..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all"
                >
                  {editingGoal ? 'Simpan Perubahan' : 'Buat Target Finansial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal with Explicit Balance Note */}
      {contributionGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-colors duration-200">
            <button
              onClick={() => setContributionGoal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Setor Tabungan</h3>
            <p className="text-xs text-brand-violet dark:text-brand-cyan font-semibold mb-4">{contributionGoal.name}</p>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs mb-4 leading-relaxed">
              💡 <strong>Catatan:</strong> Menambahkan setoran di sini mencatat progres target tabunganmu. Untuk mencatat mutasi pengeluaran kas sebenarnya, pastikan kamu juga mencatatnya di menu Transaksi.
            </div>

            <form onSubmit={handleContributionSubmit} className="space-y-4">
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Setoran</label>
                <input
                  type="text"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  placeholder="Contoh: Sisihan gaji bulan September"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all"
              >
                Simpan Setoran Tabungan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
