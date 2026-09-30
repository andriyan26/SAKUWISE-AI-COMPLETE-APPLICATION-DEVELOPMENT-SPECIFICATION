import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo } from '../../lib/dates.js';
import { sound } from '../../lib/sound.js';
import { ReceiptScannerModal } from '../../components/transactions/ReceiptScannerModal.js';
import {
  Search,
  Plus,
  Download,
  Camera,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netCashFlow: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [categoryId, setCategoryId] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Transfer Bank');
  const [formMerchant, setFormMerchant] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (type !== 'ALL') params.set('type', type);
      if (categoryId !== 'ALL') params.set('categoryId', categoryId);
      if (paymentMethod !== 'ALL') params.set('paymentMethod', paymentMethod);
      params.set('page', page.toString());
      params.set('limit', '10');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await api.get(`/transactions?${params.toString()}`);
      if (res.success) {
        setTransactions(res.data);
        setPagination(res.pagination);
        setSummary(res.summary);
      }
    } catch (error) {
      console.error('fetchTransactions error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) setCategories(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [search, type, categoryId, paymentMethod, page, sortBy, sortOrder]);

  const handleExportCsv = () => {
    window.open('http://localhost:5000/api/v1/transactions/export/csv', '_blank');
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setFormTitle('');
    setFormAmount('');
    setFormType('EXPENSE');
    const firstCat = categories.find((c) => c.type === 'EXPENSE');
    setFormCategoryId(firstCat ? firstCat.id : '');
    setFormPaymentMethod('Transfer Bank');
    setFormMerchant('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (tx: any) => {
    setEditingTransaction(tx);
    setFormTitle(tx.title);
    setFormAmount(tx.amount.toString());
    setFormType(tx.type);
    setFormCategoryId(tx.categoryId);
    setFormPaymentMethod(tx.paymentMethod);
    setFormMerchant(tx.merchant || '');
    setFormDate(tx.transactionDate.split('T')[0]);
    setFormNotes(tx.description || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!parsedAmount || parsedAmount <= 0) return;

    try {
      if (editingTransaction) {
        await api.patch(`/transactions/${editingTransaction.id}`, {
          title: formTitle,
          amount: parsedAmount,
          type: formType,
          categoryId: formCategoryId,
          paymentMethod: formPaymentMethod,
          merchant: formMerchant,
          transactionDate: formDate,
          description: formNotes,
        });
      } else {
        await api.post('/transactions', {
          title: formTitle,
          amount: parsedAmount,
          type: formType,
          categoryId: formCategoryId,
          paymentMethod: formPaymentMethod,
          merchant: formMerchant,
          transactionDate: formDate,
          description: formNotes,
        });
      }
      sound.playSuccess();
      setIsFormOpen(false);
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/transactions/${deletingId}`);
      sound.playChirp(400, 0.1);
      setDeletingId(null);
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manajemen Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Catat, pantau, dan kelola seluruh pemasukan dan pengeluaranmu secara akurat.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsScanOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan border border-slate-200 dark:border-brand-violet/30 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
            <span>Pindai Struk OCR</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors duration-200 animate-fade-in-up stagger-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari transaksi, merchant, keterangan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type */}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all cursor-pointer"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="EXPENSE">Pengeluaran</option>
            <option value="INCOME">Pemasukan</option>
          </select>

          {/* Category */}
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method */}
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all cursor-pointer"
          >
            <option value="ALL">Semua Metode</option>
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="E-Wallet">E-Wallet</option>
            <option value="QRIS">QRIS</option>
            <option value="Tunai">Tunai</option>
            <option value="Kartu Debit">Kartu Debit</option>
            <option value="Kartu Kredit">Kartu Kredit</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200 animate-fade-in-up stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#293449] bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 sm:px-6">Tanggal</th>
                <th className="py-3.5 px-4">Transaksi / Merchant</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#293449]/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors animate-fade-in"
                    style={{ animationDelay: `${Math.min(idx * 30, 350)}ms` }}
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                      {formatDateIndo(tx.transactionDate)}
                    </td>

                    {/* Title & Merchant */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{tx.title}</div>
                      {tx.merchant && <div className="text-[11px] text-slate-500 dark:text-slate-400">{tx.merchant}</div>}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${tx.category?.color || '#64748B'}20`,
                          color: tx.category?.color || '#94A3B8',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tx.category?.color || '#94A3B8' }}
                        />
                        {tx.category?.name || 'Umum'}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {tx.paymentMethod}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-black">
                      <span className={tx.type === 'INCOME' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}>
                        {tx.type === 'INCOME' ? '+' : '-'} {formatIDR(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(tx)}
                          title="Edit Transaksi"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-violet dark:text-slate-400 dark:hover:text-brand-cyan hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          title="Hapus Transaksi"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-200 dark:border-[#293449] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{transactions.length}</span> dari total{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.total}</span> transaksi
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white">
              Halaman {page} dari {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-colors duration-200">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </h3>

            {/* Type selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setFormType('EXPENSE')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  formType === 'EXPENSE'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={() => setFormType('INCOME')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  formType === 'INCOME'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pemasukan</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nominal (IDR)</label>
                <input
                  type="number"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Transaksi</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  >
                    {categories
                      .filter((c) => c.type === formType)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Metode</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Tunai">Tunai</option>
                    <option value="Kartu Debit">Kartu Debit</option>
                    <option value="Kartu Kredit">Kartu Kredit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Merchant (Opsional)</label>
                  <input
                    type="text"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    placeholder="Contoh: Tokopedia"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan kecil tentang transaksi ini..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all"
                >
                  {editingTransaction ? 'Simpan Perubahan' : 'Buat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 text-center shadow-2xl transition-colors duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Hapus Transaksi?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              Transaksi yang dihapus tidak dapat dipulihkan dan akan mempengaruhi perhitungan anggaran.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Scanner OCR Modal */}
      <ReceiptScannerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};
