/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewModule } from './components/OverviewModule';
import { SchedulerModule } from './components/SchedulerModule';
import { ServersModule } from './components/ServersModule';
import { WorkflowsModule } from './components/WorkflowsModule';
import { CarbonForecastModule } from './components/CarbonForecastModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { AccountModule } from './components/AccountModule';
import { DatasetCollectorModule } from './components/DatasetCollectorModule';
import { AddWorkflowModal } from './components/AddWorkflowModal';
import {
  ServerItem,
  WorkflowItem,
  AllocationItem,
  CarbonRecord,
  SchedulerComparison,
  UserProfile,
  SystemAuditLog,
  SchedulingRecommendation,
  PredictionResult,
  DatasetMetrics
} from './types';
import {
  INITIAL_SERVERS,
  INITIAL_COMPARISON,
  RAW_WORKFLOWS,
  INITIAL_ALLOCATIONS,
  ANDHRA_CARBON_HISTORY
} from './data/dataset';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Main data states
  const [servers, setServers] = useState<ServerItem[]>(INITIAL_SERVERS);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(RAW_WORKFLOWS);
  const [allocations, setAllocations] = useState<AllocationItem[]>(INITIAL_ALLOCATIONS);
  const [carbonRecords, setCarbonRecords] = useState<CarbonRecord[]>(ANDHRA_CARBON_HISTORY);
  const [comparison, setComparison] = useState<SchedulerComparison[]>(INITIAL_COMPARISON);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [datasetMetrics, setDatasetMetrics] = useState<DatasetMetrics | null>(null);

  // Simulation & Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Renewable availability values
  const [solarAvail, setSolarAvail] = useState(65);
  const [windAvail, setWindAvail] = useState(45);
  const [renewTarget, setRenewTarget] = useState(60);

  const currentRenewable = Math.round((solarAvail * 0.7 + windAvail * 0.3) * 10) / 10;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load initial backend state from Express + MongoDB endpoints
  const fetchInitialData = useCallback(async () => {
    try {
      const [serversRes, workflowsRes, allocationsRes, carbonRes, compRes, userRes, logsRes, metricsRes] =
        await Promise.allSettled([
          fetch('/api/servers').then((r) => r.json()),
          fetch('/api/workflows').then((r) => r.json()),
          fetch('/api/allocations').then((r) => r.json()),
          fetch('/api/carbon/forecast').then((r) => r.json()),
          fetch('/api/comparison').then((r) => r.json()),
          fetch('/api/auth/me').then((r) => r.json()),
          fetch('/api/compliance/logs').then((r) => r.json()),
          fetch('/api/datasets/metrics').then((r) => r.json())
        ]);

      if (serversRes.status === 'fulfilled' && serversRes.value?.servers) {
        setServers(serversRes.value.servers);
      }
      if (workflowsRes.status === 'fulfilled' && workflowsRes.value?.workflows) {
        setWorkflows(workflowsRes.value.workflows);
      }
      if (allocationsRes.status === 'fulfilled' && allocationsRes.value?.allocations) {
        setAllocations(allocationsRes.value.allocations);
      }
      if (carbonRes.status === 'fulfilled' && carbonRes.value?.records) {
        setCarbonRecords(carbonRes.value.records);
      }
      if (compRes.status === 'fulfilled' && compRes.value?.comparison) {
        setComparison(compRes.value.comparison);
      }
      if (userRes.status === 'fulfilled' && userRes.value?.user) {
        setUser(userRes.value.user);
        if (userRes.value.user.settings?.renewableTarget) {
          setRenewTarget(userRes.value.user.settings.renewableTarget);
        }
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.logs) {
        setAuditLogs(logsRes.value.logs);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value?.metrics) {
        setDatasetMetrics(metricsRes.value.metrics);
      }
    } catch (err) {
      console.warn('Initial backend fetch fallback to local datasets:', err);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Connect to Server-Sent Events (SSE) for Real-Time Synchronization across devices
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/events?deviceId=dev_browser_session');

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      eventSource.addEventListener('handshake', () => {
        setIsRealtimeConnected(true);
      });

      eventSource.addEventListener('allocation_created', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.allocation) {
            setAllocations((prev) => [parsed.allocation, ...prev]);
            showToast(`Real-Time Sync: Workload ${parsed.allocation.workflow_id} allocated to ${parsed.allocation.server}`);
          }
          if (parsed?.bestServer) {
            setServers((prev) =>
              prev.map((s) => (s.server_id === parsed.bestServer.server_id ? parsed.bestServer : s))
            );
          }
        } catch {
          // ignore parse error
        }
      });

      eventSource.addEventListener('workflow_added', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.workflow) {
            setWorkflows((prev) => [parsed.workflow, ...prev.filter((w) => w.workflow_id !== parsed.workflow.workflow_id)]);
            showToast(`Real-Time Sync: New workflow ${parsed.workflow.workflow_id} added from another device.`);
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('dataset_collected', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.metrics) {
            setDatasetMetrics(parsed.metrics);
          }
          if (parsed?.ingestion) {
            showToast(`Time-to-Time Ingestion: +${parsed.ingestion.bytesAdded} B to ${parsed.ingestion.dataset}`);
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('auto_collection_updated', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.metrics) {
            setDatasetMetrics(parsed.metrics);
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('database_reset', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.metrics) {
            setDatasetMetrics(parsed.metrics);
          }
        } catch {
          // ignore
        }
        fetchInitialData();
        showToast('Real-Time Sync: Cluster state reset to baseline dataset.');
      });

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchInitialData, showToast]);

  // Handler: Add custom workflow from user input
  const handleAddWorkflow = async (workflowData: Partial<WorkflowItem>, runScheduleImmediately: boolean) => {
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });
      const data = await res.json();
      if (data.success && data.workflow) {
        setWorkflows((prev) => [data.workflow, ...prev]);
        showToast(`Workflow ${data.workflow.workflow_id} stored in MongoDB.`);

        if (runScheduleImmediately) {
          handleScheduleWorkflow(data.workflow.workflow_id, currentRenewable);
          setCurrentTab('scheduler');
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback local addition
      const localItem: WorkflowItem = {
        workflow_id: workflowData.workflow_id || `WF_JOB_${Date.now()}`,
        cpu_requirement: workflowData.cpu_requirement || 30,
        memory_requirement: workflowData.memory_requirement || 8,
        execution_duration: workflowData.execution_duration || 200,
        data_size_mb: workflowData.data_size_mb || 1000,
        status: 'pending'
      };
      setWorkflows((prev) => [localItem, ...prev]);
      showToast(`Workflow ${localItem.workflow_id} added.`);
    }
  };

  // Handler: AI Scheduling dispatch
  const handleScheduleWorkflow = async (
    workflowId: string,
    renewable: number
  ): Promise<SchedulingRecommendation> => {
    const res = await fetch('/api/workflows/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_id: workflowId, renewableAvailability: renewable })
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.message || 'Capacity ceiling exceeded');
    }

    const data: SchedulingRecommendation = await res.json();
    if (data.recommendedServer) {
      setServers((prev) =>
        prev.map((s) =>
          s.server_id === data.recommendedServer.server_id
            ? {
                ...s,
                cpu_utilization: Math.min(79.5, s.cpu_utilization + 5)
              }
            : s
        )
      );
    }
    showToast(`Dispatched ${workflowId} to ${data.recommendedServer.server_id} (-${data.carbonDifferencePercent}% CO₂)`);
    return data;
  };

  // Handler: Predict server telemetry (AI Prediction Panel)
  const handlePredictServer = async (params: {
    cpu: number;
    memory: number;
    activeVms: number;
    workload: number;
    temperature: number;
    carbonIntensity: number;
  }): Promise<PredictionResult> => {
    const res = await fetch('/api/servers/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  };

  // Handler: Update user preferences
  const handleUpdateSettings = async (newSettings: Partial<UserProfile['settings']>) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings })
    });
    const data = await res.json();
    if (data.success && data.user) {
      setUser(data.user);
      showToast('Settings synced across all devices.');
    }
  };

  // Handler: Revoke device session
  const handleRevokeDevice = async (deviceId: string) => {
    const res = await fetch('/api/auth/logout-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    const data = await res.json();
    if (data.success && user) {
      setUser({ ...user, devices: data.devices });
      showToast('Device session revoked.');
    }
  };

  // Handler: Manual collect data point from dataset
  const handleCollectNow = async (targetDataset: string) => {
    try {
      const res = await fetch('/api/datasets/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDataset })
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setDatasetMetrics(data.metrics);
        if (data.ingested) {
          showToast(`Collected from ${data.ingested.datasetName}: +${data.ingested.bytesAdded} B`);
        }
        if (data.ingested?.datasetName?.includes('Carbon')) {
          fetch('/api/carbon/forecast').then((r) => r.json()).then((d) => {
            if (d.records) setCarbonRecords(d.records);
          });
        }
        if (data.ingested?.datasetName?.includes('Server')) {
          fetch('/api/servers').then((r) => r.json()).then((d) => {
            if (d.servers) setServers(d.servers);
          });
        }
        if (data.ingested?.datasetName?.includes('Workflow')) {
          fetch('/api/workflows').then((r) => r.json()).then((d) => {
            if (d.workflows) setWorkflows(d.workflows);
          });
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error collecting data from dataset.');
    }
  };

  // Handler: Toggle auto-collection daemon
  const handleToggleAutoCollect = async (enabled: boolean, intervalSeconds?: number) => {
    try {
      const res = await fetch('/api/datasets/auto-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, intervalSeconds })
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setDatasetMetrics(data.metrics);
        showToast(
          enabled
            ? `Periodic data collection active (every ${data.collectionIntervalSeconds}s).`
            : 'Periodic data collection paused.'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Reset MongoDB simulation to baseline Andhra Pradesh dataset
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      if (res.ok) {
        await fetchInitialData();
        showToast('MongoDB database reset to baseline Andhra Pradesh dataset.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  const latestCarbon = carbonRecords[carbonRecords.length - 1]?.carbon_intensity_gco2_kwh || 510.36;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        liveCarbonIntensity={Math.round(latestCarbon * 10) / 10}
        isRealtimeConnected={isRealtimeConnected}
        datasetSizeFormatted={datasetMetrics?.totalStoreSizeFormatted || '486 KB'}
        isAutoCollecting={datasetMetrics?.autoCollectionEnabled ?? true}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {currentTab === 'overview' && (
          <OverviewModule
            servers={servers}
            allocations={allocations}
            comparison={comparison}
            user={user}
            datasetMetrics={datasetMetrics}
            onNavigate={setCurrentTab}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onResetDatabase={handleResetDatabase}
            isResetting={isResetting}
          />
        )}

        {currentTab === 'scheduler' && (
          <SchedulerModule
            workflows={workflows}
            servers={servers}
            onScheduleWorkflow={handleScheduleWorkflow}
            onPredictServer={handlePredictServer}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onNavigate={setCurrentTab}
            renewableAvailability={currentRenewable}
          />
        )}

        {currentTab === 'servers' && (
          <ServersModule
            servers={servers}
            onNavigate={setCurrentTab}
            onSelectServerForScheduling={() => setCurrentTab('scheduler')}
          />
        )}

        {currentTab === 'workflows' && (
          <WorkflowsModule
            workflows={workflows}
            allocations={allocations}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onSelectWorkflowToSchedule={() => setCurrentTab('scheduler')}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'carbon' && (
          <CarbonForecastModule
            carbonRecords={carbonRecords}
            solarAvailability={solarAvail}
            windAvailability={windAvail}
            renewableTarget={renewTarget}
            onUpdateRenewableSettings={(s, w, t) => {
              setSolarAvail(s);
              setWindAvail(w);
              setRenewTarget(t);
            }}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsModule
            comparison={comparison}
            servers={servers}
            allocations={allocations}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'datasets' && (
          <DatasetCollectorModule
            metrics={datasetMetrics}
            onCollectNow={handleCollectNow}
            onToggleAutoCollect={handleToggleAutoCollect}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'account' && (
          <AccountModule
            user={user}
            onUpdateSettings={handleUpdateSettings}
            onRevokeDevice={handleRevokeDevice}
            auditLogs={auditLogs}
          />
        )}
      </main>

      {/* User Input Add Workflow Modal */}
      <AddWorkflowModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddWorkflow}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-slate-800 dark:bg-emerald-600 animate-slideUp">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Application Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-6 text-xs text-slate-500 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 gap-3">
          <p>
            &copy; 2026 EcoCloud AI · AI-Driven Carbon-Aware Workflow Scheduling &amp; Resource Optimization
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Node.js + MongoDB API
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Andhra Pradesh Calibrated Dataset
            </span>
            <span>GDPR / SOC2 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
