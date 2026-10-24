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

  const [dateRange, setDateRange] = useState('all');
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
      const [summaryRes, cashFlowRes, expenseRes, recentRes, insightsRes, goalsRes] = await Promise.allSettled([
        api.get(`/dashboard/summary?range=${dateRange}`),
        api.get(`/dashboard/cash-flow?range=${dateRange}`),
        api.get(`/dashboard/expense-breakdown?range=${dateRange}`),
        api.get('/dashboard/recent-transactions'),
        api.get('/dashboard/insights'),
        api.get('/goals'),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.success) setSummaryData(summaryRes.value.data);
      if (cashFlowRes.status === 'fulfilled' && cashFlowRes.value?.success) setCashFlowData(cashFlowRes.value.data);
      if (expenseRes.status === 'fulfilled' && expenseRes.value?.success) setExpenseBreakdown(expenseRes.value.data);
      if (recentRes.status === 'fulfilled' && recentRes.value?.success) setRecentTransactions(recentRes.value.data);
      if (insightsRes.status === 'fulfilled' && insightsRes.value?.success) setInsights(insightsRes.value.data);
      if (goalsRes.status === 'fulfilled' && goalsRes.value?.success) setSavingsGoals(goalsRes.value.data);
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
  }, []);

  const cards = summaryData?.cards;
  const totalBalance = Number(cards?.currentBalance?.amount ?? (Number(cards?.periodIncome?.amount ?? summaryData?.totalIncome ?? 0) - Number(cards?.periodExpense?.amount ?? summaryData?.totalExpense ?? 0)));
  const totalIncome = Number(cards?.periodIncome?.amount ?? summaryData?.totalIncome ?? 0);
  const totalExpense = Number(cards?.periodExpense?.amount ?? summaryData?.totalExpense ?? 0);
  const remainingBudgetAmount = Number(cards?.remainingBudget?.amount ?? cards?.budgetRemaining?.amount ?? 0);
  const remainingBudgetLimit = Number(cards?.remainingBudget?.limit ?? cards?.budgetRemaining?.totalBudget ?? 0);
  const budgetUsagePercent = Number(cards?.remainingBudget?.usagePercent ?? cards?.budgetRemaining?.usedPercentage ?? 0);

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
            Ringkasan kondisi finansialmu hari ini • {formatDateIndo(new Date())}
          </p>
        </div>

        {/* Lifetime All-Time Indicator Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-2xl self-start md:self-auto shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Akumulasi Keseluruhan Transaksi
          </span>
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
              {formatIDR(totalBalance)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>Arus kas bersih riil dari seluruh transaksi</span>
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
              {formatIDR(totalIncome)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-500 font-semibold">Akumulasi seluruh transaksi masuk</span>
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
              {formatIDR(totalExpense)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-rose-400 font-semibold">Akumulasi seluruh transaksi keluar</span>
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
            {remainingBudgetLimit > 0 ? (
              <>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-300 tracking-tight">
                  {formatIDR(remainingBudgetAmount)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Terpakai {budgetUsagePercent}%</span>
                  <span>Batas {formatIDR(remainingBudgetLimit)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                  Rp 0
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>Batas belum diatur</span>
                  <button
                    onClick={() => navigate('/budgets')}
                    className="text-brand-violet dark:text-brand-cyan font-bold hover:underline"
                  >
                    + Atur Anggaran
                  </button>
                </div>
              </>
            )}
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
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} minTickGap={20} />
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Akumulasi pengeluaran berdasarkan kategori</p>
          </div>

          {(() => {
            const breakdownItems = (expenseBreakdown?.items || expenseBreakdown?.breakdown || []) as any[];
            const totalExpenseAmount = Number(expenseBreakdown?.totalExpense ?? expenseBreakdown?.total ?? totalExpense);

            return breakdownItems.length > 0 && totalExpenseAmount > 0 ? (
              <>
                <div className="relative h-60 w-full flex items-center justify-center my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownItems}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="amount"
                      >
                        {breakdownItems.map((_: any, index: number) => (
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
                      {formatIDR(totalExpenseAmount)}
                    </span>
                  </div>
                </div>

                {/* Category Legends */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {breakdownItems.slice(0, 5).map((item: any, idx: number) => (
                    <div key={item.categoryId || idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.categoryName || item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">({formatIDR(item.amount)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  <PieIcon className="w-6 h-6 opacity-60 text-brand-violet" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Belum Ada Pengeluaran</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  Catat transaksi pengeluaran untuk melihat grafik kategori secara otomatis.
                </p>
              </div>
            );
          })()}
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
