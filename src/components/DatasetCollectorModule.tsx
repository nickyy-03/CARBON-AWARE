import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  RefreshCw,
  Play,
  Pause,
  Clock,
  Layers,
  Server,
  SunMedium,
  ShieldCheck,
  TrendingUp,
  FileText,
  Activity,
  ArrowRight,
  Download,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { DatasetMetrics, DatasetCollectionInfo, IngestionLogEntry } from '../types';
import { NavTab } from './Navbar';

interface DatasetCollectorModuleProps {
  metrics: DatasetMetrics | null;
  onCollectNow: (targetDataset: string) => Promise<void>;
  onToggleAutoCollect: (enabled: boolean, intervalSeconds?: number) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
}

export const DatasetCollectorModule: React.FC<DatasetCollectorModuleProps> = ({
  metrics,
  onCollectNow,
  onToggleAutoCollect,
  onNavigate
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [selectedInterval, setSelectedInterval] = useState<number>(
    metrics?.collectionIntervalSeconds || 15
  );
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectNotice, setCollectNotice] = useState<string | null>(null);

  const handleManualCollect = async () => {
    setIsCollecting(true);
    setCollectNotice(null);
    try {
      await onCollectNow(selectedTarget);
      setCollectNotice('Successfully collected and ingested data point from dataset.');
      setTimeout(() => setCollectNotice(null), 3500);
    } catch (err: unknown) {
      setCollectNotice('Failed to collect data: ' + ((err as Error)?.message || 'error'));
    } finally {
      setIsCollecting(false);
    }
  };

  const handleIntervalChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSelectedInterval(val);
    if (metrics?.autoCollectionEnabled) {
      await onToggleAutoCollect(true, val);
    }
  };

  const handleToggleAuto = async () => {
    if (!metrics) return;
    const nextState = !metrics.autoCollectionEnabled;
    await onToggleAutoCollect(nextState, selectedInterval);
  };

  const handleExportMetrics = () => {
    if (!metrics) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ecocloud_dataset_sizing_report.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalBytes = metrics?.totalStoreSizeBytes || 1;
  const collections = metrics?.collections || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dataset Ingestion &amp; Storage Sizing Center
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time periodic data collection from cloud datasets, exact size calculation (Bytes, KB, MB), and automated sampling daemon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMetrics}
            id="btn-export-dataset-metrics"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-blue-500" />
            <span>Export Size Audit</span>
          </button>
        </div>
      </div>

      {collectNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{collectNotice}</span>
        </div>
      )}

      {/* 4 HIGH IMPACT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disk Size */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              MongoDB Store Size
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics?.totalStoreSizeFormatted || '486.2 KB'}
            </span>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{metrics?.totalStoreSizeBytes?.toLocaleString() || '497,920'} Bytes</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Persistent Disk</span>
            </div>
          </div>
        </div>

        {/* Total Data Footprint Volume */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Data Processing Footprint
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics?.totalDataFootprintFormatted || '195.4 GB'}
            </span>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{metrics?.totalDataFootprintMb?.toLocaleString() || '195,400'} MB Workloads</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Managed Footprint</span>
            </div>
          </div>
        </div>

        {/* Total Ingested Records */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Dataset Records
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics?.totalRecordsCount || '147'} Records
            </span>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>7 Document Collections</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">Indexed JSON</span>
            </div>
          </div>
        </div>

        {/* Time-to-Time Ingestion Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Periodic Ingestion Daemon
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  metrics?.autoCollectionEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              ></span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {metrics?.autoCollectionEnabled
                  ? `Every ${metrics.collectionIntervalSeconds}s`
                  : 'Paused'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Last: {metrics?.lastCollectionTimestamp || 'Just now'}</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Auto-Stream</span>
            </div>
          </div>
        </div>
      </div>

      {/* TIME-TO-TIME DATA COLLECTION CONTROLS PANEL */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Time-to-Time Ingestion Engine
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Collect Data from Datasets &amp; Stream to MongoDB
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pulls periodic observations from the Andhra Pradesh grid carbon timeseries, server telemetry sensors, or incoming workload streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handleToggleAuto}
                id="btn-toggle-auto-collect"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  metrics?.autoCollectionEnabled
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {metrics?.autoCollectionEnabled ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Auto-Collect: ON</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Auto-Collect: OFF</span>
                  </>
                )}
              </button>

              <select
                value={selectedInterval}
                onChange={handleIntervalChange}
                id="select-interval-dropdown"
                className="rounded-lg border-0 bg-transparent py-1 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value={5}>Every 5s (Live Stream)</option>
                <option value={10}>Every 10s (Fast)</option>
                <option value={15}>Every 15s (Balanced)</option>
                <option value={30}>Every 30s (Standard)</option>
                <option value={60}>Every 60s (Low Overhead)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Manual Trigger Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              id="select-target-dataset"
              className="w-full sm:w-2/3 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">🔄 All Datasets (Rotated Sampling)</option>
              <option value="carbon">🌱 Andhra Pradesh Carbon Timeseries (Next Hour)</option>
              <option value="servers">⚡ Server Fleet Telemetry (20 Nodes Sensor Tick)</option>
              <option value="workflows">📦 Cloud Workflow Queue (Arriving Workload)</option>
            </select>

            <button
              onClick={handleManualCollect}
              disabled={isCollecting}
              id="btn-manual-collect-now"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 transition"
            >
              <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
              <span>{isCollecting ? 'Collecting from Dataset...' : 'Collect Data Point Now'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400 px-2">
            <span>Size increment:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              +240 to +420 Bytes / point
            </span>
          </div>
        </div>
      </div>

      {/* STORAGE FOOTPRINT DISTRIBUTION BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
          Dataset Storage Allocation (Percentage of Total Store Size)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Distribution of disk bytes across the 7 indexed collections in <code>/data/mongo_store/*.json</code>.
        </p>

        {/* Stacked Progress Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          {collections.map((col, idx) => {
            const pct = Math.max(2, Math.round((col.diskSizeBytes / totalBytes) * 100));
            const colors = [
              'bg-blue-500',
              'bg-emerald-500',
              'bg-purple-500',
              'bg-amber-500',
              'bg-teal-500',
              'bg-rose-500',
              'bg-indigo-500'
            ];
            return (
              <div
                key={col.name}
                className={`${colors[idx % colors.length]} h-full transition-all`}
                style={{ width: `${pct}%` }}
                title={`${col.name}: ${col.diskSizeFormatted} (${pct}%)`}
              ></div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {collections.map((col, idx) => {
            const pct = Math.max(1, Math.round((col.diskSizeBytes / totalBytes) * 100));
            const dotColors = [
              'bg-blue-500',
              'bg-emerald-500',
              'bg-purple-500',
              'bg-amber-500',
              'bg-teal-500',
              'bg-rose-500',
              'bg-indigo-500'
            ];
            return (
              <div key={col.name} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${dotColors[idx % dotColors.length]}`}></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {col.name.replace('_', ' ')}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {col.diskSizeFormatted} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED DATASET SIZING BREAKDOWN TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Collection Storage Audit &amp; Footprint Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time measurement of disk file bytes, serialized memory cache, and processed data footprint.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
            Total: {metrics?.totalStoreSizeFormatted}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Collection Name &amp; Description</th>
                <th className="p-3">Records</th>
                <th className="p-3">Disk File Size</th>
                <th className="p-3">Memory Cache</th>
                <th className="p-3">Data Footprint</th>
                <th className="p-3">Avg Record Size</th>
                <th className="p-3">Last Ingested</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {collections.map((col) => (
                <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {col.name.replace('_', ' ')}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:bg-slate-800">
                        .json
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {col.description}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {col.recordCount.toLocaleString()}
                  </td>

                  <td className="p-3">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                      {col.diskSizeFormatted}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {col.diskSizeBytes.toLocaleString()} B
                    </span>
                  </td>

                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                    {col.memorySizeFormatted}
                  </td>

                  <td className="p-3">
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {col.dataFootprintMb > 1024
                        ? (col.dataFootprintMb / 1024).toFixed(2) + ' GB'
                        : col.dataFootprintMb.toLocaleString() + ' MB'}
                    </span>
                  </td>

                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                    {col.avgRecordSizeBytes.toLocaleString()} B / record
                  </td>

                  <td className="p-3 text-[11px] text-slate-500 font-mono">
                    {new Date(col.lastUpdated).toLocaleTimeString()}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => onCollectNow(col.name)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                      title="Collect fresh data point for this dataset"
                    >
                      <RefreshCw className="h-3 w-3 text-blue-500" />
                      <span>Ingest</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT INGESTION STREAM / LOG */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Live Time-to-Time Ingestion Event Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit trail of data points collected across timestamps, with byte additions and dataset targets.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Updated in real-time via SSE
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Target Dataset</th>
                <th className="p-2.5">Ingested</th>
                <th className="p-2.5">Size Added</th>
                <th className="p-2.5">Trigger</th>
                <th className="p-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(metrics?.recentIngestions || []).map((entry: IngestionLogEntry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-mono text-[11px] text-slate-500">{entry.timestamp}</td>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{entry.dataset}</td>
                  <td className="p-2.5 font-mono">+{entry.recordsIngested} item</td>
                  <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    +{entry.bytesAdded} B
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        entry.trigger === 'auto_cron'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {entry.trigger === 'auto_cron' ? 'Auto Daemon' : 'Manual Poll'}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-md truncate">
                    {entry.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigate('overview')}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          &larr; Back to Overview
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <span>View Comparative Analytics</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
