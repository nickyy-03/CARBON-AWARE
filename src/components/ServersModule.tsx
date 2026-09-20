import React, { useState } from 'react';
import {
  Server,
  Zap,
  Leaf,
  AlertTriangle,
  Cpu,
  Thermometer,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ServerItem } from '../types';
import { NavTab } from './Navbar';

interface ServersModuleProps {
  servers: ServerItem[];
  onNavigate: (tab: NavTab) => void;
  onSelectServerForScheduling?: (serverId: string) => void;
}

export const ServersModule: React.FC<ServersModuleProps> = ({
  servers,
  onNavigate,
  onSelectServerForScheduling
}) => {
  const [filterType, setFilterType] = useState<'all' | 'low-carbon' | 'safe-failure' | 'high-headroom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServers = servers.filter((s) => {
    const matchesSearch = s.server_id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'low-carbon') return s.carbon_intensity < 600;
    if (filterType === 'safe-failure') return s.failure_risk < 0.25;
    if (filterType === 'high-headroom') return s.cpu_utilization < 40;
    return true;
  });

  const maxPower = Math.max(...servers.map((s) => s.predicted_power_watts), 400);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <Server className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cloud Server Fleet Status &amp; Telemetry (20 Nodes)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-sensor telemetry, Random Forest power estimation, failure probabilities, and carbon intensity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scheduler')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
          >
            <span>Dispatch to Node</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Fleet Overview Visual Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Prediction Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Predicted Server Power Consumption (Watts)
            </h3>
            <span className="text-[11px] text-slate-400">Random Forest Model</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {servers.slice(0, 10).map((s) => {
              const widthPct = Math.round((s.predicted_power_watts / maxPower) * 100);
              return (
                <div key={s.server_id} className="text-xs">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span className="font-medium text-slate-900 dark:text-white">{s.server_id}</span>
                    <span className="font-mono">{s.predicted_power_watts.toFixed(1)} W</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.predicted_power_watts < 220
                          ? 'bg-emerald-500'
                          : s.predicted_power_watts < 320
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Failure Risk Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Predicted Server Failure Probability (%)
            </h3>
            <span className="text-[11px] text-slate-400">Classification Model</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {servers.slice(0, 10).map((s) => {
              const failPct = Math.round(s.failure_risk * 100);
              return (
                <div key={s.server_id} className="text-xs">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span className="font-medium text-slate-900 dark:text-white">{s.server_id}</span>
                    <span className="font-mono">{failPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        failPct < 20
                          ? 'bg-emerald-500'
                          : failPct < 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${failPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            All Servers ({servers.length})
          </button>
          <button
            onClick={() => setFilterType('low-carbon')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'low-carbon'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            🌱 Low Carbon (&lt;600g)
          </button>
          <button
            onClick={() => setFilterType('safe-failure')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'safe-failure'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            🛡️ Low Risk (&lt;25%)
          </button>
          <button
            onClick={() => setFilterType('high-headroom')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'high-headroom'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            ⚡ High Capacity (&lt;40% CPU)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search server (e.g. Server_5)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* 20 Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServers.map((server) => {
          const isHighHeadroom = server.cpu_utilization <= 40;
          const isLowCarbon = server.carbon_intensity < 600;

          return (
            <div
              key={server.server_id}
              className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                server.server_id === 'Server_5'
                  ? 'border-emerald-500/50 bg-emerald-50/20 dark:border-emerald-500/30 dark:bg-emerald-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      server.cpu_utilization < 75 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {server.server_id}
                  </span>
                </div>

                {server.server_id === 'Server_5' ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    AI Top Pick
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    Score: {server.scheduling_score?.toFixed(3) || '0.50'}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {/* CPU Utilization */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-0.5">
                    <span>CPU Load:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {server.cpu_utilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        server.cpu_utilization < 50
                          ? 'bg-emerald-500'
                          : server.cpu_utilization < 80
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${server.cpu_utilization}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics 2-column */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Carbon Intensity</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {server.carbon_intensity.toFixed(1)} g
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Power Draw</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {server.predicted_power_watts.toFixed(1)} W
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-rose-500" />
                    {server.temperature.toFixed(1)}&deg;C
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                    Risk: {(server.failure_risk * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {server.active_vms} VMs active
                </span>

                <button
                  onClick={() => onNavigate('scheduler')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center gap-1"
                >
                  Allocate Workload &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
