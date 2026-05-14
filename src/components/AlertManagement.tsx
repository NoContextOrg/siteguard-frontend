import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { Search, X } from 'lucide-react';
import {
  getActiveAlerts,
  acknowledgeAlert,
  deleteAlert,
  getAllHotlistedPersons,
  updateHotlistStatus,
  type AlertDTO,
  type HealthProfile,
} from '../api/alert';

interface FormData {
  personCode: string;
  isHotlisted: boolean;
  reason: string;
}

const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [hotlistedPersons, setHotlistedPersons] = useState<HealthProfile[]>([]);

  const lastAlertIdRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'hotlist'>('alerts');

  const [showHotlistModal, setShowHotlistModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
  
  const [actionLoading, setActionLoading] = useState<{ id: number, type: 'ack' | 'del' } | null>(null);
  const [isSubmittingHotlist, setIsSubmittingHotlist] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    personCode: '',
    isHotlisted: false,
    reason: '',
  });

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [alertsResult, hotlistResult] = await Promise.all([
        getActiveAlerts().catch(() => []),
        getAllHotlistedPersons().catch(() => []),
      ]);

      setAlerts(alertsResult || []);
      setHotlistedPersons(hotlistResult || []);
      if (alertsResult && alertsResult.length > 0) {
        lastAlertIdRef.current = alertsResult[0].id ?? null;
      }
    } catch {
      setError('Failed to load alert data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= LIVE WEBSOCKET UPDATES =================
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: number;
    const WS_BASE_URL = 'wss://siteguardph.duckdns.org/ws/alerts';

    const connectWebSocket = () => {
      ws = new WebSocket(WS_BASE_URL);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const latest = data.alert || data;
          
          if (latest && latest.id && lastAlertIdRef.current !== latest.id) {
            setAlerts(prev => {
              if (prev.some(a => a.id === latest.id)) return prev;
              return [latest, ...prev];
            });
            lastAlertIdRef.current = latest.id ?? null;
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };
      ws.onclose = () => { reconnectTimeout = window.setTimeout(connectWebSocket, 5000); };
    };
    connectWebSocket();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // ================= ACTIONS =================
  const handleAcknowledgeAlert = async (alertId?: number) => {
    if (!alertId) return;
    setActionLoading({ id: alertId, type: 'ack' });

    try {
      await acknowledgeAlert(alertId);
      setSuccess('Alert acknowledged successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError('Failed to acknowledge alert');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeleteAlert = async () => {
    if (!alertToDelete) return;
    setActionLoading({ id: alertToDelete, type: 'del' });

    try {
      await deleteAlert(alertToDelete);
      setSuccess('Alert deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError('Failed to delete alert');
    } finally {
      setActionLoading(null);
      setAlertToDelete(null);
    }
  };

  const handleUpdateHotlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingHotlist(true);

    try {
      await updateHotlistStatus(
        formData.personCode,
        formData.isHotlisted,
        formData.reason
      );

      setSuccess(
        `Person ${formData.isHotlisted ? 'added to' : 'removed from'} hotlist`
      );

      setShowHotlistModal(false);
      setFormData({ personCode: '', isHotlisted: false, reason: '' });

      await loadData();
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError('Failed to update hotlist');
    } finally {
      setIsSubmittingHotlist(false);
    }
  };

  // ================= SAFE FILTERING =================
  const filteredAlerts = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return alerts.filter(alert => {
      return (
        alert.alertType?.toLowerCase().includes(q) ||
        alert.alertMessage?.toLowerCase().includes(q) ||
        alert.personName?.toLowerCase().includes(q) ||
        alert.personCode?.toLowerCase().includes(q)
      );
    });
  }, [alerts, searchQuery]);

  const filteredHotlistedPersons = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return hotlistedPersons.filter(person =>
      person.personCode?.toLowerCase().includes(q)
    );
  }, [hotlistedPersons, searchQuery]);

  // ================= ROLE CHECK =================
