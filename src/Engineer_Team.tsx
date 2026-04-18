import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BellRing, LogOut, Search, Bell, 
  ChevronDown, X, List, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';

// ========== Dummy Data for the Chart ========== //
const overtimeData = [
  { name: 'Jan 01', Hotlist: 60, Workers: 85 },
  { name: 'Jan 02', Hotlist: 55, Workers: 120 },
  { name: 'Jan 03', Hotlist: 78, Workers: 95 },
  { name: 'Jan 04', Hotlist: 80, Workers: 110 },
  { name: 'Jan 05', Hotlist: 40, Workers: 82 },
  { name: 'Jan 06', Hotlist: 65, Workers: 130 },
  { name: 'Jan 07', Hotlist: 50, Workers: 120 },
  { name: 'Jan 08', Hotlist: 55, Workers: 80 },
  { name: 'Jan 09', Hotlist: 30, Workers: 50 },
  { name: 'Jan 10', Hotlist: 45, Workers: 85 },
  { name: 'Jan 11', Hotlist: 35, Workers: 70 },
  { name: 'Jan 12', Hotlist: 75, Workers: 145 },
];

// ========== Dummy Data for the Table ========== //
const workersData = [
  { name: 'JUAN DELA CRUZ', team: 'MASONRY', attendance: 'PRESENT', engineer: 'ENGR. SANTOS', lastAdmitted: 'N/A', status: 'NORMAL' },
  { name: 'MARIA LOPEZ', team: 'LINE & GRADE', attendance: 'ABSENT', engineer: 'ENGR. MACASPAC', lastAdmitted: '01/19/26', status: 'HOTLIST' },
  { name: 'PEDRO RAMOS', team: 'MASONRY', attendance: 'ON LEAVE', engineer: 'ENGR. CRUZ', lastAdmitted: 'N/A', status: 'NORMAL' },
  { name: 'ANA VILLANUEVA', team: 'LINE & GRADE', attendance: 'PRESENT', engineer: 'ENGR. LIMUNOZ', lastAdmitted: 'N/A', status: 'NORMAL' },
  { name: 'ROBERTO MENDOZA', team: 'MEPF', attendance: 'ON LEAVE', engineer: 'ENGR. LIMUNOZ', lastAdmitted: '01/19/26', status: 'HOTLIST' },
  { name: 'LIZA FERNANDEZ', team: 'STRUCTURAL', attendance: 'PRESENT', engineer: 'ENGR. MACASPAC', lastAdmitted: 'N/A', status: 'NORMAL' },
  { name: 'NOEL BAUTISTA', team: 'FINISHING', attendance: 'ABSENT', engineer: 'ENGR. MACASPAC', lastAdmitted: 'N/A', status: 'NORMAL' },
  { name: 'RAMON GUTIERREZ', team: 'STRUCTURAL', attendance: 'PRESENT', engineer: 'ENGR. LIMUNOZ', lastAdmitted: 'N/A', status: 'NORMAL' },
  { name: 'JENNY MORALES', team: 'FINISHING', attendance: 'LATE', engineer: 'ENGR. CRUZ', lastAdmitted: '01/19/26', status: 'HOTLIST' },
  { name: 'CARLO NAVARRO', team: 'MASONRY', attendance: 'PRESENT', engineer: 'ENGR. MACASPAC', lastAdmitted: 'N/A', status: 'NORMAL' },
];

