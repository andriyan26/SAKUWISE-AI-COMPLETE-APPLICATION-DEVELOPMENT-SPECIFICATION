import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api, downloadFile } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo } from '../../lib/dates.js';
import { sound } from '../../lib/sound.js';
import { voiceService } from '../../lib/voice-service.js';
import {
  Printer,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  CheckCircle2,
  RefreshCw,
  FileText,
  AlertCircle,
  PlusCircle,
  Target,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getInitialDates = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
};

export const ReportsPage: React.FC = () => {
  const initialDates = getInitialDates();
  const [reportType, setReportType] = useState('monthly_summary');
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Voice Assistant state for Reports
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Ensure any active voice playback or recognition stops when leaving ReportsPage
  useEffect(() => {
    return () => {
      sound.stopSpeaking();
      voiceService.stopListening();
    };
  }, []);

  const handleVoiceReportCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    sound.playChirp(700, 0.08);

    if (lower.includes('kategori')) {
      setReportType('category_breakdown');
      setToast({ type: 'success', message: 'Beralih ke tab: Analisis Kategori' });
      sound.speak('Menampilkan analisis kategori');
    } else if (lower.includes('anggaran') || lower.includes('budget')) {
      setReportType('budget_performance');
      setToast({ type: 'success', message: 'Beralih ke tab: Kinerja Anggaran' });
      sound.speak('Menampilkan evaluasi kinerja anggaran');
    } else if (lower.includes('ringkasan') || lower.includes('bulanan')) {
      setReportType('monthly_summary');
      setToast({ type: 'success', message: 'Beralih ke tab: Ringkasan Bulanan' });
      sound.speak('Menampilkan ringkasan bulanan');
    } else if (lower.includes('cetak') || lower.includes('print') || lower.includes('pdf')) {
      setToast({ type: 'success', message: 'Membuka dialog cetak PDF' });
      sound.speak('Membuka dokumen cetak PDF');
      setTimeout(() => handlePrint(), 500);
    } else if (lower.includes('ekspor') || lower.includes('csv') || lower.includes('download')) {
      setToast({ type: 'success', message: 'Mengunduh laporan CSV' });
      sound.speak('Mengunduh berkas CSV');
      handleExportCsv();
    } else if (lower.includes('baca') || lower.includes('suara') || lower.includes('jelaskan') || lower.includes('kondisi')) {
      readReportSummaryAloud();
    } else {
      setToast({
        type: 'error',
        message: `Perintah "${transcript}" tidak dikenali. Coba: "Ringkasan bulanan", "Analisis kategori", atau "Cetak laporan".`,
      });
    }
  };

  const startVoiceCommand = () => {
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
          setIsVoiceOpen(false);
          handleVoiceReportCommand(text);
        }
      },
      onError: (err) => {
        setIsVoiceListening(false);
        setToast({ type: 'error', message: err });
      },
      onEnd: () => setIsVoiceListening(false),
    });
  };

  const stopVoiceCommand = () => {
    voiceService.stopListening();
    setIsVoiceListening(false);
  };

  const readReportSummaryAloud = () => {
    if (isSpeakingSummary) {
      sound.stopSpeaking();
      setIsSpeakingSummary(false);
      return;
    }

    if (!reportData?.summary) {
      sound.speak('Belum ada data laporan yang tersedia saat ini.');
      return;
    }

    const s = reportData.summary;
    setIsSpeakingSummary(true);
    const speechText = `Berikut ringkasan performa finansialmu. Total pemasukan sebesar ${formatIDR(
      s.totalIncome || 0
    )}, total pengeluaran sebesar ${formatIDR(
      s.totalExpense || 0
    )}, dan sisa kas bersih ${formatIDR(
      s.netCashFlow || 0
    )}, dengan rasio tabungan ${s.savingsRate || 0} persen.`;

    sound.speak(speechText, {
      onEnd: () => setIsSpeakingSummary(false),
      onError: () => setIsSpeakingSummary(false),
    });
  };

  const fetchReport = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/reports/generate', {
        reportType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success) {
        setReportData(res.data);
      } else {
        setErrorMessage(res.message || 'Gagal memuat laporan');
      }
    } catch (error: any) {
      console.error('fetchReport error:', error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat memuat laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await downloadFile('/transactions/export/csv', 'laporan_transaksi.csv');
      setToast({ type: 'success', message: 'File CSV berhasil diunduh!' });
    } catch (err: any) {
      setToast({ type: 'error', message: 'Gagal mengunduh file CSV: ' + (err.message || 'Koneksi bermasalah') });
    } finally {
      setIsExporting(false);
    }
  };

  const summary = reportData?.summary;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls (Hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ekspor dan cetak ringkasan performa finansial komprehensif.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Read Aloud Button */}
          <button
            onClick={readReportSummaryAloud}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isSpeakingSummary
                ? 'bg-brand-violet text-white border-brand-violet shadow-glow-violet animate-pulse'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan border-slate-200 dark:border-brand-violet/30'
            }`}
            title="Dengarkan Ringkasan Laporan dengan Suara AI"
          >
            {isSpeakingSummary ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeakingSummary ? 'Hentikan Suara' : 'Bacakan Ringkasan'}</span>
          </button>

          {/* Voice Assistant Command Button */}
          <button
            onClick={() => {
              setIsVoiceOpen(true);
              startVoiceCommand();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan border border-slate-200 dark:border-brand-violet/30 shadow-sm transition-all flex items-center gap-1.5 group"
          >
            <Mic className="w-4 h-4 text-brand-violet dark:text-brand-cyan group-hover:scale-110 transition-transform" />
            <span>Perintah Suara AI</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-brand-teal" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Mengunduh...' : 'Ekspor CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Report Type Selector (Hidden in print) */}
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'monthly_summary', label: 'Ringkasan Bulanan' },
            { id: 'category_breakdown', label: 'Analisis Kategori' },
            { id: 'budget_performance', label: 'Kinerja Anggaran' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                reportType === t.id
                  ? 'bg-brand-violet text-white shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-teal text-slate-900 hover:bg-brand-teal/90 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm animate-pulse space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-md ml-auto"></div>
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-md ml-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 h-24 space-y-2">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-6 w-28 bg-slate-300 dark:bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">Gagal Memuat Laporan</h3>
          <p className="text-xs text-rose-600 dark:text-rose-300 mt-1 max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={fetchReport}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMessage && reportData && reportData.transactions?.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 dark:bg-brand-violet/20 border border-brand-violet/30 flex items-center justify-center mx-auto mb-4 text-brand-violet dark:text-brand-cyan">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Tidak Ada Transaksi</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            Belum ada transaksi yang tercatat pada rentang tanggal{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatDateIndo(reportData.period.start)} s/d {formatDateIndo(reportData.period.end)}
            </span>
            . Tambahkan transaksi untuk menghasilkan laporan otomatis.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              to="/transactions"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Transaksi Baru</span>
            </Link>
          </div>
        </div>
      )}

      {/* The Printable Report Document Card */}
      {!isLoading && !errorMessage && reportData && reportData.transactions?.length > 0 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-2xl print:bg-white print:text-black print:p-0 print:border-none transition-colors duration-200 animate-fade-in-up">
          {/* Report Document Header */}
          <div className="border-b border-slate-200 dark:border-[#293449] print:border-slate-300 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white print:text-black">
                  SAKUWISE AI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-violet/10 dark:bg-brand-violet/20 border border-brand-violet/30 dark:border-brand-violet/40 text-brand-violet dark:text-brand-cyan print:text-indigo-600">
                  Financial Report
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                Periode: {formatDateIndo(reportData.period.start)} s/d {formatDateIndo(reportData.period.end)}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
              <div>Dibuat pada: {formatDateIndo(reportData.generatedAt)}</div>
              <div>ID Dokumen: SW-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">
                Pemasukan
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-500 dark:text-emerald-400 print:text-emerald-700 mt-1 truncate">
                {formatIDR(summary?.totalIncome)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">
                Pengeluaran
              </span>
              <div className="text-base sm:text-lg font-black text-rose-500 dark:text-rose-400 print:text-rose-700 mt-1 truncate">
                {formatIDR(summary?.totalExpense)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">
                Arus Kas Bersih
              </span>
              <div className="text-base sm:text-lg font-black text-brand-violet dark:text-brand-cyan print:text-indigo-700 mt-1 truncate">
                {formatIDR(summary?.netCashFlow)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">
                Rasio Tabungan
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white print:text-black mt-1">
                {summary?.savingsRate}%
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">
                Distribusi Kategori Pengeluaran & Pemasukan
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3 text-center">Frekuensi</th>
                      <th className="py-2.5 px-3 text-right">Total Akumulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                    {reportData.categoryBreakdown.map((cat: any, i: number) => (
                      <tr key={i} className="text-slate-700 dark:text-slate-300 print:text-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold">{cat.name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.type === 'INCOME'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">{cat.count} kali</td>
                        <td className="py-2.5 px-3 text-right font-bold">{formatIDR(cat.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Budget Performance */}
          {reportData.budgetPerformance && reportData.budgetPerformance.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">Evaluasi Batas Anggaran</h3>
              <div className="space-y-3">
                {reportData.budgetPerformance.map((b: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200 text-xs"
                  >
                    <div className="flex justify-between font-semibold mb-1.5 flex-wrap gap-1">
                      <span className="text-slate-900 dark:text-white print:text-black">
                        {b.name} <span className="text-slate-400 font-normal">({b.category})</span>
                      </span>
                      <span
                        className={
                          b.percentage >= 100
                            ? 'text-rose-500 font-bold'
                            : 'text-slate-600 dark:text-slate-300 print:text-slate-700'
                        }
                      >
                        {formatIDR(b.spent)} / {formatIDR(b.limit)} ({b.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          b.percentage >= 100 ? 'bg-rose-500' : b.percentage >= 80 ? 'bg-amber-500' : 'bg-brand-teal'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goal Summary */}
          {reportData.goalSummary && reportData.goalSummary.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">Kemajuan Target Tabungan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reportData.goalSummary.map((g: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="text-slate-900 dark:text-white print:text-black flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />
                        {g.name}
                      </span>
                      <span className="text-brand-teal font-bold">{g.progress}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Terkumpul: {formatIDR(g.current)}</span>
                      <span>Target: {formatIDR(g.target)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-violet to-brand-teal rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(g.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions List Sample */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">
              Rincian Transaksi ({reportData.transactions.length} Transaksi)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Judul</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                  {reportData.transactions.slice(0, 20).map((t: any) => (
                    <tr key={t.id} className="text-slate-700 dark:text-slate-300 print:text-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 whitespace-nowrap">{t.date}</td>
                      <td className="py-2 px-3 font-medium">{t.title}</td>
                      <td className="py-2 px-3">{t.category}</td>
                      <td className="py-2 px-3">{t.paymentMethod}</td>
                      <td
                        className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                          t.type === 'INCOME' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {t.type === 'INCOME' ? '+' : '-'} {formatIDR(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportData.transactions.length > 20 && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                Menampilkan 20 transaksi pertama dari total {reportData.transactions.length} transaksi. Gunakan Ekspor CSV untuk melihat seluruh riwayat.
              </p>
            )}
          </div>

          {/* Document Verification Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-[#293449] print:border-slate-300 text-[10px] text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Dihasilkan secara otomatis oleh sistem SAKUWISE AI</span>
            <span>https://sakuwiseai.tplp004.com</span>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast &&
        createPortal(
          <div className="fixed top-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] animate-bounce-in">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>,
          document.body
        )}

      {/* Voice Assistant Command Modal for Reports */}
      {isVoiceOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 p-4 sm:p-6 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-md my-auto bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
              <button
                onClick={() => {
                  stopVoiceCommand();
                  setIsVoiceOpen(false);
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white mx-auto mb-4 shadow-glow-violet animate-pulse ring-4 ring-brand-violet/20">
                <Mic className="w-8 h-8" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Asisten Suara Laporan Keuangan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                {isVoiceListening
                  ? 'Mendengarkan suaramu... Ucapkan perintah di bawah:'
                  : 'Ketuk mikrofon atau pilih perintah di bawah:'}
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
                  Perintah yang dapat diucapkan:
                </span>
                {[
                  'Tampilkan ringkasan bulanan',
                  'Tampilkan analisis kategori',
                  'Tampilkan kinerja anggaran',
                  'Cetak laporan PDF',
                  'Ekspor file CSV',
                  'Bacakan ringkasan laporan',
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      stopVoiceCommand();
                      setIsVoiceOpen(false);
                      handleVoiceReportCommand(cmd);
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
                    stopVoiceCommand();
                    setIsVoiceOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    if (isVoiceListening) {
                      stopVoiceCommand();
                    } else {
                      startVoiceCommand();
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                    isVoiceListening ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-violet hover:bg-brand-violet/90'
                  }`}
                >
                  {isVoiceListening ? 'Berhenti Merekam' : 'Mulai Bicara'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