const canManageHotlist = useMemo(() => {
  try {
    const rolesRaw = localStorage.getItem('userRoles');

    if (!rolesRaw) return false;

    const roles = JSON.parse(rolesRaw);

    const roleList = Array.isArray(roles) ? roles : [roles];

    return roleList.some((role: string) => {
      const r = String(role).toUpperCase();

      return (
        r === 'ADMIN' ||
        r === 'ROLE_ADMIN' ||
        r.includes('ADMIN') ||   // fallback safety
        r === 'NURSE' ||
        r === 'ROLE_NURSE' ||
        r.includes('NURSE')
      );
    });
  } catch {
    return false;
  }
}, []);

  // ================= UI =================
  return (
    <DashboardLayout title="Alert & Hotlist Management">
      <div className="p-4 md:p-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Alerts & Hotlist</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-lg">
              Hotlist status is a clinical risk flag used during login validation.
            </p>
          </div>

          {canManageHotlist && (
            <button
              onClick={() => setShowHotlistModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Manage Hotlist
            </button>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat label="Active Alerts" value={alerts.filter(a => !a.isAcknowledged).length} color="text-red-600" />
          <Stat label="Total Alerts" value={alerts.length} />
          <Stat label="Hotlisted Persons" value={hotlistedPersons.length} color="text-orange-500" />
        </div>

        {/* MESSAGES */}
        {success && (
          <Banner type="success" message={success} onClose={() => setSuccess(null)} />
        )}
        {error && (
          <Banner type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* TABS */}
        <div className="flex border-b mb-4">
          <Tab
            active={activeTab === 'alerts'}
            label={`Alerts (${alerts.length})`}
            onClick={() => setActiveTab('alerts')}
          />
          <Tab
            active={activeTab === 'hotlist'}
            label={`Hotlist (${hotlistedPersons.length})`}
            onClick={() => setActiveTab('hotlist')}
          />
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'alerts' ? 'Search alerts...' : 'Search hotlist...'}
            className="w-full pl-9 py-2 border rounded"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5">
              <X size={16} />
            </button>
          )}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-16">Loading...</div>
        ) : activeTab === 'alerts' ? (
          filteredAlerts.length === 0 ? (
            <Empty message="No alerts found" />
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map(alert => (
                <div key={alert.id ?? Math.random()} className="border p-3 rounded flex justify-between">
                  <div>
                    <div className="font-medium">{alert.personName ?? '—'}</div>
                    <div className="text-xs text-gray-400">{alert.personCode ?? '—'}</div>
                  </div>

                  <div className="flex gap-2">
                    {!alert.isAcknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        disabled={actionLoading?.id === alert.id}
                        className="text-blue-600 hover:text-blue-800 text-xs disabled:opacity-50 transition"
                      >
                    {actionLoading?.id === alert.id && actionLoading?.type === 'ack' ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    )}
                    <button
                      onClick={() => setAlertToDelete(alert.id!)}
                      disabled={actionLoading?.id === alert.id}
                      className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50 transition"
                    >
                  {actionLoading?.id === alert.id && actionLoading?.type === 'del' ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredHotlistedPersons.length === 0 ? (
          <Empty message="No hotlisted persons found" />
        ) : (
          <div className="space-y-2">
            {filteredHotlistedPersons.map(p => (
              <div key={p.id ?? p.personCode} className="border p-3 rounded">
                <div className="font-medium">{p.personCode}</div>
                <div className="text-sm text-gray-500">{p.reason ?? '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showHotlistModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleUpdateHotlist} className="bg-white p-6 rounded w-96 space-y-3">
            <input
              value={formData.personCode}
              onChange={e => setFormData({ ...formData, personCode: e.target.value })}
              placeholder="Person Code"
              className="w-full border p-2 rounded"
              required
            />

            <textarea
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason"
              className="w-full border p-2 rounded"
              required
            />

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowHotlistModal(false)} className="w-1/3 border py-2 rounded hover:bg-gray-50 disabled:opacity-50" disabled={isSubmittingHotlist}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmittingHotlist} className="bg-red-600 hover:bg-red-700 transition text-white w-2/3 py-2 rounded disabled:opacity-50">
                {isSubmittingHotlist ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Alert Confirmation Modal */}
      {alertToDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Alert</h3>
            <p className="text-gray-600 mb-6 text-sm">Are you sure you want to delete this alert? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setAlertToDelete(null)} disabled={actionLoading?.type === 'del'} className="flex-1 py-2 border rounded-md text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmDeleteAlert} disabled={actionLoading?.type === 'del'} className="flex-1 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {actionLoading?.type === 'del' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

/* ================= SMALL UI COMPONENTS ================= */

const Stat = ({ label, value, color = 'text-gray-800' }: any) => (
  <div className="p-4 border rounded bg-white">
    <div className="text-sm text-gray-500">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

const Tab = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 ${active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
  >
    {label}
  </button>
);

const Banner = ({ type, message, onClose }: any) => (
  <div className={`mb-4 p-3 rounded flex justify-between ${
    type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
  }`}>
    {message}
    <button onClick={onClose}><X size={14} /></button>
  </div>
);

const Empty = ({ message }: any) => (
  <div className="text-center py-16 text-gray-400">{message}</div>
);

export default AlertManagement;