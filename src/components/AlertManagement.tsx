import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { AlertTriangle, CheckCircle, Trash2, Search, X, AlertCircle } from 'lucide-react';
import {
  getActiveAlerts,
  acknowledgeAlert,
  deleteAlert,
  getActiveAlertCount,
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
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [hotlistedPersons, setHotlistedPersons] = useState<HealthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'hotlist'>('alerts');

  // Modal states
  const [showHotlistModal, setShowHotlistModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState<FormData>({
    personCode: '',
    isHotlisted: false,
    reason: '',
  });

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 AlertManagement mounted');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📊 Loading alert data...');
      setLoading(true);
      setError(null);
      
      // Load all data - don't let one failure stop the others
      const alertsResult = await getActiveAlerts().catch(err => {
        console.error('❌ Failed to load alerts:', err);
        setError('Failed to load alerts. You may have been logged out.');
        return [];
      });
      
      const hotlistedResult = await getAllHotlistedPersons().catch(err => {
        console.error('❌ Failed to load hotlisted persons:', err);
        return [];
      });
      
      const countResult = await getActiveAlertCount().catch(err => {
        console.error('❌ Failed to load alert count:', err);
        return 0;
      });

      console.log('✅ Alert data loaded successfully:', {
        alertsCount: alertsResult.length,
        hotlistedCount: hotlistedResult.length,
        activeCount: countResult,
      });
      
      setAlerts(alertsResult);
      setHotlistedPersons(hotlistedResult);
      setActiveAlertCount(countResult);
    } catch (err) {
      console.error('❌ Error loading alert data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      console.log('⏳ Acknowledging alert:', alertId);
      setError(null);
      await acknowledgeAlert(alertId);
      console.log('✅ Alert acknowledged');
      setSuccess('Alert acknowledged successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error acknowledging alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting alert:', alertId);
      setError(null);
      await deleteAlert(alertId);
      console.log('✅ Alert deleted');
      setSuccess('Alert deleted successfully');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error deleting alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete alert');
    }
  };

  const handleUpdateHotlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personCode) {
      setError('Please enter a person code');
      return;
    }

    try {
      setError(null);
      await updateHotlistStatus(formData.personCode, formData.isHotlisted, formData.reason);
      setSuccess(
        `Person ${formData.isHotlisted ? 'added to' : 'removed from'} hotlist successfully`
      );
      setShowHotlistModal(false);
      setFormData({ personCode: '', isHotlisted: false, reason: '' });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hotlist status');
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    (alert.alertType?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (alert.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const filteredHotlistedPersons = hotlistedPersons.filter(person =>
    person.personCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Alert & Hotlist Management">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Alert & Hotlist Management</h1>
            <p className="text-slate-600 mt-1">Monitor and manage alerts and hotlisted persons</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHotlistModal(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              <AlertTriangle size={20} />
              Manage Hotlist
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Success</h3>
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Active Alerts
              </p>
              <p className="text-3xl font-black text-red-600">{activeAlertCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Total Alerts
              </p>
              <p className="text-3xl font-black text-blue-600">{alerts.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Hotlisted Persons
              </p>
              <p className="text-3xl font-black text-orange-600">{hotlistedPersons.length}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'alerts'
                ? 'text-blue-600 border-b-blue-600'
                : 'text-slate-600 border-b-transparent hover:text-slate-900'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('hotlist')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'hotlist'
                ? 'text-blue-600 border-b-blue-600'
                : 'text-slate-600 border-b-transparent hover:text-slate-900'
            }`}
          >
            Hotlist ({hotlistedPersons.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'alerts' ? (
          /* Alerts Tab */
          filteredAlerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
              <p className="text-slate-600 text-lg">No alerts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Person Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Alert Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Created
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {alert.personId ? `Person #${alert.personId}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{alert.alertType}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{alert.description || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            alert.acknowledgedAt
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {alert.acknowledgedAt ? (
                            <>
                              <CheckCircle size={14} />
                              Acknowledged
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={14} />
                              Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {!alert.acknowledgedAt && alert.id && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id!)}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors mr-3"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.id && (
                          <button
                            onClick={() => handleDeleteAlert(alert.id!)}
                            className="text-red-600 hover:text-red-700 font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        {alert.acknowledgedAt && !alert.id && (
                          <span className="text-slate-400 text-sm">Acknowledged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Hotlist Tab */
          filteredHotlistedPersons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <AlertTriangle className="mx-auto mb-3 text-slate-400" size={32} />
              <p className="text-slate-600 text-lg">No hotlisted persons found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotlistedPersons.map((person) => (
                <div
                  key={person.id}
                  className="bg-white rounded-lg shadow-md border-l-4 border-l-red-600 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{person.personCode}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Status: <span className="font-semibold text-red-600">Hotlisted</span>
                        </p>
                      </div>
                      <AlertTriangle size={24} className="text-red-600" />
                    </div>

                    {person.reason && (
                      <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-slate-600 mb-1 font-medium">REASON:</p>
                        <p className="text-sm text-slate-900">{person.reason}</p>
                      </div>
                    )}

                    <div className="text-xs text-slate-500 space-y-1">
                      {person.createdAt && (
                        <p>Added: {new Date(person.createdAt).toLocaleString()}</p>
                      )}
                      {person.updatedAt && (
                        <p>Updated: {new Date(person.updatedAt).toLocaleString()}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setFormData({
                            personCode: person.personCode,
                            isHotlisted: false,
                            reason: '',
                          });
                          setShowHotlistModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors text-sm"
                      >
                        <Trash2 size={16} />
                        Remove from Hotlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Hotlist Modal */}
      {showHotlistModal && (
        <Modal
          title={
            formData.isHotlisted ? 'Add to Hotlist' : 'Manage Hotlist Status'
          }
          onClose={() => {
            setShowHotlistModal(false);
            setFormData({ personCode: '', isHotlisted: false, reason: '' });
          }}
          onSubmit={handleUpdateHotlist}
        >
          <form onSubmit={handleUpdateHotlist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Person Code *</label>
              <input
                type="text"
                required
                value={formData.personCode}
                onChange={(e) => setFormData({ ...formData, personCode: e.target.value })}
                placeholder="e.g., WRK-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Action</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isHotlisted: true })}
                  className={`w-full p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                    formData.isHotlisted
                      ? 'bg-red-100 border-red-600 text-red-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-red-300'
                  }`}
                >
                  Add to Hotlist
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isHotlisted: false })}
                  className={`w-full p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                    !formData.isHotlisted
                      ? 'bg-green-100 border-green-600 text-green-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-green-300'
                  }`}
                >
                  Remove from Hotlist
                </button>
              </div>
            </div>

            {formData.isHotlisted && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter the reason for hotlisting..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowHotlistModal(false);
                  setFormData({ personCode: '', isHotlisted: false, reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors font-medium ${
                  formData.isHotlisted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {formData.isHotlisted ? 'Add to Hotlist' : 'Remove from Hotlist'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}        </div>
      </div>
    </div>
  );
};

export default AlertManagement;
