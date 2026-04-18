import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, LogOut, Bell, ChevronDown, X, Download,  Search 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ========== Mock Data ========== //
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

const teamMembers = [
  { id: '1', name: 'Marion Delos Santos', status: 'On-Site', type: 'Hotlist' },
  { id: '2', name: 'Kaloy Samonte', status: 'On-Site', type: 'Hotlist' },
  { id: '3', name: 'Orlito Macapuno', status: 'Off-Site', type: 'Hotlist' },
  { id: '4', name: 'Pedro Tangkay', status: 'On-Site', type: 'Normal' },
  { id: '5', name: 'Erina Lamoso', status: 'On-Site', type: 'Normal' },
];

const AdminTeamDetail = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'list' | 'add' | null>(null);

  // ========== PDF GENERATION LOGIC ========== //
  const downloadAttendancePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    doc.setFontSize(18);
    doc.text("Daily Attendance Report - MEPF TEAM", 14, 20);
    doc.setFontSize(11);
    doc.text(`Engineer: Albert Santos`, 14, 30);
    doc.text(`Date: ${date}`, 14, 35);

    autoTable(doc, {
      startY: 45,
      head: [['Worker Name', 'Status', 'Classification', 'Time In']],
      body: [
        ['Marion Delos Santos', 'On-Site', 'Hotlist', '08:00 AM'],
        ['Kaloy Samonte', 'On-Site', 'Hotlist', '08:15 AM'],
        ['Pedro Tangkay', 'On-Site', 'Normal', '07:50 AM'],
        ['Erina Lamoso', 'On-Site', 'Normal', '08:05 AM'],
        ['Orlito Macapuno', 'Off-Site', 'Hotlist', '-'],
      ],
      headStyles: { fillColor: [30, 58, 138] } // SiteGuard Blue
    });

    doc.save(`Attendance_MEPF_${date}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans relative">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg"><Search className="text-blue-600 w-6 h-6" /></div>
          <span className="text-xl font-bold tracking-tight">SiteGuard</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => navigate('/admin_dashboard')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <LayoutDashboard size={20} /> <span className="text-sm font-semibold uppercase">Dashboard</span>
          </button>
          <button onClick={() => navigate('/workers')} className="flex items-center gap-4 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Workers</span>
          </button>
          <button onClick={() => navigate('/team')} className="flex items-center gap-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
            <Users size={20} /> <span className="text-sm font-semibold uppercase">Team</span>
          </button>
        </nav>
        <button onClick={() => navigate('/')} className="p-6 flex items-center gap-4 text-slate-400 hover:text-white mt-auto"><LogOut size={20} /> <span className="font-semibold">Logout</span></button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <header className="bg-[#1e3a8a] text-white h-16 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2"><img src="/logo.png" alt="Logo" className="w-8 h-8 invert" /><span className="text-xl font-bold uppercase tracking-widest">SiteGuard</span></div>
          <div className="flex items-center gap-6"><Bell size={20} /><div className="flex items-center gap-3 border-l border-white/20 pl-6"><div className="text-right"><p className="text-xs font-bold">Ysa Dela Fuente</p></div><div className="w-10 h-10 bg-slate-300 rounded-full"></div><ChevronDown size={16} /></div></div>
        </header>

        <div className="p-8">
          <h1 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">TEAM</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 uppercase">MEPF</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">ENGR. ALBERT SANTOS</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Hotlist Card */}
                  <div className="border-2 border-slate-100 rounded-2xl p-6 relative">
                    <h3 className="text-md font-black text-slate-800 uppercase">Hotlist Workers</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Users size={32} className="text-red-400" /><span className="text-4xl font-black text-red-400">20</span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
                      <button onClick={() => setActiveModal('list')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1">See List →</button>
                      <button onClick={() => setActiveModal('add')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1">Add Worker →</button>
                    </div>
                  </div>
                  {/* Normal Card */}
                  <div className="border-2 border-slate-100 rounded-2xl p-6 relative">
                    <h3 className="text-md font-black text-slate-800 uppercase">Normal Workers</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Users size={32} className="text-blue-400" /><span className="text-4xl font-black text-blue-400">50</span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
                      <button onClick={() => setActiveModal('list')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1">See List →</button>
                      <button onClick={() => setActiveModal('add')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1">Add Worker →</button>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-slate-100 rounded-2xl p-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Overtime Overview</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overtimeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                        <Line type="monotone" dataKey="Hotlist" stroke="#818cf8" strokeWidth={3} dot={{r: 4}} />
                        <Line type="monotone" dataKey="Workers" stroke="#f87171" strokeWidth={3} dot={{r: 4}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[700px]">
              <div className="p-6">
                <button 
                  onClick={downloadAttendancePDF}
                  className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition"
                >
                  <Download size={18} /> Download Attendance
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                <section>
                  <h3 className="text-lg font-black text-slate-800 uppercase mb-4 tracking-tighter">Hotlist Workers</h3>
                  <div className="space-y-2">
                    {teamMembers.filter(m => m.type === 'Hotlist').map(m => (
                      <div key={m.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center bg-white shadow-sm">
                        <span className="text-[12px] font-bold text-slate-700">{m.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-black text-slate-800 uppercase mb-4 tracking-tighter">Normal Workers</h3>
                  <div className="space-y-2">
                    {teamMembers.filter(m => m.type === 'Normal').map(m => (
                      <div key={m.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center bg-white shadow-sm">
                        <span className="text-[12px] font-bold text-slate-700">{m.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========== MODALS ========== */}

      {/* 1. See List Table Overlay */}
      {activeModal === 'list' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Full Team List - MEPF</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={24}/></button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black text-slate-400 uppercase border-b">
                  <tr><th className="px-4 py-3">Worker Name</th><th className="px-4 py-3">Classification</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="font-bold text-slate-600">
                  {teamMembers.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3">{m.type}</td>
                      <td className="px-4 py-3 text-blue-600 italic">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Worker Form Popout */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Add Worker to MEPF</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={24}/></button>
            </div>
            <form className="p-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Search Worker Name</label>
                    <input type="text" placeholder="Start typing name..." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
                </div>
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Assign Date</label>
                    <input type="date" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
                </div>
                <button onClick={() => setActiveModal(null)} className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition mt-4">Confirm Addition</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTeamDetail;