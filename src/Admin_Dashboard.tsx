// Admin Dashboard Component
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, UserX, HardHat, ArrowUpRight, Calendar, Filter, List, Bell, Users, Users2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getSystemStats, getDashboardOverview, getAttendancePlot, getHotlistOverview, getTeamAttendance } from './api/analytics';
import { getActiveAlerts } from './api/alert';
import type { SystemStats, DashboardOverview, HotlistOverview } from './api/analytics';
import type { AlertDTO } from './api/alert';

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

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);

        // Fetch all data in parallel
        const [stats, overview, attendance, hotlist, teamAttend] = await Promise.all([
          getSystemStats(),
          getDashboardOverview(),
          getAttendancePlot(),
          getHotlistOverview(),
          getTeamAttendance(),
        ]);

        if (cancelled) return;

        setSystemStats(stats);
        setDashboardOverview(overview);
        setHotlistOverview(hotlist);
        
        // Align with AnalyticsController's map structure
        const attArray = Object.entries((attendance as any)?.counts || {}).map(([date, count]) => ({
            name: date,
            Workers: count,
            Hotlist: 0,
            Engineers: 0
        }));
        setAttendanceData(attArray);

        const tdArray = Object.entries((teamAttend as any)?.teamDateCounts || {}).map(([teamName, dates]) => ({
            name: teamName,
            present: Object.values(dates as Record<string, number>).reduce((a, b) => a + b, 0),
            absent: 0,
            on_leave: 0,
            overtime: 0
        }));
        setTeamAttendanceData(tdArray as any);

        const pieData = Object.entries((teamAttend as any)?.hotlistPerTeam || {}).map(([teamName, count], idx) => {
            const colors = ['#818cf8', '#f87171', '#2dd4bf', '#fb923c'];
            return { name: teamName, value: count, color: colors[idx % colors.length] };
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
      ws = new WebSocket('ws://siteguardph.duckdns.org/ws/alerts');

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

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="p-8">
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

        <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Admin Dashboard</h2>

        {/* ========== TOP STAT CARDS ========== */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Workers"
            value={(systemStats?.workers ?? 0).toLocaleString()}
            icon={<Users className="text-blue-400" size={28} />}
            borderColor="border-l-blue-500"
            onClick={() => navigate('/admin_team')}
          />
          <StatCard
            label="Site Engineers"
            value={(systemStats?.engineers ?? 0).toLocaleString()}
            icon={<HardHat className="text-blue-300" size={28} />}
            borderColor="border-l-blue-300"
            onClick={() => navigate('/admin_team')}
          />
          <StatCard
            label="Nurses"
            value={(systemStats?.nurses ?? 0).toLocaleString()}
            icon={<UserX className="text-red-400" size={28} />}
            borderColor="border-l-red-500"
            onClick={() => navigate('/admin_team')}
          />
          <StatCard
            label="Admins"
            value={(systemStats?.admins ?? 0).toLocaleString()}
            icon={<UserCheck className="text-teal-400" size={28} />}
            borderColor="border-l-teal-500"
            onClick={() => navigate('/admin_team')}
          />
          <StatCard
            label="Staff"
            value={(systemStats?.staff ?? 0).toLocaleString()}
            icon={<Users size={28} />}
            borderColor="border-l-purple-500"
            onClick={() => navigate('/admin_team')}
          />
          <StatCard
            label="Total Persons"
            value={(systemStats?.total_persons ?? 0).toLocaleString()}
            icon={<HardHat size={28} />}
            borderColor="border-l-indigo-500"
            onClick={() => navigate('/admin_team')}
          />
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>

        {/* ========== MAIN GRID SECTION ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Tables & Graphs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Alert Overview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase">Alert Overview</h3>
                  <p className="text-[12px] text-slate-400 font-medium">Active alerts currently detected by the system.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    <List size={18} className="text-slate-400" />
                  </div>
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
                      <tr>
                        <td className="px-6 py-10" colSpan={5}>
                          <div className="flex items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                          </div>
                        </td>
                      </tr>
                    ) : activeAlerts.length === 0 ? (
                      <tr>
                        <td className="px-6 py-6 text-slate-400" colSpan={5}>
                          No active alerts
                        </td>
                      </tr>
                    ) : (
                      activeAlerts.slice(0, 8).map((alert) => (
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
            <ChartContainer title="Overall Attendance Overview" subtitle="This bar graph shows how many workers are onsite and their time of arrival.">
              <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                      <Bar dataKey="Workers" stackId="a" fill="#818cf8" barSize={30} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Hotlist" stackId="a" fill="#f87171" barSize={30} />
                      <Bar dataKey="Engineers" stackId="a" fill="#2dd4bf" barSize={30} radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Hotlist Attendance Overview Chart */}
            <ChartContainer title="Hotlist Attendance Overview" subtitle="This bar graph shows recent hotlist alerts by team.">
              <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(Array.isArray(teamAttendanceData) ? teamAttendanceData : []).slice(0, 5).map((t, i) => ({
                    name: `Team ${i + 1}`,
                    present: t.present,
                    absent: t.absent,
                    leave: t.on_leave,
                  }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip />
                      <Legend iconType="rect" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                      <Bar dataKey="present" stackId="a" fill="#818cf8" name="Present" />
                      <Bar dataKey="absent" stackId="a" fill="#f472b6" name="Absent" />
                      <Bar dataKey="leave" stackId="a" fill="#2dd4bf" name="On Leave" />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Attendance Trend (Line Chart) */}
            <ChartContainer title="Attendance Overview" subtitle="This bar graph shows how many hotlist per team is present.">
              <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                      <Line type="monotone" dataKey="Hotlist" stroke="#818cf8" strokeWidth={3} dot={{r: 4}} />
                      <Line type="monotone" dataKey="Workers" stroke="#f87171" strokeWidth={3} dot={{r: 4}} />
                      <Line type="monotone" dataKey="Engineers" stroke="#2dd4bf" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

          </div>

          {/* RIGHT: Hotlist Overview & Pie */}
          <div className="space-y-8">
              {/* Hotlist Overview List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-800 uppercase">Hotlist Overview</h3>
                      <p className="text-[12px] text-slate-400 font-medium">This shows which are the active workers on hotlist.</p>
                      <div className="flex gap-2 mt-4">
                          <button className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 px-2 py-1 rounded"> <Filter size={10}/> By Team</button>
                          <button className="text-[9px] font-bold bg-slate-100 px-2 py-1 rounded">View All</button>
                      </div>
                  </div>
                  <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                      {hotlistOverview?.list && hotlistOverview.list.length > 0 ? (
                        hotlistOverview.list.map((alert: any, i: number) => (
                          <div key={alert.personCode ?? i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition group">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                      <Users size={16} className="text-slate-400" />
                                  </div>
                                  <div>
                                      <p className="text-[11px] font-bold text-slate-700">{alert.name}</p>
                                      <div className="flex items-center gap-1">
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                          <span className="text-[9px] font-bold text-slate-400 italic">{alert.role}</span>
                                      </div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => navigate('/workers')}
                                  className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition"
                              >
                                  See workers
                              </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-[12px]">No hotlist alerts</div>
                      )}
                  </div>
              </div>

              {/* Team Attendance Donut */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Team Attendance</h3>
                  <div className="flex gap-2 mb-6">
                      <button className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 px-2 py-1 rounded"> <Filter size={10}/> By Team</button>
                      <button className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 px-2 py-1 rounded"> <HardHat size={10}/> Line & Grade Team</button>
                      <button className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 px-2 py-1 rounded"> <Calendar size={10}/> Jan 20, 2026</button>
                  </div>
                  
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
                          <span className="text-3xl font-black text-slate-800">
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
              </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon, borderColor, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border-l-8 ${borderColor} shadow-sm hover:scale-[1.02] transition cursor-pointer`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <span className="text-4xl font-black text-slate-800">{value}</span>
      </div>
      <div className="opacity-40">{icon}</div>
    </div>
    {onClick && (
      <div className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors w-full">
        Click to view →
      </div>
    )}
  </div>
);

const ChartContainer = ({ title, subtitle, children }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-sm font-black text-slate-800 uppercase">{title}</h3>
                <p className="text-[12px] text-slate-400 font-medium">{subtitle}</p>
            </div>
            <div className="flex gap-2 text-slate-400">
                <Bell size={16} />
                <Calendar size={16} />
            </div>
        </div>
        {children}
    </div>
)

export default AdminDashboard;