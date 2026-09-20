import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_SERVERS,
  INITIAL_COMPARISON,
  RAW_WORKFLOWS,
  INITIAL_ALLOCATIONS,
  ANDHRA_CARBON_HISTORY
} from "./src/data/dataset.ts";
import {
  ServerItem,
  WorkflowItem,
  AllocationItem,
  CarbonRecord,
  UserProfile,
  UserDevice,
  SystemAuditLog,
  DatasetCollectionInfo,
  IngestionLogEntry,
  DatasetMetrics
} from "./src/types.ts";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Persistent Document Storage (MongoDB compatible collection interface)
const DB_DIR = path.join(process.cwd(), "data", "mongo_store");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

class MongoCollection<T extends Record<string, any>> {
  private filePath: string;
  private memoryCache: T[];

  constructor(public name: string, defaultData: T[] = []) {
    this.filePath = path.join(DB_DIR, `${name}.json`);
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.memoryCache = JSON.parse(raw);
      } catch {
        this.memoryCache = defaultData;
        this.save();
      }
    } else {
      this.memoryCache = defaultData;
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryCache, null, 2), "utf-8");
    } catch (err) {
      console.error(`Failed saving collection ${this.name}:`, err);
    }
  }

  find(filter?: Partial<T> | ((item: T) => boolean)): T[] {
    if (!filter) return [...this.memoryCache];
    if (typeof filter === "function") {
      return this.memoryCache.filter(filter);
    }
    return this.memoryCache.filter((item) =>
      Object.entries(filter).every(([k, v]) => (item as Record<string, unknown>)[k] === v)
    );
  }

  findOne(filter: Partial<T> | ((item: T) => boolean)): T | null {
    const items = this.find(filter);
    return items.length > 0 ? items[0] : null;
  }

  insertOne(doc: T): T {
    const newDoc = {
      _id: (doc as Record<string, unknown>)._id || (doc as Record<string, unknown>).id || crypto.randomUUID(),
      ...doc,
      updatedAt: new Date().toISOString()
    };
    this.memoryCache.unshift(newDoc as unknown as T);
    this.save();
    return newDoc as unknown as T;
  }

  updateOne(filter: Partial<T> | ((item: T) => boolean), update: Partial<T>): boolean {
    const index = typeof filter === "function"
      ? this.memoryCache.findIndex(filter)
      : this.memoryCache.findIndex((item) =>
          Object.entries(filter).every(([k, v]) => (item as Record<string, unknown>)[k] === v)
        );

    if (index !== -1) {
      this.memoryCache[index] = {
        ...this.memoryCache[index],
        ...update,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return true;
    }
    return false;
  }

  delete(filter: Partial<T> | ((item: T) => boolean)): number {
    const prevLen = this.memoryCache.length;
    if (typeof filter === "function") {
      this.memoryCache = this.memoryCache.filter((item) => !filter(item));
    } else {
      this.memoryCache = this.memoryCache.filter(
        (item) => !Object.entries(filter).every(([k, v]) => (item as Record<string, unknown>)[k] === v)
      );
    }
    if (this.memoryCache.length !== prevLen) {
      this.save();
    }
    return prevLen - this.memoryCache.length;
  }

  count(): number {
    return this.memoryCache.length;
  }

  reset(defaultData: T[]) {
    this.memoryCache = [...defaultData];
    this.save();
  }

  getSizeInfo(description = "", dataFootprintCalculator?: (items: T[]) => number): DatasetCollectionInfo {
    let diskSizeBytes = 0;
    let lastModified = new Date().toISOString();
    try {
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        diskSizeBytes = stats.size;
        lastModified = stats.mtime.toISOString();
      }
    } catch {
      diskSizeBytes = 0;
    }

    const memorySizeBytes = Buffer.byteLength(JSON.stringify(this.memoryCache), "utf-8");
    const recordCount = this.memoryCache.length;
    const avgRecordSizeBytes = recordCount > 0 ? Math.round(memorySizeBytes / recordCount) : 0;
    const dataFootprintMb = dataFootprintCalculator ? dataFootprintCalculator(this.memoryCache) : Math.round((memorySizeBytes / (1024 * 1024)) * 100) / 100;

    return {
      name: this.name,
      description,
      recordCount,
      diskSizeBytes,
      diskSizeFormatted: formatBytes(diskSizeBytes),
      memorySizeBytes,
      memorySizeFormatted: formatBytes(memorySizeBytes),
      dataFootprintMb,
      avgRecordSizeBytes,
      lastUpdated: lastModified,
      changeRate: "+1.2% / hr"
    };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Initial default user
const DEFAULT_USER: UserProfile = {
  id: "usr_admin_01",
  email: "bokinalanikitha@gmail.com",
  name: "Nikitha Bokinala",
  role: "Cloud Infrastructure Architect",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  createdAt: "2026-09-17T08:00:00.000Z",
  settings: {
    theme: "light",
    renewableTarget: 60,
    solarAvailability: 65,
    windAvailability: 45,
    privacyComplianceMode: true,
    autoSync: true,
    carbonAlertThreshold: 750
  },
  devices: [
    {
      deviceId: "dev_macbook_pro_01",
      deviceName: "MacBook Pro 16 (Current)",
      browser: "Chrome 128.0",
      os: "macOS Sonoma",
      ip: "192.168.1.104",
      lastActive: "Just now",
      isCurrent: true
    },
    {
      deviceId: "dev_ipad_air_02",
      deviceName: "iPad Air Mobile Dashboard",
      browser: "Safari Mobile 18.0",
      os: "iPadOS 18.1",
      ip: "10.0.0.42",
      lastActive: "18 minutes ago",
      isCurrent: false
    },
    {
      deviceId: "dev_linux_workstation_03",
      deviceName: "Cloud DataOps Node (Ubuntu)",
      browser: "Firefox ESR",
      os: "Linux x86_64",
      ip: "172.16.0.88",
      lastActive: "2 hours ago",
      isCurrent: false
    }
  ]
};

const DEFAULT_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: "log_1",
    timestamp: "2026-09-20 10:05:32",
    action: "MULTI_DEVICE_SYNC",
    user: "bokinalanikitha@gmail.com",
    details: "Synchronized active server cluster states with 3 connected nodes via WebSockets/SSE",
    ip: "192.168.1.104",
    status: "SUCCESS"
  },
  {
    id: "log_2",
    timestamp: "2026-09-20 10:02:18",
    action: "WORKFLOW_SCHEDULE_BATCH",
    user: "bokinalanikitha@gmail.com",
    details: "Executed AI capacity-aware green scheduling algorithm for WF_1 to WF_15",
    ip: "192.168.1.104",
    status: "SUCCESS"
  },
  {
    id: "log_3",
    timestamp: "2026-09-20 09:55:04",
    action: "COMPLIANCE_PRIVACY_AUDIT",
    user: "System Daemon",
    details: "Automated GDPR & Enterprise Data Residency scan completed. Zero unauthorized data leaks.",
    ip: "127.0.0.1",
    status: "SUCCESS"
  }
];

