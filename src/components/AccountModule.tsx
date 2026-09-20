import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  Lock,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Sliders,
  UserCheck
} from 'lucide-react';
import { UserProfile, UserDevice, SystemAuditLog } from '../types';

interface AccountModuleProps {
  user: UserProfile | null;
  onUpdateSettings: (settings: Partial<UserProfile['settings']>) => Promise<void>;
  onRevokeDevice: (deviceId: string) => Promise<void>;
  auditLogs: SystemAuditLog[];
}

export const AccountModule: React.FC<AccountModuleProps> = ({
  user,
  onUpdateSettings,
  onRevokeDevice,
  auditLogs
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleCompliance = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await onUpdateSettings({
        privacyComplianceMode: !user.settings.privacyComplianceMode
      });
      setSuccessMsg('Privacy compliance mode updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAutoSync = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await onUpdateSettings({
        autoSync: !user.settings.autoSync
      });
      setSuccessMsg('Real-time sync preference updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ecocloud_compliance_audit_logs.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Account Management &amp; Multi-Device Sync Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seamless data persistence in Node.js &amp; MongoDB, low-latency live synchronization, and strict enterprise privacy standards.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <Download className="h-4 w-4 text-emerald-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt="Avatar"
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Nikitha Bokinala'}
                </h3>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified Owner
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email || 'bokinalanikitha@gmail.com'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                Role: {user?.role || 'Cloud Infrastructure Architect'}
              </p>
            </div>
          </div>

          {/* Database status tag */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Backend Store</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Node.js + MongoDB Collection Engine
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Encrypted persistence in <code>data/mongo_store/*.json</code>
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Device Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Active Linked Devices ({user?.devices?.length || 3})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time synchronization across desktop, mobile, and edge infrastructure instances.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(user?.devices || []).map((device: UserDevice) => (
            <div
              key={device.deviceId}
              className={`rounded-xl border p-4 transition ${
                device.isCurrent
                  ? 'border-emerald-500 bg-emerald-50/20 dark:border-emerald-500/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-slate-200/70 p-2 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {device.os.toLowerCase().includes('mac') || device.os.toLowerCase().includes('windows') || device.os.toLowerCase().includes('linux') ? (
                      <Laptop className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {device.deviceName}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {device.browser} · {device.os}
                    </span>
                  </div>
                </div>

                {!device.isCurrent && (
                  <button
                    onClick={() => onRevokeDevice(device.deviceId)}
                    className="text-slate-400 hover:text-rose-500 transition p-1"
                    title="Revoke session credentials"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>IP: {device.ip}</span>
                {device.isCurrent ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Current
                  </span>
                ) : (
                  <span>Last active: {device.lastActive}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security, Privacy & Enterprise Compliance Settings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
          Privacy, Compliance &amp; Sync Architecture
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Engineered for strict GDPR, SOC2 compliance, zero telemetry leaks, and low-latency API communication.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Enterprise Privacy &amp; Data Residency Mode
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Strips user identifiers from external ML telemetry payloads and enforces local encryption.
              </p>
            </div>
            <button
              onClick={handleToggleCompliance}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                user?.settings.privacyComplianceMode ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  user?.settings.privacyComplianceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Real-Time Server-Sent Events (SSE) Auto-Sync
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pushes scheduling events and live carbon telemetry to all active devices in sub-50ms latency.
              </p>
            </div>
            <button
              onClick={handleToggleAutoSync}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                user?.settings.autoSync ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  user?.settings.autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise Audit Log Viewer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
          System Security &amp; Compliance Audit Logs
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Immutable logging of user dispatches, device authentication, and telemetry modifications.
        </p>

        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Event</th>
                <th className="p-2.5">User</th>
                <th className="p-2.5">Details</th>
                <th className="p-2.5">IP</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                  <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{log.user}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300">{log.details}</td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-500">{log.ip}</td>
                  <td className="p-2.5">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
