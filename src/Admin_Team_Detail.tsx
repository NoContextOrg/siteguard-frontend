import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  X,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardLayout from './components/DashboardLayout';
import { getTeamById, getTeamMembers } from './api/team';
import { getTeamAttendance } from './api/analytics';
import { createPersonUi, uploadProfilePicture, getFallbackAvatar } from './api/person';

const AdminTeamDetail = () => {
  const { teamId } = useParams();
  const [activeModal, setActiveModal] = useState<'list' | 'add' | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewWorkerPassword, setShowNewWorkerPassword] = useState(false);

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
        if (attendanceRes && attendanceRes.teamDateCounts) {
          const teamName = (teamRes as any)?.teamName || teamRes?.name;
          const dateCounts = attendanceRes.teamDateCounts[teamName] || {};
          const arr = Object.entries(dateCounts).map(([date, count]) => ({
            name: date,
            Workers: count,
            Hotlist: 0
          }));
          setAttendance(arr);
        } else {
          setAttendance([]);
        }
      } catch (e) {
        // handle error (optional)
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  useEffect(() => {
    return () => {
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let finalProfilePictureUrl = undefined;
      if (selectedFile) {
        finalProfilePictureUrl = await uploadProfilePicture(selectedFile);
      }
      
      let formattedPhone = newWorkerPhone.trim();
      if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.slice(1);
      if (!formattedPhone.startsWith('9')) formattedPhone = '9' + formattedPhone.replace(/^\+?63/, '');
      formattedPhone = '+63' + formattedPhone;

      await createPersonUi({
        name: newWorkerName,
        email: newWorkerEmail,
        phone: formattedPhone,
        role: 'WORKER',
        password: newWorkerPassword,
        profilePictureUrl: finalProfilePictureUrl,
        teamId: Number(teamId)
      } as any);
      
      alert('Worker added to team successfully!');
      setActiveModal(null);
      setNewWorkerName('');
      setNewWorkerEmail('');
      setNewWorkerPhone('');
      setNewWorkerPassword('');
      setSelectedFile(null);
      setPreviewUrl(null);
      
      const numericTeamId = Number(teamId);
      const membersRes = await getTeamMembers(numericTeamId);
      setMembers(membersRes);
    } catch (err: any) {
      alert(err.message || 'Failed to add worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== PDF GENERATION LOGIC ========== //
  const downloadAttendancePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const teamName = team?.teamName || 'TEAM';
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text(`Team Attendance Report`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Team: ${teamName}`, 14, 32);
    doc.text(`Date: ${date}`, 14, 38);
    let headerY = 38;
    if (team?.siteEngineerName) {
      headerY = 44;
      doc.text(`Engineer: ${team.siteEngineerName}`, 14, headerY);
    }
    
    // Divider
    const dividerY = headerY + 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(14, dividerY, 196, dividerY);
    
    // Summary section
    const summaryTitleY = dividerY + 10;
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Summary Overview`, 14, summaryTitleY);
    doc.setFont('helvetica', 'normal');
    
    const summaryDataY = summaryTitleY + 8;
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Total Workers: ${members.length}`, 14, summaryDataY);
    doc.text(`Hotlisted: ${hotlistMembers.length}`, 60, summaryDataY);
    doc.text(`Normal: ${normalMembers.length}`, 100, summaryDataY);

    autoTable(doc, {
      startY: summaryDataY + 8,
      head: [['Worker Name', 'Status', 'Role', 'Time In']],
      body: members.map(m => [m.firstName + ' ' + m.lastName, m.status || '-', m.role || '-', m.timeIn || '-']),
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 14, right: 14 },
    });
    doc.save(`Attendance_${teamName.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
  };

  if (loading) return <DashboardLayout title="Team"><div className="p-8">Loading…</div></DashboardLayout>;

  // Split members by hotlist/normal (if status or role is available)
  const hotlistMembers = members.filter(m => (m.status || '').toLowerCase() === 'hotlist');
  const normalMembers = members.filter(m => (m.status || '').toLowerCase() !== 'hotlist');

  return (
    <DashboardLayout title="Team">
      <div className="p-8">
          <h1 className="text-3xl font-black !text-slate-950 mb-8 uppercase tracking-tight">{team?.teamName || 'TEAM'}</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black !text-slate-950 uppercase">{team?.teamName || ''}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">{team?.siteEngineerName || ''}</p>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Hotlist Card */}
                  <div className="border-2 border-slate-100 rounded-2xl p-6 relative">
                    <h3 className="text-md font-black !text-slate-950 uppercase">Hotlist Workers</h3>
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
                    <h3 className="text-md font-black !text-slate-950 uppercase">Normal Workers</h3>
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
                  <h3 className="text-sm font-black !text-slate-950 uppercase mb-4">Overtime Overview</h3>
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
                  <h3 className="text-lg font-black !text-slate-950 uppercase mb-4 tracking-tighter">Hotlist Workers</h3>
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
                  <h3 className="text-lg font-black !text-slate-950 uppercase mb-4 tracking-tighter">Normal Workers</h3>
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
              <h2 className="text-xl font-black !text-slate-950 uppercase tracking-widest">Full Team List - {team?.teamName || ''}</h2>
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
              <h2 className="text-xl font-black !text-slate-950 uppercase tracking-widest">Add Worker to {team?.teamName || ''}</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={24}/></button>
            </div>
            <form className="p-8 space-y-4" onSubmit={handleAddWorker}>
                {/* Profile Picture Upload Section */}
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-full border-2 border-dashed border-blue-200 overflow-hidden flex items-center justify-center bg-white">
                    <img src={previewUrl || getFallbackAvatar(newWorkerName)} alt="Preview" className={`h-full w-full object-cover ${!previewUrl && 'opacity-60'}`} onError={(e) => { e.currentTarget.src = getFallbackAvatar(newWorkerName); }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-2">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition cursor-pointer" />
                  </div>
                </div>
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Full Name</label>
                    <input type="text" required value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
                </div>
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Email</label>
                    <input type="email" required value={newWorkerEmail} onChange={e => setNewWorkerEmail(e.target.value)} placeholder="e.g. juan@example.com" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
                </div>
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Phone</label>
                    <input type="text" required value={newWorkerPhone} onChange={e => setNewWorkerPhone(e.target.value.replace(/[^\d]/g, ''))} placeholder="e.g. 9123456789" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm" />
                </div>
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Set Password</label>
                    <div className="relative">
                      <input type={showNewWorkerPassword ? "text" : "password"} required minLength={6} value={newWorkerPassword} onChange={e => setNewWorkerPassword(e.target.value)} className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm pr-10" />
                      <button type="button" onClick={() => setShowNewWorkerPassword(!showNewWorkerPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600">
                        {showNewWorkerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition mt-4 disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Worker'}
                </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminTeamDetail;