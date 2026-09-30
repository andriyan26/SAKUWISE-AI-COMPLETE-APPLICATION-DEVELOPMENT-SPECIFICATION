import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  LineChart,
  PieChart,
  Target,
  FileBarChart,
  Bot,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  // Navigation items with custom iconography & vibrant color accents
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-indigo-600',
      activeColor: 'text-white',
    },
    {
      name: 'Transaksi',
      path: '/transactions',
      icon: ReceiptText,
      color: 'from-teal-400 to-emerald-600',
      activeColor: 'text-white',
    },
    {
      name: 'Analisis Keuangan',
      path: '/analytics',
      icon: LineChart,
      color: 'from-cyan-400 to-blue-600',
      activeColor: 'text-white',
    },
    {
      name: 'Anggaran',
      path: '/budgets',
      icon: PieChart,
      color: 'from-amber-400 to-orange-500',
      activeColor: 'text-white',
    },
    {
      name: 'Tujuan Finansial',
      path: '/goals',
      icon: Target,
      color: 'from-emerald-400 to-teal-600',
      activeColor: 'text-white',
    },
    {
      name: 'Laporan',
      path: '/reports',
      icon: FileBarChart,
      color: 'from-purple-500 to-indigo-600',
      activeColor: 'text-white',
    },
    {
      name: 'AI Assistant',
      path: '/ai-assistant',
      icon: Bot,
      color: 'from-brand-violet to-brand-teal',
      activeColor: 'text-white',
      isAi: true,
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-[#293449] select-none transition-colors duration-200">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-[#293449]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-glow-violet shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">SAKUWISE</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-violet/25 text-brand-violet dark:text-brand-cyan border border-brand-violet/40">
                    AI
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Smart Finance Assistant
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Nav Items with Enhanced Icons */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-sm'
                          : `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-gradient-to-br ${item.color} group-hover:text-white`
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.isAi ? 'animate-pulse' : ''}`} />
                    </div>

                    {!isCollapsed && (
                      <span className="truncate flex-1 flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.isAi && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-sm animate-pulse">
                            AI
                          </span>
                        )}
                      </span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="hidden group-hover:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area of Sidebar (Bottom settings/help removed per request, now in Profile Dropdown) */}
      <div className="p-3 border-t border-slate-200 dark:border-[#293449]">
        {!isCollapsed && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>FinTech AI Active</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Terenkripsi & ISO-27001
            </p>
          </div>
        )}

        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
