import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { formatDateIndo, formatShortDate } from '../../lib/dates.js';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PieChart as PieIcon,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Plus,
  ArrowRight,
  Bot,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState('this_month');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, cashFlowRes, expenseRes, recentRes, insightsRes, goalsRes] = await Promise.all([
        api.get(`/dashboard/summary?range=${dateRange}`),
        api.get(`/dashboard/cash-flow?range=${dateRange}`),
        api.get(`/dashboard/expense-breakdown?range=${dateRange}`),
        api.get('/dashboard/recent-transactions'),
        api.get('/dashboard/insights'),
        api.get('/goals'),
      ]);

      if (summaryRes.success) setSummaryData(summaryRes.data);
      if (cashFlowRes.success) setCashFlowData(cashFlowRes.data);
      if (expenseRes.success) setExpenseBreakdown(expenseRes.data);
      if (recentRes.success) setRecentTransactions(recentRes.data);
      if (insightsRes.success) setInsights(insightsRes.data);
      if (goalsRes.success) setSavingsGoals(goalsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('transaction-updated', handleUpdate);
    return () => window.removeEventListener('transaction-updated', handleUpdate);
  }, [dateRange]);

  const cards = summaryData?.cards;

  const COLORS = ['#635BFF', '#14B8A6', '#EC4899', '#F59E0B', '#38BDF8', '#8B5CF6', '#10B981', '#64748B'];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Halo, {user?.name || 'Andrian'}!</span>
            <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Berikut ringkasan kondisi keuanganmu hari ini • {formatDateIndo(new Date())}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-2xl self-start md:self-auto shadow-sm">
          {[
            { id: '7_days', label: '7 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: '3_months', label: '3 Bulan' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateRange === r.id
                  ? 'bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] hover:border-brand-violet/50 transition-all shadow-sm dark:shadow-lg animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Saldo</span>
            <div className="w-9 h-9 rounded-xl bg-brand-violet/20 text-brand-violet dark:text-brand-cyan flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatIDR(cards?.currentBalance?.amount || 0)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>Arus kas neto kumulatif akun</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pemasukan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] hover:border-emerald-500/50 transition-all shadow-sm dark:shadow-lg animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pemasukan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatIDR(cards?.periodIncome?.amount || 0)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              {cards?.periodIncome?.trendPercentage !== 0 && (
                <span
                  className={`flex items-center font-bold ${
                    cards?.periodIncome?.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {cards?.periodIncome?.isPositive ? '+' : ''}
                  {cards?.periodIncome?.trendPercentage}%
                </span>
              )}
              <span>vs periode sebelumnya</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] hover:border-rose-500/50 transition-all shadow-sm dark:shadow-lg animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pengeluaran</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-500 dark:text-rose-400 tracking-tight">
              {formatIDR(cards?.periodExpense?.amount || 0)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              {cards?.periodExpense?.trendPercentage !== 0 && (
                <span
                  className={`flex items-center font-bold ${
                    cards?.periodExpense?.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {cards?.periodExpense?.trendPercentage > 0 ? '+' : ''}
                  {cards?.periodExpense?.trendPercentage}%
                </span>
              )}
              <span>vs periode sebelumnya</span>
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Anggaran */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] hover:border-amber-500/50 transition-all shadow-sm dark:shadow-lg animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sisa Anggaran</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <PieIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-300 tracking-tight">
              {formatIDR(cards?.remainingBudget?.amount || 0)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Terpakai {cards?.remainingBudget?.usagePercent || 0}%</span>
              <span>Batas {formatIDR(cards?.remainingBudget?.limit || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Charts Area (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Income vs Expenses Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Arus Kas (Pemasukan vs Pengeluaran)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fluktuasi harian dalam periode terpilih</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Pengeluaran
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#FFFFFF' : '#0F172A',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [formatIDR(val), '']}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="Pemasukan"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="Pengeluaran"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Expense Distribution Donut Chart (1 col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl flex flex-col justify-between animate-fade-in-up stagger-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Distribusi Pengeluaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Berdasarkan kategori pengeluaran</p>
          </div>

          <div className="relative h-60 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown?.items || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {(expenseBreakdown?.items || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#FFFFFF' : '#0F172A',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [formatIDR(val), 'Jumlah']}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {formatIDR(expenseBreakdown?.totalExpense || 0)}
              </span>
            </div>
          </div>

          {/* Category Legends */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {(expenseBreakdown?.items || []).slice(0, 4).map((item: any, idx: number) => (
              <div key={item.categoryId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.categoryName}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">({formatIDR(item.amount)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Financial Insights Panel */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-violet/10 via-white to-brand-teal/10 dark:from-brand-violet/20 dark:via-[#151D30] dark:to-brand-teal/20 border border-brand-violet/30 shadow-sm dark:shadow-glow-violet relative overflow-hidden animate-fade-in-up stagger-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Insight Keuangan untukmu</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-violet dark:text-brand-cyan border border-brand-cyan/40">
                  AI Evaluated
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {insights.map((ins) => (
                  <div key={ins.id} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">{ins.title}:</span> {ins.description}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/ai-assistant')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-violet text-white hover:bg-brand-violet/90 transition-all shrink-0 shadow-md"
          >
            <Bot className="w-4 h-4 text-brand-cyan" />
            <span>Konsultasi AI</span>
          </button>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaksi Terbaru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">5 aktivitas finansial paling mutakhir</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#293449]/70">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Belum ada transaksi tercatat. Mulai catat transaksi pertamamu!
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs">
                        {tx.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{tx.category?.name || 'Umum'}</span>
                        <span>•</span>
                        <span>{formatShortDate(tx.transactionDate)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-black ${
                        tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'} {formatIDR(tx.amount)}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{tx.paymentMethod}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Goals Widget (1 col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl flex flex-col justify-between animate-fade-in-up stagger-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Target Finansial</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Progres tabungan aktif</p>
              </div>
              <button
                onClick={() => navigate('/goals')}
                className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
              >
                <span>Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {savingsGoals.slice(0, 3).map((g) => (
                <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{g.name}</span>
                    <span className="font-black text-brand-violet dark:text-brand-cyan">{g.percentage}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-brand-violet to-brand-teal rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, g.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Terkumpul: {formatIDR(g.currentAmount)}</span>
                    <span>Target: {formatIDR(g.targetAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/goals')}
            className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tujuan Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
