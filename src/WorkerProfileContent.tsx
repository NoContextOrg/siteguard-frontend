import { useEffect, useState } from 'react';
import { SquarePen, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPersonById, getAvatarUrl, getFallbackAvatar } from './api/person';
import { getAttendanceCalendar } from './api/attendance';
import { updateFullWorkerProfile } from './api/workerProfile';
import dayjs, { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useAuth } from './context/AuthContext';
import { authenticatedFetch } from './api/fetch';
import { updateHotlistStatus } from './api/alert';

/* ---------------- TYPES ---------------- */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://siteguardph.duckdns.org/api';

interface HealthLogDTO {
  id?: number;
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  findings?: string;
  classification?: 'HOTLIST' | 'NORMAL';
  height?: string;
  weight?: string;
  bmi?: string;
  takenMedications?: string;
  allergies?: string;
  existingMedicalConditions?: string;
  timestamp?: string;
  time?: string;
  date?: string;
}

interface WorkerProfileContentProps {
  workerId: string | number;
}

/* ---------------- MOCK API ---------------- */

const getHealthLogsForPerson = async (personCode: string): Promise<HealthLogDTO[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/health-logs/person/${personCode}`);
  if (!response.ok) return [];
  return response.json();
};

const addHealthLog = async (personCode: string, logDto: HealthLogDTO): Promise<HealthLogDTO> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/health-logs/person/${personCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logDto),
  });
  if (!response.ok) throw new Error('Failed to add health log');
  return response.json();
};

const updateHealthLog = async (id: number, logDto: HealthLogDTO): Promise<HealthLogDTO> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/health-logs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logDto),
  });
  if (!response.ok) throw new Error('Failed to update health log');
  return response.json();
};

const deleteHealthLog = async (id: number): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/health-logs/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete health log');
};

/* ---------------- COMPONENT ---------------- */

const WorkerProfileContent = ({ workerId }: WorkerProfileContentProps) => {
  const { roles } = useAuth();
  const primaryRole = roles?.[0]?.replace('ROLE_', '').toLowerCase();
  const canEditProfile = primaryRole === 'admin' || primaryRole === 'nurse';
  const canAddMedicalLog = primaryRole === 'admin' || primaryRole === 'nurse';

  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLogDTO[]>([]);
  const [calendar, setCalendar] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editData, setEditData] = useState<any>({});
  const [formData, setFormData] = useState<HealthLogDTO>({});
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [logDateTime, setLogDateTime] = useState<Dayjs | null>(null);
  const [isHotlisted, setIsHotlisted] = useState(false);
  const [overtimeInfo, setOvertimeInfo] = useState({ isOvertime: false, consecutiveDays: 0 });

  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  /* ---------------- LOAD ---------------- */

  const loadData = async () => {
    try {
      setLoading(true);

      const workerData = await getPersonById(Number(workerId));

      const personCode = (workerData as any)?.personCode;

      if (personCode) {
        const profileRes = await authenticatedFetch(`${API_BASE_URL}/worker-profiles/person/${personCode}`);
        if (profileRes.ok) {
          setWorkerProfile(await profileRes.json());
        } else {
          setWorkerProfile({ person: workerData });
        }
        setHealthLogs(await getHealthLogsForPerson(personCode));
        setCalendar(await getAttendanceCalendar(personCode));
      }

      // Fetch dedicated endpoints for hotlist and overtime
      try {
        const [hotlistRes, overtimeRes] = await Promise.all([
          authenticatedFetch(`${API_BASE_URL}/attendance/person-id/${Number(workerId)}/is-hotlisted`),
          authenticatedFetch(`${API_BASE_URL}/attendance/person-id/${Number(workerId)}/is-overtime`)
        ]);
        if (hotlistRes.ok) {
          const hlData = await hotlistRes.json();
          setIsHotlisted(hlData.isHotlisted);
        }
        if (overtimeRes.ok) {
          const otData = await overtimeRes.json();
          setOvertimeInfo({ isOvertime: otData.isOvertime, consecutiveDays: otData.consecutiveDays });
        }
      } catch(e) {
        console.warn('Could not load hotlist/overtime status', e);
      }
    } catch (e) {
      setError('Failed to load worker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [workerId]);

  // Initialize combined datetime when opening modal / editing
  useEffect(() => {
    if (!isModalOpen) return;
    const datePart = formData.date;
    if (datePart) {
      const candidate = dayjs(datePart);
      setLogDateTime(candidate.isValid() ? candidate : null);
      return;
    }
    setLogDateTime(null);
  }, [isModalOpen, formData.date]);

  const handleDateTimeChange = (val: Dayjs | null) => {
    setLogDateTime(val);
    if (!val || !val.isValid()) {
      setFormData((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, date: val.format('YYYY-MM-DDTHH:mm:ss'), time: val.format('HH:mm') }));
  };

  /* ---------------- FORM ---------------- */

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      classification: e.target.value as 'HOTLIST' | 'NORMAL',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const personCode = workerProfile?.person?.personCode;
    if (!personCode) return;

    try {
      setIsSubmittingLog(true);
      
      if (editingLogId) {
        const updatedLog = await updateHealthLog(editingLogId, formData);
        setHealthLogs(prev => prev.map(log => log.id === editingLogId ? updatedLog : log));
      } else {
        const newLog = await addHealthLog(personCode, formData);
        setHealthLogs(prev => [...prev, newLog]);
      }

      // Sync hotlist status with the backend based on classification
      const classification = formData.classification || 'NORMAL';
      const isHotlisted = classification === 'HOTLIST';
      await updateHotlistStatus(personCode, isHotlisted, formData.findings || 'Medical log update');

      setSuccess(editingLogId ? 'Medical log updated successfully!' : 'Medical log added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setFormData({ classification: 'NORMAL' });
      setIsModalOpen(false);
      setEditingLogId(null);
      
      await loadData();
    } catch (err) {
      setError('Failed to submit health log');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleDeleteLog = (id: number) => {
    setLogToDelete(id);
  };

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    try {
      await deleteHealthLog(logToDelete);
      setHealthLogs(prev => prev.filter(log => log.id !== logToDelete));
      setSuccess('Medical log deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete health log');
    } finally {
      setLogToDelete(null);
    }
  };

  /* ---------------- EDIT PROFILE ---------------- */

  const fullName = workerProfile?.person ? (workerProfile.person.name || [workerProfile.person.firstName, workerProfile.person.lastName].filter(Boolean).join(' ').trim()) : '';
  const position = workerProfile?.position || workerProfile?.person?.role || '';

  const handleEditClick = () => {
    if (!workerProfile) return;

    setEditData({
      name: fullName,
      position: position,
    });

    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!workerProfile) return;

    setIsSaving(true);

    try {
      const updated = await updateFullWorkerProfile(workerProfile.person.id, {
        name: editData.name,
        position: editData.position
      });
      setWorkerProfile(updated);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setIsEditing(false);
    } catch {
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- ATTENDANCE ---------------- */

  const getStatus = (date: string) => {
    const logs = calendar[date];

    // Check if there are any health logs for this date indicating hotlist
    const dateLogs = healthLogs.filter(hl => {
      const hlDate = hl.date ? hl.date.split('T')[0] : hl.timestamp ? hl.timestamp.split('T')[0] : '';
      return hlDate === date;
    });
    const hasHotlistLog = dateLogs.some(hl => hl.classification === 'HOTLIST');

    if ((!logs || logs.length === 0) && !hasHotlistLog) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;
      
      if (date <= todayStr) return 'ABSENT';
      return 'EMPTY';
    }
    
    const isHotlist = hasHotlistLog || (logs && logs.some(l => l.toUpperCase() === 'HOTLIST'));
    // Backend emits "LOGOUT", "LOGOUT_OVERTIME", etc. — any logout = overtime
    const isOvertime = logs && logs.some(l => l.toUpperCase().includes('LOGOUT') || l.toUpperCase() === 'OVERTIME');
    const isPresent = logs && logs.some(l => l.toUpperCase() === 'LOGIN' || l.toUpperCase() === 'PRESENT');
    
    if (isHotlist && isOvertime) return 'HOTLIST_OT';
    if (isHotlist) return 'HOTLIST';
    if (isOvertime) return 'OVERTIME';
    if (isPresent) return 'PRESENT';
    
    return 'ABSENT';
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const gridCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) gridCells.push(null);
  for (let i = 1; i <= daysInMonth; i++) gridCells.push(i);

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  gridCells.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === gridCells.length - 1) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const handlePrevMonth = () => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  /* ---------------- UI ---------------- */

  if (loading) return <div className="py-12 flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /></div>;
  if (!workerProfile && !error) return <div className="p-8 text-slate-500">Not found</div>;

  return (
    <>
      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-8">My Profile</h2>
      
      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex justify-between animate-in fade-in"><span>{error}</span><button onClick={() => setError(null)}><X size={16}/></button></div>}
      {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex justify-between animate-in fade-in"><span>{success}</span><button onClick={() => setSuccess(null)}><X size={16}/></button></div>}
      
      {workerProfile && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PROFILE */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>

              {canEditProfile && (
                isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="text-slate-600 font-bold px-4 py-2 rounded-lg hover:bg-slate-100">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleEditClick} className="flex items-center gap-2 text-blue-900 font-bold hover:text-blue-600 transition">
                    <SquarePen size={18} /> EDIT PROFILE
                  </button>
                )
              )}
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-40 h-40 rounded-full border-4 border-slate-100 overflow-hidden mb-2 bg-slate-50 flex items-center justify-center">
                <img src={getAvatarUrl(fullName, workerProfile?.person?.profilePictureUrl)} alt={fullName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = getFallbackAvatar(fullName); }} />
              </div>
              {isHotlisted && (
                <span className="px-3 py-1 bg-red-100 text-red-700 font-black text-[10px] rounded-full uppercase tracking-widest mb-4">
                  HOTLISTED
                </span>
              )}
            </div>

            <div className="space-y-6">
              <EditableField
                label="Name"
                name="name"
                value={isEditing ? editData.name : fullName}
                isEditing={isEditing}
                onChange={(e: any) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />

              <EditableField
                label="Position"
                name="position"
                value={isEditing ? editData.position : position}
                isEditing={isEditing}
                onChange={(e: any) =>
                  setEditData({ ...editData, position: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <EditableField
                  label="Overtime Count"
                  name="overtimeCount"
                  value={String(overtimeInfo.consecutiveDays ?? 0)}
                  isEditing={false}
                />
                <EditableField
                  label="Overtime Status"
                  name="overtimeStatus"
                  value={overtimeInfo.isOvertime ? 'OVERTIME' : 'NORMAL'}
                  isEditing={false}
                />
              </div>
            </div>

            {/* Attendance */}
            <div className="mt-12 bg-[#1e293b] p-8 rounded-xl text-white shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold uppercase tracking-widest text-blue-100">Attendance Overview</h3>
                <div className="flex items-center gap-4">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-700/50 rounded-lg transition"><ChevronLeft size={20}/></button>
                  <span className="font-bold uppercase tracking-widest text-sm text-center min-w-[120px]">
                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-slate-700/50 rounded-lg transition"><ChevronRight size={20}/></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 gap-2">
                    {week.map((day, dIdx) => {
                      if (day === null) {
                        return <div key={`empty-${wIdx}-${dIdx}`} className="h-14 bg-transparent" />;
                      }
                      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const status = getStatus(dStr);
                      
                      let bgClass = 'bg-transparent border-slate-700 text-slate-500';
                      let displayStatus = status;
                      
                      if (status === 'HOTLIST_OT') {
                        bgClass = 'bg-[linear-gradient(135deg,rgba(239,68,68,0.3)_50%,rgba(34,197,94,0.3)_50%)] border-red-400/50 text-white';
                        displayStatus = 'HOTLIST+OT';
                      } else if (status === 'HOTLIST') {
                        bgClass = 'bg-red-500/30 border-red-400/50 text-red-100';
                      } else if (status === 'OVERTIME') {
                        bgClass = 'bg-green-500/20 border-green-400/50 text-green-100';
                      } else if (status === 'ABSENT') {
                        bgClass = 'bg-slate-500/40 border-slate-400/50 text-slate-100';
                      } else if (status === 'PRESENT') {
                        bgClass = 'bg-blue-500/20 border-blue-400/50 text-blue-100';
                      }

                      return (
                        <div
                          key={day}
                          className={`h-14 flex flex-col items-center justify-center rounded-lg border transition-colors ${bgClass}`}
                          title={`${dStr} - ${displayStatus}`}
                        >
                          <span className="text-sm font-bold">{day}</span>
                          {status !== 'EMPTY' && (
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-1 opacity-80 truncate w-full text-center px-1">
                              {displayStatus}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-6 mt-10 text-[10px] font-black border-t border-slate-700/50 pt-6 tracking-widest">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm border border-slate-500 bg-transparent" /> NO DATA
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-400" /> PRESENT
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm bg-slate-500" /> ABSENT
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm bg-green-400" /> OVERTIME
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm bg-red-500" /> HOTLIST
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm bg-[linear-gradient(135deg,#ef4444_50%,#22c55e_50%)]" /> HOTLIST + OT
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MEDICAL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
          <div className="p-6 text-center border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Medical Form</h2>
            {canAddMedicalLog && (
              <button 
                onClick={() => { setEditingLogId(null); setFormData({ classification: 'NORMAL' }); setIsModalOpen(true); }}
                className="flex items-center justify-center gap-2 text-blue-900 font-bold mt-2 mx-auto hover:text-blue-600 transition"
              >
                <SquarePen size={18} /> ADD CHECKUP LOG
              </button>
            )}
          </div>

          <div className="p-4 space-y-3">
            {healthLogs.length > 0 ? healthLogs.map((log) => (
              <div key={log.id} className={`${log.classification === 'HOTLIST' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border p-4 rounded-lg relative group`}>
                {canAddMedicalLog && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingLogId(log.id!); setFormData(log); setIsModalOpen(true); }} className="p-1.5 bg-white/80 rounded-md hover:bg-white text-blue-600 shadow-sm" title="Edit">
                      <SquarePen size={14} />
                    </button>
                    <button onClick={() => handleDeleteLog(log.id!)} className="p-1.5 bg-white/80 rounded-md hover:bg-white text-red-600 shadow-sm" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <p className={`text-[16px] font-bold ${log.classification === 'HOTLIST' ? 'text-red-900' : 'text-green-900'} leading-tight uppercase text-center`}>
                  {log.findings || 'No findings'}
                </p>
                <p className="text-[12px] text-slate-500 mt-1 text-center">
                  {log.date ? new Date(log.date).toLocaleDateString() : log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'No date'}
                </p>
              </div>
            )) : <p className="text-center text-slate-500 text-sm py-4">No medical logs found.</p>}
          </div>
        </div>
      </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form
            onSubmit={handleSubmit}
            className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
          >
            <div className="p-6 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingLogId ? 'Edit Medical Log' : 'Add Medical Log'}</h2>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingLogId(null); setFormData({ classification: 'NORMAL' }); }} className="p-2 hover:bg-slate-100 rounded-full transition">
                <X size={24} className="text-slate-800" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Temperature</label>
                <input
                  name="temperature"
                  placeholder="36.5 °C"
                  onChange={handleFormChange}
                  className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm"
                />
              </div>

              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Blood Pressure</label>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    type="text"
                    placeholder="120"
                    value={(formData.bloodPressure || '').split('/')[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const [, dia = ''] = (formData.bloodPressure || '').split('/');
                      setFormData(prev => ({ ...prev, bloodPressure: val || dia ? `${val}/${dia}` : '' }));
                    }}
                    className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm text-center"
                  />
                  <span className="text-slate-400 font-black text-lg select-none">/</span>
                  <input
                    inputMode="numeric"
                    type="text"
                    placeholder="80"
                    value={(formData.bloodPressure || '').split('/')[1] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const [sys = ''] = (formData.bloodPressure || '').split('/');
                      setFormData(prev => ({ ...prev, bloodPressure: sys || val ? `${sys}/${val}` : '' }));
                    }}
                    className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm text-center"
                  />
                </div>
              </div>

              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Findings</label>
                <textarea
                  name="findings"
                  placeholder="Enter physical observations..."
                  onChange={handleFormChange}
                  className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm resize-none h-16"
                />
              </div>

              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Date & Time</label>
                <div className="relative z-[9999]">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Date & Time"
                      value={logDateTime}
                      onChange={handleDateTimeChange}
                      sx={{ width: '100%', bgcolor: 'transparent' }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </div>
              </div>

              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 uppercase">Classification:</span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="NORMAL"
                      checked={formData.classification === 'NORMAL' || !formData.classification}
                      onChange={handleRadioChange}
                      className="w-4 h-4 border-2 border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase group-hover:text-blue-600 transition">Normal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="HOTLIST"
                      checked={formData.classification === 'HOTLIST'}
                      onChange={handleRadioChange}
                      className="w-4 h-4 border-2 border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase group-hover:text-blue-600 transition">Hotlist</span>
                  </label>
                </div>
              </div>

              <button disabled={isSubmittingLog} type="submit" className="w-full mt-4 bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition-all shadow-lg disabled:opacity-50">
                {isSubmittingLog ? 'Submitting...' : 'Submit Log'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Delete Log Confirmation Modal */}
      {logToDelete !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[30px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Delete Record</h3>
            <p className="text-slate-600 mb-6 text-sm">Are you sure you want to delete this medical record? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setLogToDelete(null)} className="flex-1 py-3 border border-slate-200 rounded-2xl font-black text-slate-600 uppercase hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDeleteLog} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black uppercase hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ---------------- REUSABLE FIELD ---------------- */

const EditableField = ({
  label,
  name,
  value,
  isEditing,
  onChange,
}: any) => (
  <div className="mb-4">
    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{label}</label>
    {isEditing ? (
      <input
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full p-4 border-2 border-blue-200 bg-blue-50 rounded-xl font-bold text-slate-700 text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    ) : (
      <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-lg text-center">
        {value || 'N/A'}
      </div>
    )}
  </div>
);

export default WorkerProfileContent;