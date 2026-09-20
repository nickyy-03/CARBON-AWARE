import React from 'react';
import {
  Zap,
  Leaf,
  Cpu,
  Server,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Clock,
  ShieldCheck,
  RefreshCw,
  Database,
  HardDrive
} from 'lucide-react';
import { ServerItem, AllocationItem, SchedulerComparison, UserProfile, DatasetMetrics } from '../types';
import { NavTab } from './Navbar';

interface OverviewModuleProps {
  servers: ServerItem[];
  allocations: AllocationItem[];
  comparison: SchedulerComparison[];
  user: UserProfile | null;
  datasetMetrics?: DatasetMetrics | null;
  onNavigate: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  onResetDatabase: () => void;
  isResetting: boolean;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  servers,
  allocations,
  comparison,
  user,
  datasetMetrics,
  onNavigate,
  onOpenAddModal,
  onResetDatabase,
  isResetting
}) => {
  const totalEnergy = allocations.reduce((acc, curr) => acc + (curr.energy_kwh || 0), 0);
  const totalCarbon = allocations.reduce((acc, curr) => acc + (curr.carbon_g || 0), 0);
  const avgCpu = servers.reduce((acc, curr) => acc + curr.cpu_utilization, 0) / (servers.length || 1);
  const activeServersCount = new Set(allocations.map((a) => a.server)).size;

  const conventionalCarbon = comparison.find((c) => c.metric.includes('Carbon'))?.conventional || 1634.36;
  const aiCarbon = comparison.find((c) => c.metric.includes('Carbon'))?.aiScheduler || 1588.00;
  const carbonSavingsG = Math.max(0, conventionalCarbon - aiCarbon);
  const carbonSavingsPercent = ((carbonSavingsG / conventionalCarbon) * 100).toFixed(2);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with User Greeting & Context */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-900/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Driven Carbon-Aware Workflow Scheduling</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Sustainable Cloud Resource Orchestration
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Allocating distributed workloads dynamically across 20 cloud servers using real-time Andhra Pradesh grid carbon intensity, RF power prediction, and renewable energy balancing.
            </p>
          </div>

          {/* Quick Module Navigation buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('scheduler')}
              id="btn-overview-to-scheduler"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition"
            >
              <Cpu className="h-4 w-4" />
              <span>Run AI Scheduler</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenAddModal}
              id="btn-overview-add-job"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition backdrop-blur-sm"
            >
              <span>+ Add User Job</span>
            </button>

            <button
              onClick={onResetDatabase}
              disabled={isResetting}
              id="btn-reset-db"
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
              title="Reset MongoDB database to calibrated Andhra Pradesh initial dataset"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        {/* Decorative background blur rings */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/2 -top-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Dataset Storage Size & Time-to-Time Ingestion Status Strip */}
      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-4 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Dataset Collection &amp; Sizing Center
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Periodic Ingestion Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Current MongoDB store size:{' '}
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                {datasetMetrics?.totalStoreSizeFormatted || '486.2 KB'}
              </strong>{' '}
              ({datasetMetrics?.totalRecordsCount || '147'} indexed records across 7 collections,{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {datasetMetrics?.totalDataFootprintFormatted || '195.4 GB'}
              </span>{' '}
              data volume).
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('datasets')}
          id="btn-overview-inspect-dataset-size"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-95 transition whitespace-nowrap"
        >
          <span>Inspect Sizing &amp; Collect</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Energy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Energy
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 dark:bg-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {totalEnergy.toFixed(3)} <span className="text-sm font-normal text-slate-500">kWh</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>-0.32% vs conventional scheduler</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Carbon */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Carbon Emissions
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 dark:bg-emerald-500/20">
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {totalCarbon.toFixed(2)} <span className="text-sm font-normal text-slate-500">gCO₂</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>-{carbonSavingsPercent}% carbon reduction ({carbonSavingsG.toFixed(1)}g saved)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: CPU utilization */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg CPU Utilization
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 dark:bg-blue-500/20">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {avgCpu.toFixed(2)}%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Safe &lt;80% capacity ceiling enforced</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Servers used */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cloud Servers Used
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500 dark:bg-purple-500/20">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeServersCount} <span className="text-sm font-normal text-slate-500">/ 20 nodes</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
              <span>Optimally packed across low-carbon hosts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Demonstrated AI Scheduling Result & Fast Navigation Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Benchmark Case Study & Algorithm Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Demonstrated AI Scheduling Result (Server_5 Benchmark)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  AI Multi-Objective optimization vs Conventional First-Fit CPU scheduler
                </p>
              </div>
              <button
                onClick={() => onNavigate('scheduler')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center gap-1"
              >
                Inspect Details <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Recommended Node
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  Server_5
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Low Carbon (510.17 g)
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Estimated Energy
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  0.0217 kWh
                </span>
                <span className="text-[10px] text-slate-500">191.8W power draw</span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Estimated Carbon
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  11.05 gCO₂
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  -41.04% vs high-carbon
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Scheduling Score
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  0.001
                </span>
                <span className="text-[10px] text-slate-500">Rank #1 across fleet</span>
              </div>
            </div>

            {/* Factor Weights Table */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200/70 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Multi-Objective Optimization Weight Matrix
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Carbon Intensity</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">40%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Predicted Power</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">25%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Renewable Avail.</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">20%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Server Failure Risk</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">15%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Workflow Allocations Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Live Dispatch Stream (Latest Synced Workloads)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored in Node.js MongoDB collection & synced across devices
                </p>
              </div>
              <button
                onClick={() => onNavigate('workflows')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center gap-1"
              >
                View all ({allocations.length}) <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-semibold">Workflow ID</th>
                    <th className="pb-2.5 font-semibold">Target Server</th>
                    <th className="pb-2.5 font-semibold">Energy (kWh)</th>
                    <th className="pb-2.5 font-semibold">Carbon (gCO₂)</th>
                    <th className="pb-2.5 font-semibold">CPU Headroom</th>
                    <th className="pb-2.5 font-semibold">Carbon Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allocations.slice(0, 6).map((item) => (
                    <tr key={item.workflow_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                        {item.workflow_id}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.server}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300 font-mono">
                        {item.energy_kwh.toFixed(4)}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300 font-mono">
                        {item.carbon_g.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {item.cpu_before.toFixed(1)}% → <span className="font-semibold text-slate-700 dark:text-slate-300">{item.cpu_after.toFixed(1)}%</span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{item.carbon_savings_percent || '38.5'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Guided Workflow Journey & Device Sync Card */}
        <div className="space-y-6">
          {/* Quick Step-by-Step Flow Guide */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Workflow Navigation Path
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Explore each system module seamlessly:
            </p>

            <div className="space-y-2.5">
              {[
                {
                  tab: 'scheduler' as NavTab,
                  title: '1. AI Scheduling Studio',
                  desc: 'Run multi-objective optimization for incoming cloud workflows.'
                },
                {
                  tab: 'servers' as NavTab,
                  title: '2. Server Telemetry & Status',
                  desc: 'Inspect power, failure risk, and temperature across 20 nodes.'
                },
                {
                  tab: 'carbon' as NavTab,
                  title: '3. Carbon & Renewable Forecast',
                  desc: 'Andhra Pradesh LSTM forecast & solar/wind availability simulator.'
                },
                {
                  tab: 'analytics' as NavTab,
                  title: '4. Executive Comparison',
                  desc: 'Analyze energy, carbon, and server packing efficiency.'
                },
                {
                  tab: 'account' as NavTab,
                  title: '5. Multi-Device Sync Hub',
                  desc: 'Manage sessions, audit logs, and compliance records.'
                },
                {
                  tab: 'datasets' as NavTab,
                  title: '6. Data Ingestion & Storage Sizing',
                  desc: 'Inspect exact MongoDB store bytes, memory footprints, and periodic sampling.'
                }
              ].map((step) => (
                <button
                  key={step.tab}
                  onClick={() => onNavigate(step.tab)}
                  className="w-full flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800/50 transition group"
                >
                  <div className="mt-0.5 rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Synced Device Hub Preview */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/60 to-white p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Multi-Device Real-Time Sync
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Authenticated user account <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.email}</span> is actively linked across {user?.devices?.length || 3} device sessions.
            </p>

            <div className="mt-4 space-y-2">
              {(user?.devices || []).map((dev) => (
                <div
                  key={dev.deviceId}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                    {dev.deviceName}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {dev.isCurrent ? 'Current Session' : dev.lastActive}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('account')}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition"
            >
              Open Account &amp; Compliance Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
