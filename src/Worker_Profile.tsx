import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SquarePen, X, Trash2 } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { getPersonById } from './api/person';
import { getAttendanceCalendar } from './api/attendance';
import {
  updateFullWorkerProfile,
  type WorkerFullUpdateDTO,
} from './api/workerProfile';
import { authenticatedFetch } from './api/fetch';
import { updateHotlistStatus, dispatchAlert } from './api/alert';

const API_BASE_URL = 'http://localhost:8080/api';

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

const WorkerProfile = () => {
  const { logout, roles } = useAuth();
  const primaryRole = roles?.[0]?.replace('ROLE_', '').toLowerCase();
  const canEditProfile = primaryRole === 'admin' || primaryRole === 'nurse';
  const canAddMedicalLog = primaryRole === 'admin' || primaryRole === 'nurse';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const workerId = searchParams.get('id');

  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLogDTO[]>([]);
  const [calendar, setCalendar] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<HealthLogDTO>({});
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [logDateTime, setLogDateTime] = useState<Dayjs | null>(null);

  // Auto-calculate BMI when height/weight changes
  useEffect(() => {
    const h = Number(formData.height);
    const w = Number(formData.weight);

    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
      if (formData.bmi) setFormData((prev) => ({ ...prev, bmi: '' }));
      return;
    }

    // height input is assumed to be in cm
    const meters = h / 100;
    const bmi = w / (meters * meters);
    const rounded = Number.isFinite(bmi) ? bmi.toFixed(1) : '';

    if (rounded !== String(formData.bmi ?? '')) {
      setFormData((prev) => ({ ...prev, bmi: rounded }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.height, formData.weight]);

  const loadData = async () => {
    if (!workerId) {
      setError('No worker ID specified in URL.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const numericWorkerId = Number(workerId);
      // NOTE: getPersonById is assumed to exist in `api/person.ts`
      // and that PersonResponse contains a `personCode`.
      const workerData = await getPersonById(numericWorkerId);

      const personCode = (workerData as any)?.personCode;
      if (personCode) {
        try {
          const profileRes = await authenticatedFetch(`${API_BASE_URL}/worker-profiles/person/${personCode}`);
          if (profileRes.ok) {
            setWorkerProfile(await profileRes.json());
          } else {
            setWorkerProfile({ person: workerData });
          }
        } catch (err) {
          console.warn('Could not load worker profile', err);
        }

        const logs = await getHealthLogsForPerson(personCode);
        setHealthLogs(logs);
        const calendarData = await getAttendanceCalendar(personCode);
        setCalendar(calendarData);
      } else {
        console.warn('Worker data does not contain a personCode.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load worker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [workerId]);

  const handleLogout = () => {
    logout();
    // DashboardLayout sidebar handles navigation; logout should return to home.
    window.location.href = '/';
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Numeric-only fields (units are shown in UI, not typed)
    const numericFields = new Set([
      'temperature',
      'height',
      'weight',
      'bmi',
      'heartRate',
      'respiratoryRate',
    ]);

    const cleaned = numericFields.has(name)
      ? value.replace(/[^0-9.]/g, '')
      : value;

    setFormData((prev) => ({ ...prev, [name]: cleaned }));
  };

  const fullName = workerProfile?.person ? (workerProfile.person.name || [workerProfile.person.firstName, workerProfile.person.lastName].filter(Boolean).join(' ').trim()) : '';
  const position = workerProfile?.position || workerProfile?.person?.role || '';

  const handleEditClick = () => {
    if (!workerProfile) return;
    setEditData({
      name: fullName,
      address: workerProfile?.address || '',
      phoneNumber: workerProfile?.person?.phoneNumber || '',
      age: workerProfile?.age || '',
      birthdate: workerProfile?.birthdate || '',
      position: position,
      yearOfEmployment: workerProfile?.yearOfEmployment || '',
    });
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    if (!workerProfile) return;
    setIsSaving(true);
    setError(null);
    try {
      const dto: WorkerFullUpdateDTO = {
        name: editData.name,
        phoneNumber: editData.phoneNumber,
        address: editData.address,
        age: editData.age ? Number(editData.age) : undefined,
        birthdate: editData.birthdate,
        position: editData.position,
        yearOfEmployment: editData.yearOfEmployment ? Number(editData.yearOfEmployment) : undefined,
      };

      const updatedProfile = await updateFullWorkerProfile(workerProfile.person.id, dto);
      setWorkerProfile(updatedProfile);

      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, classification: e.target.value as 'HOTLIST' | 'NORMAL' }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const personCode = workerProfile?.person?.personCode;
    if (!personCode) {
      alert('Cannot submit log: worker personCode is missing.');
      return;
    }

    try {
      if (editingLogId) {
        const updatedLog = await updateHealthLog(editingLogId, formData);
        setHealthLogs(prev => prev.map(log => log.id === editingLogId ? updatedLog : log));
      } else {
        const newLog = await addHealthLog(personCode, formData);
        setHealthLogs(prev => [...prev, newLog]);
      }

      // Sync hotlist status with the backend based on classification
      if (formData.classification) {
        const isHotlisted = formData.classification === 'HOTLIST';
        await updateHotlistStatus(personCode, isHotlisted, formData.findings || 'Medical log update');
        
        if (isHotlisted) {
          await dispatchAlert({ alertType: 'HOTLIST_ALERT', personCode });
        }
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingLogId(null);
    } catch (err) {
      alert(`Failed to submit health log: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this health record?')) return;
    try {
      await deleteHealthLog(id);
      setHealthLogs(prev => prev.filter(log => log.id !== id));
    } catch (err) {
      alert(`Failed to delete health log: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const handleDateTimeChange = (val: Dayjs | null) => {
    setLogDateTime(val);

    if (!val || !val.isValid()) {
      setFormData((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      date: val.format('YYYY-MM-DDTHH:mm:ss'),
      time: val.format('HH:mm'),
    }));
  };

  if (loading) {
    return <DashboardLayout title="Worker Profile"><div className="p-8">Loading profile...</div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout title="Worker Profile"><div className="p-8 text-red-500">{error}</div></DashboardLayout>;
  }

  if (!workerProfile) {
    return <DashboardLayout title="Worker Profile"><div className="p-8">Worker not found.</div></DashboardLayout>;
  }

  const getStatus = (date: string) => {
    const logs = calendar[date];

    if (!logs || logs.length === 0) return 'EMPTY';

    if (logs.includes('LEAVE')) return 'LEAVE';
    if (logs.includes('OVERTIME')) return 'OVERTIME';
    if (logs.includes('LOGIN')) return 'PRESENT';

    return 'EMPTY';
  };

  const statusColor: Record<string, string> = {
    PRESENT: 'bg-blue-400',
    OVERTIME: 'bg-green-400',
    LEAVE: 'bg-red-500',
  };

  const generateYearDates = (year: number) => {
    const dates: string[] = [];
    // Use UTC to avoid timezone issues with date iteration
    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end = new Date(`${year}-12-31T00:00:00Z`);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split('T')[0];
      dates.push(iso);
    }

    return dates;
  };

  // As per instructions, using a fixed year for now.
  const yearDates = generateYearDates(2026);

  return (
    <DashboardLayout title="Worker Profile">
      <div className="p-8">
        <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">Worker Profile</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ========== Left Column: Personal_Info ========== */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                {canEditProfile && (
                  isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={handleCancelClick} className="text-slate-600 font-bold px-4 py-2 rounded-lg hover:bg-slate-100">
                        Cancel
                      </button>
                      <button onClick={handleSaveClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEditClick}
                      className="flex items-center gap-2 text-blue-900 font-bold hover:text-blue-600 transition"
                    >
                      <SquarePen size={18} /> EDIT PROFILE
                    </button>
                  )
                )}
              </div>
              <div className="flex flex-col items-center mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-slate-100 overflow-hidden mb-6">
              <img src={`https://i.pravatar.cc/150?u=${workerProfile.person.id}`} alt="Worker" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* ========== Form Fields ========== */}
              <div className="space-y-6">
                <EditableProfileField
                  label="Name"
                  name="name"
              value={isEditing ? editData.name : fullName}
                  isEditing={isEditing}
                  onChange={handleEditDataChange}
                />
                <EditableProfileField
                  label="Address"
                  name="address"
                  value={isEditing ? editData.address : workerProfile?.address}
                  isEditing={isEditing}
                  onChange={handleEditDataChange}
                />
                <EditableProfileField
                  label="Contact Number"
                  name="phoneNumber"
              value={isEditing ? editData.phoneNumber : workerProfile?.person?.phoneNumber}
                  isEditing={isEditing}
                  onChange={handleEditDataChange}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <EditableProfileField
                    label="Age"
                    name="age"
                    type="number"
                    value={isEditing ? editData.age : workerProfile?.age}
                    isEditing={isEditing}
                    onChange={handleEditDataChange}
                  />
                  <EditableProfileField
                    label="Birthdate"
                    name="birthdate"
                    type="date"
                    value={isEditing ? editData.birthdate : workerProfile?.birthdate}
                    isEditing={isEditing}
                    onChange={handleEditDataChange}
                  />
                  <EditableProfileField
                    label="Position"
                    name="position"
                value={isEditing ? editData.position : position}
                    isEditing={isEditing}
                    onChange={handleEditDataChange}
                  />
                  <EditableProfileField
                    label="Year of Employment"
                    name="yearOfEmployment"
                    type="number"
                    value={isEditing ? editData.yearOfEmployment : workerProfile?.yearOfEmployment}
                    isEditing={isEditing}
                    onChange={handleEditDataChange}
                  />
                </div>
              </div>

              {/* ========== Attendance Grid ========== */}
              <div className="mt-12 bg-[#1e293b] p-8 rounded-xl text-white shadow-2xl">
              <h3 className="text-lg font-bold uppercase mb-6 tracking-widest text-blue-100">Attendance Overview</h3>

              <div className="grid grid-cols-7 gap-2">
                {yearDates.map(date => {
                  const status = getStatus(date);
                  type StatusKey = keyof typeof statusColor;

                  if (status === 'EMPTY') {
                    return (
                      <div
                        key={date}
                        className="w-3 h-3 rounded-full border border-slate-500 bg-transparent"
                        title={`${date} - No record`}
                      />
                    );
                  }

                  return (
                    <div
                      key={date}
                      className={`w-3 h-3 rounded-full ${statusColor[status as StatusKey]}`}
                      title={`${date} - ${status}`}
                    />
                  );
                })}
              </div>

              {/* ========== Legend Section ========== */}
              <div className="flex justify-center gap-8 mt-10 text-[10px] font-black border-t border-slate-700/50 pt-6 tracking-widest">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full border border-slate-500 bg-transparent" /> ABSENT
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${statusColor.PRESENT}`} /> PRESENT
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${statusColor.OVERTIME}`} /> OVERTIME
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${statusColor.LEAVE}`} /> ON LEAVE
                  </div>
              </div>
              </div>
          </div>
          </div>

          {/* ========== Right Column: Medical_Form ========== */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
            <div className="p-6 text-center border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Medical Form</h2>
              {canAddMedicalLog && (
                <button 
                  onClick={() => { setEditingLogId(null); setFormData({}); setIsModalOpen(true); }}
                  className="flex items-center justify-center gap-2 text-blue-900 font-bold mt-2 mx-auto hover:text-blue-600 transition"
                >
                  <SquarePen size={18} /> ADD CHECKUP LOG
                </button>
              )}
            </div>

            <div className="p-4 space-y-3">
              {healthLogs.length > 0 ? healthLogs.map(log => (
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
      </div>

      {/* Logout handler retained for any in-page logout usage */}
      <button onClick={handleLogout} className="hidden">Logout</button>

      {/* ========== Medical Form Modal (Inline Overlay) ========== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Blurred Backdrop */}
          <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={() => { setIsModalOpen(false); setEditingLogId(null); setFormData({}); }}
          ></div>

          <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
          <div className="relative p-6 flex justify-center items-center border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingLogId ? 'Edit Medical Log' : 'Medical Form'}</h2>
              <button 
              onClick={() => { setIsModalOpen(false); setEditingLogId(null); setFormData({}); }}
              className="absolute right-8 top-6 p-2 hover:bg-slate-100 rounded-full transition"
              >
              <X size={28} className="text-slate-800" />
              </button>
          </div>

          {/* Modal Body */}
          <form className="px-10 py-8 space-y-4 max-h-[85vh] overflow-y-auto" onSubmit={handleFormSubmit}>
              
              {/* Row 1: Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Temperature */}
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Temperature</label>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      type="text"
                      name="temperature"
                      placeholder="36.5"
                      onChange={handleFormChange}
                      value={formData.temperature || ''}
                      className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm"
                    />
                    <span className="text-xs font-black text-slate-400 select-none">°C</span>
                  </div>
                </div>

                {/* Blood Pressure */}
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

                {/* Heart Rate */}
                <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Heart Rate / Pulse</label>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      type="text"
                      name="heartRate"
                      placeholder="72"
                      onChange={handleFormChange}
                      value={formData.heartRate || ''}
                      className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm"
                    />
                    <span className="text-xs font-black text-slate-400 select-none">bpm</span>
                  </div>
                </div>

                {/* Date & Time (MUI) */}
                <div className="md:col-span-2 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Date & Time</label>

                  <div className="relative z-[9999]">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker
                        value={logDateTime}
                        onChange={handleDateTimeChange}
                        format="MM/DD/YYYY hh:mm A"
                        sx={{ width: '100%', bgcolor: 'transparent' }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 mt-1">Pick from calendar/clock</div>
                </div>
              </div>

              {/* Row 2: Physicals */}
              <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Height</label>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      type="text"
                      name="height"
                      value={formData.height || ''}
                      onChange={handleFormChange}
                      placeholder="170"
                      className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal"
                    />
                    <span className="text-xs font-black text-slate-400 select-none">cm</span>
                  </div>
              </div>
              <div className="col-span-3 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Weight</label>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      type="text"
                      name="weight"
                      value={formData.weight || ''}
                      onChange={handleFormChange}
                      placeholder="65"
                      className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal"
                    />
                    <span className="text-xs font-black text-slate-400 select-none">kg</span>
                  </div>
              </div>
              <div className="col-span-2 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Bmi</label>
                  <input
                    type="text"
                    name="bmi"
                    value={formData.bmi || ''}
                    readOnly
                    placeholder="Auto"
                    className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal cursor-not-allowed"
                  />
                  <div className="text-[10px] font-bold text-slate-400 mt-1">Auto-calculated</div>
              </div>
              <div className="col-span-4 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Respiratory Rate</label>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      type="text"
                      name="respiratoryRate"
                      value={formData.respiratoryRate || ''}
                      onChange={handleFormChange}
                      placeholder="16"
                      className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal"
                    />
                    <span className="text-xs font-black text-slate-400 select-none">/min</span>
                  </div>
              </div>
              </div>

              {/* Row 3: History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Taken Medications</label>
                  <input type="text" name="takenMedications" value={formData.takenMedications || ''} onChange={handleFormChange} placeholder="Paracetamol, Amoxicillin, etc." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
              </div>
              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Allergies</label>
                  <input type="text" name="allergies" value={formData.allergies || ''} onChange={handleFormChange} placeholder="Peanuts, Penicillin, Dust, etc." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
              </div>
              </div>

              {/* Row 4: Conditions */}
              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Existing Medical Conditions</label>
              <input type="text" name="existingMedicalConditions" value={formData.existingMedicalConditions || ''} onChange={handleFormChange} placeholder="Hypertension, Asthma, Diabetes, etc." className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
              </div>

              {/* Row 5: Findings */}
              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 min-h-[100px] transition-focus focus-within:border-blue-400">
              <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Findings</label>
              <textarea 
                  name="findings"
                  value={formData.findings || ''}
                  onChange={handleFormChange}
                  placeholder="Enter physical observations or diagnosis findings here..."
                  className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm resize-none h-16 placeholder:font-normal" 
              />
              </div>

              {/* Row 6: Classification */}
              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 uppercase">Classification:</span>
              <div className="flex items-center gap-10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="classification" value="HOTLIST" checked={formData.classification === 'HOTLIST'} onChange={handleRadioChange} className="w-5 h-5 border-2 border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-700 uppercase group-hover:text-blue-600 transition">Hotlist</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="classification" value="NORMAL" checked={formData.classification === 'NORMAL'} onChange={handleRadioChange} className="w-5 h-5 border-2 border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-700 uppercase group-hover:text-blue-600 transition">Normal</span>
                  </label>
              </div>
              </div>

              <div className="flex justify-center pt-4">
              <button 
                  type="submit"
                  className="bg-[#1a2e5a] text-white px-20 py-4 rounded-2xl font-semibold uppercase tracking-widest hover:bg-[#132142] hover:scale-105 transition-all shadow-xl active:scale-95"
              >
                  Submit Log
              </button>
              </div>
          </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const EditableProfileField = ({ label, name, value, isEditing, onChange, type = 'text' }: any) => (
  <div>
    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{label}</label>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full p-4 border-2 border-blue-200 bg-blue-50 rounded-xl font-bold text-slate-700 text-lg text-center"
      />
    ) : (
      <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-lg text-center">{value || 'N/A'}</div>
    )}
  </div>
);

export default WorkerProfile;
