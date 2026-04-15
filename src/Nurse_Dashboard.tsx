import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BellRing, LogOut, Search, Bell, ChevronDown, UserCheck, UserX, HardHat, ShieldAlert, ArrowUpRight, Users2, Calendar, Filter, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// ========== DUMMY DATA FOR CHARTS (ayoko na) ========== //
const attendanceData = [
  { name: 'Jan 1', Hotlist: 21, Workers: 15, Engineers: 4 },
  { name: 'Jan 2', Hotlist: 30, Workers: 10, Engineers: 9 },
  { name: 'Jan 3', Hotlist: 42, Workers: 8, Engineers: 11 },
  { name: 'Jan 4', Hotlist: 21, Workers: 3, Engineers: 2 },
  { name: 'Jan 5', Hotlist: 45, Workers: 6, Engineers: 1 },
];

const hotlistTeamData = [
  { name: 'Jan 6', 'Line & Grade': 25, MEPF: 13, Finishing: 25, Structural: 15, Masonry: 15 },
  { name: 'Jan 7', 'Line & Grade': 28, MEPF: 25, Finishing: 24, Structural: 30, Masonry: 24 },
  { name: 'Jan 8', 'Line & Grade': 15, MEPF: 13, Finishing: 15, Structural: 19, Masonry: 19 },
];

const teamAttendancePie = [
  { name: 'Present', value: 340, color: '#818cf8' },
  { name: 'Absent', value: 45, color: '#f87171' },
  { name: 'On Leave', value: 21, color: '#2dd4bf' },
  { name: 'Overtime', value: 94, color: '#fb923c' },
];

const NurseDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* ========== SIDEBAR ========== */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg">
            <ShieldAlert className="text-blue-600 w-6 h-6" />
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
        </nav>

        <button onClick={() => navigate('/')} className="p-6 flex items-center gap-4 text-slate-400 hover:text-white transition mt-auto border-t border-slate-700">
          <LogOut size={20} /> <span className="font-semibold">Logout</span>
        </button>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
                <Search size={20} />
            </div>
            <span className="text-xl font-bold uppercase tracking-widest">SiteGuard</span>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="cursor-pointer" />
            <div className="flex items-center gap-3 border-l border-white/20 pl-6">
              <div className="text-right">
                <p className="text-xs font-bold">Ysa Dela Fuente</p>
                <p className="text-[12px] opacity-70">ysadelafuente@gmail.com</p>
              </div>
              <div className="w-10 h-10 bg-slate-300 rounded-full overflow-hidden border-2 border-white/50">
                 <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" alt="Admin" />
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="p-8">
          <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Nurse Dashboard</h2>

          {/* ========== TOP STAT CARDS ========== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Total Workers" value="530" icon={<Users className="text-blue-400" size={28}/>} borderColor="border-l-blue-500" />
            <StatCard label="Onsite Workers" value="450" icon={<UserCheck className="text-teal-400" size={28}/>} borderColor="border-l-teal-500" />
            <StatCard label="Site Engineers" value="35" icon={<HardHat className="text-blue-300" size={28}/>} borderColor="border-l-blue-300" />
            <StatCard label="Hotlist Workers" value="210" icon={<UserX className="text-red-400" size={28}/>} borderColor="border-l-red-500" />
            <StatCard label="Workers Admitted" value="23" icon={<Users size={28}/>} borderColor="border-l-purple-500" />
            <StatCard label="Site Engineers Admitted" value="4" icon={<HardHat size={28}/>} borderColor="border-l-indigo-500" />
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-400 uppercase font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Team</th>
                                <th className="px-6 py-3">Alert</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-600">
                            {[
                                { name: 'Oscar Madrid', team: 'Structural', alert: 'Overtime', time: '8:40 am', date: '01/19/26' },
                                { name: 'Carlito Cruz', team: 'Line & Grade', alert: 'Admitted', time: '8:30 am', date: '01/19/26' },
                                { name: 'Alfonso Miguel', team: 'Finishing', alert: 'Admitted', time: '8:35 am', date: '01/19/26' },
                                { name: 'Ernesto Tornito', team: 'MEPF', alert: 'Overtime', time: '9:00 am', date: '01/19/26' },
                            ].map((row, i) => (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                                    <td className="px-6 py-3">{row.name}</td>
                                    <td className="px-6 py-3">{row.team}</td>
                                    <td className="px-6 py-3">{row.alert}</td>
                                    <td className="px-6 py-3">{row.time}</td>
                                    <td className="px-6 py-3">{row.date}</td>
                                </tr>
                            ))}
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
              <ChartContainer title="Hotlist Attendance Overview" subtitle="This bar graph shows how many hotlist per team is present.">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hotlistTeamData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip />
                        <Legend iconType="rect" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                        <Bar dataKey="Line & Grade" stackId="a" fill="#818cf8" />
                        <Bar dataKey="MEPF" stackId="a" fill="#f472b6" />
                        <Bar dataKey="Finishing" stackId="a" fill="#2dd4bf" />
                        <Bar dataKey="Structural" stackId="a" fill="#fb923c" />
                        <Bar dataKey="Masonry" stackId="a" fill="#94a3b8" />
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
                        {[
                            { name: 'Maria Lopez', status: 'Offsite', color: 'bg-blue-500' },
                            { name: 'Karlito Pelaez', status: 'Onsite', color: 'bg-green-500' },
                            { name: 'Gilbert Ilurado', status: 'Offsite', color: 'bg-blue-500' },
                            { name: 'Maybelline Delgado', status: 'Offsite', color: 'bg-blue-500' },
                            { name: 'Albert Mejorao', status: 'Offsite', color: 'bg-blue-500' },
                        ].map((worker, i) => (
                            <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Users size={16} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-700">{worker.name}</p>
                                        <div className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${worker.color}`} />
                                            <span className="text-[9px] font-bold text-slate-400 italic">{worker.status}</span>
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
                        ))}
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
                            <span className="text-3xl font-black text-slate-800">500</span>
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
      </main>
    </div>
  );
};

// ========== SUB-COMPONENTS ========== //

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