// Admin Dashboard Component
import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, UserX, HardHat, ArrowUpRight, Calendar, Filter, List, Bell, Users, Users2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getSystemStats, getDashboardOverview, getAttendancePlot, getHotlistOverview, getTeamAttendance } from './api/analytics';
import { getActiveAlerts } from './api/alert';
import type { SystemStats, DashboardOverview, HotlistOverview, TeamAttendance } from './api/analytics';
import type { AlertDTO } from './api/alert';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertDTO[]>([]);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hotlistOverview, setHotlistOverview] = useState<HotlistOverview | null>(null);
  const [teamAttendanceData, setTeamAttendanceData] = useState<TeamAttendance[]>([]);
  const [teamAttendancePie, setTeamAttendancePie] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [stats, overview, attendance, hotlist, teamAttend] = await Promise.all([
          getSystemStats(),
          getDashboardOverview(),
          getAttendancePlot(),
          getHotlistOverview(),
          getTeamAttendance(),
        ]);

        setSystemStats(stats);
        setDashboardOverview(overview);
        setAttendanceData(attendance.data || []);
        setHotlistOverview(hotlist);
        setTeamAttendanceData(teamAttend);

        // Format team attendance pie data
        if (teamAttend.length > 0) {
          const firstTeam = teamAttend[0];
          const pieData = [
            { name: 'Present', value: firstTeam.present, color: '#818cf8' },
            { name: 'Absent', value: firstTeam.absent, color: '#f87171' },
            { name: 'On Leave', value: firstTeam.on_leave, color: '#2dd4bf' },
            { name: 'Overtime', value: firstTeam.overtime, color: '#fb923c' },
          ];
          setTeamAttendancePie(pieData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchActiveAlerts = async () => {
      try {
        setAlertsLoading(true);
        setAlertsError(null);
        const alerts = await getActiveAlerts();
        if (!cancelled) setActiveAlerts(Array.isArray(alerts) ? alerts : []);
      } catch (err) {
        console.error('Error fetching active alerts:', err);
        if (!cancelled) {
          setActiveAlerts([]);
          setAlertsError(err instanceof Error ? err.message : 'Failed to load alerts');
        }
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    };

    fetchActiveAlerts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="p-8">
        <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Admin Dashboard</h2>

        {/* ========== TOP STAT CARDS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading...</div>
          ) : (
            <>
              <StatCard
                label="Workers"
                value={(systemStats?.workers ?? 0).toLocaleString()}
                icon={<Users className="text-blue-400" size={28} />}
                borderColor="border-l-blue-500"
                footer={
                  <Link
                    to="/workers"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  >
                    View workers →
                  </Link>
                }
              />
              <StatCard
                label="Site Engineers"
                value={(systemStats?.engineers ?? 0).toLocaleString()}
                icon={<HardHat className="text-blue-300" size={28} />}
                borderColor="border-l-blue-300"
                footer={
                  <Link
                    to="/person-management"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  >
                    Add account →
                  </Link>
                }
              />
              <StatCard
                label="Nurses"
                value={(systemStats?.nurses ?? 0).toLocaleString()}
                icon={<UserX className="text-red-400" size={28} />}
                borderColor="border-l-red-500"
                footer={
                  <Link
                    to="/person-management"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  >
                    Add account →
                  </Link>
                }
              />
              <StatCard
                label="Admins"
                value={(systemStats?.admins ?? 0).toLocaleString()}
                icon={<UserCheck className="text-teal-400" size={28} />}
                borderColor="border-l-teal-500"
                footer={
                  <Link
                    to="/person-management"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  >
                    Add account →
                  </Link>
                }
              />
              <StatCard
                label="Staff"
                value={(systemStats?.staff ?? 0).toLocaleString()}
                icon={<Users size={28} />}
                borderColor="border-l-purple-500"
                footer={
                  <Link
                    to="/person-management"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  >
                    Manage people →
                  </Link>
                }
              />
              <StatCard
                label="Total Persons"
                value={(systemStats?.total_persons ?? 0).toLocaleString()}
                icon={<HardHat size={28} />}
                borderColor="border-l-indigo-500"
                footer={
                  <Link
                    to="/person-management"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  >
                    View all →
                  </Link>
                }
              />
            </>
          )}
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-l-8 border-l-red-900 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teams</p>
              <div className="flex items-center gap-3 mt-2">
                <Users2 size={32} />
                <span className="text-4xl font-black">{dashboardOverview?.total_teams || 0}</span>
              </div>
            </div>
            <Link
              to="/team-management"
              className="text-[12px] font-bold text-slate-400 flex items-center gap-1 hover:text-blue-600"
            >
              View Teams <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="bg-white p-6 rounded-xl border-l-8 border-l-orange-400 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
              <div className="flex items-center gap-3 mt-2">
                <Users size={32} className="text-orange-400" />
                <span className="text-4xl font-black text-orange-400">
                  {dashboardOverview?.todays_attendance || 0}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1 text-[12px] font-bold">
                <ArrowUpRight size={12} className="text-green-500" />{' '}
                {dashboardOverview?.todays_hotlist_alerts || 0}
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
                        <td className="px-6 py-6 text-slate-400" colSpan={5}>
                          Loading alerts...
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
                        <tr key={alert.id ?? `${alert.alertType}-${alert.createdAt}`} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                          <td className="px-6 py-3">{alert.id ?? '-'}</td>
                          <td className="px-6 py-3">{alert.alertType}</td>
                          <td className="px-6 py-3 max-w-[360px] truncate" title={alert.description || ''}>
                            {alert.description || '-'}
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
                      {hotlistOverview?.recent_alerts && hotlistOverview.recent_alerts.length > 0 ? (
                        hotlistOverview.recent_alerts.map((alert, i) => (
                          <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition group">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                      <Users size={16} className="text-slate-400" />
                                  </div>
                                  <div>
                                      <p className="text-[11px] font-bold text-slate-700">{alert.name}</p>
                                      <div className="flex items-center gap-1">
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                          <span className="text-[9px] font-bold text-slate-400 italic">{alert.alert_type}</span>
                                      </div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => navigate('/worker-profile')}
                                  className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition"
                              >
                                  See profile
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

const StatCard = ({ label, value, icon, borderColor, footer }: any) => (
  <div
    className={`bg-white p-6 rounded-xl border-l-8 ${borderColor} shadow-sm hover:scale-[1.02] transition cursor-pointer`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <span className="text-4xl font-black text-slate-800">{value}</span>
      </div>
      <div className="opacity-40">{icon}</div>
    </div>
    {footer ? <div className="mt-4">{footer}</div> : null}
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