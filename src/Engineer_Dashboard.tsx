import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, BellRing, Calendar, Filter, List, X, UserCheck, UserX, UserPlus 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { useAuth } from './context/AuthContext';
import { DashboardNavbar } from './components/DashboardNavbar';
import { DashboardSidebar } from './components/DashboardSidebar';
import type { 
  SystemStats,
  DashboardOverview,
  HotlistOverview,
  TeamAttendance,
} from './api/analytics';
import { 
  getSystemStats, 
  getDashboardOverview, 
  getAttendancePlot, 
  getHotlistOverview,
  getTeamAttendance,
} from './api/analytics';

const EngineerDashboard = () => {
  const { userEmail } = useAuth();
  const [modalType, setModalType] = useState<'hotlist' | 'normal' | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [hotlistOverview, setHotlistOverview] = useState<HotlistOverview | null>(null);
  const [teamAttendanceData, setTeamAttendanceData] = useState<TeamAttendance[]>([]);

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
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/engineer_dashboard' },
    { icon: <Users size={20} />, label: 'Workers', path: '/workers' },
    { icon: <BellRing size={20} />, label: 'Alerts', onClick: () => {} },
    { icon: <Users size={20} />, label: 'Team', path: '/engineer_team' },
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <DashboardSidebar navItems={sidebarItems} />

      {/* ========== Main Content ========== */}
      <main className="flex-1 ml-64">
        <DashboardNavbar 
          title="Engineer Dashboard"
          userEmail={userEmail || undefined}
        />

        <motion.div 
          className="p-8"
          variants={containerVars}
          initial="hidden"
          animate="show"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Engineer Dashboard</h1>
          </div>

          {/* ========== Stat Cards ========== */}
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
              
              {/* ========== Table 1: Recent Admitted ========== */}
              <motion.div variants={itemVars} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 flex justify-between items-center border-b bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Recent Admitted Workers</h3>
                  <Filter size={18} className="text-slate-400 cursor-pointer" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-bold">
                    <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest border-b">
                      <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Team</th><th className="px-6 py-4">Nurse Assigned</th><th className="px-6 py-4">Classification</th><th className="px-6 py-4">Date</th></tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {['Carlito Cruz', 'Alfonso Miguel', 'Mabel Elmanor', 'Oscar Madrid'].map((name, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition">
                          <td className="px-6 py-4 text-slate-800">{name}</td>
                          <td className="px-6 py-4">Structural</td>
                          <td className="px-6 py-4">Maria Cruz, RN</td>
                          <td className="px-6 py-4"><span className={i%2===0 ? 'text-blue-500' : 'text-red-500'}>{i%2===0 ? 'Normal' : 'Hotlist'}</span></td>
                          <td className="px-6 py-4">01/19/26</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* ========== Table 2: Alert Overview ========== */}
              <motion.div variants={itemVars} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 flex justify-between items-center border-b">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Alert Overview</h3>
                  <div className="flex gap-2"><Calendar size={18} className="text-slate-400" /><List size={18} className="text-slate-400" /></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-bold">
                    <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest border-b">
                      <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Team</th><th className="px-6 py-4">Alert</th><th className="px-6 py-4">Time</th><th className="px-6 py-4">Date</th></tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {['Oscar Madrid', 'Carlito Cruz', 'Alfonso Miguel'].map((name, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50 transition">
                          <td className="px-6 py-4">{name}</td>
                          <td className="px-6 py-4">Finishing</td>
                          <td className="px-6 py-4 text-orange-500">Overtime</td>
                          <td className="px-6 py-4">9:00 am</td>
                          <td className="px-6 py-4">01/19/26</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* ========== Charts for Hotlist Attendance ========== */}
              <motion.div variants={itemVars} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase mb-6">Team Attendance Overview</h3>
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
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="rect" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                    <Bar dataKey="present" stackId="a" fill="#818cf8" name="Present" />
                    <Bar dataKey="absent" stackId="a" fill="#f472b6" name="Absent" />
                    <Bar dataKey="leave" stackId="a" fill="#2dd4bf" name="On Leave" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div variants={itemVars} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase mb-6">Attendance Overview Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                    <Line type="monotone" dataKey="hotlist" stroke="#818cf8" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" dataKey="workers" stroke="#f87171" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" dataKey="engineers" stroke="#2dd4bf" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            <div className="space-y-8">
              {hotlistOverview && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Recent Hotlist Alerts</h3>
                    <button className="text-[10px] font-black text-blue-600 hover:underline uppercase">See All →</button>
                  </div>
                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {hotlistOverview.recent_alerts && hotlistOverview.recent_alerts.slice(0, 5).map((alert, i) => (
                      <div key={i} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:border-blue-200 transition bg-white shadow-sm cursor-pointer group">
                        <div>
                          <p className="text-[12px] font-bold text-slate-700">{alert.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">Alert: {alert.alert_type}</p>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 italic group-hover:text-blue-500">{alert.team}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {systemStats && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <h3 className="text-sm font-black text-slate-800 uppercase mb-4">System Summary</h3>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Workers:</span>
                      <span className="font-bold">{systemStats.workers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Admins:</span>
                      <span className="font-bold">{systemStats.admins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Engineers:</span>
                      <span className="font-bold">{systemStats.engineers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nurses:</span>
                      <span className="font-bold">{systemStats.nurses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Staff:</span>
                      <span className="font-bold">{systemStats.staff}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* ========== OVERLAY MODAL ========== */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md" 
              onClick={() => setModalType(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-[30px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Full {modalType} List</h2>
                <button onClick={() => setModalType(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={28}/></button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <table className="w-full text-left font-bold text-sm">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="py-4">Alert Type</th><th className="py-4">Count</th></tr>
                  </thead>
                  <tbody>
                    {hotlistOverview && Object.entries({
                      'Overtime': hotlistOverview.recent_alerts?.filter(a => a.alert_type === 'Overtime').length || 0,
                      'Medical': hotlistOverview.recent_alerts?.filter(a => a.alert_type === 'Medical').length || 0,
                      'Other': hotlistOverview.recent_alerts?.filter(a => !['Overtime', 'Medical'].includes(a.alert_type)).length || 0,
                    }).map(([type, count]) => (
                      <tr key={type} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4">{type}</td>
                        <td className="py-4 text-blue-600 font-black">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========== Sub Components ========== //

const StatCard = ({ label, value, color, icon }: any) => (
  <motion.div 
    variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
    className={`bg-white p-6 rounded-xl border-l-[8px] ${color} shadow-sm flex justify-between items-center hover:shadow-md transition cursor-pointer`}
  >
    <div>
      <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-800">{value}</p>
    </div>
    <div className="text-slate-200 group-hover:text-slate-300 transition">{icon}</div>
  </motion.div>
);

export default EngineerDashboard;