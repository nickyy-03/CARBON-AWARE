import React from 'react';
import {
  Cloud,
  LayoutDashboard,
  Server,
  Layers,
  Cpu,
  SunMedium,
  BarChart3,
  ShieldCheck,
  Moon,
  Sun,
  PlusCircle,
  Wifi,
  Database,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab =
  | 'overview'
  | 'scheduler'
  | 'servers'
  | 'workflows'
  | 'carbon'
  | 'analytics'
  | 'datasets'
  | 'account';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: UserProfile | null;
  onOpenAddModal: () => void;
  liveCarbonIntensity: number;
  isRealtimeConnected: boolean;
  datasetSizeFormatted?: string;
  isAutoCollecting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode,
  user,
  onOpenAddModal,
  liveCarbonIntensity,
  isRealtimeConnected,
  datasetSizeFormatted = '486 KB',
  isAutoCollecting = true
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scheduler', label: 'AI Scheduler', icon: Cpu },
    { id: 'servers', label: 'Servers (20)', icon: Server },
    { id: 'workflows', label: 'Workflows', icon: Layers },
    { id: 'carbon', label: 'Carbon & Renewables', icon: SunMedium },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'datasets', label: 'Data Ingestion & Sizing', icon: Database },
    { id: 'account', label: 'Multi-Device Sync', icon: ShieldCheck }
  ];

  const carbonBadgeColor =
    liveCarbonIntensity < 600
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
      : liveCarbonIntensity < 780
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
      : 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
            id="brand-home-button"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <Cloud className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  EcoCloud<span className="text-emerald-500">.AI</span>
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Node+Mongo
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
                Carbon-Aware Dynamic Scheduler
              </p>
            </div>
          </button>

          {/* Real-time Grid & Sync pill */}
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${carbonBadgeColor}`}
              title="Current Andhra Pradesh Grid Carbon Intensity"
            >
              <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
              <span>Grid: {liveCarbonIntensity} gCO₂/kWh</span>
            </div>

            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                isRealtimeConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Wifi className="h-3 w-3" />
              <span>{isRealtimeConnected ? 'Real-Time Sync' : 'Reconnecting...'}</span>
            </div>

            {/* Live Dataset Size & Ingestion Badge */}
            <button
              onClick={() => onSelectTab('datasets')}
              id="btn-nav-dataset-size"
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 transition"
              title="Click to view full dataset sizing breakdown and time-to-time collection controls"
            >
              <Database className="h-3 w-3 text-blue-500" />
              <span>Store: {datasetSizeFormatted}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${isAutoCollecting ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
                title={isAutoCollecting ? 'Auto-ingestion active' : 'Auto-ingestion paused'}
              ></span>
            </button>
          </div>
        </div>

        {/* Action Controls: Add Workflow + Theme Toggle + User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenAddModal}
            id="btn-header-add-workflow"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 sm:px-3.5 sm:text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Workflow</span>
            <span className="sm:hidden">Add</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            id="btn-theme-toggle"
            aria-label="Toggle theme"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* Quick Account badge */}
          <button
            onClick={() => onSelectTab('account')}
            id="btn-nav-user-profile"
            className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 pl-2 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 transition"
          >
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight">
                {user?.name || 'Nikitha Bokinala'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {user?.devices?.length || 3} Devices Active
              </p>
            </div>
            <div className="relative">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt="Avatar"
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>
          </button>
        </div>
      </div>

      {/* Sub-nav horizontal tabs */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 overflow-x-auto">
        <div className="mx-auto flex max-w-7xl space-x-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                id={`tab-${item.id}`}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-emerald-600 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