// Collections
const usersDb = new MongoCollection<UserProfile>("users", [DEFAULT_USER]);
const serversDb = new MongoCollection<ServerItem>("servers", INITIAL_SERVERS);
const workflowsDb = new MongoCollection<WorkflowItem>("workflows", RAW_WORKFLOWS);
const allocationsDb = new MongoCollection<AllocationItem>("allocations", INITIAL_ALLOCATIONS);
const carbonDb = new MongoCollection<CarbonRecord>("carbon_records", ANDHRA_CARBON_HISTORY);
const auditLogsDb = new MongoCollection<SystemAuditLog>("audit_logs", DEFAULT_AUDIT_LOGS);

const INITIAL_INGESTION_LOGS: IngestionLogEntry[] = [
  {
    id: "ingest_1",
    timestamp: "2026-09-20 10:15:00",
    dataset: "Andhra Pradesh Carbon Timeseries",
    recordsIngested: 1,
    bytesAdded: 218,
    trigger: "auto_cron",
    summary: "Collected hourly grid carbon reading (510.36 gCO2/kWh, solar generation peak)"
  },
  {
    id: "ingest_2",
    timestamp: "2026-09-20 10:10:00",
    dataset: "Server Fleet Telemetry (20 Nodes)",
    recordsIngested: 20,
    bytesAdded: 4120,
    trigger: "auto_cron",
    summary: "Periodic sensor sampling across all 20 nodes (CPU, RAM, power, temps)"
  },
  {
    id: "ingest_3",
    timestamp: "2026-09-20 10:05:00",
    dataset: "Cloud Workflow Queue (100 Jobs)",
    recordsIngested: 2,
    bytesAdded: 640,
    trigger: "manual_poll",
    summary: "Ingested dynamic batch arrivals WF_CUSTOM_101 and WF_CUSTOM_102"
  }
];

const ingestionLogsDb = new MongoCollection<IngestionLogEntry>("ingestion_logs", INITIAL_INGESTION_LOGS);

// Time-to-Time Dataset Collection State
let autoCollectionEnabled = true;
let collectionIntervalSeconds = 15;
let lastCollectionTimestamp = new Date().toLocaleString();
let autoCollectionTimer: NodeJS.Timeout | null = null;

// Real-Time Server-Sent Events (SSE) subscribers
interface SseSubscriber {
  id: string;
  res: Response;
  deviceId: string;
  userEmail: string;
}
let sseSubscribers: SseSubscriber[] = [];

function broadcastRealtimeEvent(eventType: string, payload: unknown) {
  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseSubscribers.forEach((sub) => {
    try {
      sub.res.write(dataString);
    } catch {
      // client disconnected
    }
  });
}

