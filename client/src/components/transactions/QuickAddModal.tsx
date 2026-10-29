import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api-client.js';
import { sound } from '../../lib/sound.js';
import { VoiceNoteModal } from '../common/VoiceNoteModal.js';
import { ParsedVoiceTransaction } from '../../lib/voice-parser.js';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  Mic,
  Sparkles,
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/categories').then((res) => {
        if (res.success && res.data) {
          setCategories(res.data);
          const defaultCat = res.data.find((c: any) => c.type === type);
          if (defaultCat) setCategoryId(defaultCat.id);
        }
      });
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Jumlah transaksi harus lebih dari 0.');
      return;
    }

    if (!categoryId) {
      setError('Silakan pilih kategori.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/transactions', {
        title,
        amount: parsedAmount,
        type,
        categoryId,
        paymentMethod,
        merchant: merchant || null,
        transactionDate: date,
      });

      sound.playSuccess();
      onClose();
      if (onSuccess) onSuccess();
      // Reset form
      setTitle('');
      setAmount('');
      setMerchant('');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceParsed = (parsed: ParsedVoiceTransaction) => {
    if (parsed.type) setType(parsed.type);
    if (parsed.amount) setAmount(parsed.amount.toString());
    if (parsed.title) setTitle(parsed.title);
    if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
    if (parsed.merchant) setMerchant(parsed.merchant);
    if (parsed.date) setDate(parsed.date);

    // Auto-select category
    if (parsed.categoryName && categories.length > 0) {
      const matched = categories.find(
        (c) =>
          c.type === parsed.type &&
          c.name.toLowerCase().includes(parsed.categoryName!.toLowerCase())
      );
      if (matched) {
        setCategoryId(matched.id);
      }
    }

    setVoiceSuccessMsg(
      `Terdeteksi: ${parsed.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'} ${
        parsed.amount ? 'Rp ' + parsed.amount.toLocaleString('id-ID') : ''
      } (${parsed.title})`
    );
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md my-auto max-h-[92vh] flex flex-col bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 shrink-0">Tambah Transaksi Baru</h3>

        {/* Voice Note AI Quick Fill Button */}
        <button
          type="button"
          onClick={() => setIsVoiceOpen(true)}
          className="w-full py-2.5 px-3.5 mb-3 rounded-2xl bg-gradient-to-r from-brand-violet/15 via-purple-500/10 to-brand-teal/15 hover:from-brand-violet/25 hover:to-brand-teal/25 border border-brand-violet/40 text-brand-violet dark:text-brand-cyan font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group shrink-0 active:scale-[0.99]"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span>Bicara / Rekam Suara (Voice Note AI)</span>
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

        {/* Type Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'INCOME'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Pemasukan</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nominal (IDR)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-brand-violet"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Judul</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Makan Siang, Gaji Bulanan..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Metode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="QRIS">QRIS</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
              />
            </div>
          </div>

          {/* Merchant (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Merchant / Lokasi (Opsional)</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Contoh: Superindo, Starbucks..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 sticky bottom-0 bg-white dark:bg-[#151D30] pb-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>

      {/* Voice Note AI Modal */}
      <VoiceNoteModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onParsedTransaction={handleVoiceParsed}
        availableCategories={categories}
      />
    </div>,
    document.body
  );
};
