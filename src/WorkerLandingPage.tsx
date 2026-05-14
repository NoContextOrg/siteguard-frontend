import React, { useState, useEffect } from 'react';
import WorkerProfileContent from './WorkerProfileContent';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons, getAvatarUrl, getFallbackAvatar } from './api/person';
import { authenticatedFetch } from './api/fetch';
import { getUnifiedDashboard, type UnifiedAnalyticsResponse } from './api/analytics';
import {
  getWorkerAttendanceTrends,
  exportWorkerExcel,
  makeDefaultDashboardTimeFilter,
  makeExportFilename,
  type DashboardTimeFilterState,
} from './api/analytics';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';


const API_BASE_URL = 'https://siteguardph.duckdns.org/api';

const FILTER_STORAGE_KEY = 'siteguard.dashboard.timeFilter';

const WorkerLandingPage: React.FC = () => {
  const auth = useAuth();

  const personCode = auth.userEmail || '';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  
  const [fallbackId, setFallbackId] = useState<number | null>(null);
  
  const workerId = auth.userId || fallbackId;
  
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [workerDetails, setWorkerDetails] = useState<any>(null);
  const [unifiedData, setUnifiedData] = useState<UnifiedAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilterState>(() => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : makeDefaultDashboardTimeFilter();
    } catch {
      return makeDefaultDashboardTimeFilter();
    }
  });
  const [customStart, setCustomStart] = useState(timeFilter.start || '');
  const [customEnd, setCustomEnd] = useState(timeFilter.end || '');

  const effectiveFilter: DashboardTimeFilterState =
    timeFilter.key === 'CUSTOM'
      ? { key: 'CUSTOM', start: customStart || undefined, end: customEnd || undefined }
      : timeFilter;

  const [workerTrend, setWorkerTrend] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!personCode) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let currentCode = auth.personCode;
        let currentId = auth.userId;
        let pData = null;
        
        // Fallback: If not in auth context, fetch real person details using email
        if (!currentCode || !currentId) {
          const allPersons = await getAllPersons();
          const personData = allPersons.find(p => p.email === personCode);
          
          if (personData) {
            currentId = personData.id;
            currentCode = (personData as any).personCode;
            setFallbackId(currentId);
            pData = personData;
          } else {
            throw new Error('Worker profile not found.');
          }
        } else {
          try {
            const res = await authenticatedFetch(`${API_BASE_URL}/persons/${currentId}`);
            if (res.ok) {
              const json = await res.json();
              pData = json.data || json;
            }
          } catch (e) {}
        }
        setWorkerDetails(pData);
        
        if (activeTab === 'dashboard' && currentCode) {
          const [summaryRes, logsRes, unified] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/attendance/person/${currentCode}/summary`),
            authenticatedFetch(`${API_BASE_URL}/attendance/person/${currentCode}`),
            getUnifiedDashboard()
          ]);
          
          const summary = summaryRes.ok ? await summaryRes.json() : null;
          const logs = logsRes.ok ? await logsRes.json() : [];
          
          setAttendanceSummary(summary);
          setAttendanceLogs(Array.isArray(logs) ? logs : []);
          setUnifiedData(unified);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [personCode, activeTab, auth.personCode, auth.userId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(timeFilter));
    } catch {}
  }, [timeFilter]);

  useEffect(() => {
    if (!personCode) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await getWorkerAttendanceTrends(personCode, effectiveFilter);
        if (!cancelled) setWorkerTrend(t);
      } catch (e) {
        console.error('Failed to load worker trends', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personCode, effectiveFilter.start, effectiveFilter.end, effectiveFilter.key]);

  // Keep existing attendanceSummary/logs fetch, but reload on filter when possible
  useEffect(() => {
    if (!personCode) return;
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    if (effectiveFilter.key === 'CUSTOM') {
      if (effectiveFilter.start) qs.set('from', effectiveFilter.start);
      if (effectiveFilter.end) qs.set('to', effectiveFilter.end);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : '';

    Promise.all([
      authenticatedFetch(`${API_BASE_URL}/attendance/person/${personCode}/summary`).then(r => r.json()),
      authenticatedFetch(`${API_BASE_URL}/attendance/person/${personCode}${effectiveFilter.key === 'CUSTOM' ? '/range' : ''}${effectiveFilter.key === 'CUSTOM' ? suffix : ''}`).then(r => r.json()),
    ])
      .then(([summary, logs]) => {
        setAttendanceSummary(summary);
        setAttendanceLogs(Array.isArray(logs) ? logs : []);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [personCode, effectiveFilter.start, effectiveFilter.end, effectiveFilter.key]);

  const handleWorkerExport = async () => {
    if (!personCode) return;
    try {
      setExporting(true);
      await exportWorkerExcel({
        personCode,
        filter: effectiveFilter.key === 'CUSTOM' ? undefined : (effectiveFilter.key === '7_DAYS' ? '1_WEEK' : effectiveFilter.key),
        startDate: effectiveFilter.key === 'CUSTOM' ? effectiveFilter.start : undefined,
        endDate: effectiveFilter.key === 'CUSTOM' ? effectiveFilter.end : undefined,
        filename: makeExportFilename('worker-trends', effectiveFilter),
      });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="Worker Dashboard">
      <div className="flex min-h-screen">
        {/* Sidebar with tabs and filter */}
        <aside className="w-64 bg-white border-r border-slate-200 py-8 px-4 flex flex-col gap-2">
          <div className="flex flex-col items-center mb-8 px-2">
            <div className="w-24 h-24 rounded-full border-4 border-slate-100 overflow-hidden mb-3 bg-slate-50 flex items-center justify-center">
              <img src={getAvatarUrl(workerDetails?.name || auth.userEmail, workerDetails?.profilePictureUrl)} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = getFallbackAvatar(workerDetails?.name || auth.userEmail); }} />
            </div>
            <div className="text-sm font-black text-slate-800 text-center break-words">{workerDetails?.name || auth.userEmail}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{workerDetails?.role || 'WORKER'}</div>
          </div>

          <button
            className={`text-left px-4 py-3 rounded-lg font-bold text-base mb-2 ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`text-left px-4 py-3 rounded-lg font-bold text-base ${activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>

          <div className="mt-6">
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Time Filter</div>
            <div className="flex flex-wrap gap-2">
              {([
                { k: '3_HOURS', label: '3H' },
                { k: '6_HOURS', label: '6H' },
                { k: '12_HOURS', label: '12H' },
                { k: '24_HOURS', label: '24H' },
                { k: '7_DAYS', label: '7D' },
                { k: 'CUSTOM', label: 'Custom' },
              ] as const).map((opt) => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setTimeFilter({ key: opt.k as any, start: timeFilter.start, end: timeFilter.end })}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition ${timeFilter.key === opt.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {timeFilter.key === 'CUSTOM' && (
              <div className="mt-2 space-y-2">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Start Date"
                    value={customStart ? dayjs(customStart) : null}
                    onChange={(newValue) => setCustomStart(newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={customEnd ? dayjs(customEnd) : null}
                    onChange={(newValue) => setCustomEnd(newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </div>
            )}

            <button
              type="button"
              disabled={exporting}
              onClick={handleWorkerExport}
              className="mt-4 w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[12px] disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export My Report'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-8">My Dashboard</h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
              ) : (
                <>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4">Site Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Onsite Today</div>
                      <div className="text-4xl font-black text-slate-800">{unifiedData?.dashboardOverview?.onsitePersonsToday ?? '—'}</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Site Attendance Rate</div>
                      <div className="text-4xl font-black text-blue-600">{unifiedData?.overallAttendanceOverview?.attendanceRate?.toFixed(1) ?? '—'}%</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Active Alerts</div>
                      <div className="text-4xl font-black text-red-500">{unifiedData?.alertsOverview?.totalActive ?? '—'}</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4">My Attendance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Days Present</div>
                      <div className="text-4xl font-black text-blue-600">{attendanceSummary?.totalDaysPresent ?? '—'}</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Overtime</div>
                      <div className="text-4xl font-black text-green-600">{attendanceSummary?.totalOvertime ?? '—'}</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Absences</div>
                      <div className="text-4xl font-black text-red-500">{attendanceSummary?.absences ?? '—'}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Attendance Logs</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                          <tr>
                            <th className="px-6 py-4 border-r border-slate-100">Date</th>
                            <th className="px-6 py-4 border-r border-slate-100">Type</th>
                            <th className="px-6 py-4">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                          {attendanceLogs.slice(0, 10).map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="px-6 py-4">{log.date || log.timestamp?.split('T')[0]}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-sm ${
                                  log.type?.toUpperCase() === 'LOGIN' ? 'text-green-600 bg-green-50' :
                                  log.type?.toUpperCase() === 'LOGOUT' ? 'text-red-600 bg-red-50' :
                                  log.type?.toUpperCase() === 'OVERTIME' ? 'text-orange-600 bg-orange-50' :
                                  'text-blue-600 bg-blue-50'
                                }`}>
                                  {log.type?.toUpperCase() || 'UNKNOWN'}
                                </span>
                              </td>
                              <td className="px-6 py-4">{log.time || (log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '')}</td>
                            </tr>
                          ))}
                          {attendanceLogs.length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-slate-400 py-8 text-center">No logs found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Worker Trends Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4">My Trends</h3>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                      </div>
                    ) : error ? (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-4">Attendance Trends</div>
                        {!workerTrend?.timeline || workerTrend.timeline.length === 0 ? (
                          <div className="text-slate-400 py-8 text-center">No trends data available.</div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {workerTrend.timeline.map((trend: any, idx: number) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-lg shadow-inner">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">{trend.label || trend.date || trend.timestamp}</div>
                                <div className="text-2xl font-black text-slate-800">{trend.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-5xl mx-auto">
              {workerId ? (
                <WorkerProfileContent workerId={workerId} />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default WorkerLandingPage;