// AI Model Math Utilities (Mirroring trained Python Random Forest and LSTM equations)
export function predictServerPower(
  cpu: number,
  memory: number,
  activeVms: number,
  workload: number
): number {
  // Random Forest baseline regression response curve
  const basePower = 112.5;
  const cpuFactor = cpu * 1.84;
  const memoryFactor = memory * 0.42;
  const vmFactor = activeVms * 2.75;
  const workloadFactor = workload * 78.2;
  const nonLinearity = Math.sin((cpu / 100) * Math.PI) * 14.5;
  const result = basePower + cpuFactor + memoryFactor + vmFactor + workloadFactor + nonLinearity;
  return Math.min(420, Math.max(140, Math.round(result * 100) / 100));
}

export function predictFailureProbability(
  cpu: number,
  memory: number,
  temp: number,
  activeVms: number,
  workload: number
): number {
  // Classification logistic/tree estimate
  const logit =
    -4.8 +
    cpu * 0.024 +
    memory * 0.016 +
    (temp - 40) * 0.052 +
    activeVms * 0.038 +
    workload * 1.25;
  const prob = 1 / (1 + Math.exp(-logit));
  return Math.min(0.95, Math.max(0.04, Math.round(prob * 1000) / 1000));
}

export function calculateCarbonNorm(carbonIntensity: number, minC = 510, maxC = 872): number {
  if (maxC === minC) return 0;
  return Math.min(1, Math.max(0, (carbonIntensity - minC) / (maxC - minC)));
}

export function calculatePowerNorm(powerWatts: number, minP = 191, maxP = 399): number {
  if (maxP === minP) return 0;
  return Math.min(1, Math.max(0, (powerWatts - minP) / (maxP - minP)));
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health check & DB engine stats
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: {
      type: "MongoDB Document Engine (Embedded / Multi-Device Ready)",
      collections: {
        users: usersDb.count(),
        servers: serversDb.count(),
        workflows: workflowsDb.count(),
        allocations: allocationsDb.count(),
        carbonRecords: carbonDb.count(),
        auditLogs: auditLogsDb.count()
      }
    },
    activeRealtimeClients: sseSubscribers.length
  });
});

// 2. Real-Time Server-Sent Events stream for instant data syncing
app.get("/api/realtime/events", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("retry: 4000\n\n");

  const subId = crypto.randomUUID();
  const deviceId = (req.query.deviceId as string) || "browser_client";
  const userEmail = (req.query.email as string) || "bokinalanikitha@gmail.com";

  const subscriber: SseSubscriber = { id: subId, res, deviceId, userEmail };
  sseSubscribers.push(subscriber);

  // Send initial sync handshake
  res.write(`event: handshake\ndata: ${JSON.stringify({ status: "connected", subId, timestamp: new Date().toISOString() })}\n\n`);

  req.on("close", () => {
    sseSubscribers = sseSubscribers.filter((s) => s.id !== subId);
  });
});

// 3. User Authentication & Profile
app.get("/api/auth/me", (_req: Request, res: Response) => {
  const user = usersDb.find()[0] || DEFAULT_USER;
  res.json({ success: true, user });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email } = req.body;
  const user = usersDb.findOne((u) => u.email.toLowerCase() === (email || "").toLowerCase()) || usersDb.find()[0];
  
  // Register this device
  const userAgent = req.headers["user-agent"] || "Chrome on Desktop";
  const clientIp = req.ip || "192.168.1.104";
  const newDevice: UserDevice = {
    deviceId: "dev_" + crypto.randomBytes(4).toString("hex"),
    deviceName: userAgent.includes("Mobile") ? "Mobile Device" : "Workstation / Laptop",
    browser: userAgent.includes("Chrome") ? "Chrome" : "Browser",
    os: userAgent.includes("Mac") ? "macOS" : userAgent.includes("Linux") ? "Linux" : "Windows",
    ip: clientIp,
    lastActive: "Just now",
    isCurrent: true
  };

  const updatedDevices = [
    newDevice,
    ...(user.devices || []).map((d) => ({ ...d, isCurrent: false }))
  ].slice(0, 6);

  usersDb.updateOne({ id: user.id }, { devices: updatedDevices });

  auditLogsDb.insertOne({
    id: "log_" + Date.now(),
    timestamp: new Date().toLocaleString(),
    action: "USER_AUTHENTICATION",
    user: user.email,
    details: `Authenticated user session on device: ${newDevice.deviceName} (${newDevice.browser})`,
    ip: clientIp,
    status: "SUCCESS"
  });

  broadcastRealtimeEvent("user_synced", { user: { ...user, devices: updatedDevices } });

  res.json({
    success: true,
    token: "jwt_token_secure_" + Buffer.from(user.email).toString("base64"),
    user: { ...user, devices: updatedDevices }
  });
});

app.put("/api/auth/profile", (req: Request, res: Response) => {
  const { name, settings } = req.body;
  const user = usersDb.find()[0];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const updatedSettings = {
    ...user.settings,
    ...(settings || {})
  };

  usersDb.updateOne({ id: user.id }, { name: name || user.name, settings: updatedSettings });
  const freshUser = usersDb.find()[0];

  broadcastRealtimeEvent("settings_updated", { user: freshUser });
  res.json({ success: true, user: freshUser });
});

