import React, { useState } from 'react';
import {
  Layers,
  PlusCircle,
  Search,
  Cpu,
  HardDrive,
  Clock,
  Database,
  CheckCircle2,
  ArrowRight,
  Filter,
  Play
} from 'lucide-react';
import { WorkflowItem, AllocationItem } from '../types';
import { NavTab } from './Navbar';

interface WorkflowsModuleProps {
  workflows: WorkflowItem[];
  allocations: AllocationItem[];
  onOpenAddModal: () => void;
  onSelectWorkflowToSchedule: (workflowId: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const WorkflowsModule: React.FC<WorkflowsModuleProps> = ({
  workflows,
  allocations,
  onOpenAddModal,
  onSelectWorkflowToSchedule,
  onNavigate
}) => {
  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'allocations'>('catalog');
  const [filterResource, setFilterResource] = useState<'all' | 'high-cpu' | 'heavy-data'>('all');

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch = w.workflow_id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterResource === 'high-cpu') return w.cpu_requirement >= 50;
    if (filterResource === 'heavy-data') return w.data_size_mb >= 3000;
    return true;
  });

  const filteredAllocations = allocations.filter((a) =>
    a.workflow_id.toLowerCase().includes(search.toLowerCase()) ||
    a.server.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cloud Workload Queue &amp; Allocation Matrix
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Persisted in Node.js MongoDB document store. Track execution demands, CPU packaging, and assigned hosts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            id="btn-workflows-add"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Sub-tab switcher: Workflow Definitions vs Actual Allocations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeSubTab === 'catalog'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Workload Catalog ({workflows.length} Jobs)
          </button>
          <button
            onClick={() => setActiveSubTab('allocations')}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeSubTab === 'allocations'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            Execution Allocations ({allocations.length} Assigned)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'catalog' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterResource('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  filterResource === 'all'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterResource('high-cpu')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  filterResource === 'high-cpu'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                &gt;50% CPU
              </button>
              <button
                onClick={() => setFilterResource('heavy-data')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  filterResource === 'heavy-data'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                &gt;3GB Data
              </button>
            </div>
          )}

          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search workflow ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* CATALOG VIEW */}
      {activeSubTab === 'catalog' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold z-10">
                <tr>
                  <th className="p-3">Workflow Tag</th>
                  <th className="p-3">CPU Requirement</th>
                  <th className="p-3">Memory (RAM)</th>
                  <th className="p-3">Execution Duration</th>
                  <th className="p-3">Data Footprint</th>
                  <th className="p-3">Allocation Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWorkflows.map((wf) => (
                  <tr key={wf.workflow_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {wf.workflow_id}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {wf.cpu_requirement.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {wf.memory_requirement.toFixed(1)} GB
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {wf.execution_duration.toFixed(0)} sec
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {wf.data_size_mb.toFixed(0)} MB
                    </td>
                    <td className="p-3">
                      {wf.allocatedServer ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>{wf.allocatedServer}</span>
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Pending Queue
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          onSelectWorkflowToSchedule(wf.workflow_id);
                          onNavigate('scheduler');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Schedule</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALLOCATIONS VIEW */}
      {activeSubTab === 'allocations' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold z-10">
                <tr>
                  <th className="p-3">Workflow</th>
                  <th className="p-3">Host Node</th>
                  <th className="p-3">Energy (kWh)</th>
                  <th className="p-3">Carbon (gCO₂)</th>
                  <th className="p-3">CPU Before &rarr; After</th>
                  <th className="p-3">Grid Carbon Intensity</th>
                  <th className="p-3">Failure Risk</th>
                  <th className="p-3">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAllocations.map((alloc) => (
                  <tr key={alloc.workflow_id + alloc.server} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {alloc.workflow_id}
                    </td>
                    <td className="p-3">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {alloc.server}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                      {alloc.energy_kwh.toFixed(4)}
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                      {alloc.carbon_g.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {alloc.cpu_before.toFixed(1)}% &rarr; <span className="font-semibold text-slate-900 dark:text-white">{alloc.cpu_after.toFixed(1)}%</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                      {alloc.carbon_intensity.toFixed(1)} gCO₂/kWh
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {(alloc.failure_risk * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      +{alloc.carbon_savings_percent || '35.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
