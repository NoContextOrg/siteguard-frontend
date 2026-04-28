import { useState, useEffect, useRef } from 'react';
import { UserX, Calendar, Filter, List, Bell, Users, BellRing, Clock, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from './components/DashboardLayout';
import type { 
  HotlistOverview,
  AlertsOverview,
  StaffEfficiency,
} from './api/analytics';
import { 
  getHotlistOverview,
  getAlertsOverview,
  getStaffEfficiency,
} from './api/analytics';
import { getActiveAlerts } from './api/alert';
import type { AlertDTO } from './api/alert';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const NurseDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertDTO[]>([]);
  const [floatingAlert, setFloatingAlert] = useState<AlertDTO | null>(null);
  const lastAlertIdRef = useRef<number | null>(null);

  const [hotlistOverview, setHotlistOverview] = useState<HotlistOverview | null>(null);
  const [alertsOverview, setAlertsOverview] = useState<AlertsOverview | null>(null);
  const [staffEfficiency, setStaffEfficiency] = useState<StaffEfficiency[]>([]);
  const [alertsBreakdownPie, setAlertsBreakdownPie] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all data a nurse is allowed to see
        const [hotlist, alerts, efficiency] = await Promise.all([
          getHotlistOverview().catch(() => null),
          getAlertsOverview().catch(() => null),
          getStaffEfficiency().catch(() => []),
        ]);

        setHotlistOverview(hotlist);
        setAlertsOverview(alerts);

        // Handle cases where API returns `{ data: [...] }` or just `[...]`
        const efficiencyData = Array.isArray(efficiency)
          ? efficiency
          : (efficiency as any)?.data ?? [];
        setStaffEfficiency(efficiencyData);

        // Format alert breakdown for pie chart
        if (alerts?.breakdown) {
          const breakdownData = Object.entries(alerts.breakdown).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value,
          }));
          setAlertsBreakdownPie(breakdownData);
        } else {
          setAlertsBreakdownPie([]);
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

  useEffect(() => {
    const pollAlerts = async () => {
      try {
        const alerts = await getActiveAlerts();
        if (Array.isArray(alerts) && alerts.length > 0) {
          const latest = alerts[0];
          if (latest.id && lastAlertIdRef.current !== latest.id) {
            setFloatingAlert(latest);
            lastAlertIdRef.current = latest.id;
            setTimeout(() => setFloatingAlert(null), 7000);
          }
        }
      } catch {}
    };
    pollAlerts();
    const interval = setInterval(pollAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout title="Nurse Dashboard">
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

          <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Nurse Dashboard</h2>

          {/* ========== TOP STAT CARDS ========== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <div className="col-span-full text-center py-8">Loading...</div>
            ) : (
              <>
                <StatCard label="Active Alerts" value={(alertsOverview?.active_alerts ?? 0).toString()} icon={<Bell className="text-red-400" size={28}/>} borderColor="border-l-red-500" />
                <StatCard label="Today's Alerts" value={(alertsOverview?.total_alerts_today ?? 0).toString()} icon={<BellRing className="text-orange-400" size={28}/>} borderColor="border-l-orange-500" />
                <StatCard label="Hotlisted Persons" value={(hotlistOverview?.total_hotlist ?? 0).toString()} icon={<UserX className="text-yellow-400" size={28}/>} borderColor="border-l-yellow-500" />
                <StatCard label="Overtime Alerts" value={(alertsOverview?.breakdown?.overtime ?? 0).toString()} icon={<Clock className="text-indigo-400" size={28}/>} borderColor="border-l-indigo-500" />
                <StatCard label="Hotlist Login Alerts" value={(alertsOverview?.breakdown?.hotlist ?? 0).toString()} icon={<UserX className="text-pink-400" size={28}/>} borderColor="border-l-pink-500" />
                <StatCard label="Unauthorized Alerts" value={(alertsOverview?.breakdown?.unauthorized ?? 0).toString()} icon={<ShieldAlert className="text-rose-400" size={28}/>} borderColor="border-l-rose-500" />
              </>
            )}
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
                        <p className="text-[12px] text-slate-400 font-medium">List of all hotlist workers that are working overtime or was admitted.</p>
                    </div>
                    <div className="flex gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        <List size={18} className="text-slate-400" />
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
                            )))}
                        </tbody>
                    </table>
                </div>
              </div>

              {/* Staff Efficiency Chart */}
              <ChartContainer title="Staff Efficiency" subtitle="Checkups completed by medical staff.">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={staffEfficiency}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                        <Bar dataKey="checkups_completed" name="Checkups" fill="#8884d8" barSize={30} radius={[4, 4, 0, 0]} />
                    </BarChart>
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
                                    onClick={() => { /* navigate('/worker-profile') */ }}
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

                {/* Alert Breakdown Donut */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Alert Type Breakdown</h3>
                    
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie 
                                    data={alertsBreakdownPie} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {alertsBreakdownPie.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-800">
                              {alertsBreakdownPie.reduce((sum, item) => sum + item.value, 0)}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Total Active</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {alertsBreakdownPie.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
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

const StatCard = ({ label, value, icon, borderColor }: any) => (
  <div className={`bg-white p-6 rounded-xl border-l-8 ${borderColor} shadow-sm flex items-center justify-between hover:scale-[1.02] transition cursor-pointer`}>
    <div>
        <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <span className="text-4xl font-black text-slate-800">{value}</span>
    </div>
    <div className="opacity-40">{icon}</div>
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

export default NurseDashboard;