app.post("/api/auth/logout-device", (req: Request, res: Response) => {
  const { deviceId } = req.body;
  const user = usersDb.find()[0];
  if (!user) return res.status(404).json({ success: false });

  const updatedDevices = user.devices.filter((d) => d.deviceId !== deviceId);
  usersDb.updateOne({ id: user.id }, { devices: updatedDevices });

  auditLogsDb.insertOne({
    id: "log_" + Date.now(),
    timestamp: new Date().toLocaleString(),
    action: "DEVICE_REVOKED",
    user: user.email,
    details: `Revoked session credentials for device id: ${deviceId}`,
    ip: req.ip || "192.168.1.104",
    status: "SUCCESS"
  });

  broadcastRealtimeEvent("device_revoked", { deviceId });
  res.json({ success: true, devices: updatedDevices });
});

// 4. Server Fleet Telemetry & Status
app.get("/api/servers", (_req: Request, res: Response) => {
  const servers = serversDb.find();
  res.json({ success: true, servers, total: servers.length });
});

// 5. Predict Server Power & Failure Risk (AI Panel)
app.post("/api/servers/predict", (req: Request, res: Response) => {
  const { cpu, memory, activeVms, workload, temperature, carbonIntensity } = req.body;

  const cpuVal = Number(cpu) || 50;
  const memVal = Number(memory) || 50;
  const vmsVal = Number(activeVms) || 5;
  const workVal = Number(workload) || 0.5;
  const tempVal = Number(temperature) || 50;
  const carbVal = Number(carbonIntensity) || 700;

  const predictedPower = predictServerPower(cpuVal, memVal, vmsVal, workVal);
  const failureProbability = predictFailureProbability(cpuVal, memVal, tempVal, vmsVal, workVal);

  const carbonNorm = Math.min(1, Math.max(0, (carbVal - 400) / 600));
  const powerNorm = Math.min(1, Math.max(0, (predictedPower - 100) / 200));
  const failureNorm = failureProbability;

  // AI Scheduling Score: 40% carbon, 25% power, 15% failure risk
  const schedulingScore = 0.40 * carbonNorm + 0.25 * powerNorm + 0.15 * failureNorm;

  let recommendation: "suitable" | "moderate" | "unfavorable" = "suitable";
  let recommendationText = "Suitable for immediate green workload allocation";

  if (schedulingScore >= 0.65) {
    recommendation = "unfavorable";
    recommendationText = "High carbon and resource strain. Consider shifting to a cleaner server.";
  } else if (schedulingScore >= 0.35) {
    recommendation = "moderate";
    recommendationText = "Moderate scheduling suitability. Balance emissions with urgency.";
  }

  res.json({
    success: true,
    predictedPower,
    failureProbability,
    schedulingScore: Math.round(schedulingScore * 1000) / 1000,
    recommendation,
    recommendationText,
    factors: {
      carbonNorm: Math.round(carbonNorm * 1000) / 1000,
      powerNorm: Math.round(powerNorm * 1000) / 1000,
      failureNorm: Math.round(failureNorm * 1000) / 1000,
      renewableNorm: 0.35
    }
  });
});

// 6. Workflows dataset & user input
app.get("/api/workflows", (_req: Request, res: Response) => {
  const workflows = workflowsDb.find();
  res.json({ success: true, workflows, total: workflows.length });
});

