import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, UserCheck, UserX, UserPlus, Users, Bell
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import type {
  SystemStats,
  DashboardOverview,
  HotlistOverview,
} from './api/analytics';
import {
  getSystemStats,
  getDashboardOverview,
  getHotlistOverview,
  getTeamAttendance,
} from './api/analytics';
import { getAllPersons, type PersonResponse } from './api/person';
import { getActiveAlerts, type AlertDTO } from './api/alert';
import DashboardLayout from './components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<'hotlist' | 'normal' | null>(null);
  const [loading, setLoading] = useState(true);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [hotlistOverview, setHotlistOverview] = useState<HotlistOverview | null>(null);
  const [teamAttendanceData, setTeamAttendanceData] = useState<any[]>([]);

  // NEW: backend-connected states
  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [floatingAlert, setFloatingAlert] = useState<AlertDTO | null>(null);

  const lastAlertIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);

        const [
          stats,
          overview,
          hotlist,
          teamAttend,
          personsRes,
        ] = await Promise.all([
          getSystemStats(),
          getDashboardOverview(),
          getHotlistOverview(),
          getTeamAttendance(),
          getAllPersons(),
        ]);

        if (cancelled) return;

        setSystemStats(stats);
        setDashboardOverview(overview);
        setHotlistOverview(hotlist);
        
        const tdArray = Object.entries((teamAttend as any)?.teamDateCounts || {}).map(([teamName, dates]) => ({
            name: teamName,
            present: Object.values(dates as Record<string, number>).reduce((a, b) => a + b, 0),
            absent: 0,
            leave: 0,
        }));
        setTeamAttendanceData(tdArray as any);

        setPersons(personsRes || []);

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

    const fetchAlerts = async () => {
      try {
        const fetchedAlerts = await getActiveAlerts();
        if (cancelled) return;

        if (Array.isArray(fetchedAlerts)) {
          setAlerts(fetchedAlerts);
          if (fetchedAlerts.length > 0 && fetchedAlerts[0].id) {
            const latest = fetchedAlerts[0];
            if (lastAlertIdRef.current !== null && lastAlertIdRef.current !== latest.id) {
              setFloatingAlert(latest);
              setTimeout(() => setFloatingAlert(null), 7000);
            }
            lastAlertIdRef.current = latest.id ?? null;
          } else if (fetchedAlerts.length === 0) {
            lastAlertIdRef.current = null;
          }
        }
      } catch {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);

    const connectWebSocket = () => {
      ws = new WebSocket('ws://siteguardph.duckdns.org/ws/alerts');

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const latest = data.alert || data;
          
          if (latest && latest.id && lastAlertIdRef.current !== latest.id) {
            setFloatingAlert(latest);
            setTimeout(() => setFloatingAlert(null), 7000);

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

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <DashboardLayout>
      <motion.div className="p-8" variants={containerVars} initial="hidden" animate="show">
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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
            Engineer Dashboard
          </h1>
        </div>

        {/* ========== STAT CARDS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading...</div>
          ) : (
            <>
              <StatCard label="Total Workers" value={(systemStats?.workers ?? 0).toString()} color="border-l-blue-400" icon={<Users size={28}/>} onClick={() => navigate('/engineer_team')} />
              <StatCard label="Total Admins" value={(systemStats?.admins ?? 0).toString()} color="border-l-teal-400" icon={<UserCheck size={28}/>} onClick={() => navigate('/engineer_team')} />
              <StatCard label="Hotlist Count" value={(dashboardOverview?.hotlistWorkers ?? 0).toString()} color="border-l-red-400" icon={<UserX size={28}/>} onClick={() => navigate('/alerts')} />
              <StatCard label="Today's Attendance" value={(dashboardOverview?.onsitePersonsToday ?? 0).toString()} color="border-l-purple-400" icon={<UserPlus size={28}/>} onClick={() => navigate('/engineer_team')} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">

            {/* ========== RECENT ADMITTED (NOW BACKEND) ========== */}
            <motion.div variants={itemVars} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b bg-slate-50/50">
                <h3 className="text-sm font-black uppercase">Recent Admitted Workers</h3>
                <Filter size={18} className="text-slate-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-bold">
                  <thead className="bg-slate-50 text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Team</th>
                      <th className="px-6 py-4">Email</th>
                    </tr>
                  </thead>

                  <tbody>
                    {persons.slice(0, 5).map((p, i) => (
                      <tr key={i} className="border-b hover:bg-blue-50">
                        <td className="px-6 py-4">{p.name}</td>
                        <td className="px-6 py-4">{(p as any).role ?? 'WORKER'}</td>
                        <td className="px-6 py-4">{p.teamId ? `Team ${p.teamId}` : 'Unassigned'}</td>
                        <td className="px-6 py-4">{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ========== ALERT OVERVIEW (NOW BACKEND) ========== */}
            <motion.div variants={itemVars} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b">
                <h3 className="text-sm font-black uppercase">Alert Overview</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-bold">
                  <thead className="bg-slate-50 text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alerts.slice(0, 5).map((a, i) => (
                      <tr key={i} className="border-b hover:bg-blue-50">
                        <td className="px-6 py-4">{a.personName || 'N/A'}</td>
                        <td className="px-6 py-4 text-orange-500">{a.alertType}</td>
                        <td className="px-6 py-4">{a.isAcknowledged ? 'Acknowledged' : 'ACTIVE'}</td>
                        <td className="px-6 py-4">
                          {a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* CHARTS (UNCHANGED) */}
            <motion.div variants={itemVars} className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-sm font-black uppercase mb-6">Team Attendance Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={(teamAttendanceData || []).slice(0, 5).map((t, i) => ({
                  name: `Team ${i + 1}`,
                  present: t.present,
                  absent: t.absent,
                  leave: t.on_leave,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" stackId="a" fill="#818cf8" />
                  <Bar dataKey="absent" stackId="a" fill="#f472b6" />
                  <Bar dataKey="leave" stackId="a" fill="#2dd4bf" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

          </div>

          <div className="space-y-8">

            {/* HOTLIST SIDEBAR */}
            {hotlistOverview && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b flex justify-between">
                  <h3 className="text-sm font-black uppercase">Recent Hotlist Alerts</h3>

                  {/* FIXED BUTTON */}
                  <button
                    onClick={() => setModalType('hotlist')}
                    className="text-[10px] font-black text-blue-600 uppercase"
                  >
                    See All →
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {hotlistOverview.list?.slice(0, 5).map((alert: any, i: number) => (
                    <div key={alert.personCode ?? i} className="p-3 border rounded-lg">
                      <p className="font-bold text-sm">{alert.name}</p>
                      <p className="text-xs text-slate-500">{alert.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>

      {/* MODAL (UNCHANGED) */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setModalType(null)}
            />
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
};

const StatCard = ({ label, value, color, icon, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-6 border-l-8 ${color} rounded-xl flex flex-col justify-between shadow-sm ${onClick ? 'hover:scale-[1.02] cursor-pointer transition' : ''}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-800">{value}</p>
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

export default EngineerDashboard;