import React, { useState, useRef } from 'react';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { sound } from '../../lib/sound.js';
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Calendar,
  Store,
} from 'lucide-react';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Editable fields after extraction
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      api.get('/categories').then((res) => {
        if (res.success && res.data) {
          setCategories(res.data.filter((c: any) => c.type === 'EXPENSE'));
        }
      });
      // reset
      setFile(null);
      setScanResult(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUploadAndScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setError('');

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await api.upload('/receipts/scan', formData);
      if (res.success && res.data) {
        sound.playSuccess();
        setScanResult(res.data);
        const ext = res.data.extracted;
        setMerchant(ext.merchant || '');
        setAmount(ext.totalAmount ? ext.totalAmount.toString() : '');
        setDate(ext.date ? ext.date.split('T')[0] : new Date().toISOString().split('T')[0]);

        // auto pick category if suggested
        const allCategories = categories;
        if (ext.categorySuggestion) {
          const matched = allCategories.find((c: any) =>
            c.name.toLowerCase().includes(ext.categorySuggestion.toLowerCase())
          );
          if (matched) setCategoryId(matched.id);
          else if (allCategories.length > 0) setCategoryId(allCategories[0].id);
        } else if (allCategories.length > 0) {
          setCategoryId(allCategories[0].id);
        }
      } else {
        setError(res.message || res.error?.message || 'Gagal mengekstrak dokumen. Coba file lain.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses file.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    // Deteksi tipe dari hasil scan, atau fallback ke EXPENSE
    const docType = scanResult?.extracted?.isIncome ? 'INCOME' : 'EXPENSE';

    setIsSaving(true);
    try {
      await api.post('/transactions', {
        title: merchant
          ? (docType === 'INCOME' ? `Pemasukan dari ${merchant}` : `Belanja di ${merchant}`)
          : (docType === 'INCOME' ? 'Pemasukan' : 'Belanja Struk'),
        amount: parsedAmount,
        type: docType,
        categoryId: categoryId || categories[0]?.id,
        paymentMethod: 'Transfer Bank',
        merchant,
        transactionDate: date,
        receiptId: scanResult?.receiptId || null,
        description: `Dipindai dari PDF/Struk (${file?.name || 'dokumen'}). Item: ${
          scanResult?.extracted?.items?.map((it: any) => it.name).join(', ') || '-'
        }`,
      });

      sound.playSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-glow-violet">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pindai Struk Pintar (AI OCR)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ekstraksi otomatis struk belanja dan review sebelum simpan</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {!scanResult ? (
          /* Step 1: Upload Image */
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-violet rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <UploadCloud className="w-12 h-12 text-brand-violet dark:text-brand-cyan mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {file ? file.name : 'Klik untuk unggah foto struk belanja'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Format didukung: JPG, PNG, WEBP, PDF (Maks. 5MB)
              </p>
            </div>

            <button
              onClick={handleUploadAndScan}
              disabled={!file || isScanning}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menganalisis Struk dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Pindai & Ekstrak Data</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Review & Edit Extracted Data */
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Data struk berhasil diekstrak! Harap periksa dan sesuaikan sebelum disimpan.</span>
            </div>

            {/* Extracted items breakdown */}
            {scanResult.extracted.items && scanResult.extracted.items.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Daftar Item Terdeteksi:
                </span>
                <div className="space-y-1 text-xs">
                  {scanResult.extracted.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>• {it.name}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatIDR(it.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Merchant / Toko</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Nominal (IDR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-brand-violet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Pindai Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? 'Menyimpan...' : 'Konfirmasi & Simpan Transaksi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
