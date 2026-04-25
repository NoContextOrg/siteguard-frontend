import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SquarePen, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { getPersonById, type PersonResponse } from './api/person';
import { getAttendanceCalendar } from './api/attendance';

// NOTE: These API functions should be moved to a dedicated file like `src/api/health.ts`
// and use a shared API client instance (e.g., axios).

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

const getHealthLogsForPerson = async (_personCode: string): Promise<HealthLogDTO[]> => {
  // const response = await api.get<HealthLogDTO[]>(`/api/health-logs/person/${personCode}`);
  // return response.data;
  // Mocking for now. Replace with actual API call.
  return [];
};

const addHealthLog = async (_personCode: string, logDto: HealthLogDTO): Promise<HealthLogDTO> => {
  // const response = await api.post<HealthLogDTO>(`/api/health-logs/person/${personCode}`, logDto);
  // return response.data;
  // Mocking for now.
  return { id: Math.random(), ...logDto };
};

const WorkerProfile = () => {
  const { logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const workerId = searchParams.get('id');

  const [worker, setWorker] = useState<PersonResponse | null>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLogDTO[]>([]);
  const [calendar, setCalendar] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<HealthLogDTO>({});

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
      setWorker(workerData);

      const personCode = (workerData as any)?.personCode;
      if (personCode) {
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, classification: e.target.value as 'HOTLIST' | 'NORMAL' }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const personCode = (worker as any)?.personCode;
    if (!personCode) {
      alert('Cannot submit log: worker personCode is missing.');
      return;
    }

    try {
      const newLog = await addHealthLog(personCode, formData);
      setHealthLogs(prev => [...prev, newLog]);
      setIsModalOpen(false);
      setFormData({});
    } catch (err) {
      alert(`Failed to submit health log: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return <DashboardLayout title="Worker Profile"><div className="p-8">Loading profile...</div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout title="Worker Profile"><div className="p-8 text-red-500">{error}</div></DashboardLayout>;
  }

  if (!worker) {
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
            <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col items-center mb-10">
                <div className="w-40 h-40 rounded-full border-4 border-slate-100 overflow-hidden mb-6">
                  <img src={`https://i.pravatar.cc/150?u=${worker.id}`} alt="Worker" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* ========== Form Fields ========== */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Name</label>
                  <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-lg text-center">{worker.name || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Address</label>
                  <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">{(worker as any).address || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Contact Number</label>
                  <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">{(worker as any).phoneNumber || 'N/A'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Age</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">{(worker as any).age || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Birthdate</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">{(worker as any).birthDate || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Position</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">{worker.position || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Year of Employment</label>
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 text-center">{(worker as any).employmentYear || 'N/A'}</div>
                  </div>
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
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 text-blue-900 font-bold mt-2 mx-auto hover:text-blue-600 transition"
              >
                <SquarePen size={18} /> ADD CHECKUP LOG
              </button>
            </div>

            <div className="p-4 space-y-3">
              {healthLogs.length > 0 ? healthLogs.map(log => (
                <div key={log.id} className={`${log.classification === 'HOTLIST' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border p-4 rounded-lg`}>
                  <p className={`text-[16px] font-bold ${log.classification === 'HOTLIST' ? 'text-red-900' : 'text-green-900'} leading-tight uppercase text-center`}>
                    {log.findings || 'No findings'}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-1 text-center">
                    {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'No date'}
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
          onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
          <div className="relative p-6 flex justify-center items-center border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Medical Form</h2>
              <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-8 top-6 p-2 hover:bg-slate-100 rounded-full transition"
              >
              <X size={28} className="text-slate-800" />
              </button>
          </div>

          {/* Modal Body */}
          <form className="px-10 py-8 space-y-4 max-h-[85vh] overflow-y-auto" onSubmit={handleFormSubmit}>
              
              {/* Row 1: Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                  { label: 'Temperature', placeholder: '36.5 °C', type: 'text' },
                  { label: 'Blood Pressure', placeholder: '120/80', type: 'text' },
                  { label: 'Heart Rate / Pulse', placeholder: '72 bpm', type: 'text' },
                  { label: 'Time', type: 'time' },
                  { label: 'Date', type: 'date' },
              ].map((field) => (
                  <div key={field.label} className="bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">{field.label}</label>
                  <input 
                      type={field.type} 
                      name={field.label.toLowerCase().replace(/ \/ /g, '').replace(/ /g, '')}
                      placeholder={field.placeholder}
                      onChange={handleFormChange}
                      value={(formData as any)[field.label.toLowerCase().replace(/ \/ /g, '').replace(/ /g, '')] || ''}
                      className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-sm cursor-pointer"
                  />
                  </div>
              ))}
              </div>

              {/* Row 2: Physicals */}
              <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Height</label>
                  <input type="text" name="height" value={formData.height || ''} onChange={handleFormChange} placeholder="170 cm" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
              </div>
              <div className="col-span-3 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Weight</label>
                  <input type="text" name="weight" value={formData.weight || ''} onChange={handleFormChange} placeholder="65 kg" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
              </div>
              <div className="col-span-2 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Bmi</label>
                  <input type="text" name="bmi" value={formData.bmi || ''} onChange={handleFormChange} placeholder="22.4" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
              </div>
              <div className="col-span-4 bg-[#f0f7ff] border-2 border-blue-100 rounded-2xl p-4 transition-focus focus-within:border-blue-400">
                  <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">Respiratory Rate</label>
                  <input type="text" name="respiratoryRate" value={formData.respiratoryRate || ''} onChange={handleFormChange} placeholder="16 breaths/min" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm placeholder:font-normal" />
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

export default WorkerProfile;
