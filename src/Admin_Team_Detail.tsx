import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  X,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardLayout from './components/DashboardLayout';
import { getTeamById, getTeamMembers } from './api/team';
import { getTeamAttendance } from './api/analytics';

const AdminTeamDetail = () => {
  const { teamId } = useParams();
  const [activeModal, setActiveModal] = useState<'list' | 'add' | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const numericTeamId = Number(teamId);
        const teamRes = await getTeamById(numericTeamId);
        setTeam(teamRes);
        const membersRes = await getTeamMembers(numericTeamId);
        setMembers(membersRes);
        const attendanceRes = await getTeamAttendance();
        setAttendance(Array.isArray(attendanceRes) ? attendanceRes : []);
      } catch (e) {
        // handle error (optional)
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  // ========== PDF GENERATION LOGIC ========== //
  const downloadAttendancePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.text(`Daily Attendance Report - ${team?.teamName || ''} TEAM`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Engineer: ${team?.siteEngineerName || ''}`, 14, 30);
    doc.text(`Date: ${date}`, 14, 35);
    autoTable(doc, {
      startY: 45,
      head: [['Worker Name', 'Status', 'Role', 'Time In']],
      body: members.map(m => [m.firstName + ' ' + m.lastName, m.status, m.role, m.timeIn || '-']),
      headStyles: { fillColor: [30, 58, 138] }
    });
    doc.save(`Attendance_${team?.teamName || 'Team'}_${date}.pdf`);
  };

  if (loading) return <DashboardLayout title="Team"><div className="p-8">Loading…</div></DashboardLayout>;

  // Split members by hotlist/normal (if status or role is available)
  const hotlistMembers = members.filter(m => (m.status || '').toLowerCase() === 'hotlist');
  const normalMembers = members.filter(m => (m.status || '').toLowerCase() !== 'hotlist');

  return (
    <DashboardLayout title="Team">
      <div className="p-8">
          <h1 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">{team?.teamName || 'TEAM'}</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 uppercase">{team?.teamName || ''}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">{team?.siteEngineerName || ''}</p>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Hotlist Card */}
                  <div className="border-2 border-slate-100 rounded-2xl p-6 relative">
                    <h3 className="text-md font-black text-slate-800 uppercase">Hotlist Workers</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Users size={32} className="text-red-400" /><span className="text-4xl font-black text-red-400">{hotlistMembers.length}</span>
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
                      <Users size={32} className="text-blue-400" /><span className="text-4xl font-black text-blue-400">{normalMembers.length}</span>
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
                      <LineChart data={attendance}>
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
                    {hotlistMembers.map(m => (
                      <div key={m.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center bg-white shadow-sm">
                        <span className="text-[12px] font-bold text-slate-700">{m.firstName} {m.lastName}</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-lg font-black text-slate-800 uppercase mb-4 tracking-tighter">Normal Workers</h3>
                  <div className="space-y-2">
                    {normalMembers.map(m => (
                      <div key={m.id} className="border border-slate-100 p-4 rounded-xl flex justify-between items-center bg-white shadow-sm">
                        <span className="text-[12px] font-bold text-slate-700">{m.firstName} {m.lastName}</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
      </div>
      {/* ========== MODALS ========== */}
      {/* 1. See List Table Overlay */}
      {activeModal === 'list' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Full Team List - {team?.teamName || ''}</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={24}/></button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black text-slate-400 uppercase border-b">
                  <tr><th className="px-4 py-3">Worker Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="font-bold text-slate-600">
                  {members.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">{m.firstName} {m.lastName}</td>
                      <td className="px-4 py-3">{m.role}</td>
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
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Add Worker to {team?.teamName || ''}</h2>
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
    </DashboardLayout>
  );
};

export default AdminTeamDetail;