const EngineerTeam = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'list' | 'add' | null>(null);

  const filteredWorkers = workersData.filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      
      {/* ========== SIDEBAR ========== */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg">
             <img src="/logo.png" alt="SG" className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiteGuard</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => navigate('/engineer_dashboard')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <LayoutDashboard size={20} /> <span className="text-sm font-semibold uppercase">Dashboard</span>
          </button>
          <button onClick={() => navigate('/workers')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Workers</span>
          </button>
          <button className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <BellRing size={20} /> <span className="text-sm font-semibold uppercase">Alerts</span>
          </button>
          <button className="flex items-center gap-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Team</span>
          </button>
        </nav>
        <button onClick={() => navigate('/')} className="p-6 flex items-center gap-4 text-slate-400 hover:text-white transition mt-auto border-t border-slate-700">
          <LogOut size={20} /> <span className="font-semibold">Logout</span>
        </button>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 ml-64">
        
        {/* ========== Header ========== */}
        <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30 shadow-md">
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
                <p className="text-[10px] opacity-70">ysadelafuente@gmail.com</p>
              </div>
              <div className="w-10 h-10 bg-slate-300 rounded-full border-2 border-white/50"></div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="p-10">

          {/* ========== MEPF Summary Section ========== */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-xl font-black text-slate-800 uppercase">MEPF</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">ENGR. ALBERT SANTOS</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* ========== Hotlist Card ========== */}
              <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
                <Users size={40} className="text-red-400" />
                <div>
                  <h3 className="text-md font-black text-slate-800 uppercase">Hotlist Workers</h3>
                  <span className="text-5xl font-black text-red-400">20</span>
                </div>
                <div className="absolute bottom-4 right-6 text-right space-y-1">
                  <button onClick={() => setModalType('list')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-1">See List →</button>
                  <button onClick={() => setModalType('add')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-1">Add Worker →</button>
                </div>
              </div>

              {/* ========== Normal Card ========== */}
              <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
                <Users size={40} className="text-blue-400" />
                <div>
                  <h3 className="text-md font-black text-slate-800 uppercase">Normal Workers</h3>
                  <span className="text-5xl font-black text-blue-400">50</span>
                </div>
                <div className="absolute bottom-4 right-6 text-right space-y-1">
                  <button onClick={() => setModalType('list')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-1">See List →</button>
                  <button onClick={() => setModalType('add')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase flex items-center gap-1">Add Worker →</button>
                </div>
              </div>
            </div>

            {/* ========== Overtime Overview Chart ========== */}
            <div className="border-2 border-slate-100 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase">Overtime Overview</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">This bar graph shows how many workers are working overtime.</p>
                </div>
                <Calendar size={20} className="text-slate-800" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overtimeData}>
                    <defs>
                      <linearGradient id="colorHotlist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWorkers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                    <Area type="monotone" dataKey="Hotlist" stroke="#818cf8" fillOpacity={1} fill="url(#colorHotlist)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Workers" stroke="#f87171" fillOpacity={1} fill="url(#colorWorkers)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ========== Worker Table Section ========== */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Controls */}
            <div className="p-6 flex flex-wrap gap-4 items-center justify-between bg-white border-b border-slate-100">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:border-blue-500 transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                 <Calendar className="text-slate-400 cursor-pointer" size={20} />
                 <List className="text-slate-400 cursor-pointer" size={20} />
              </div>
            </div>

            {/* ========== The Table ========== */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[11px] font-bold">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Assigned Team</th>
                    <th className="px-6 py-4">Attendance</th>
                    <th className="px-6 py-4">Assigned Engineer</th>
                    <th className="px-6 py-4">Last Admitted</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {filteredWorkers.map((worker, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-slate-900">{worker.name}</td>
                      <td className="px-6 py-4 uppercase">{worker.team}</td>
                      <td className="px-6 py-4 uppercase">{worker.attendance}</td>
                      <td className="px-6 py-4 uppercase">{worker.engineer}</td>
                      <td className="px-6 py-4 uppercase">{worker.lastAdmitted}</td>
                      <td className={`px-6 py-4 uppercase ${worker.status === 'HOTLIST' ? 'text-red-500 font-black' : 'text-slate-500'}`}>
                        {worker.status}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => navigate('/worker-profile')} className="text-blue-500 font-black uppercase hover:underline flex items-center gap-1 justify-center"> View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ========== OVERLAY MODALS ========== */}
      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setModalType(null)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[30px] shadow-2xl animate-in zoom-in duration-300">
             <div className="p-8 border-b flex justify-between items-center">
                <h2 className="text-xl font-black uppercase text-slate-800">
                  {modalType === 'list' ? 'See Full Worker List' : 'Add Worker to Team'}
                </h2>
                <X className="cursor-pointer" onClick={() => setModalType(null)} />
             </div>
             <div className="p-8">
                {modalType === 'add' ? (
                   <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <div className="bg-[#f0f7ff] border border-slate-200 rounded-xl p-4">
                        <label className="text-[10px] font-black uppercase text-blue-900">Worker Name</label>
                        <input type="text" placeholder="Search..." className="w-full bg-transparent outline-none font-bold" />
                      </div>
                      <button onClick={() => setModalType(null)} className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-900 transition">Submit Addition</button>
                   </form>
                ) : (
                  <div className="text-center py-10 font-bold text-slate-400 uppercase tracking-widest">List Component Content Here</div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerTeam;