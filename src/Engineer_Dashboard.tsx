import { useState, useEffect, useRef } from 'react';
import { Users, Bell, Download, FileText } from 'lucide-react';
import { getEngineerDashboardSummary, getEngineerAlerts, startEngineerAttendanceExport } from './api/engineer';
import { useExportJob } from './hooks/useExportJob';
import { ExportStatusOverlay } from './components/ExportStatusOverlay';
import { RecentExportsModal } from './components/RecentExportsModal';
import { SkeletonCard, SkeletonRow, SkeletonListItem } from './components/Skeletons';
import DashboardLayout from './components/DashboardLayout';
import { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://siteguardph.duckdns.org/ws/alerts';

const EngineerDashboard = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isEngineer = roles.includes('ROLE_ENGINEER');
  const canExport = isAdmin || isEngineer;

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const exportManager = useExportJob({
    onSuccess: () => console.log('Export finished successfully'),
    onError: (err) => console.error('Export failed:', err)
  });

  const [exportDate, setExportDate] = useState<Dayjs | null>(null);
  const [showRecentExports, setShowRecentExports] = useState(false);

  const fetchDashboard = async (isBackground = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!isBackground && !dashboardData) setLoading(true);
      const data = await getEngineerDashboardSummary(controller.signal);
      
      if (data && !controller.signal.aborted) {
        // Safe Normalization Layer
        const normalized = {
          ...data,
          workers: Array.isArray(data.workers) ? data.workers : [],
          hotlists: Array.isArray(data.hotlists) ? data.hotlists : [],
          team: {
             ...data.team,
             workerCount: typeof data.team?.workerCount === 'number' ? data.team.workerCount : 0
          },
          overtime: {
             ...data.overtime,
             count: typeof data.overtime?.count === 'number' ? data.overtime.count : 0
          },
          attendance: {
             ...data.attendance,
             attendanceRate: data.attendance?.attendanceRate || '0.0%'
          }
        };
        setDashboardData(normalized);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch dashboard summary:', err);
      }
    } finally {
      if (!isBackground && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    
    // Stable Polling
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchAlerts = async (isBackground = false) => {
    try {
      if (!isBackground && alerts.length === 0) setAlertsLoading(true);
      const data = await getEngineerAlerts();
      if (data) {
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      if (!isBackground) setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(false);
    
    // Stable Alerts Polling
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // WebSocket for Alerts
  useEffect(() => {
    const ws = new WebSocket(WS_BASE_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        setAlerts((prevAlerts) => {
          // ID-based deduplication and immutable state updates
          if (prevAlerts.some((a) => a.id === newAlert.id)) {
            return prevAlerts;
          }
          const updated = [newAlert, ...prevAlerts];
          return updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
        });
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <DashboardLayout title="Engineer Dashboard">
      <div className="p-10 space-y-8">
        
        {/* Core Stats Overview */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-black !text-slate-950 uppercase">Dashboard Overview</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
            {dashboardData?.team?.teamName || 'Team Dashboard'}
          </p>

          {loading && !dashboardData ? (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
               {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center">
                <Users size={30} className="text-blue-400 mb-2" />
                <h3 className="text-xs font-black !text-slate-950 uppercase text-center">Total Workers</h3>
                <span className="text-3xl font-black text-blue-400">
                  {dashboardData?.team?.workerCount ?? 0}
                </span>
              </div>
              
              <div className="border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center">
                <Users size={30} className="text-amber-400 mb-2" />
                <h3 className="text-xs font-black !text-slate-950 uppercase text-center">Overtime Count</h3>
                <span className="text-3xl font-black text-amber-400">
                  {dashboardData?.overtime?.count ?? 0}
                </span>
              </div>

              <div className="border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center">
                <Users size={30} className="text-red-400 mb-2" />
                <h3 className="text-xs font-black !text-slate-950 uppercase text-center">Hotlist Count</h3>
                <span className="text-3xl font-black text-red-400">
                  {dashboardData?.hotlists?.length ?? 0}
                </span>
              </div>

              <div className="border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center">
                <Users size={30} className="text-green-400 mb-2" />
                <h3 className="text-xs font-black !text-slate-950 uppercase text-center">Today's Attendance</h3>
                <span className="text-3xl font-black text-green-400">
                  {dashboardData?.attendance?.attendanceRate ?? '0.0%'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 border-2 border-slate-100 rounded-2xl p-8">
              <h3 className="text-sm font-black !text-slate-950 uppercase mb-6">Recent Admitted Workers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-[11px] font-bold">
                  <thead className="bg-slate-50 text-slate-400 uppercase">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !dashboardData ? (
                       Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
                    ) : dashboardData?.workers?.length > 0 ? (
                      dashboardData.workers.map((w: any) => {
                        const normalizedName = (w.name && w.name.trim() !== '') ? w.name.trim() : 'Unknown Worker';
                        return (
                          <tr key={w.id || w.personCode || Math.random().toString()} className="border-b hover:bg-slate-50">
                            <td className="p-4 text-slate-900">{normalizedName}</td>
                            <td>{w.email || '-'}</td>
                            <td>
                              <Link to={`/worker-profile?id=${w.id}`} className="text-blue-500 hover:underline">
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={3} className="p-4 text-slate-400">No recent workers</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-2 border-slate-100 rounded-2xl p-8 flex flex-col">
              <h3 className="text-sm font-black !text-slate-950 uppercase mb-2">Daily Attendance Export</h3>
              <p className="text-[12px] text-slate-400 font-medium mb-6">
                Export team attendance data to PDF.
              </p>
              
              <div className="space-y-4 mt-auto">
                {canExport ? (
                  <button
                    onClick={() => exportManager.startJob(() => startEngineerAttendanceExport())}
                    disabled={loading || !dashboardData || exportManager.isExporting}
                    className="w-full bg-[#1a2e5a] text-white py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-[#132142] transition disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <Download size={16} /> Export Today's Attendance
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center py-2">
                    Admin access required to export
                  </div>
                )}
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] font-black uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <div className="space-y-2">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={exportDate}
                      onChange={(newValue) => setExportDate(newValue)}
                      sx={{ width: '100%' }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </LocalizationProvider>
                  {canExport && (
                    <button
                      onClick={() => {
                        const dateVal = exportDate ? exportDate.format('YYYY-MM-DD') : undefined;
                        if (!dateVal) {
                          alert('Please select a date');
                          return;
                        }
                        exportManager.startJob(() => startEngineerAttendanceExport(dateVal));
                      }}
                      disabled={loading || !dashboardData || exportManager.isExporting}
                      className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      <Download size={16} /> Export Selected Day
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowRecentExports(true)}
                  className="w-full border-2 border-slate-200 text-slate-600 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition flex justify-center items-center gap-2 mt-4"
                >
                  <FileText size={16} /> View Recent Exports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Alerts Stream */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black !text-slate-950 uppercase flex items-center gap-2">
              <Bell className="text-red-500" />
              Live Team Alerts
            </h2>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              {alerts.length} Active
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {alertsLoading && alerts.length === 0 ? (
               Array.from({ length: 5 }).map((_, i) => <SkeletonListItem key={i} />)
            ) : alerts.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold uppercase text-xs tracking-widest">
                No active alerts
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-xl flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900">{alert.title || alert.type}</h4>
                    <p className="text-xs text-slate-600 mt-1">{alert.message || 'Worker triggered an alert.'}</p>
                  </div>
                  <div className="text-[10px] font-black text-red-400 uppercase tracking-wider text-right">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ExportStatusOverlay 
        state={exportManager.state}
        progress={exportManager.progress}
        error={exportManager.error}
        onReset={exportManager.reset}
        onDownloadAgain={exportManager.downloadAgain}
      />

      {showRecentExports && (
        <RecentExportsModal onClose={() => setShowRecentExports(false)} />
      )}
    </DashboardLayout>
  );
};

export default EngineerDashboard;