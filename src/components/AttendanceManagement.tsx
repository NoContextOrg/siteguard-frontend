import { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, Search, X, Download } from 'lucide-react';
import {
  getAllAttendance,
  getTodaysSummary,
  getAttendanceStats,
  type AttendanceLog,
  type AttendanceSummary,
  type AttendanceStats,
} from '../api/attendance';
import DashboardLayout from './DashboardLayout';

const AttendanceManagement = () => {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [todaysSummary, setTodaysSummary] = useState<AttendanceSummary | null>(null);
  const [statsData, setStatsData] = useState<AttendanceStats | null>(null);

  // Modal states
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Form states
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Load data on component mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logs, summary, stats] = await Promise.all([
        getAllAttendance(),
        getTodaysSummary().catch(() => null),
        getAttendanceStats().catch(() => null),
      ]);

      setAttendanceLogs(logs);
      setTodaysSummary(summary);
      setStatsData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const stats = await getAttendanceStats(dateFrom || undefined, dateTo || undefined);
      setStatsData(stats);
      setSuccess('Statistics loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    }
  };

  const filteredLogs = attendanceLogs.filter(
    (log) =>
      log.personCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.personName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toUpperCase()) {
      case 'LOGIN':
        return <LogIn size={16} className="text-green-600" />;
      case 'LOGOUT':
        return <LogOut size={16} className="text-red-600" />;
      case 'OVERTIME':
        return <Clock size={16} className="text-orange-600" />;
      default:
        return null;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium';
    switch (eventType.toUpperCase()) {
      case 'LOGIN':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'LOGOUT':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'OVERTIME':
        return `${baseClasses} bg-orange-100 text-orange-700`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700`;
    }
  };

  return (
    <DashboardLayout title="Attendance Management">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
            <p className="text-slate-600 mt-1">
              Attendance logs are generated automatically by the biometric IoT hardware.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
              type="button"
            >
              <Download size={20} />
              View Stats
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
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800" type="button">
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
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800" type="button">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {todaysSummary && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Today's Date</p>
              <p className="text-2xl font-black text-slate-900">
                {new Date(todaysSummary.date).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Present Today</p>
              <p className="text-2xl font-black text-green-600">{todaysSummary.presentCount}</p>
              <p className="text-xs text-slate-500 mt-2">{todaysSummary.totalLogs} total logs</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <p className="text-lg font-bold text-blue-600">Active Monitoring</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by person name or code..."
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
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <LogIn className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-600 text-lg">No attendance logs found</p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Person Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Event Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.slice(0, 50).map((log) => (
                  <tr key={log.id ?? `${log.personCode}-${log.eventTimestamp}-${log.eventType}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{log.personCode}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className={getEventTypeBadge(log.eventType)}>
                        {getEventTypeIcon(log.eventType)}
                        {log.eventType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.eventTimestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {log.rawPayload ? (
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {log.rawPayload.substring(0, 50)}...
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length > 50 && (
              <div className="px-6 py-4 bg-slate-50 text-center text-sm text-slate-600">
                Showing 50 of {filteredLogs.length} logs
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics Modal */}
      {showStatsModal && (
        <Modal title="Attendance Statistics" onClose={() => setShowStatsModal(false)}>
          <form onSubmit={handleExportStats} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {statsData && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-bold">Total Logins</p>
                    <p className="text-2xl font-bold text-green-600">{statsData.totalLogins}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-bold">Total Logouts</p>
                    <p className="text-2xl font-bold text-red-600">{statsData.totalLogouts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-bold">Unique Persons</p>
                    <p className="text-2xl font-bold text-blue-600">{statsData.uniquePersons}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-bold">Total Logs</p>
                    <p className="text-2xl font-bold text-slate-600">{statsData.totalLogs}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Fetch Statistics
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
  children: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 transition-colors" type="button">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
