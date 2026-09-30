import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo } from '../../lib/dates.js';
import { sound } from '../../lib/sound.js';
import {
  PieChart as PieIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  TrendingDown,
  Layers,
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  // Form
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/budgets');
      if (res.success) {
        setBudgets(res.data);
        setOverview(res.overview);
      }
    } catch (error) {
      console.error('fetchBudgets error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) {
        setCategories(res.data.filter((c: any) => c.type === 'EXPENSE'));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingBudget(null);
    setName('');
    setCategoryId('');
    setAmount('');
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setPeriodStart(start);
    setPeriodEnd(end);
    setAlertThreshold('80');
    setIsModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBudget(b);
    setName(b.name);
    setCategoryId(b.categoryId || '');
    setAmount(b.amount.toString());
    setPeriodStart(b.periodStart.split('T')[0]);
    setPeriodEnd(b.periodEnd.split('T')[0]);
    setAlertThreshold(b.alertThreshold.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    try {
      if (editingBudget) {
        await api.patch(`/budgets/${editingBudget.id}`, {
          name,
          categoryId: categoryId || null,
          amount: parsedAmount,
          periodStart,
          periodEnd,
          alertThreshold: parseInt(alertThreshold, 10),
        });
      } else {
        await api.post('/budgets', {
          name,
          categoryId: categoryId || null,
          amount: parsedAmount,
          periodStart,
          periodEnd,
          alertThreshold: parseInt(alertThreshold, 10),
        });
      }
      sound.playSuccess();
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan anggaran.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus anggaran ini?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      sound.playChirp(400, 0.1);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manajemen Anggaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kendalikan pengeluaran dengan batas anggaran bulanan dan notifikasi peringatan.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Anggaran Baru</span>
        </button>
      </div>

      {/* Overall Overview Banner */}
      {overview && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl transition-colors duration-200 animate-fade-in-up stagger-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Batas Anggaran</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatIDR(overview.totalBudgetLimit)}</div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Terpakai</span>
              <div className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">{formatIDR(overview.totalSpent)}</div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sisa Anggaran Total</span>
              <div className="text-2xl font-black text-emerald-500 dark:text-emerald-400 mt-1">{formatIDR(overview.totalRemaining)}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
              <span>Penggunaan Anggaran Keseluruhan</span>
              <span className="font-bold text-slate-900 dark:text-white">{overview.overallPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  overview.overallPercentage >= 90
                    ? 'bg-rose-500'
                    : overview.overallPercentage >= 75
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-brand-violet to-brand-teal'
                }`}
                style={{ width: `${Math.min(100, overview.overallPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((b, idx) => {
          const isExceeded = b.status === 'EXCEEDED';
          const isWarning = b.status === 'WARNING';

          return (
            <div
              key={b.id}
              style={{ animationDelay: `${idx * 70}ms` }}
              className={`p-6 rounded-3xl bg-white dark:bg-[#151D30] border transition-all shadow-sm dark:shadow-xl flex flex-col justify-between animate-fade-in-up ${
                isExceeded
                  ? 'border-rose-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : isWarning
                  ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-slate-200 dark:border-[#293449] hover:border-brand-violet/40'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{b.name}</h3>
                      {isExceeded && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Melebihi Batas
                        </span>
                      )}
                      {isWarning && !isExceeded && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Mendekati Batas
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Kategori: {b.category?.name || 'Semua Pengeluaran'} • Ambang {b.alertThreshold}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-violet dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-3 my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Terpakai</span>
                    <div className="text-lg font-black text-rose-500 dark:text-rose-400">{formatIDR(b.spentAmount)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Sisa Kuota</span>
                    <div className="text-lg font-black text-emerald-500 dark:text-emerald-400">{formatIDR(b.remainingAmount)}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Total Limit: {formatIDR(b.amount)}</span>
                    <span
                      className={`font-bold ${
                        isExceeded ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-brand-violet dark:text-brand-cyan'
                      }`}
                    >
                      {b.percentageUsed}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-brand-violet'
                      }`}
                      style={{ width: `${Math.min(100, b.percentageUsed)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Period Footer */}
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#293449] text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Periode: {formatDateIndo(b.periodStart)} - {formatDateIndo(b.periodEnd)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-colors duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingBudget ? 'Edit Anggaran' : 'Buat Anggaran Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Anggaran</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Anggaran Kuliner Bulanan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori (Opsional)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                >
                  <option value="">Semua Kategori (Batas Belanja Keseluruhan)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Batas Maksimal (IDR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mulai Periode</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Akhir Periode</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ambang Notifikasi Peringatan ({alertThreshold}%)
                </label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                >
                  <option value="75">75% - Peringatan Awal</option>
                  <option value="80">80% - Standar Rekomendasi</option>
                  <option value="90">90% - Pengeluaran Tinggi</option>
                  <option value="100">100% - Batas Maksimal</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all"
                >
                  {editingBudget ? 'Simpan Perubahan' : 'Buat Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
