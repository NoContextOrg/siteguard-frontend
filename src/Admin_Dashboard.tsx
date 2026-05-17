// Admin Dashboard Component
import { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, UserX, HardHat, ArrowUpRight, Bell, Users, Users2, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import {
  getUnifiedDashboard,
  type DashboardTimeFilterState
} from './api/analytics';
import {
  startAttendanceExport,
  startAnalyticsExport
} from './api/export';
import { useExportJob } from './hooks/useExportJob';
import { ExportStatusOverlay } from './components/ExportStatusOverlay';
import { getActiveAlerts } from './api/alert';
import type { SystemStats, DashboardOverview, HotlistOverview } from './api/analytics';
import type { AlertDTO } from './api/alert';
import { getAvatarUrl, getFallbackAvatar } from './api/person';
import { SkeletonCard, SkeletonRow, SkeletonChart, SkeletonListItem, SkeletonPie } from './components/Skeletons';

import { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://siteguardph.duckdns.org/ws/alerts';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertDTO[]>([]);
  const [floatingAlert, setFloatingAlert] = useState<AlertDTO | null>(null);
  const lastAlertIdRef = useRef<number | null>(null);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hotlistOverview, setHotlistOverview] = useState<HotlistOverview | null>(null);
  const [teamAttendanceData, setTeamAttendanceData] = useState<any[]>([]);
  const [teamAttendancePie, setTeamAttendancePie] = useState<any[]>([]);

  const [alertsFilter, setAlertsFilter] = useState<DashboardTimeFilterState>({ key: '7_DAYS' });
  const [attendanceFilter, setAttendanceFilter] = useState<DashboardTimeFilterState>({ key: '7_DAYS' });

  const [exportDate, setExportDate] = useState<Dayjs | null>(null);

  // New Async Export Hook
  const exportManager = useExportJob({
    onSuccess: () => { },
    onError: (err) => console.error('Export failed:', err)
  });

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);

        // Global dashboard data
        const unified = await getUnifiedDashboard();
        if (cancelled) return;

        setSystemStats(unified.systemStats || null);
        setDashboardOverview(unified.dashboardOverview || null);

        if (unified.enhancedHotlistOverview) {
          setHotlistOverview({
            count: unified.enhancedHotlistOverview.totalHotlisted,
            list: unified.enhancedHotlistOverview.list,
            graph: (unified.enhancedHotlistOverview.teamBreakdown || []).reduce((acc: any, cur: any) => {
              acc[cur.name] = cur.value;
              return acc;
            }, {}),
          });
        }

        const attArray = (unified.enhancedAttendanceOverview?.timeSeries || []).map((t) => ({
          name: t.date,
          Workers: t.count,
          Hotlist: 0,
          Engineers: 0,
        }));
        setAttendanceData(attArray);

        const tdArray = (unified.enhancedAttendanceOverview?.teamBreakdown || []).map((t: any) => ({
          name: t.name,
          present: t.present,
          absent: t.absent,
          overtime: t.overtime || 0,
        }));
        setTeamAttendanceData(tdArray as any);

        const pieData = (unified.enhancedHotlistOverview?.teamBreakdown || []).map((item, idx) => {
          const colors = ['#818cf8', '#f87171', '#2dd4bf', '#fb923c'];
          return { name: item.name, value: item.value, color: colors[idx % colors.length] };
        });
        setTeamAttendancePie(pieData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (!cancelled && !isBackground) setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket;
    let reconnectTimeout: number;

    const fetchAlerts = async (isBackground = false) => {
      try {
        if (!isBackground) {
          setAlertsLoading(true);
          setAlertsError(null);
        }
        const alerts = await getActiveAlerts();
        if (cancelled) return;

        if (Array.isArray(alerts)) {
          setActiveAlerts(alerts);
          if (alerts.length > 0 && alerts[0].id) {
            const latest = alerts[0];
            if (lastAlertIdRef.current !== null && lastAlertIdRef.current !== latest.id) {
              setFloatingAlert(latest);
              setTimeout(() => setFloatingAlert(null), 7000);
            }
            lastAlertIdRef.current = latest.id ?? null;
          } else if (alerts.length === 0) {
            lastAlertIdRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error fetching active alerts:', err);
        if (!cancelled && !isBackground) {
          setActiveAlerts([]);
          setAlertsError(err instanceof Error ? err.message : 'Failed to load alerts');
        }
      } finally {
        if (!cancelled && !isBackground) setAlertsLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), 15000);

    const connectWebSocket = () => {
      ws = new WebSocket(WS_BASE_URL);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const latest = data.alert || data;

          if (latest && latest.id && lastAlertIdRef.current !== latest.id) {
            setFloatingAlert(latest);
            setTimeout(() => setFloatingAlert(null), 7000);

            setActiveAlerts(prev => {
              if (prev.some(a => a.id === latest.id)) return prev;
              return [latest, ...prev];
            });
            lastAlertIdRef.current = latest.id ?? null;
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = window.setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleExport = async (exportType: string, _prefix: string, filterState?: DashboardTimeFilterState) => {
    const params = {
      exportType,
      filter: filterState?.key === 'CUSTOM' ? undefined : (filterState?.key === '7_DAYS' ? '1_WEEK' : filterState?.key),
      startDate: filterState?.key === 'CUSTOM' ? filterState.start : undefined,
      endDate: filterState?.key === 'CUSTOM' ? filterState.end : undefined,
      format: 'EXCEL'
    };

    exportManager.startJob(() => startAnalyticsExport(params));
  };

  const handleDownloadDailyPdf = async (dateVal?: string | null) => {
    exportManager.startJob(() => startAttendanceExport(dateVal || undefined, 'PDF'));
  };

  const handleExportAlertsCsv = async () => {
    const params = {
      exportType: 'ALERTS',
      format: 'CSV'
    };
    exportManager.startJob(() => startAnalyticsExport(params));
  };

  const filteredAlerts = useMemo(() => {
    if (alertsFilter.key === '7_DAYS' || alertsFilter.key === 'CUSTOM') return activeAlerts;
    const hours = alertsFilter.key === '3_HOURS' ? 3 : alertsFilter.key === '6_HOURS' ? 6 : alertsFilter.key === '12_HOURS' ? 12 : alertsFilter.key === '24_HOURS' ? 24 : 24 * 7;
    const cutoff = new Date().getTime() - (hours * 3600 * 1000);
    return activeAlerts.filter(a => {
      if (!a.createdAt) return true;
      return new Date(a.createdAt).getTime() >= cutoff;
    });
  }, [activeAlerts, alertsFilter.key]);

  const filteredAttendanceData = useMemo(() => {
    if (attendanceFilter.key === '7_DAYS' || attendanceFilter.key === 'CUSTOM') return attendanceData;
    const hours = attendanceFilter.key === '3_HOURS' ? 3 : attendanceFilter.key === '6_HOURS' ? 6 : attendanceFilter.key === '12_HOURS' ? 12 : attendanceFilter.key === '24_HOURS' ? 24 : 24 * 7;
    const cutoff = new Date().getTime() - (hours * 3600 * 1000);
    return attendanceData.filter(d => {
      if (!d.name) return true;
      const t = new Date(d.name).getTime();
      return isNaN(t) ? true : t >= cutoff;
    });
  }, [attendanceData, attendanceFilter.key]);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Dashboard-wide time filter removed; filters are now per section */}

        {floatingAlert && (
          <div className="fixed top-6 right-6 z-50 bg-yellow-50 border border-yellow-300 shadow-lg rounded-xl px-6 py-4 flex items-center gap-3 animate-fade-in">
            <Bell className="text-yellow-500" size={28} />
            <div>
              <div className="font-bold text-yellow-800">New Alert: {floatingAlert.alertType}</div>
              <div className="text-yellow-700 text-sm">{floatingAlert.alertMessage}</div>
              <div className="text-xs text-yellow-600 mt-1">{floatingAlert.createdAt ? new Date(floatingAlert.createdAt).toLocaleString() : ''}</div>
            </div>
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-black !text-slate-950 mb-6 uppercase tracking-tight">Admin Dashboard</h2>

        {/* ========== TOP STAT CARDS ========== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Workers" value={(systemStats?.workers ?? 0).toLocaleString()} icon={<Users className="text-blue-400" size={28} />} borderColor="border-l-blue-500" onClick={() => navigate('/admin_team')} />
              <StatCard label="Site Engineers" value={(systemStats?.engineers ?? 0).toLocaleString()} icon={<HardHat className="text-blue-300" size={28} />} borderColor="border-l-blue-300" onClick={() => navigate('/admin_team')} />
              <StatCard label="Nurses" value={(systemStats?.nurses ?? 0).toLocaleString()} icon={<UserX className="text-red-400" size={28} />} borderColor="border-l-red-500" onClick={() => navigate('/admin_team')} />
              <StatCard label="Admins" value={(systemStats?.admins ?? 0).toLocaleString()} icon={<UserCheck className="text-teal-400" size={28} />} borderColor="border-l-teal-500" onClick={() => navigate('/admin_team')} />
              <StatCard label="Staff" value={(systemStats?.staff ?? 0).toLocaleString()} icon={<Users size={28} />} borderColor="border-l-purple-500" onClick={() => navigate('/admin_team')} />
              <StatCard label="Total Persons" value={(systemStats?.total_persons ?? 0).toLocaleString()} icon={<HardHat size={28} />} borderColor="border-l-indigo-500" onClick={() => navigate('/admin_team')} />
            </>
          )}
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <div
                onClick={() => navigate('/admin_team')}
                className="bg-white p-6 rounded-xl border-l-8 border-l-red-900 shadow-sm flex justify-between items-center hover:scale-[1.02] transition cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teams</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Users2 size={32} />
                    <span className="text-4xl font-black">{dashboardOverview?.totalTeams || 0}</span>
                  </div>
                </div>
                <ArrowUpRight size={24} className="text-slate-300" />
              </div>
              <div
                onClick={() => navigate('/attendance')}
                className="bg-white p-6 rounded-xl border-l-8 border-l-orange-400 shadow-sm flex justify-between items-center hover:scale-[1.02] transition cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Users size={32} className="text-orange-400" />
                    <span className="text-4xl font-black text-orange-400">
                      {dashboardOverview?.onsitePersonsToday || 0}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1 text-[12px] font-bold">
                    <ArrowUpRight size={12} className="text-green-500" />{' '}
                    {dashboardOverview?.hotlistWorkers || 0}
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Today's Alerts</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ========== MAIN GRID SECTION ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Tables & Graphs */}
          <div className="lg:col-span-2 space-y-8">

            {/* Alert Overview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black !text-slate-950 uppercase">Alert Overview</h3>
                  <p className="text-[12px] text-slate-400 font-medium">Active alerts currently detected by the system.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    { k: '3_HOURS', label: '3H' },
                    { k: '6_HOURS', label: '6H' },
                    { k: '12_HOURS', label: '12H' },
                    { k: '24_HOURS', label: '24H' },
                    { k: '7_DAYS', label: '7D' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.k}
                      type="button"
                      onClick={() => setAlertsFilter({ key: opt.k as any })}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition ${alertsFilter.key === opt.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={loading || exportManager.isExporting}
                    onClick={() => handleExportAlertsCsv()}
                    className="ml-1 flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-[12px] font-black disabled:opacity-60"
                  >
                    <Download size={16} /> Export
                  </button>
                  <Link to="/alerts" className="text-[12px] font-bold text-slate-400 hover:text-blue-600">
                    View all
                  </Link>
                </div>
              </div>

              {alertsError && (
                <div className="px-6 py-3 text-[12px] text-red-600 bg-red-50 border-b border-red-100">
                  {alertsError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Alert ID</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Created</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-600">
                    {alertsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    ) : filteredAlerts.length === 0 ? (
                      <tr>
                        <td className="px-6 py-6 text-slate-400" colSpan={5}>
                          No active alerts
                        </td>
                      </tr>
                    ) : (
                      filteredAlerts.slice(0, 8).map((alert) => (
                        <tr
                          key={alert.id ?? `${alert.alertType}-${alert.createdAt}`}
                          className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-6 py-3">{alert.id ?? '-'}</td>
                          <td className="px-6 py-3">{alert.alertType}</td>
                          <td className="px-6 py-3 max-w-[360px] truncate" title={alert.alertMessage || ''}>
                            {alert.alertMessage || '-'}
                          </td>
                          <td className="px-6 py-3">
                            {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded-sm bg-yellow-50 text-yellow-700">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Attendance Overview Chart */}
            <ChartContainer
              title={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
                  <div>
                    <div className="text-sm font-black !text-slate-950 uppercase">Overall Attendance Overview</div>
                    <div className="text-[12px] text-slate-400 font-medium">This bar graph shows how many workers are onsite and their time of arrival.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {([
                      { k: '3_HOURS', label: '3H' },
                      { k: '6_HOURS', label: '6H' },
                      { k: '12_HOURS', label: '12H' },
                      { k: '24_HOURS', label: '24H' },
                      { k: '7_DAYS', label: '7D' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.k}
                        type="button"
                        onClick={() => setAttendanceFilter({ key: opt.k as any })}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition ${attendanceFilter.key === opt.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={loading || exportManager.isExporting}
                      onClick={() => handleExport('ATTENDANCE_TRENDS', 'attendance-report', attendanceFilter)}
                      className="ml-1 flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-[12px] font-black disabled:opacity-60"
                    >
                      <Download size={16} /> Export
                    </button>
                  </div>
                </div>
              }
              subtitle={null}
            >
              {loading ? <SkeletonChart /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={filteredAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Bar dataKey="Workers" stackId="a" fill="#818cf8" barSize={30} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Hotlist" stackId="a" fill="#f87171" barSize={30} />
                    <Bar dataKey="Engineers" stackId="a" fill="#2dd4bf" barSize={30} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* Hotlist Attendance Overview Chart */}
            <ChartContainer title="Hotlist Attendance Overview" subtitle="This bar graph shows recent hotlist alerts by team.">
              {loading ? <SkeletonChart /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(Array.isArray(teamAttendanceData) ? teamAttendanceData : []).slice(0, 5).map((t, i) => ({
                    name: `Team ${i + 1}`,
                    present: t.present,
                    absent: t.absent,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Bar dataKey="present" stackId="a" fill="#818cf8" name="Present" />
                    <Bar dataKey="absent" stackId="a" fill="#f472b6" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* Attendance Trend (Line Chart) */}
            <ChartContainer title="Attendance Overview" subtitle="This bar graph shows how many hotlist per team is present.">
              {loading ? <SkeletonChart /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={filteredAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="Hotlist" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Workers" stroke="#f87171" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Engineers" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

          </div>

          {/* RIGHT: Hotlist Overview & Pie */}
          <div className="space-y-8">
            {/* Daily Attendance Report Exporter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-black !text-slate-950 uppercase mb-2">Daily Attendance Report</h3>
              <p className="text-[12px] text-slate-400 font-medium mb-6">
                Export a structured PDF report of all worker attendance for a specific day.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleDownloadDailyPdf()}
                  disabled={loading || exportManager.isExporting}
                  className="w-full bg-[#1a2e5a] text-white py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-[#132142] transition disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  <Download size={16} /> Export Today's Attendance
                </button>

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
                  <button
                    onClick={() => {
                      const dateVal = exportDate ? exportDate.format('YYYY-MM-DD') : null;
                      if (!dateVal) {
                        alert('Please select a date');
                        return;
                      }
                      handleDownloadDailyPdf(dateVal);
                    }}
                    disabled={loading || exportManager.isExporting}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <Download size={16} /> Export Selected Day
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black !text-slate-950 uppercase">Hotlist Overview</h3>
                  <p className="text-[12px] text-slate-400 font-medium">This shows which are the active workers on hotlist.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || exportManager.isExporting}
                    onClick={() => handleExport('HOTLIST', 'hotlist-report')}
                    className="ml-1 flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-[12px] font-black disabled:opacity-60"
                  >
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonListItem key={i} />)
                ) : hotlistOverview?.list && hotlistOverview.list.length > 0 ? (
                  hotlistOverview.list.map((alert: any, i: number) => (
                    <div key={alert.personCode ?? i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img src={getAvatarUrl(alert.personName || alert.name, alert.profilePictureUrl || alert.photoUrl)} alt={alert.personName || alert.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = getFallbackAvatar(alert.personName || alert.name); }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{alert.personName}</p>
                          <p className="text-xs text-slate-500 truncate">{alert.personCode}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded-sm bg-red-50 text-red-700">
                          HOTLISTED
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-[12px]">No hotlist alerts</div>
                )}
              </div>
            </div>

            {/* Team Attendance Donut */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-black !text-slate-950 uppercase mb-4">Team Attendance</h3>

              {loading ? <SkeletonPie /> : (
                <>
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={teamAttendancePie}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {teamAttendancePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black !text-slate-950">
                        {teamAttendancePie.reduce((sum, item) => sum + item.value, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {teamAttendancePie.map((item) => (
                      <div key={item.name} className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[12px] font-bold text-slate-400 uppercase">{item.name}</span>
                        </div>
                        <span className="text-[12px] font-black text-slate-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Export Status Notification Overlay */}
      <ExportStatusOverlay
        state={exportManager.state}
        progress={exportManager.progress}
        error={exportManager.error}
        onReset={exportManager.reset}
        onDownloadAgain={exportManager.downloadAgain}
      />
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon, borderColor, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-white p-4 md:p-6 rounded-xl border-l-[6px] md:border-l-8 ${borderColor} shadow-sm card-hover-effect active-scale cursor-pointer flex flex-col justify-between h-full min-h-[120px]`}
  >
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">{label}</p>
        <span className="text-2xl md:text-4xl font-black !text-slate-950 block truncate">{value}</span>
      </div>
      <div className="opacity-20 md:opacity-40 flex-shrink-0 ml-2">{icon}</div>
    </div>
    {onClick && (
      <div className="mt-4 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors w-full">
        View details →
      </div>
    )}
  </div>
);

const ChartContainer = ({ title, subtitle, children }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-center mb-6">
      <div className="min-w-0 flex-1">
        {typeof title === 'string' ? (
          <h3 className="text-sm font-black !text-slate-950 uppercase">{title}</h3>
        ) : (
          title
        )}
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <p className="text-[12px] text-slate-400 font-medium">{subtitle}</p>
          ) : (
            subtitle
          )
        ) : null}
      </div>
    </div>
    {children}
  </div>
)

export default AdminDashboard;