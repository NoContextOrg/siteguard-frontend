import { useEffect, useState } from 'react';
import { SquarePen, X, Trash2 } from 'lucide-react';
import { getPersonById, type PersonResponse } from './api/person';
import { getAttendanceCalendar } from './api/attendance';
import { updateWorkerProfile, type WorkerProfileUpdateDTO } from './api/workerProfile';
import { useAuth } from './context/AuthContext';
import { authenticatedFetch } from './api/fetch';

/* ---------------- TYPES ---------------- */

const API_BASE_URL = 'http://siteguardph.duckdns.org/api';

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

  const [worker, setWorker] = useState<PersonResponse | null>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLogDTO[]>([]);
  const [calendar, setCalendar] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editData, setEditData] = useState<WorkerProfileUpdateDTO>({});
  const [formData, setFormData] = useState<HealthLogDTO>({});
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  /* ---------------- LOAD ---------------- */

  const loadData = async () => {
    try {
      setLoading(true);

      const workerData = await getPersonById(Number(workerId));
      setWorker(workerData);

      const personCode = (workerData as any)?.personCode;

      if (personCode) {
        setHealthLogs(await getHealthLogsForPerson(personCode));
        setCalendar(await getAttendanceCalendar(personCode));
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

    const personCode = (worker as any)?.personCode;
    if (!personCode) return;

    try {
      if (editingLogId) {
        const updatedLog = await updateHealthLog(editingLogId, formData);
        setHealthLogs(prev => prev.map(log => log.id === editingLogId ? updatedLog : log));
      } else {
        const newLog = await addHealthLog(personCode, formData);
        setHealthLogs(prev => [...prev, newLog]);
      }
      setFormData({});
      setIsModalOpen(false);
      setEditingLogId(null);
    } catch (err) {
      setError('Failed to submit health log');
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this health record?')) return;
    try {
      await deleteHealthLog(id);
      setHealthLogs(prev => prev.filter(log => log.id !== id));
    } catch (err) {
      setError('Failed to delete health log');
    }
  };

  /* ---------------- EDIT PROFILE ---------------- */

  const handleEditClick = () => {
    if (!worker) return;

    setEditData({
      name: worker.name,
      position: worker.position,
    });

    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!worker) return;

    setIsSaving(true);

    try {
      const updated = await updateWorkerProfile(worker.id, editData);
      setWorker(updated);
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
    if (!logs) return 'EMPTY';
    if (logs.includes('LEAVE')) return 'LEAVE';
    if (logs.includes('OVERTIME')) return 'OVERTIME';
    if (logs.includes('LOGIN')) return 'PRESENT';
    return 'EMPTY';
  };

  const yearDates = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(2026, 0, 1);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  /* ---------------- UI ---------------- */

  if (loading) return <div className="py-12 flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>;
  if (!worker) return <div className="p-8 text-slate-500">Not found</div>;

  return (
    <>
      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-8">My Profile</h2>
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

            <div className="space-y-6">
              <EditableField
                label="Name"
                name="name"
                value={isEditing ? editData.name : worker.name}
                isEditing={isEditing}
                onChange={(e: any) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />

              <EditableField
                label="Position"
                name="position"
                value={isEditing ? editData.position : worker.position}
                isEditing={isEditing}
                onChange={(e: any) =>
                  setEditData({ ...editData, position: e.target.value })
                }
              />
            </div>

            {/* Attendance */}
            <div className="mt-12 bg-[#1e293b] p-8 rounded-xl text-white shadow-2xl">
              <h3 className="text-lg font-bold uppercase mb-6 tracking-widest text-blue-100">Attendance Overview</h3>
              <div className="grid grid-cols-7 gap-2">
                {yearDates.map((d) => {
                  const status = getStatus(d);
                  return (
                    <div
                      key={d}
                      className={`w-3 h-3 rounded-full ${
                        status === 'PRESENT'
                          ? 'bg-blue-400'
                          : status === 'OVERTIME'
                          ? 'bg-green-400'
                          : status === 'LEAVE'
                          ? 'bg-red-500'
                          : 'bg-transparent border border-slate-500'
                      }`}
                      title={`${d} - ${status}`}
                    />
                  );
                })}
              </div>

              <div className="flex justify-center gap-8 mt-10 text-[10px] font-black border-t border-slate-700/50 pt-6 tracking-widest">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full border border-slate-500 bg-transparent" /> ABSENT
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-400" /> PRESENT
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-green-400" /> OVERTIME
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" /> ON LEAVE
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
                onClick={() => { setEditingLogId(null); setFormData({}); setIsModalOpen(true); }}
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form
            onSubmit={handleSubmit}
            className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
          >
            <div className="p-6 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingLogId ? 'Edit Medical Log' : 'Add Medical Log'}</h2>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingLogId(null); setFormData({}); }} className="p-2 hover:bg-slate-100 rounded-full transition">
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
                <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Findings</label>
                <textarea
                  name="findings"
                  placeholder="Enter physical observations..."
                  onChange={handleFormChange}
                  className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm resize-none h-16"
                />
              </div>

              <div className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 uppercase">Classification:</span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="NORMAL"
                      checked={formData.classification === 'NORMAL'}
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

              <button type="submit" className="w-full mt-4 bg-[#1a2e5a] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#132142] transition-all shadow-lg">
                Submit Log
              </button>
            </div>
          </form>
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