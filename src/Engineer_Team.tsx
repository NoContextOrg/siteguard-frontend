import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Users,
  X,
  Search,
  Eye,
  EyeOff,
  Download,
  UserX,
  FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { SkeletonCard, SkeletonRow, SkeletonChart } from './components/Skeletons';
import DashboardLayout from './components/DashboardLayout';
import { Link } from 'react-router-dom';
import { createPersonUi, uploadProfilePicture, getFallbackAvatar } from './api/person';
import { getEngineerTeamDashboard, startEngineerTeamExport, type EngineerTeamOverview } from './api/engineerTeam';
import { useExportJob } from './hooks/useExportJob';
import { ExportStatusOverlay } from './components/ExportStatusOverlay';
import { RecentExportsModal } from './components/RecentExportsModal';
import { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from './context/AuthContext';

// ================= COMPONENT ================= //
const EngineerTeam = () => {
  const { roles, userEmail } = useAuth();
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isEngineer = roles.includes('ROLE_ENGINEER');
  const canExport = isAdmin || isEngineer;
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'hotlist' | 'unassigned' | 'add' | null>(null);

  const [dashboard, setDashboard] = useState<EngineerTeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New Async Export Hook
  const exportManager = useExportJob({
    onSuccess: () => console.log('Export finished successfully'),
    onError: (err) => console.error('Export failed:', err)
  });

  const [exportDate, setExportDate] = useState<Dayjs | null>(null);
  const [showRecentExports, setShowRecentExports] = useState(false);

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

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDashboard = async (isBackground = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!isBackground && !dashboard) setLoading(true);
      const data = await getEngineerTeamDashboard(controller.signal);
      
      if (data && !controller.signal.aborted) {
        // Normalize Data Layer
        const normalized = {
          ...data,
          normalWorkers: Array.isArray(data.normalWorkers) ? data.normalWorkers : [],
          hotlistWorkers: Array.isArray(data.hotlistWorkers) ? data.hotlistWorkers : [],
          unassignedWorkers: Array.isArray(data.unassignedWorkers) ? data.unassignedWorkers : [],
          hotlistWorkersCount: typeof data.hotlistWorkersCount === 'number' ? data.hotlistWorkersCount : 0,
          normalWorkersCount: typeof data.normalWorkersCount === 'number' ? data.normalWorkersCount : 0,
          overtimeOverview: {
             ...data.overtimeOverview,
             timeSeries: Array.isArray(data.overtimeOverview?.timeSeries) ? data.overtimeOverview.timeSeries : []
          }
        };
        setDashboard(normalized);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch team dashboard data:', err);
      }
    } finally {
      if (!isBackground && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to add worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedWorkers = useMemo(() => {
    if (!dashboard) return [];
    let list = dashboard.normalWorkers || [];
    list = list.filter(p => {
      const matchesSearch = (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
    return list;
  }, [dashboard, searchTerm]);

  // ================= UI ================= //
  return (
    <DashboardLayout title="Team">
      <div className="p-10">
        {/* ========== SUMMARY ========== */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-black !text-slate-950 uppercase">
            Team Overview
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
            {userEmail || 'Engineer'}
          </p>

          {loading && !dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {/* HOTLIST */}
              <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
                <Users size={40} className="text-red-400" />
                <div>
                  <h3 className="text-md font-black !text-slate-950 uppercase">Hotlist Workers</h3>
                  <span className="text-5xl font-black text-red-400">
                    {dashboard?.hotlistWorkersCount ?? 0}
                  </span>
                </div>
                <div className="absolute bottom-4 right-6 text-right space-y-1">
                  <button onClick={() => setModalType('hotlist')}
                    className="block w-full text-right text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase">
                    See List →
                  </button>
                  <button onClick={() => setModalType('add')}
                    className="block w-full text-right text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase">
                    Add Worker →
                  </button>
                </div>
              </div>

              {/* NORMAL */}
              <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
                <Users size={40} className="text-blue-400" />
                <div>
                  <h3 className="text-md font-black !text-slate-950 uppercase">Normal Workers</h3>
                  <span className="text-5xl font-black text-blue-400">
                    {dashboard?.normalWorkersCount ?? 0}
                  </span>
                </div>
              </div>

              {/* UNASSIGNED */}
              <div className="border-2 border-slate-100 rounded-2xl p-8 relative flex items-center gap-6">
                <UserX size={40} className="text-amber-400" />
                <div>
                  <h3 className="text-md font-black !text-slate-950 uppercase">Unassigned</h3>
                  <span className="text-5xl font-black text-amber-400">
                    {dashboard?.unassignedWorkers?.length ?? 0}
                  </span>
                </div>
                <div className="absolute bottom-4 right-6 text-right space-y-1">
                  <button onClick={() => setModalType('unassigned')}
                    className="block w-full text-right text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase">
                    See List →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========== CHART ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 border-2 border-slate-100 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black !text-slate-950 uppercase">
                    Overtime Overview
                  </h3>
                </div>
              </div>

              <div className="h-64">
                {loading && !dashboard ? <SkeletonChart /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.overtimeOverview?.timeSeries || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area dataKey="Workers" stroke="#818cf8" fill="#818cf8" />
                      <Area dataKey="Hotlist" stroke="#f87171" fill="#f87171" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Daily Attendance Report Exporter */}
            <div className="border-2 border-slate-100 rounded-2xl p-8 flex flex-col">
              <h3 className="text-sm font-black !text-slate-950 uppercase mb-2">Daily Attendance Report</h3>
              <p className="text-[12px] text-slate-400 font-medium mb-6">
                Export a structured PDF report of team attendance for a specific day.
              </p>
              
              <div className="space-y-4 mt-auto">
                {canExport ? (
                  <button
                    onClick={() => exportManager.startJob(() => startEngineerTeamExport())}
                    disabled={loading || !dashboard || exportManager.isExporting}
                    className="w-full bg-[#1a2e5a] text-white py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-[#132142] transition disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <Download size={16} /> Export Today's Attendance
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center py-2">
                    Admin access required to export
                  </div>
                )}

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] font-black uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <div className="space-y-2">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={exportDate}
                      onChange={(newValue) => setExportDate(newValue)}
                      sx={{ width: '100%' }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </LocalizationProvider>
                  {canExport && (
                    <button
                      onClick={() => {
                        const dateVal = exportDate ? exportDate.format('YYYY-MM-DD') : undefined;
                        if (!dateVal) {
                          alert('Please select a date');
                          return;
                        }
                        exportManager.startJob(() => startEngineerTeamExport(dateVal));
                      }}
                      disabled={loading || !dashboard || exportManager.isExporting}
                      className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      <Download size={16} /> Export Selected Day
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowRecentExports(true)}
                  className="w-full border-2 border-slate-200 text-slate-600 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition flex justify-center items-center gap-2 mt-4"
                >
                  <FileText size={16} /> View Recent Exports
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========== TABLE ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b">
            <h3 className="font-black !text-slate-950 uppercase tracking-tight">Normal Workers List</h3>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search normal workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                {loading && !dashboard ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
                ) : displayedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-slate-400">
                      No normal workers found
                    </td>
                  </tr>
                ) : (
                  displayedWorkers.map((p) => {
                    const normalizedName = (p.name && p.name.trim() !== '') ? p.name.trim() : 'Unknown Worker';
                    return (
                      <tr key={p.id || p.personCode || Math.random().toString()} className="border-b hover:bg-slate-50">
                        <td className="p-4 text-slate-900">{normalizedName}</td>
                        <td>{(p as any).role || 'WORKER'}</td>
                        <td>
                          <Link to={`/worker-profile?id=${p.id}`} className="text-blue-500 hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center shrink-0 mb-4 pb-4 border-b border-slate-100">
              <h2 className="font-black !text-slate-950 uppercase tracking-tight">
                {modalType === 'hotlist' ? 'Hotlist Workers' : 
                 modalType === 'unassigned' ? 'Unassigned Workers' : 'Add Worker'}
              </h2>
              <button onClick={() => setModalType(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-1 -mx-1 flex-1">
            {modalType === 'hotlist' && (
              <div className="space-y-3">
                {dashboard?.hotlistWorkers?.map(w => (
                  <div key={w.id} className="p-3 border rounded-lg bg-red-50 border-red-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">{w.name}</h4>
                      <span className="text-xs text-red-500 font-bold uppercase">{w.personCode}</span>
                    </div>
                    <Link to={`/worker-profile?id=${w.id}`} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full font-bold uppercase hover:bg-red-700">
                      View Profile
                    </Link>
                  </div>
                ))}
                {(!dashboard?.hotlistWorkers || dashboard.hotlistWorkers.length === 0) && (
                  <p className="text-center text-slate-400 text-sm">No hotlist workers</p>
                )}
              </div>
            )}
            
            {modalType === 'unassigned' && (
              <div className="space-y-3">
                {dashboard?.unassignedWorkers?.map(w => (
                  <div key={w.id} className="p-3 border rounded-lg bg-amber-50 border-amber-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">{w.name}</h4>
                      <span className="text-xs text-amber-600 font-bold uppercase">{w.personCode}</span>
                    </div>
                    <Link to={`/worker-profile?id=${w.id}`} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-full font-bold uppercase hover:bg-amber-700">
                      View Profile
                    </Link>
                  </div>
                ))}
                {(!dashboard?.unassignedWorkers || dashboard.unassignedWorkers.length === 0) && (
                  <p className="text-center text-slate-400 text-sm">No unassigned workers</p>
                )}
              </div>
            )}

            {modalType === 'add' && (
              <form onSubmit={handleAddWorker} className="space-y-3 pb-2">
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

      {/* Export Status Notification Overlay */}
      <ExportStatusOverlay 
        state={exportManager.state}
        progress={exportManager.progress}
        error={exportManager.error}
        onReset={exportManager.reset}
        onDownloadAgain={exportManager.downloadAgain}
      />

      {showRecentExports && (
        <RecentExportsModal onClose={() => setShowRecentExports(false)} />
      )}
    </DashboardLayout>
  );
};

export default EngineerTeam;
