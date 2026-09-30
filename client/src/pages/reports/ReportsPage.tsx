import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo } from '../../lib/dates.js';
import {
  FileBarChart,
  Printer,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('monthly_summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/reports/generate', {
        reportType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success) {
        setReportData(res.data);
      }
    } catch (error) {
      console.error('fetchReport error:', error);
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

  const handleExportCsv = () => {
    window.open('http://localhost:5000/api/v1/transactions/export/csv', '_blank');
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
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
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
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-colors duration-200 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
          />
          <button
            onClick={fetchReport}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-teal text-slate-900 hover:bg-brand-teal/90 shadow-sm"
          >
            Filter
          </button>
        </div>
      </div>

      {/* The Printable Report Document Card */}
      {reportData && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-2xl print:bg-white print:text-black print:p-0 print:border-none transition-colors duration-200 animate-fade-in-up stagger-2">
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

            <div className="text-right text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
              <div>Dibuat pada: {formatDateIndo(reportData.generatedAt)}</div>
              <div>ID Dokumen: SW-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">Pemasukan</span>
              <div className="text-lg font-black text-emerald-500 dark:text-emerald-400 print:text-emerald-700 mt-1">
                {formatIDR(summary?.totalIncome)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">Pengeluaran</span>
              <div className="text-lg font-black text-rose-500 dark:text-rose-400 print:text-rose-700 mt-1">
                {formatIDR(summary?.totalExpense)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">Arus Kas Bersih</span>
              <div className="text-lg font-black text-brand-violet dark:text-brand-cyan print:text-indigo-700 mt-1">
                {formatIDR(summary?.netCashFlow)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-slate-500">Rasio Tabungan</span>
              <div className="text-lg font-black text-slate-900 dark:text-white print:text-black mt-1">
                {summary?.savingsRate}%
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">Distribusi Kategori Pengeluaran</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3 text-center">Frekuensi</th>
                    <th className="py-2.5 px-3 text-right">Total Akumulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                  {reportData.categoryBreakdown.map((cat: any, i: number) => (
                    <tr key={i} className="text-slate-700 dark:text-slate-300 print:text-slate-800">
                      <td className="py-2 px-3 font-semibold">{cat.name}</td>
                      <td className="py-2 px-3">{cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</td>
                      <td className="py-2 px-3 text-center">{cat.count} kali</td>
                      <td className="py-2 px-3 text-right font-bold">{formatIDR(cat.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget Performance */}
          {reportData.budgetPerformance && reportData.budgetPerformance.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">Evaluasi Batas Anggaran</h3>
              <div className="space-y-3">
                {reportData.budgetPerformance.map((b: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200 dark:border-slate-700/60 print:border-slate-200 text-xs">
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-900 dark:text-white print:text-black">{b.name} ({b.category})</span>
                      <span className={b.percentage >= 100 ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300 print:text-slate-700'}>
                        {formatIDR(b.spent)} / {formatIDR(b.limit)} ({b.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions List Sample */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black mb-3">Rincian Transaksi Periode Ini</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Judul</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                  {reportData.transactions.slice(0, 15).map((t: any) => (
                    <tr key={t.id} className="text-slate-700 dark:text-slate-300 print:text-slate-800">
                      <td className="py-2 px-3">{t.date}</td>
                      <td className="py-2 px-3 font-medium">{t.title}</td>
                      <td className="py-2 px-3">{t.category}</td>
                      <td className="py-2 px-3">{t.paymentMethod}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {t.type === 'INCOME' ? '+' : '-'} {formatIDR(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Verification Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-[#293449] print:border-slate-300 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between items-center">
            <span>Dihasilkan secara otomatis oleh sistem SAKUWISE AI</span>
            <span>https://sakuwise.ai</span>
          </div>
        </div>
      )}
    </div>
  );
};