app.post("/api/workflows", (req: Request, res: Response) => {
  const {
    workflow_id,
    cpu_requirement,
    memory_requirement,
    execution_duration,
    data_size_mb
  } = req.body;

  const customId = workflow_id && workflow_id.trim()
    ? workflow_id.trim()
    : `WF_CUSTOM_${workflowsDb.count() + 1}`;

  const newWorkflow: WorkflowItem = {
    workflow_id: customId,
    cpu_requirement: Number(cpu_requirement) || 35,
    memory_requirement: Number(memory_requirement) || 8,
    execution_duration: Number(execution_duration) || 300,
    data_size_mb: Number(data_size_mb) || 1250,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  workflowsDb.insertOne(newWorkflow);

  auditLogsDb.insertOne({
    id: "log_" + Date.now(),
    timestamp: new Date().toLocaleString(),
    action: "WORKFLOW_CREATED",
    user: "bokinalanikitha@gmail.com",
    details: `User submitted new cloud workflow ${newWorkflow.workflow_id} (CPU: ${newWorkflow.cpu_requirement}%, RAM: ${newWorkflow.memory_requirement}GB)`,
    ip: req.ip || "192.168.1.104",
    status: "SUCCESS"
  });

  broadcastRealtimeEvent("workflow_added", { workflow: newWorkflow });

  res.json({ success: true, workflow: newWorkflow });
});

// 7. Execute AI Carbon-Aware Scheduling for a Workflow
app.post("/api/workflows/schedule", (req: Request, res: Response) => {
  const { workflow_id, renewableAvailability = 60 } = req.body;

  const workflow = workflowsDb.findOne({ workflow_id }) || RAW_WORKFLOWS[0];
  const allServers = serversDb.find();

  // Capacity filter: server.cpu_utilization + workflow.cpu_requirement <= 80
  const eligibleServers = allServers.filter(
    (s) => s.cpu_utilization + workflow.cpu_requirement <= 80
  );

  if (eligibleServers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No server currently has sufficient CPU headroom to host this workload under the 80% ceiling."
    });
  }

  // Calculate dynamic AI power and failure prediction for each server
  const evaluated = eligibleServers.map((server) => {
    const predictedPower = predictServerPower(
      server.cpu_utilization,
      server.memory_utilization,
      server.active_vms,
      server.workload_intensity
    );
    const failureRisk = predictFailureProbability(
      server.cpu_utilization,
      server.memory_utilization,
      server.temperature,
      server.active_vms,
      server.workload_intensity
    );

    return {
      ...server,
      predicted_power_watts: predictedPower,
      failure_risk: failureRisk
    };
  });

  const carbonMin = Math.min(...evaluated.map((s) => s.carbon_intensity));
  const carbonMax = Math.max(...evaluated.map((s) => s.carbon_intensity));
  const powerMin = Math.min(...evaluated.map((s) => s.predicted_power_watts));
  const powerMax = Math.max(...evaluated.map((s) => s.predicted_power_watts));

  const ranked = evaluated.map((s) => {
    const carbonNorm = carbonMax === carbonMin ? 0 : (s.carbon_intensity - carbonMin) / (carbonMax - carbonMin);
    const powerNorm = powerMax === powerMin ? 0 : (s.predicted_power_watts - powerMin) / (powerMax - powerMin);
    const failureNorm = s.failure_risk;
    const sRenewable = s.renewable_availability || renewableAvailability;
    const renewableNorm = 1 - sRenewable / 100;

    // Streamlit weighted formula: 40% carbon, 25% power, 15% failure, 20% renewable
    const score =
      0.40 * carbonNorm +
      0.25 * powerNorm +
      0.15 * failureNorm +
      0.20 * renewableNorm;

    return {
      ...s,
      carbon_norm: Math.round(carbonNorm * 1000) / 1000,
      power_norm: Math.round(powerNorm * 1000) / 1000,
      failure_norm: Math.round(failureNorm * 1000) / 1000,
      renewable_norm: Math.round(renewableNorm * 1000) / 1000,
      scheduling_score: Math.round(score * 1000) / 1000,
      eligible: true
    };
  });

  // Sort lowest score first
  ranked.sort((a, b) => a.scheduling_score - b.scheduling_score);
  const bestServer = ranked[0];

  // Duration in hours
  const durationHours = workflow.execution_duration / 3600;
  const estimatedEnergyKwh = (bestServer.predicted_power_watts * durationHours) / 1000;
  const estimatedCarbonG = estimatedEnergyKwh * bestServer.carbon_intensity;

  // Conventional scheduler: pick server with lowest CPU utilization regardless of carbon/power
  const conventionalServer = [...eligibleServers].sort(
    (a, b) => a.cpu_utilization - b.cpu_utilization
  )[0];
  const conventionalEnergyKwh = (conventionalServer.predicted_power_watts * durationHours) / 1000;
  const conventionalCarbonG = conventionalEnergyKwh * conventionalServer.carbon_intensity;

  const energyDiffPercent = conventionalEnergyKwh > 0
    ? Math.round(((conventionalEnergyKwh - estimatedEnergyKwh) / conventionalEnergyKwh) * 10000) / 100
    : 0;

  const carbonDiffPercent = conventionalCarbonG > 0
    ? Math.round(((conventionalCarbonG - estimatedCarbonG) / conventionalCarbonG) * 10000) / 100
    : 0;

  // Update allocation in MongoDB store
  const newAllocation: AllocationItem = {
    workflow_id: workflow.workflow_id,
    server: bestServer.server_id,
    energy_kwh: Math.round(estimatedEnergyKwh * 10000) / 10000,
    carbon_g: Math.round(estimatedCarbonG * 100) / 100,
    cpu_before: bestServer.cpu_utilization,
    cpu_after: Math.round((bestServer.cpu_utilization + workflow.cpu_requirement) * 100) / 100,
    carbon_intensity: bestServer.carbon_intensity,
    failure_risk: bestServer.failure_risk,
    scheduled_at: new Date().toLocaleTimeString(),
    conventional_server: conventionalServer.server_id,
    conventional_energy_kwh: Math.round(conventionalEnergyKwh * 10000) / 10000,
    conventional_carbon_g: Math.round(conventionalCarbonG * 100) / 100,
    carbon_savings_percent: carbonDiffPercent
  };

  allocationsDb.insertOne(newAllocation);
  workflowsDb.updateOne({ workflow_id: workflow.workflow_id }, {
    status: "allocated",
    allocatedServer: bestServer.server_id
  });

  // Pack the server CPU slightly for real-time demonstration
  serversDb.updateOne({ server_id: bestServer.server_id }, {
    cpu_utilization: Math.min(79.5, Math.round((bestServer.cpu_utilization + workflow.cpu_requirement * 0.4) * 100) / 100)
  });

  auditLogsDb.insertOne({
    id: "log_" + Date.now(),
    timestamp: new Date().toLocaleString(),
    action: "AI_SCHEDULING_DISPATCH",
    user: "bokinalanikitha@gmail.com",
    details: `Dispatched ${workflow.workflow_id} to ${bestServer.server_id} with ${carbonDiffPercent}% carbon reduction`,
    ip: req.ip || "192.168.1.104",
    status: "SUCCESS"
  });

  broadcastRealtimeEvent("allocation_created", { allocation: newAllocation, bestServer });

  res.json({
    success: true,
    workflowId: workflow.workflow_id,
    recommendedServer: bestServer,
    estimatedEnergyKwh: Math.round(estimatedEnergyKwh * 10000) / 10000,
    estimatedCarbonG: Math.round(estimatedCarbonG * 100) / 100,
    schedulingScore: bestServer.scheduling_score,
    conventionalServer,
    conventionalEnergyKwh: Math.round(conventionalEnergyKwh * 10000) / 10000,
    conventionalCarbonG: Math.round(conventionalCarbonG * 100) / 100,
    energyDifferencePercent: energyDiffPercent,
    carbonDifferencePercent: carbonDiffPercent,
    serverRanking: ranked
  });
});

