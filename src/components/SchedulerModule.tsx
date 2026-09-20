import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Layers,
  Sliders,
  Play,
  RotateCcw,
  BarChart,
  HardDrive,
  Clock,
  Database,
  Info
} from 'lucide-react';
import { ServerItem, WorkflowItem, SchedulingRecommendation, PredictionResult } from '../types';
import { NavTab } from './Navbar';

interface SchedulerModuleProps {
  workflows: WorkflowItem[];
  servers: ServerItem[];
  onScheduleWorkflow: (workflowId: string, renewableAvailability: number) => Promise<SchedulingRecommendation>;
  onPredictServer: (params: {
    cpu: number;
    memory: number;
    activeVms: number;
    workload: number;
    temperature: number;
    carbonIntensity: number;
  }) => Promise<PredictionResult>;
  onOpenAddModal: () => void;
  onNavigate: (tab: NavTab) => void;
  renewableAvailability: number;
}

export const SchedulerModule: React.FC<SchedulerModuleProps> = ({
  workflows,
  servers,
  onScheduleWorkflow,
  onPredictServer,
  onOpenAddModal,
  onNavigate,
  renewableAvailability
}) => {
  // Workflow scheduling state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    workflows[0]?.workflow_id || 'WF_1'
  );
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingResult, setSchedulingResult] = useState<SchedulingRecommendation | null>(null);
  const [schedulingError, setSchedulingError] = useState<string | null>(null);

  // Prediction panel state (Custom user inputs)
  const [predCpu, setPredCpu] = useState<number>(50);
  const [predMemory, setPredMemory] = useState<number>(50);
  const [predVms, setPredVms] = useState<number>(5);
  const [predWorkload, setPredWorkload] = useState<number>(0.50);
  const [predTemp, setPredTemp] = useState<number>(50);
  const [predCarbon, setPredCarbon] = useState<number>(700);

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  const currentWorkflow =
    workflows.find((w) => w.workflow_id === selectedWorkflowId) || workflows[0];

  const handleExecuteSchedule = async () => {
    if (!currentWorkflow) return;
    setIsScheduling(true);
    setSchedulingError(null);
    try {
      const res = await onScheduleWorkflow(currentWorkflow.workflow_id, renewableAvailability);
      setSchedulingResult(res);
    } catch (err: unknown) {
      setSchedulingError((err as Error)?.message || 'Scheduling calculation failed');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRunPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await onPredictServer({
        cpu: predCpu,
        memory: predMemory,
        activeVms: predVms,
        workload: predWorkload,
        temperature: predTemp,
        carbonIntensity: predCarbon
      });
      setPredictionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Module Title & Navigation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Workflow-to-Server Scheduling Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluate CPU capacity (&le;80%), predicted power, failure risk, carbon intensity, and renewable availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('servers')}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            Inspect Servers
          </button>
          <button
            onClick={() => onNavigate('carbon')}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            Grid Forecast
          </button>
        </div>
      </div>

      {/* SECTION 1: WORKFLOW SELECTION & AI DISPATCH ENGINE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Step 1: Select or Create Cloud Workload
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Target Workflow Requirements
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedWorkflowId}
              onChange={(e) => {
                setSelectedWorkflowId(e.target.value);
                setSchedulingResult(null);
              }}
              id="select-workflow-dropdown"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {workflows.map((wf) => (
                <option key={wf.workflow_id} value={wf.workflow_id}>
                  {wf.workflow_id} ({wf.cpu_requirement.toFixed(1)}% CPU · {wf.memory_requirement.toFixed(1)}GB · {wf.execution_duration.toFixed(0)}s)
                </option>
              ))}
            </select>

            <button
              onClick={onOpenAddModal}
              id="btn-add-workflow-inline"
              className="whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
            >
              + New Custom Job
            </button>
          </div>
        </div>

        {/* Workflow Metric Badges */}
        {currentWorkflow && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-emerald-500" /> CPU Requirement
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                {currentWorkflow.cpu_requirement.toFixed(2)}%
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-blue-500" /> Memory Requirement
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                {currentWorkflow.memory_requirement.toFixed(2)} GB
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" /> Execution Duration
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                {currentWorkflow.execution_duration.toFixed(0)} sec
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-purple-500" /> Data Footprint
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                {currentWorkflow.data_size_mb.toFixed(0)} MB
              </span>
            </div>
          </div>
        )}

        {/* Schedule Button */}
        <div className="mt-5">
          <button
            onClick={handleExecuteSchedule}
            disabled={isScheduling}
            id="btn-run-ai-scheduler"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {isScheduling ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Evaluating 20 servers against capacity constraints...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Schedule Workflow with AI Optimization</span>
              </>
            )}
          </button>
        </div>

        {schedulingError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {schedulingError}
          </div>
        )}

        {/* AI SCHEDULING RESULT DISPLAY */}
        {schedulingResult && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm mb-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span>
                Optimal Green Target: {currentWorkflow?.workflow_id} allocated to {schedulingResult.recommendedServer.server_id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Recommended Server</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {schedulingResult.recommendedServer.server_id}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {schedulingResult.recommendedServer.carbon_intensity.toFixed(1)} gCO₂/kWh
                </span>
              </div>

              <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Estimated Energy</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {schedulingResult.estimatedEnergyKwh.toFixed(4)} kWh
                </span>
                <span className="text-[10px] text-slate-500">
                  {schedulingResult.recommendedServer.predicted_power_watts.toFixed(1)} W
                </span>
              </div>

              <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Estimated Carbon</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {schedulingResult.estimatedCarbonG.toFixed(2)} gCO₂
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  -{schedulingResult.carbonDifferencePercent}% vs Conventional
                </span>
              </div>

              <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">AI Scheduling Score</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {schedulingResult.schedulingScore.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-500">Fleet Rank #1</span>
              </div>
            </div>

            {/* Side-by-Side Comparison: Conventional vs AI Scheduler */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Conventional vs AI Scheduler Head-to-Head Comparison
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Conventional */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Conventional Scheduler (Greedy CPU)
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      Baseline
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Assigned Node:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {schedulingResult.conventionalServer.server_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Energy Consumption:</span>
                      <span className="font-mono">{schedulingResult.conventionalEnergyKwh.toFixed(4)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbon Footprint:</span>
                      <span className="font-mono">{schedulingResult.conventionalCarbonG.toFixed(2)} gCO₂</span>
                    </div>
                  </div>
                </div>

                {/* AI Carbon-Aware */}
                <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      AI Carbon-Aware Scheduler
                    </span>
                    <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Optimized
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <div className="flex justify-between">
                      <span>Assigned Node:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {schedulingResult.recommendedServer.server_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Energy Consumption:</span>
                      <span className="font-mono font-semibold">
                        {schedulingResult.estimatedEnergyKwh.toFixed(4)} kWh ({schedulingResult.energyDifferencePercent >= 0 ? `-${schedulingResult.energyDifferencePercent}%` : `+${Math.abs(schedulingResult.energyDifferencePercent)}%`})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbon Footprint:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {schedulingResult.estimatedCarbonG.toFixed(2)} gCO₂ (-{schedulingResult.carbonDifferencePercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligible Server Ranking Table */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Eligible Fleet Candidates (Capacity &le; 80% Filtered)
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">Rank</th>
                      <th className="p-2.5">Server</th>
                      <th className="p-2.5">CPU %</th>
                      <th className="p-2.5">Predicted Power</th>
                      <th className="p-2.5">Carbon Intensity</th>
                      <th className="p-2.5">Failure Risk</th>
                      <th className="p-2.5">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {schedulingResult.serverRanking.map((s, idx) => (
                      <tr
                        key={s.server_id}
                        className={idx === 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}
                      >
                        <td className="p-2.5">{idx === 0 ? '🥇 #1' : `#${idx + 1}`}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">{s.server_id}</td>
                        <td className="p-2.5">{s.cpu_utilization.toFixed(1)}%</td>
                        <td className="p-2.5 font-mono">{s.predicted_power_watts.toFixed(1)}W</td>
                        <td className="p-2.5 font-mono">{s.carbon_intensity.toFixed(1)} g</td>
                        <td className="p-2.5">{(s.failure_risk * 100).toFixed(1)}%</td>
                        <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {s.scheduling_score?.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: AI SERVER PREDICTION PANEL (User Input Controls) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive AI Telemetry Prediction Panel</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Simulate Server Power &amp; Failure Risk with Machine Learning
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter simulated host metrics to test Random Forest regression power consumption and logistic failure models.
          </p>
        </div>

        {/* 6 User Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>CPU Utilization (%)</span>
              <span className="font-bold text-slate-900 dark:text-white">{predCpu}%</span>
            </div>
            <input
              type="number"
              min="5"
              max="100"
              step="1"
              value={predCpu}
              onChange={(e) => setPredCpu(Number(e.target.value))}
              id="input-pred-cpu"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Memory Utilization (%)</span>
              <span className="font-bold text-slate-900 dark:text-white">{predMemory}%</span>
            </div>
            <input
              type="number"
              min="10"
              max="100"
              step="1"
              value={predMemory}
              onChange={(e) => setPredMemory(Number(e.target.value))}
              id="input-pred-memory"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Active Virtual Machines</span>
              <span className="font-bold text-slate-900 dark:text-white">{predVms}</span>
            </div>
            <input
              type="number"
              min="1"
              max="20"
              step="1"
              value={predVms}
              onChange={(e) => setPredVms(Number(e.target.value))}
              id="input-pred-vms"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Workload Intensity (0.05 - 1.0)</span>
              <span className="font-bold text-slate-900 dark:text-white">{predWorkload.toFixed(2)}</span>
            </div>
            <input
              type="number"
              min="0.05"
              max="1.0"
              step="0.05"
              value={predWorkload}
              onChange={(e) => setPredWorkload(Number(e.target.value))}
              id="input-pred-workload"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Server Temperature (&deg;C)</span>
              <span className="font-bold text-slate-900 dark:text-white">{predTemp}&deg;C</span>
            </div>
            <input
              type="number"
              min="30"
              max="80"
              step="1"
              value={predTemp}
              onChange={(e) => setPredTemp(Number(e.target.value))}
              id="input-pred-temperature"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Carbon Intensity (gCO₂/kWh)</span>
              <span className="font-bold text-slate-900 dark:text-white">{predCarbon} g</span>
            </div>
            <input
              type="number"
              min="400"
              max="1000"
              step="10"
              value={predCarbon}
              onChange={(e) => setPredCarbon(Number(e.target.value))}
              id="input-pred-carbon"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleRunPrediction}
          disabled={isPredicting}
          id="btn-run-prediction"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
        >
          {isPredicting ? 'Computing Random Forest Inference...' : '🚀 Run AI Prediction'}
        </button>

        {/* Prediction Results Card */}
        {predictionResult && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 animate-fadeIn">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              AI Prediction Output
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Predicted Power</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">
                  {predictionResult.predictedPower.toFixed(1)} W
                </span>
              </div>

              <div className="rounded-lg bg-white p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Failure Risk</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  {(predictionResult.failureProbability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="rounded-lg bg-white p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Carbon Level</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">
                  {predCarbon} g
                </span>
              </div>

              <div className="rounded-lg bg-white p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Scheduling Score</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {predictionResult.schedulingScore.toFixed(3)}
                </span>
              </div>
            </div>

            <div
              className={`mt-3 rounded-lg p-3 text-xs flex items-start gap-2 ${
                predictionResult.recommendation === 'suitable'
                  ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : predictionResult.recommendation === 'moderate'
                  ? 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold capitalize">
                  {predictionResult.recommendation}: {predictionResult.recommendationText}
                </span>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Calculated carbon-aware scheduling score is {predictionResult.schedulingScore.toFixed(3)}.
                </p>
              </div>
            </div>
          </div>
        )}
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
          onClick={() => onNavigate('servers')}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <span>Explore 20-Server Telemetry</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
