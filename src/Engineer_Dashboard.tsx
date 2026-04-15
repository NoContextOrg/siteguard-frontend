import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, BellRing, LogOut, Bell, ChevronDown, 
  Search, Calendar, Filter, List, X, UserCheck, UserX, UserPlus 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line 
} from 'recharts';

// ========== Dummy Data ========== //
const hotlistAttendanceData = [
  { name: 'Jan 6', 'Line & Grade': 15, MEPF: 13, Finishing: 25, Structural: 30, Masonry: 15 },
  { name: 'Jan 7', 'Line & Grade': 24, MEPF: 25, Finishing: 24, Structural: 30, Masonry: 24 },
  { name: 'Jan 8', 'Line & Grade': 30, MEPF: 19, Finishing: 13, Structural: 15, Masonry: 19 },
  { name: 'Jan 9', 'Line & Grade': 24, MEPF: 30, Finishing: 25, Structural: 15, Masonry: 13 },
  { name: 'Jan 10', 'Line & Grade': 30, MEPF: 24, Finishing: 25, Structural: 19, Masonry: 30 },
];

const generalTrendData = [
  { name: 'Jan 01', Hotlist: 60, Workers: 85, Engineers: 40 },
  { name: 'Jan 03', Hotlist: 78, Workers: 110, Engineers: 90 },
  { name: 'Jan 05', Hotlist: 40, Workers: 82, Engineers: 50 },
  { name: 'Jan 08', Hotlist: 55, Workers: 90, Engineers: 100 },
  { name: 'Jan 10', Hotlist: 35, Workers: 70, Engineers: 45 },
  { name: 'Jan 12', Hotlist: 75, Workers: 145, Engineers: 110 },
];

const workerList = [
  { name: 'Marion Delos Santos', lastAdmitted: '01/19/2026', status: 'On-Site', type: 'Hotlist' },
  { name: 'Kaloy Samonte', lastAdmitted: '01/11/2026', status: 'On-Site', type: 'Hotlist' },
  { name: 'Orlito Macapuno', lastAdmitted: '12/5/2025', status: 'Off-Site', type: 'Hotlist' },
  { name: 'Pedro Tangkay', lastAdmitted: '01/20/2026', status: 'On-Site', type: 'Normal' },
  { name: 'Salvi Kapuno', lastAdmitted: '01/15/2026', status: 'Off-Site', type: 'Normal' },
];

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<'hotlist' | 'normal' | null>(null);
  const [selectedDate, setSelectedDate] = useState('01/19/26');

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
      {/* ========== Sidebar ========== */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg border shadow-sm">
             <img src="/logo.png" alt="SG" className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiteGuard</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button className="flex items-center gap-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
            <LayoutDashboard size={20} /> <span className="text-sm font-semibold uppercase">Dashboard</span>
          </button>
          <button onClick={() => navigate('/workers')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Workers</span>
          </button>
          <button className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <BellRing size={20} /> <span className="text-sm font-semibold uppercase">Alerts</span>
          </button>
          <button onClick={() => navigate('/engineer_team')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Team</span>
          </button>
        </nav>
        <button onClick={() => navigate('/')} className="p-6 flex items-center gap-4 text-slate-400 hover:text-white mt-auto border-t border-slate-700">
          <LogOut size={20} /> <span className="font-semibold">Logout</span>
        </button>
      </aside>

      {/* ========== Main Content ========== */}
      <main className="flex-1 ml-64">
        <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
             <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
                <Search size={20} />
            </div>
            <span className="text-xl font-bold uppercase tracking-widest">SiteGuard</span>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="cursor-pointer hover:scale-110 transition" />
            <div className="flex items-center gap-3 border-l border-white/20 pl-6 cursor-pointer group">
              <div className="text-right">
                <p className="text-xs font-bold">Ysa Dela Fuente</p>
                <p className="text-[10px] opacity-70 italic">Engineer View</p>
              </div>
              <div className="w-10 h-10 bg-slate-300 rounded-full border-2 border-white/50 group-hover:border-blue-300 transition" />
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <motion.div 
          className="p-8"
          variants={containerVars}
          initial="hidden"
          animate="show"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Engineer Dashboard</h1>
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                <Calendar size={18} className="text-blue-600" />
                <input 
                  type="date" 
                  className="text-xs font-bold text-slate-600 outline-none" 
                  defaultValue="2026-01-19"
                />
            </div>
          </div>

          {/* ========== Stat Cards ========== */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Workers" value="100" color="border-l-blue-400" icon={<Users size={28}/>} />
            <StatCard label="Onsite Workers" value="70" color="border-l-teal-400" icon={<UserCheck size={28}/>} />
            <StatCard label="Hotlist Workers" value="25" color="border-l-red-400" icon={<UserX size={28}/>} />
            <StatCard label="Workers Admitted" value="8" color="border-l-purple-400" icon={<UserPlus size={28}/>} />
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
                <h3 className="text-sm font-black text-slate-800 uppercase mb-6">Hotlist Attendance Overview</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hotlistAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="rect" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                    <Bar dataKey="Line & Grade" stackId="a" fill="#818cf8" />
                    <Bar dataKey="MEPF" stackId="a" fill="#f472b6" />
                    <Bar dataKey="Finishing" stackId="a" fill="#2dd4bf" />
                    <Bar dataKey="Structural" stackId="a" fill="#fb923c" />
                    <Bar dataKey="Masonry" stackId="a" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div variants={itemVars} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase mb-6">Attendance Overview Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={generalTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                    <Line type="monotone" dataKey="Hotlist" stroke="#818cf8" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" dataKey="Workers" stroke="#f87171" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" dataKey="Engineers" stroke="#2dd4bf" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            <div className="space-y-8">
              <WorkerSidebarList title="Hotlist Workers" list={workerList.filter(w => w.type === 'Hotlist')} onSeeList={() => setModalType('hotlist')} />
              <WorkerSidebarList title="Normal Workers" list={workerList.filter(w => w.type === 'Normal')} onSeeList={() => setModalType('normal')} />
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
                    <tr><th className="py-4">Worker Name</th><th className="py-4">Last Admitted</th><th className="py-4">Status</th></tr>
                  </thead>
                  <tbody>
                    {workerList.map((w, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4">{w.name}</td>
                        <td className="py-4 text-slate-400">{w.lastAdmitted}</td>
                        <td className="py-4 text-blue-600 italic">{w.status}</td>
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

const WorkerSidebarList = ({ title, list, onSeeList }: any) => (
  <motion.div variants={{ hidden: { x: 20, opacity: 0 }, show: { x: 0, opacity: 1 } }} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">{title}</h3>
      <button onClick={onSeeList} className="text-[10px] font-black text-blue-600 hover:underline uppercase">See List →</button>
    </div>
    <div className="p-4 space-y-3">
      {list.map((w: any, i: number) => (
        <div key={i} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:border-blue-200 transition bg-white shadow-sm cursor-pointer group">
          <div>
            <p className="text-[12px] font-bold text-slate-700">{w.name}</p>
            <p className="text-[9px] text-slate-400 font-medium">Last Admitted: {w.lastAdmitted}</p>
          </div>
          <span className="text-[10px] font-black text-slate-400 italic group-hover:text-blue-500">{w.status}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default EngineerDashboard;