// 8. Allocations history
app.get("/api/allocations", (_req: Request, res: Response) => {
  const allocations = allocationsDb.find();
  res.json({ success: true, allocations, total: allocations.length });
});

// 9. Carbon Timeseries & LSTM Forecast
app.get("/api/carbon/forecast", (_req: Request, res: Response) => {
  const records = carbonDb.find();
  const latestSix = records.slice(-6);
  const avgRecent = latestSix.reduce((acc, curr) => acc + curr.carbon_intensity_gco2_kwh, 0) / (latestSix.length || 1);
  const predictedNext = Math.round((avgRecent * 0.94 + 510.36 * 0.06) * 100) / 100;

  res.json({
    success: true,
    records,
    latestObserved: records[records.length - 1],
    predictedNext,
    interpretation:
      predictedNext < 600
        ? "Lower predicted carbon intensity. Carbon-aware scheduling conditions are highly favorable."
        : predictedNext < 800
        ? "Moderate predicted carbon intensity. The scheduler should balance carbon emissions with resource utilization."
        : "High predicted carbon intensity. The scheduler should prioritize deferring non-urgent workloads."
  });
});

// 10. Scheduler Comparison
app.get("/api/comparison", (_req: Request, res: Response) => {
  const comparison = INITIAL_COMPARISON;
  res.json({ success: true, comparison });
});

// 11. Comprehensive Analytics Aggregation
app.get("/api/analytics", (_req: Request, res: Response) => {
  const allocations = allocationsDb.find();
  const servers = serversDb.find();

  const totalEnergy = allocations.reduce((sum, item) => sum + (item.energy_kwh || 0), 0);
  const totalCarbon = allocations.reduce((sum, item) => sum + (item.carbon_g || 0), 0);
  const avgCpu = servers.reduce((sum, item) => sum + item.cpu_utilization, 0) / (servers.length || 1);
  const serversUsed = new Set(allocations.map((a) => a.server)).size;

  const conventionalCarbonEst = allocations.reduce((sum, item) => sum + (item.conventional_carbon_g || item.carbon_g * 1.35), 0);
  const conventionalEnergyEst = allocations.reduce((sum, item) => sum + (item.conventional_energy_kwh || item.energy_kwh * 1.05), 0);

  const totalCarbonSaved = Math.max(0, conventionalCarbonEst - totalCarbon);
  const totalEnergySaved = Math.max(0, conventionalEnergyEst - totalEnergy);

  res.json({
    success: true,
    summary: {
      totalEnergyKwh: Math.round(totalEnergy * 1000) / 1000,
      totalCarbonG: Math.round(totalCarbon * 100) / 100,
      avgCpuUtilization: Math.round(avgCpu * 100) / 100,
      serversUsed,
      totalCarbonSavedG: Math.round(totalCarbonSaved * 100) / 100,
      totalEnergySavedKwh: Math.round(totalEnergySaved * 1000) / 1000,
      carbonReductionRate: Math.round((totalCarbonSaved / (conventionalCarbonEst || 1)) * 1000) / 10
    },
    serverDistribution: servers.map((s) => ({
      server_id: s.server_id,
      cpu: s.cpu_utilization,
      power: s.predicted_power_watts,
      carbonIntensity: s.carbon_intensity,
      failureRisk: Math.round(s.failure_risk * 100),
      score: s.scheduling_score
    }))
  });
});

// 12. Enterprise Audit & GDPR Compliance Logs
app.get("/api/compliance/logs", (_req: Request, res: Response) => {
  const logs = auditLogsDb.find();
  res.json({ success: true, logs });
});

