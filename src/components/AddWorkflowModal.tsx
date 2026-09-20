import React, { useState } from 'react';
import { X, Sparkles, Cpu, HardDrive, Clock, Database, Check } from 'lucide-react';
import { WorkflowItem } from '../types';

interface AddWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workflowData: Partial<WorkflowItem>, runScheduleImmediately: boolean) => Promise<void>;
}

export const AddWorkflowModal: React.FC<AddWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [workflowId, setWorkflowId] = useState('');
  const [cpu, setCpu] = useState(38);
  const [memory, setMemory] = useState(8.5);
  const [duration, setDuration] = useState(240);
  const [dataSize, setDataSize] = useState(1800);
  const [scheduleNow, setScheduleNow] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'AI Model Inference',
      cpu: 45,
      memory: 12,
      duration: 180,
      dataSize: 2400
    },
    {
      name: 'Batch Data ETL',
      cpu: 65,
      memory: 16,
      duration: 480,
      dataSize: 4200
    },
    {
      name: 'Web Microservice API',
      cpu: 18,
      memory: 4,
      duration: 120,
      dataSize: 650
    },
    {
      name: 'Media Transcoding',
      cpu: 75,
      memory: 8,
      duration: 360,
      dataSize: 3100
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setCpu(p.cpu);
    setMemory(p.memory);
    setDuration(p.duration);
    setDataSize(p.dataSize);
    if (!workflowId) {
      setWorkflowId(`WF_${p.name.toUpperCase().replace(/\s+/g, '_')}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          workflow_id: workflowId || `WF_JOB_${Date.now().toString().slice(-4)}`,
          cpu_requirement: cpu,
          memory_requirement: memory,
          execution_duration: duration,
          data_size_mb: dataSize
        },
        scheduleNow
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 transition-colors"
        id="modal-add-workflow"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Create & Dispatch Cloud Workflow
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Input user parameters and persist to Node.js & MongoDB document store
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
            id="btn-close-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Presets */}
        <div className="my-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Quick Architecture Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="flex flex-col items-start rounded-xl border border-slate-200 p-2.5 text-left text-xs hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20 transition"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {p.cpu}% CPU · {p.memory}GB · {p.duration}s
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Workflow Tag / Custom Identifier
            </label>
            <input
              type="text"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              placeholder="e.g. WF_DATA_PIPELINE_01"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              id="input-workflow-id"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-emerald-500" /> CPU Req
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{cpu}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={cpu}
                onChange={(e) => setCpu(Number(e.target.value))}
                className="w-full accent-emerald-500"
                id="input-workflow-cpu"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-500" /> RAM Req
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{memory} GB</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="0.5"
                value={memory}
                onChange={(e) => setMemory(Number(e.target.value))}
                className="w-full accent-emerald-500"
                id="input-workflow-memory"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" /> Duration
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{duration} sec</span>
              </div>
              <input
                type="range"
                min="30"
                max="900"
                step="10"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-emerald-500"
                id="input-workflow-duration"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-emerald-500" /> Data Payload
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{dataSize} MB</span>
              </div>
              <input
                type="range"
                min="100"
                max="6000"
                step="100"
                value={dataSize}
                onChange={(e) => setDataSize(Number(e.target.value))}
                className="w-full accent-emerald-500"
                id="input-workflow-data"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleNow}
              onChange={(e) => setScheduleNow(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              Immediately execute AI Carbon-Aware dispatch & score ranking
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
              id="btn-submit-add-workflow"
            >
              {isSubmitting ? (
                'Storing in MongoDB...'
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save & Disperse
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
