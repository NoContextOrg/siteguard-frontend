import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, UserCheck, UserX, UserPlus, Users
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import type {
  SystemStats,
  DashboardOverview,
  HotlistOverview,
  TeamAttendance,
} from './api/analytics';
import {
  getSystemStats,
  getDashboardOverview,
  getHotlistOverview,
  getTeamAttendance,
} from './api/analytics';
import { getAllPersons } from './api/person';
import { getActiveAlerts } from './api/alert';
import DashboardLayout from './components/DashboardLayout';

const EngineerDashboard = () => {
  const [modalType, setModalType] = useState<'hotlist' | 'normal' | null>(null);
  const [loading, setLoading] = useState(true);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [hotlistOverview, setHotlistOverview] = useState<HotlistOverview | null>(null);
  const [teamAttendanceData, setTeamAttendanceData] = useState<TeamAttendance[]>([]);

  // NEW: backend-connected states
  const [persons, setPersons] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [
          stats,
          overview,
          hotlist,
          teamAttend,
          personsRes,
          alertsRes
        ] = await Promise.all([
          getSystemStats(),
          getDashboardOverview(),
          getHotlistOverview(),
          getTeamAttendance(),
          getAllPersons(),
          getActiveAlerts(),
        ]);

        setSystemStats(stats);
        setDashboardOverview(overview);
        setHotlistOverview(hotlist);
        setTeamAttendanceData(teamAttend);

        setPersons(personsRes || []);
        setAlerts(alertsRes || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
              <StatCard label="Total Workers" value={(systemStats?.workers ?? 0).toString()} color="border-l-blue-400" icon={<Users size={28}/>} />
              <StatCard label="Total Admins" value={(systemStats?.admins ?? 0).toString()} color="border-l-teal-400" icon={<UserCheck size={28}/>} />
              <StatCard label="Hotlist Count" value={(dashboardOverview?.todays_hotlist_alerts ?? 0).toString()} color="border-l-red-400" icon={<UserX size={28}/>} />
              <StatCard label="Today's Attendance" value={(dashboardOverview?.todays_attendance ?? 0).toString()} color="border-l-purple-400" icon={<UserPlus size={28}/>} />
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
                        <td className="px-6 py-4">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="px-6 py-4">{p.role}</td>
                        <td className="px-6 py-4">{p.teamName || 'Unassigned'}</td>
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
                        <td className="px-6 py-4">{a.personName}</td>
                        <td className="px-6 py-4 text-orange-500">{a.alertType}</td>
                        <td className="px-6 py-4">{a.status || 'ACTIVE'}</td>
                        <td className="px-6 py-4">{a.timestamp}</td>
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
                <BarChart data={teamAttendanceData.slice(0, 5).map((t, i) => ({
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
                  {hotlistOverview.recent_alerts?.slice(0, 5).map((alert, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <p className="font-bold text-sm">{alert.name}</p>
                      <p className="text-xs text-slate-500">{alert.alert_type}</p>
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

const StatCard = ({ label, value, color, icon }: any) => (
  <div className={`bg-white p-6 border-l-8 ${color} rounded-xl flex justify-between`}>
    <div>
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
    {icon}
  </div>
);

export default EngineerDashboard;