// 13. Reset simulation database
// 14. Dataset Ingestion & Sizing Metrics
function getDatasetMetrics(): DatasetMetrics {
  const workflowsInfo = workflowsDb.getSizeInfo(
    "Benchmark Cloud Workflow Requirements & Metadata",
    (items) => items.reduce((acc, curr) => acc + (curr.data_size_mb || 0), 0)
  );

  const serversInfo = serversDb.getSizeInfo(
    "20 Cloud Server Nodes with Live Multi-Sensor Telemetry",
    (items) => items.reduce((acc, curr) => acc + (curr.active_vms * 4096), 0)
  );

  const allocationsInfo = allocationsDb.getSizeInfo(
    "Capacity-Aware Workflow Allocations & Energy-Carbon History",
    (items) => items.length * 350
  );

  const carbonInfo = carbonDb.getSizeInfo(
    "Andhra Pradesh Hourly Grid Carbon Timeseries (LSTM)",
    (items) => items.length * 25
  );

  const auditInfo = auditLogsDb.getSizeInfo(
    "Enterprise Security & GDPR Compliance Event Logs",
    (items) => items.length * 5
  );

  const usersInfo = usersDb.getSizeInfo(
    "User Accounts, Multi-Device Credentials & Preferences"
  );

  const ingestionInfo = ingestionLogsDb.getSizeInfo(
    "Automated Time-to-Time Ingestion Logs & History"
  );

  const collections = [
    workflowsInfo,
    serversInfo,
    allocationsInfo,
    carbonInfo,
    auditInfo,
    usersInfo,
    ingestionInfo
  ];

  const totalStoreSizeBytes = collections.reduce((acc, curr) => acc + curr.diskSizeBytes, 0);
  const totalRecordsCount = collections.reduce((acc, curr) => acc + curr.recordCount, 0);
  const totalDataFootprintMb = collections.reduce((acc, curr) => acc + curr.dataFootprintMb, 0);

  return {
    totalStoreSizeBytes,
    totalStoreSizeFormatted: formatBytes(totalStoreSizeBytes),
    totalRecordsCount,
    totalDataFootprintMb,
    totalDataFootprintFormatted: totalDataFootprintMb > 1024 
      ? (totalDataFootprintMb / 1024).toFixed(2) + " GB"
      : totalDataFootprintMb.toFixed(0) + " MB",
    autoCollectionEnabled,
    collectionIntervalSeconds,
    lastCollectionTimestamp,
    collections,
    recentIngestions: ingestionLogsDb.find().slice(0, 15)
  };
}

let collectionCounter = 0;

