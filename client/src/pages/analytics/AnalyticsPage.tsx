import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  BarChart2,
  PieChart as PieIcon,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      setIsLoading(true);
      try {
        const [cfRes, expRes, incRes, healthRes] = await Promise.all([
          api.get('/analytics/cash-flow'),
          api.get('/analytics/expenses'),
          api.get('/analytics/income'),
          api.get('/analytics/financial-health'),
        ]);

        if (cfRes.success) setCashFlowData(cfRes.data);
        if (expRes.success) setExpenseData(expRes.data);
        if (incRes.success) setIncomeData(incRes.data);
        if (healthRes.success) setHealthData(healthRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAnalytics();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Analisis Keuangan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pusat evaluasi kesehatan finansial, analisis arus kas historis, dan pola belanja cerdas.
        </p>
      </div>

      {/* SECTION E: Financial Health Overview (Prominent at top) */}
      {healthData && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-violet/10 via-white to-brand-teal/10 dark:from-brand-violet/20 dark:via-[#151D30] dark:to-brand-teal/20 border border-brand-violet/30 dark:border-brand-violet/40 shadow-sm dark:shadow-glow-violet transition-colors duration-200 animate-fade-in-up stagger-1">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#293449]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status Kesehatan Finansial</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet dark:bg-brand-cyan/20 dark:text-brand-cyan border border-brand-violet/30 dark:border-brand-cyan/40">
                  Algoritma Deterministik
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span>{healthData.rating}</span>
                <span className="text-xl font-bold px-3 py-1 rounded-xl bg-brand-violet/15 text-brand-violet dark:text-brand-cyan border border-brand-violet/30">
                  Skor: {healthData.healthScore}/100
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
                {healthData.ratingDescription}
              </p>
            </div>

            {/* Health Meter gauge visual */}
            <div className="flex items-center gap-3">
              <div className="w-28 h-28 rounded-full border-4 border-slate-200 dark:border-slate-700/60 relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-4 border-brand-teal transition-all duration-1000"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${healthData.healthScore}%, 0 ${healthData.healthScore}%)`,
                  }}
                />
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{healthData.healthScore}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Indeks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Formula Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {healthData.metrics.map((m: any) => (
              <div key={m.key} className="p-4 rounded-2xl bg-white/80 dark:bg-[#0F172A]/70 border border-slate-200 dark:border-slate-700/70 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-300">{m.label}</span>
                  <span
                    className={`font-extrabold ${
                      m.status === 'GOOD' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'
                    }`}
                  >
                    {m.value}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Target:</span> {m.target}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {m.description}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] text-brand-violet dark:text-brand-cyan/80 font-mono">
                  Rumus: {m.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION A: Cash Flow Analysis (6 Months BarChart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl transition-colors duration-200 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Arus Kas Historis (6 Bulan Terakhir)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Perbandingan pemasukan, pengeluaran, dan saldo bersih per bulan</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#293449' : '#E2E8F0'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#64748B' : '#94A3B8'} fontSize={11} />
              <YAxis
                stroke={theme === 'dark' ? '#64748B' : '#94A3B8'}
                fontSize={11}
                tickFormatter={(val) => `${val / 1000000}Jt`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                  borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#FFFFFF' : '#0F172A',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(val: any) => [formatIDR(val), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} name="Pemasukan" />
              <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} name="Pengeluaran" />
              <Bar dataKey="net" fill="#635BFF" radius={[6, 6, 0, 0]} name="Kas Bersih (Net)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION B & C: Expense Breakdown & Income Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-3">
        {/* Expense Category Deep Dive */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl transition-colors duration-200">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Analisis Pos Pengeluaran</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Pengeluaran terperinci berdasarkan kategori bulan ini</p>

          <div className="space-y-3">
            {(expenseData?.categories || []).map((cat: any) => (
              <div key={cat.categoryId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{cat.name}</span>
                  <span className="font-extrabold text-rose-500 dark:text-rose-400">{formatIDR(cat.totalAmount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{cat.transactionCount} transaksi (Rata-rata {formatIDR(cat.averagePerTransaction)})</span>
                  <span>{cat.percentage}% dari total pengeluaran</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income Sources Deep Dive */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl transition-colors duration-200">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Analisis Sumber Pemasukan</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Komposisi aliran pendapatan aktif bulan ini</p>

          <div className="space-y-3">
            {(incomeData?.sources || []).map((src: any) => (
              <div key={src.categoryId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{src.name}</span>
                  <span className="font-extrabold text-emerald-500 dark:text-emerald-400">{formatIDR(src.totalAmount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{src.transactionCount} kali penerimaan</span>
                  <span>{src.percentage}% dari total pemasukan</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
