import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { sound } from '../../lib/sound.js';
import { runClientOcr, parseReceiptText, ParsedReceiptData } from '../../lib/receipt-ocr.js';
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Calendar,
  Store,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  RefreshCw,
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusMessage, setScanStatusMessage] = useState('');
  const [scanResult, setScanResult] = useState<ParsedReceiptData | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Editable fields after extraction
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [docType, setDocType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [date, setDate] = useState('');
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/categories').then((res) => {
        if (res.success && res.data) {
          setAllCategories(res.data);
        }
      });
      // reset
      setFile(null);
      setPreviewUrl(null);
      setScanResult(null);
      setReceiptId(null);
      setError('');
      setScanProgress(0);
      setScanStatusMessage('');
    }
  }, [isOpen]);

  // Clean up object URL when modal closes or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError('');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUploadAndScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setError('');
    setScanProgress(10);
    setScanStatusMessage('Menyiapkan pindaian AI OCR...');

    try {
      // 1. Eksekusi OCR AI langsung pada browser (Mendukung Web & HP)
      const parsed = await runClientOcr(file, (percent, msg) => {
        setScanProgress(percent);
        setScanStatusMessage(msg);
      });

      // 2. Unggah file struk ke server backend Hostinger untuk arsip database
      let uploadedReceiptId: string | null = null;
      try {
        const formData = new FormData();
        formData.append('receipt', file);
        formData.append('ocrText', parsed.rawText);
        formData.append('extractedDataJson', JSON.stringify(parsed));
        const res = await api.upload('/receipts/scan', formData);
        if (res.success && res.data) {
          uploadedReceiptId = res.data.receiptId || null;
        }
      } catch (uploadErr) {
        console.warn('Upload receipt backup warning:', uploadErr);
      }

      sound.playSuccess();
      setScanResult(parsed);
      setReceiptId(uploadedReceiptId);

      // Set state form dari hasil AI OCR
      setMerchant(parsed.merchant || 'Transaksi Bank');
      setAmount(parsed.totalAmount > 0 ? parsed.totalAmount.toString() : '');
      setDocType(parsed.isIncome ? 'INCOME' : 'EXPENSE');
      setDate(parsed.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(parsed.bankOrChannel || 'Transfer Bank');

      // Auto-select category
      const filteredCats = allCategories.filter((c) =>
        parsed.isIncome ? c.type === 'INCOME' : c.type === 'EXPENSE'
      );
      if (parsed.categorySuggestion) {
        const matched = filteredCats.find((c: any) =>
          c.name.toLowerCase().includes(parsed.categorySuggestion.toLowerCase())
        );
        if (matched) setCategoryId(matched.id);
        else if (filteredCats.length > 0) setCategoryId(filteredCats[0].id);
      } else if (filteredCats.length > 0) {
        setCategoryId(filteredCats[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses struk. Silakan periksa file Anda.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Harap masukkan nominal transaksi yang valid (lebih dari 0).');
      return;
    }

    setIsSaving(true);
    try {
      const activeCats = allCategories.filter((c) => c.type === docType);
      const chosenCatId = categoryId || activeCats[0]?.id || allCategories[0]?.id;

      await api.post('/transactions', {
        title: merchant
          ? (docType === 'INCOME' ? `Pemasukan: ${merchant}` : `Transaksi: ${merchant}`)
          : (docType === 'INCOME' ? 'Pemasukan Bank' : 'Belanja Struk'),
        amount: parsedAmount,
        type: docType,
        categoryId: chosenCatId,
        paymentMethod: paymentMethod || 'Transfer Bank',
        merchant: merchant || (scanResult?.bankOrChannel || 'Merchant'),
        transactionDate: date ? `${date} 12:00:00` : new Date().toISOString(),
        receiptId: receiptId,
        description: `Dipindai otomatis oleh AI OCR dari berkas (${file?.name || 'struk'}). Channel: ${
          scanResult?.bankOrChannel || 'Bank Transfer'
        }`,
      });

      sound.playSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = allCategories.filter((c) => c.type === docType);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl my-auto bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-glow-violet shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Pindai Struk & Bukti Transfer AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet dark:bg-brand-cyan/20 dark:text-brand-cyan border border-brand-violet/20">
                AI OCR Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ekstraksi otomatis screenshot m-banking (BCA, Mandiri, BRI, Dana, QRIS, dsb.) dan nota kasir belanja
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {!scanResult ? (
          /* Step 1: Upload and Preview */
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-violet rounded-3xl p-6 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative max-h-52 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Pratinjau Struk / Screenshot"
                      className="max-h-52 w-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                      <RefreshCw className="w-4 h-4" /> Ganti Gambar
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {file?.name}
                  </p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-brand-violet dark:text-brand-cyan mx-auto mb-3 animate-bounce" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Klik untuk unggah screenshot m-banking atau foto struk
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Mendukung JPG, PNG, WEBP, PDF (Maks. 5MB). Kompatibel Web & HP.
                  </p>
                </>
              )}
            </div>

            {isScanning && (
              <div className="p-4 rounded-2xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-brand-violet dark:text-brand-cyan">
                  <span>{scanStatusMessage || 'Memproses AI OCR...'}</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-violet to-brand-teal transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUploadAndScan}
              disabled={!file || isScanning}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menganalisis Bukti Transaksi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Pindai & Ekstrak Data Otomatis</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Review & Edit Extracted Data */
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">Bukti transaksi berhasil diekstrak!</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                {scanResult.bankOrChannel}
              </span>
            </div>

            {/* Layout Pratinjau & Form */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Pratinjau Gambar di sebelah kiri/atas */}
              {previewUrl && (
                <div className="sm:col-span-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex flex-col items-center justify-center p-2">
                  <img
                    src={previewUrl}
                    alt="Pratinjau Screenshot"
                    className="max-h-40 sm:max-h-56 w-auto object-contain rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Bukti Asli
                  </span>
                </div>
              )}

              {/* Form Input yang Terisi Otomatis */}
              <div className={`space-y-3 ${previewUrl ? 'sm:col-span-8' : 'sm:col-span-12'}`}>
                {/* Tipe Transaksi (Pemasukan vs Pengeluaran) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Transaksi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDocType('EXPENSE')}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        docType === 'EXPENSE'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType('INCOME')}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        docType === 'INCOME'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Pemasukan
                    </button>
                  </div>
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Nominal (IDR)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Contoh: 150000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-sm focus:outline-none focus:border-brand-violet"
                    />
                  </div>
                </div>

                {/* Penerima / Toko / Merchant */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Penerima / Toko / Merchant
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      placeholder="Nama Merchant / Tujuan"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
                    />
                  </div>
                </div>

                {/* Kategori & Tanggal */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
                    >
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-violet"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                {isSaving ? 'Menyimpan Transaksi...' : 'Konfirmasi & Simpan Transaksi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