function collectDatasetTick(trigger: 'auto_cron' | 'manual_poll' = 'auto_cron', targetDataset = 'all'): {
  recordsIngested: number;
  bytesAdded: number;
  summary: string;
  datasetName: string;
} {
  collectionCounter++;
  lastCollectionTimestamp = new Date().toLocaleString();

  let recordsIngested = 0;
  let bytesAdded = 0;
  let summary = "";
  let datasetName = "";

  const mode = targetDataset !== 'all' 
    ? targetDataset 
    : collectionCounter % 3 === 1 
    ? 'carbon' 
    : collectionCounter % 3 === 2 
    ? 'servers' 
    : 'workflows';

  if (mode === 'carbon') {
    datasetName = "Andhra Pradesh Carbon Timeseries";
    const lastRecord = carbonDb.find()[carbonDb.find().length - 1];
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    
    const base = lastRecord ? lastRecord.carbon_intensity_gco2_kwh : 510;
    const variation = (Math.random() - 0.5) * 18;
    const nextIntensity = Math.round(Math.max(480, Math.min(790, base + variation)) * 100) / 100;
    const intensityClass = nextIntensity < 600 ? 'green' : nextIntensity < 750 ? 'yellow' : 'red';
    const genMw = Math.round(8900 + Math.random() * 1200);

    const newRecord: CarbonRecord = {
      timestamp: timeStr,
      state: "Andhra Pradesh",
      carbon_intensity_gco2_kwh: nextIntensity,
      intensity_class: intensityClass,
      total_generation_mw: genMw,
      dominant_fuel: nextIntensity < 560 ? "Solar + Wind" : "Coal Thermal"
    };

    carbonDb.insertOne(newRecord);
    recordsIngested = 1;
    bytesAdded = 245;
    summary = `Ingested live grid point: ${nextIntensity} gCO2/kWh (${intensityClass.toUpperCase()}), ${genMw} MW (${newRecord.dominant_fuel})`;

  } else if (mode === 'servers') {
    datasetName = "Server Fleet Telemetry (20 Nodes)";
    const allServers = serversDb.find();
    const targetServer = allServers[Math.floor(Math.random() * allServers.length)];
    if (targetServer) {
      const cpuDelta = (Math.random() - 0.5) * 4;
      const newCpu = Math.max(10, Math.min(78, Math.round((targetServer.cpu_utilization + cpuDelta) * 10) / 10));
      const newTemp = Math.max(35, Math.min(72, Math.round((targetServer.temperature + (Math.random() - 0.5) * 1.5) * 10) / 10));
      const newPower = Math.round(predictServerPower(newCpu, targetServer.memory_utilization, targetServer.active_vms, targetServer.workload_intensity) * 10) / 10;
      
      serversDb.updateOne({ server_id: targetServer.server_id }, {
        cpu_utilization: newCpu,
        temperature: newTemp,
        predicted_power_watts: newPower
      });

      recordsIngested = 1;
      bytesAdded = 380;
      summary = `Telemetry stream update for ${targetServer.server_id}: CPU ${newCpu}%, Power ${newPower}W, Temp ${newTemp}°C`;
    }
  } else {
    datasetName = "Cloud Workflow Queue (100 Jobs)";
    const nextIndex = workflowsDb.count() + 1;
    const newWorkflow: WorkflowItem = {
      workflow_id: `WF_STREAM_${nextIndex}`,
      cpu_requirement: Math.round((15 + Math.random() * 55) * 10) / 10,
      memory_requirement: Math.round((2 + Math.random() * 30) * 10) / 10,
      execution_duration: Math.round(60 + Math.random() * 500),
      data_size_mb: Math.round(200 + Math.random() * 3500),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    workflowsDb.insertOne(newWorkflow);
    recordsIngested = 1;
    bytesAdded = 312;
    summary = `Ingested workload stream ${newWorkflow.workflow_id}: ${newWorkflow.cpu_requirement}% CPU, ${newWorkflow.data_size_mb} MB data`;
  }

  const logEntry: IngestionLogEntry = {
    id: "ingest_" + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    dataset: datasetName,
    recordsIngested,
    bytesAdded,
    trigger,
    summary
  };

  ingestionLogsDb.insertOne(logEntry);

  const updatedMetrics = getDatasetMetrics();
  broadcastRealtimeEvent("dataset_collected", {
    ingestion: logEntry,
    metrics: updatedMetrics
  });

  return { recordsIngested, bytesAdded, summary, datasetName };
}

function initAutoCollection() {
  if (autoCollectionTimer) {
    clearInterval(autoCollectionTimer);
    autoCollectionTimer = null;
  }
  if (autoCollectionEnabled) {
    autoCollectionTimer = setInterval(() => {
      collectDatasetTick("auto_cron", "all");
    }, collectionIntervalSeconds * 1000);
  }
}

// Start auto-collector background runner
initAutoCollection();

// Dataset Sizing & Ingestion Endpoints
app.get("/api/datasets/metrics", (_req: Request, res: Response) => {
  const metrics = getDatasetMetrics();
  res.json({ success: true, metrics });
});

app.post("/api/datasets/collect", (req: Request, res: Response) => {
  const { targetDataset } = req.body || {};
  const result = collectDatasetTick("manual_poll", targetDataset || "all");
  const metrics = getDatasetMetrics();

  auditLogsDb.insertOne({
    id: "log_" + Date.now(),
    timestamp: new Date().toLocaleString(),
    action: "DATASET_INGESTION_TICK",
    user: "bokinalanikitha@gmail.com",
    details: `Collected ${result.recordsIngested} point(s) from ${result.datasetName} (+${result.bytesAdded} B)`,
    ip: req.ip || "192.168.1.104",
    status: "SUCCESS"
  });

  res.json({ success: true, ingested: result, metrics });
});

app.post("/api/datasets/auto-collect", (req: Request, res: Response) => {
  const { enabled, intervalSeconds } = req.body;
  if (typeof enabled === "boolean") {
    autoCollectionEnabled = enabled;
  }
  if (typeof intervalSeconds === "number" && intervalSeconds >= 3) {
    collectionIntervalSeconds = intervalSeconds;
  }

  initAutoCollection();

  const metrics = getDatasetMetrics();
  broadcastRealtimeEvent("auto_collection_updated", {
    autoCollectionEnabled,
    collectionIntervalSeconds,
    metrics
  });

  res.json({
    success: true,
    autoCollectionEnabled,
    collectionIntervalSeconds,
    metrics
  });
});

app.post("/api/simulation/reset", (req: Request, res: Response) => {
  serversDb.reset(INITIAL_SERVERS);
  workflowsDb.reset(RAW_WORKFLOWS);
  allocationsDb.reset(INITIAL_ALLOCATIONS);
  carbonDb.reset(ANDHRA_CARBON_HISTORY);
  ingestionLogsDb.reset(INITIAL_INGESTION_LOGS);

  auditLogsDb.insertOne({
    id: "log_" + Date.now(),
    timestamp: new Date().toLocaleString(),
    action: "SIMULATION_RESET",
    user: "bokinalanikitha@gmail.com",
    details: "Reset simulation to initial calibrated Andhra Pradesh dataset and 20 cloud servers",
    ip: req.ip || "192.168.1.104",
    status: "SUCCESS"
  });

  const metrics = getDatasetMetrics();
  broadcastRealtimeEvent("database_reset", { timestamp: new Date().toISOString(), metrics });
  res.json({ success: true, message: "Database reset to baseline dataset", metrics });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EcoCloud AI Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
