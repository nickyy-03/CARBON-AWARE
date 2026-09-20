export interface ServerItem {
  server_id: string;
  cpu_utilization: number;
  memory_utilization: number;
  active_vms: number;
  workload_intensity: number;
  temperature: number;
  carbon_intensity: number;
  predicted_power_watts: number;
  failure_risk: number;
  carbon_norm?: number;
  power_norm?: number;
  failure_norm?: number;
  renewable_availability?: number;
  scheduling_score?: number;
}

export interface WorkflowItem {
  workflow_id: string;
  cpu_requirement: number;
  memory_requirement: number;
  execution_duration: number;
  data_size_mb: number;
  userId?: string;
  createdAt?: string;
  status?: 'pending' | 'allocated' | 'running' | 'completed';
  allocatedServer?: string;
}

export interface AllocationItem {
  workflow_id: string;
  server: string;
  energy_kwh: number;
  carbon_g: number;
  cpu_before: number;
  cpu_after: number;
  carbon_intensity: number;
  failure_risk: number;
  scheduled_at?: string;
  conventional_server?: string;
  conventional_energy_kwh?: number;
  conventional_carbon_g?: number;
  carbon_savings_percent?: number;
}

export interface CarbonRecord {
  timestamp: string;
  state: string;
  carbon_intensity_gco2_kwh: number;
  intensity_class: 'green' | 'yellow' | 'red';
  total_generation_mw: number;
  dominant_fuel: string;
  isForecast?: boolean;
}

export interface SchedulerComparison {
  metric: string;
  conventional: number;
  aiScheduler: number;
  unit: string;
  savings?: string;
}

export interface UserDevice {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isCurrent?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  createdAt: string;
  settings: {
    theme: 'light' | 'dark' | 'system';
    renewableTarget: number;
    solarAvailability: number;
    windAvailability: number;
    privacyComplianceMode: boolean;
    autoSync: boolean;
    carbonAlertThreshold: number;
  };
  devices: UserDevice[];
}

export interface PredictionResult {
  predictedPower: number;
  failureProbability: number;
  schedulingScore: number;
  recommendation: 'suitable' | 'moderate' | 'unfavorable';
  recommendationText: string;
  factors: {
    carbonNorm: number;
    powerNorm: number;
    failureNorm: number;
    renewableNorm: number;
  };
}

export interface SchedulingRecommendation {
  workflowId: string;
  recommendedServer: ServerItem;
  estimatedEnergyKwh: number;
  estimatedCarbonG: number;
  schedulingScore: number;
  conventionalServer: ServerItem;
  conventionalEnergyKwh: number;
  conventionalCarbonG: number;
  energyDifferencePercent: number;
  carbonDifferencePercent: number;
  serverRanking: (ServerItem & { score: number; eligible: boolean; rejectionReason?: string })[];
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  ip: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface DatasetCollectionInfo {
  name: string;
  description: string;
  recordCount: number;
  diskSizeBytes: number;
  diskSizeFormatted: string;
  memorySizeBytes: number;
  memorySizeFormatted: string;
  dataFootprintMb: number;
  avgRecordSizeBytes: number;
  lastUpdated: string;
  changeRate: string;
}

export interface IngestionLogEntry {
  id: string;
  timestamp: string;
  dataset: string;
  recordsIngested: number;
  bytesAdded: number;
  trigger: 'auto_cron' | 'manual_poll' | 'sse_event';
  summary: string;
}

export interface DatasetMetrics {
  totalStoreSizeBytes: number;
  totalStoreSizeFormatted: string;
  totalRecordsCount: number;
  totalDataFootprintMb: number;
  totalDataFootprintFormatted: string;
  autoCollectionEnabled: boolean;
  collectionIntervalSeconds: number;
  lastCollectionTimestamp: string;
  collections: DatasetCollectionInfo[];
  recentIngestions: IngestionLogEntry[];
}
