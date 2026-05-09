import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  X,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from './components/DashboardLayout';
import { Link } from 'react-router-dom';
import { getAllPersons, createPersonUi, uploadProfilePicture, getFallbackAvatar } from './api/person';
import type { PersonResponse } from './api/person';
import { getOvertimeOverview, getUnifiedDashboard } from './api/analytics';
import { getActiveAlertCount } from './api/alert';

// ================= TYPES ================= //
type OvertimePoint = {
  name: string;
  Hotlist: number;
  Workers: number;
};

// ================= COMPONENT ================= //
const EngineerTeam = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [modalType, setModalType] = useState<'list' | 'add' | null>(null);

  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [overtimeData, setOvertimeData] = useState<OvertimePoint[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<number>(0);
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
        profilePictureUrl: finalProfilePictureUrl
      });
      
      alert('Worker added successfully!');
      setModalType(null);
      setNewWorkerName('');
      setNewWorkerEmail('');
      setNewWorkerPhone('');
      setNewWorkerPassword('');
      setSelectedFile(null);
      setPreviewUrl(null);
      
      const personsData = await getAllPersons();
      setPersons(personsData || []);
    } catch (err: any) {
      alert(err.message || 'Failed to add worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= FETCH DATA ================= //
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [personsData, , unifiedData, alertsJson] = await Promise.all([
          getAllPersons(),
          getOvertimeOverview(),
          getUnifiedDashboard(),
          getActiveAlertCount(),
        ]);

        setPersons(personsData || []);
        
        const attArray = (unifiedData?.enhancedAttendanceOverview?.timeSeries || []).map((t: any) => ({
          name: t.date,
          Workers: t.count,
          Hotlist: 0,
        }));
        setOvertimeData(attArray);
        setStats({
          ...unifiedData?.systemStats,
          hotlistCount: unifiedData?.enhancedHotlistOverview?.totalHotlisted || unifiedData?.dashboardOverview?.hotlistWorkers
        });
        setActiveAlerts((alertsJson as any)?.activeAlertCount || 0);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= FILTER ================= //
  const filteredWorkers = useMemo(() => {
    return persons.filter(p => {
      const matchesSearch = (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || (p.role || 'WORKER').toUpperCase() === roleFilter.toUpperCase();
      return matchesSearch && matchesRole;
    });
  }, [persons, searchTerm, roleFilter]);

  const handleExport = () => {
    if (filteredWorkers.length === 0) {
      alert('No data to export');
      return;
    }
    const headers = ['Name', 'Role', 'Status', 'Phone', 'Email'];
    const csvRows = filteredWorkers.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.role || 'WORKER').replace(/"/g, '""')}"`,
      `"${(p.status || 'Active').replace(/"/g, '""')}"`,
      `"${(p.phoneNumber || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ================= UI ================= //
  return (
    <DashboardLayout title="Team">
      <div className="p-10">

        {/* ========== SUMMARY ========== */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-black text-slate-800 uppercase">MEPF</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
            ENGR. ALBERT SANTOS
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

            {/* HOTLIST */}
            <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
              <Users size={40} className="text-red-400" />
              <div>
                <h3 className="text-md font-black text-slate-800 uppercase">Hotlist Workers</h3>
                <span className="text-5xl font-black text-red-400">
                  {stats?.hotlistCount ?? activeAlerts}
                </span>
              </div>
              <div className="absolute bottom-4 right-6 text-right space-y-1">
                <button onClick={() => setModalType('list')}
                  className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase">
                  See List →
                </button>
                <button onClick={() => setModalType('add')}
                  className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase">
                  Add Worker →
                </button>
              </div>
            </div>

            {/* NORMAL */}
            <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
              <Users size={40} className="text-blue-400" />
              <div>
                <h3 className="text-md font-black text-slate-800 uppercase">Normal Workers</h3>
                <span className="text-5xl font-black text-blue-400">
                  {stats?.workers ?? persons.length}
                </span>
              </div>
            </div>
          </div>

          {/* ========== CHART ========== */}
          <div className="border-2 border-slate-100 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Overtime Overview
                </h3>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area dataKey="Hotlist" stroke="#818cf8" fill="#818cf8" />
                  <Area dataKey="Workers" stroke="#f87171" fill="#f87171" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ========== TABLE ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase w-full sm:w-auto cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="WORKER">Worker</option>
                <option value="ENGINEER">Engineer</option>
                <option value="NURSE">Nurse</option>
                <option value="STAFF">Staff</option>
              </select>
              <button
                onClick={handleExport}
                className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-full font-black text-xs uppercase hover:bg-blue-100 transition shadow-sm whitespace-nowrap shrink-0"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-[11px] font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase">
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-slate-900">
                        {p.name}
                      </td>
                      <td>{(p as any).role || 'WORKER'}</td>
                      <td>
                        <Link to={`/worker-profile?id=${p.id}`} className="text-blue-500">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== MODAL ========== */}
      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center shrink-0 mb-4 pb-4 border-b border-slate-100">
              <h2 className="font-black text-slate-800 uppercase tracking-tight">
                {modalType === 'list' ? 'Worker List' : 'Add Worker'}
              </h2>
              <button onClick={() => setModalType(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-1 -mx-1">
            {modalType === 'list' ? (
              <div className="text-sm text-slate-500 pb-4">
                Worker list placeholder
              </div>
            ) : (
              <form onSubmit={handleAddWorker} className="space-y-3 pb-2">
                {/* Profile Picture Upload Section */}
                <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="h-14 w-14 shrink-0 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-white">
                    <img src={previewUrl || getFallbackAvatar(newWorkerName)} alt="Preview" className={`h-full w-full object-cover ${!previewUrl && 'opacity-60'}`} onError={(e) => { e.currentTarget.src = getFallbackAvatar(newWorkerName); }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                  <input type="text" required value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" required value={newWorkerEmail} onChange={e => setNewWorkerEmail(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                  <input type="text" required value={newWorkerPhone} onChange={e => setNewWorkerPhone(e.target.value.replace(/[^\d]/g, ''))} className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 9123456789" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Set Password</label>
                  <div className="relative mt-1">
                    <input type={showNewWorkerPassword ? "text" : "password"} required minLength={6} value={newWorkerPassword} onChange={e => setNewWorkerPassword(e.target.value)} className="w-full border border-slate-200 rounded p-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowNewWorkerPassword(!showNewWorkerPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewWorkerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-lg py-3 mt-2 font-bold uppercase text-xs hover:bg-blue-700 disabled:opacity-50 shadow-md transition">
                  {isSubmitting ? 'Saving...' : 'Create Worker'}
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EngineerTeam;
