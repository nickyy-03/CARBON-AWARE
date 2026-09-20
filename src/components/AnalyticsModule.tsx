import React from 'react';
import {
  BarChart3,
  TrendingDown,
  Zap,
  Leaf,
  Cpu,
  Server,
  Download,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { SchedulerComparison, ServerItem, AllocationItem } from '../types';
import { NavTab } from './Navbar';

interface AnalyticsModuleProps {
  comparison: SchedulerComparison[];
  servers: ServerItem[];
  allocations: AllocationItem[];
  onNavigate: (tab: NavTab) => void;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  comparison,
  servers,
  allocations,
  onNavigate
}) => {
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ comparison, servers, allocations }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ecocloud_esg_analytics_report.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const energyConventional = comparison.find((c) => c.metric.includes('Energy'))?.conventional || 2.4507;
  const energyAi = comparison.find((c) => c.metric.includes('Energy'))?.aiScheduler || 2.4429;

  const carbonConventional = comparison.find((c) => c.metric.includes('Carbon'))?.conventional || 1634.36;
  const carbonAi = comparison.find((c) => c.metric.includes('Carbon'))?.aiScheduler || 1588.00;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Conventional vs AI Scheduler Analytics
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical benchmark analytics based on 100 workloads scheduled across Andhra Pradesh grid data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            id="btn-export-esg-report"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            <span>Export ESG Report</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Visual Bar Charts (Energy & Carbon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Energy Bar Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Energy Consumption Comparison (kWh)
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              -0.32% Reduction
            </span>
          </div>

          <div className="space-y-4 my-6">
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Conventional First-Fit Scheduler:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {energyConventional.toFixed(4)} kWh
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full w-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-300 mb-1">
                <span className="font-bold">Capacity-Aware AI Scheduler:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {energyAi.toFixed(4)} kWh
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${(energyAi / energyConventional) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Intelligently aligns compute duration with host power curves without violating node safety constraints.
          </p>
        </div>

        {/* Carbon Bar Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-500" />
              Carbon Emissions Comparison (gCO₂)
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              -2.84% Overall (-46.36 g)
            </span>
          </div>

          <div className="space-y-4 my-6">
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Conventional First-Fit Scheduler:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {carbonConventional.toFixed(2)} gCO₂
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full w-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-300 mb-1">
                <span className="font-bold">Capacity-Aware AI Scheduler:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {carbonAi.toFixed(2)} gCO₂
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${(carbonAi / carbonConventional) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Per-workload carbon reduction peaks at up to <strong>41.04%</strong> when migrating tasks from coal-heavy nodes to solar/wind availability.
          </p>
        </div>
      </div>

      {/* Dataset Benchmark Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
          Empirical System Metric Comparison Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Evaluation Metric</th>
                <th className="pb-3 font-semibold">Conventional Scheduler</th>
                <th className="pb-3 font-semibold">Capacity-Aware AI Scheduler</th>
                <th className="pb-3 font-semibold">Unit</th>
                <th className="pb-3 font-semibold">System Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparison.map((row) => (
                <tr key={row.metric} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                    {row.metric}
                  </td>
                  <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                    {row.conventional.toFixed(2)}
                  </td>
                  <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {row.aiScheduler.toFixed(2)}
                  </td>
                  <td className="py-3 text-slate-500 font-mono">
                    {row.unit}
                  </td>
                  <td className="py-3">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {row.savings}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Low-Carbon Nodes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Node Carbon Distribution &amp; Ranking
          </h3>
          <button
            onClick={() => onNavigate('servers')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
          >
            Manage Cluster <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {servers.slice(0, 4).map((s, idx) => (
            <div
              key={s.server_id}
              className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Rank #{idx + 1}: {s.server_id}
                </span>
                <span className="text-[10px] rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Clean Tier
                </span>
              </div>
              <div className="mt-2 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Carbon:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {s.carbon_intensity.toFixed(1)} g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Power:</span>
                  <span className="font-mono">{s.predicted_power_watts.toFixed(1)} W</span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {s.scheduling_score?.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
