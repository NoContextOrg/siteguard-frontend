import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Save, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons, updatePersonUi, setPersonPassword, getAvatarUrl, getFallbackAvatar, type PersonResponse } from './api/person';
import { getAllAttendance, getBiometricLastId, type AttendanceLog } from './api/attendance';
import { authenticatedFetch } from './api/fetch';
import { getUnifiedDashboard } from './api/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://siteguardph.duckdns.org/api';

// ========== Types ==========
type WorkerStatus = 'NORMAL' | 'HOTLIST' | 'NO_FINGERPRINT';

type WorkerAttendance = 'PRESENT' | 'ABSENT' | 'OVERTIME' | 'UNKNOWN';

interface WorkerRow {
  id: number;
  personCode: string;
  name: string;
  team: string;
  attendance: WorkerAttendance;
  engineer: string;
  lastAdmitted: string;
  status: WorkerStatus;

  overtimeCount?: number;
  overtimeStatus?: string;
  fingerprint?: number | null;
  profilePictureUrl?: string;
}


const toWorkerRow = (p: PersonResponse): WorkerRow => {
  // Only use fingerprint for display, do not send in payloads
  const fingerprint = p.biometricId ?? (p as any).fingerprint ?? null;

  let status: WorkerStatus = 'NO_FINGERPRINT';
  if (p.healthProfileStatus === 'HOTLIST' || p.healthProfileStatus === 'HOTLISTED') {
    status = 'HOTLIST';
  } else if (fingerprint) {
    status = 'NORMAL';
  }

  let lastAdmittedFormatted = 'Never';
  if (p.lastAdmitted) {
    const d = new Date(p.lastAdmitted);
    lastAdmittedFormatted = isNaN(d.getTime()) ? p.lastAdmitted : d.toLocaleDateString();
  }

  return {
    id: p.id,
    personCode: (p as any).personCode || '',
    name: (p.name || '').toUpperCase(),
    team: p.teamName || (p.teamId ? `TEAM-${p.teamId}` : 'UNASSIGNED'),
    attendance: 'UNKNOWN',
    engineer: p.assignedEngineerName || 'N/A',
    lastAdmitted: lastAdmittedFormatted,
    status,
    overtimeCount: (p as any).overtimeCount ?? 0,
    overtimeStatus: (p as any).overtimeStatus ?? 'N/A',
    fingerprint,
    profilePictureUrl: p.profilePictureUrl,
  };
};

// Unified reusable status square to prevent dual badge rendering
const UnifiedStatusSquare = ({ hotlist, overtime, present }: { hotlist: boolean, overtime: boolean, present: boolean }) => {
  let bgClass = 'bg-slate-200 text-slate-600 border border-slate-300';
  let label = 'ABSENT';

  if (hotlist && overtime) {
    bgClass = 'bg-[linear-gradient(135deg,#fee2e2_50%,#dcfce7_50%)] text-slate-800 border border-slate-200 shadow-sm';
    label = 'HOTLIST+OT';
  } else if (hotlist) {
    bgClass = 'bg-red-100 text-red-700 border border-red-200';
    label = 'HOTLIST';
  } else if (overtime) {
    bgClass = 'bg-green-100 text-green-700 border border-green-200';
    label = 'OVERTIME';
  } else if (present) {
    bgClass = 'bg-blue-100 text-blue-700 border border-blue-200';
    label = 'PRESENT';
  }

  return (
    <div 
      className={`flex items-center justify-center mx-auto px-2 min-w-[84px] h-8 rounded-md ${bgClass}`}
      title={hotlist && overtime ? 'Hotlist + Overtime' : label}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assigningFingerprintId, setAssigningFingerprintId] = useState<number | null>(null);

  // Hardware-centric state
  const [biometricLastId, setBiometricLastId] = useState<number | null>(null);
  const [lastIdLoading, setLastIdLoading] = useState(false);

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Inline rename state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editPasswordModal, setEditPasswordModal] = useState<number | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [editConfirmPasswordValue, setEditConfirmPasswordValue] = useState('');
  const [editPasswordLoading, setEditPasswordLoading] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState<string | null>(null);
  const [editPasswordSuccess, setEditPasswordSuccess] = useState<string | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  // In-app guide state
  const [guideOpen, setGuideOpen] = useState(true);

  // Password modal state
  const [passwordModalId, setPasswordModalId] = useState<number | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [hotlistCodes, setHotlistCodes] = useState<Set<string>>(new Set());

  const loadPersons = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) {
        setLoading(true);
      }
      setError(null);

      const loaded = await getAllPersons();
      const onlyWorkers = loaded.filter((p) => String((p as any).role ?? '').toUpperCase() === 'WORKER');
      setPersons(onlyWorkers);
      setWorkers(onlyWorkers.map(toWorkerRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workers');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const loadAttendance = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setAttendanceLoading(true);
      const logs = await getAllAttendance();
      setAttendanceLogs(Array.isArray(logs) ? logs : []);
    } catch (e) {
      // Non-fatal for Workers page
      console.warn('Failed to load attendance logs', e);
    } finally {
      if (!opts?.silent) setAttendanceLoading(false);
    }
  };

  const closeEditPasswordModal = () => {
    setEditPasswordModal(null);
    setEditPasswordValue('');
    setEditConfirmPasswordValue('');
    setEditPasswordError(null);
    setEditPasswordSuccess(null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      await loadPersons();
      if (!cancelled) {
        void loadAttendance({ silent: false });

        getUnifiedDashboard().then(res => {
          if (!cancelled && res.enhancedHotlistOverview?.list) {
            const codes = new Set(res.enhancedHotlistOverview.list.map((l: any) => l.personCode));
            setHotlistCodes(codes);
          }
        }).catch(e => console.warn('Failed to load hotlist overview', e));
      }
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll biometric lastId
  useEffect(() => {
    let cancelled = false;
    let interval: number | null = null;

    const tick = async () => {
      const hasToken = Boolean(localStorage.getItem('accessToken'));

      try {
        setLastIdLoading(true);

        const lastId = await getBiometricLastId();
        if (!cancelled) setBiometricLastId(lastId);
      } catch (e) {
        console.warn('Failed to poll biometric lastId', e);
        if (!cancelled) setBiometricLastId(null);

        if (!hasToken && interval != null) {
          window.clearInterval(interval);
          interval = null;
        }
      } finally {
        if (!cancelled) setLastIdLoading(false);
      }
    };

    void tick();
    interval = window.setInterval(tick, 2500);

    return () => {
      cancelled = true;
      if (interval != null) window.clearInterval(interval);
    };
  }, []);

  const registeredFingerprintsCount = useMemo(
    () => persons.filter((p) => Boolean(p.biometricId ?? (p as any).fingerprint)).length,
    [persons]
  );

  // ========== Compute enriched workers with actual attendance ==========
  const enrichedWorkers = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return workers.map(w => {
      const todayLogs = attendanceLogs.filter(log => {
        const anyLog = log as any;
        const logDate = anyLog.date || (anyLog.timestamp || anyLog.eventTimestamp || '').split('T')[0];
        return (anyLog.personCode === w.personCode || anyLog.personCode === w.name || anyLog.personId === w.id) && logDate === todayStr;
      });

      let attendance: WorkerAttendance = 'ABSENT';
      if (todayLogs.length > 0) {
        const isPresent = todayLogs.some((l: any) => String(l.type || l.eventType || '').toUpperCase() === 'LOGIN');
        const isOvertime = todayLogs.some((l: any) => String(l.type || l.eventType || '').toUpperCase().includes('LOGOUT') || String(l.type || l.eventType || '').toUpperCase() === 'OVERTIME');

        if (isOvertime) attendance = 'OVERTIME';
        else if (isPresent) attendance = 'PRESENT';
      }

      let status = w.status;
      if (hotlistCodes.has(w.personCode)) {
        status = 'HOTLIST';
      }

      return { ...w, attendance, status };
    });
  }, [workers, attendanceLogs, hotlistCodes]);

  // ========== Filter workers based on search ==========
  const filteredWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enrichedWorkers;

    return enrichedWorkers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.team.toLowerCase().includes(q) ||
        w.engineer.toLowerCase().includes(q)
    );
  }, [enrichedWorkers, searchQuery]);

  const startEdit = (worker: WorkerRow) => {
    setEditingId(worker.id);
    setEditName(worker.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: number) => {
    const next = editName.trim();
    if (!next) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setSavingEdit(true);
      setError(null);

      await updatePersonUi(id, {
        name: next,
        email: (persons.find((p) => p.id === id)?.email ?? '').toString(),
        phone: persons.find((p) => p.id === id)?.phoneNumber ?? '',
        role: 'WORKER',
      });

      await loadPersons({ silent: true });
      setSuccess('Worker renamed successfully!');
      setTimeout(() => setSuccess(null), 3000);
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename worker');
    } finally {
      setSavingEdit(false);
    }
  };

  // ✅ B. Assign Fingerprint handler
  const assignFingerprint = async (workerId: number) => {
    if (!biometricLastId || biometricLastId <= 0) {
      setError('No fingerprint ID available in the pool. Please enroll on the scanner first.');
      return;
    }

    try {
      setAssigningFingerprintId(workerId);
      setError(null);
      
      const res = await authenticatedFetch(`${API_BASE_URL}/persons/${workerId}/biometric`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biometricId: String(biometricLastId) }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to assign fingerprint');
      }
      
      setBiometricLastId(null); // Clear local state immediately to prevent double-assignment

      setSuccess('Fingerprint assigned successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadPersons({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign fingerprint');
    } finally {
      setAssigningFingerprintId(null);
    }
  };

  // Password modal handlers
  const openPasswordModal = (id: number) => {
    setPasswordModalId(id);
    setPasswordValue('');
    setConfirmPasswordValue('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };
  const closePasswordModal = () => {
    setPasswordModalId(null);
    setPasswordValue('');
    setConfirmPasswordValue('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };
  const handleSetPassword = async () => {
    if (passwordModalId === null) return;
    if (!passwordValue || passwordValue.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (passwordValue !== confirmPasswordValue) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await setPersonPassword(passwordModalId, passwordValue);
      setPasswordSuccess('Password updated successfully.');
      setTimeout(() => closePasswordModal(), 1200);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Failed to set password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout title="Workers">
      <div className="p-10 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">WORKERS</h2>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {loading ? 'Loading…' : `${filteredWorkers.length} shown / ${workers.length} total`}
          </div>
        </div>

        {/* In-app guide: fingerprint enrollment */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <button
            type="button"
            className="w-full p-4 border-b flex items-center justify-between text-left hover:bg-slate-50"
            onClick={() => setGuideOpen((v) => !v)}
          >
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Guide: Register workers with fingerprint
              </div>
              <div className="text-xs text-slate-500 mt-1">
                This matches the real flow: UI → ESP32 → Backend → stored on worker record
              </div>
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-blue-600">
              {guideOpen ? 'Hide' : 'Show'}
            </div>
          </button>

          {guideOpen && (
            <div className="p-5 space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="p-4 border border-slate-200 bg-slate-50 rounded-sm">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">1) Create the worker</div>
                  <ul className="mt-2 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      Add the worker in <span className="font-semibold">User Management</span> (role: WORKER).
                    </li>
                    <li>
                      Ensure the worker has a unique <span className="font-mono">personCode</span> (used by attendance/biometrics).
                    </li>
                    <li>
                      The worker can exist without fingerprint first; enrollment comes next.
                    </li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 bg-slate-50 rounded-sm">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    2) Enroll on the fingerprint device (ESP32)
                  </div>
                  <ul className="mt-2 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      Put the ESP32 device into <span className="font-semibold">enroll</span> mode (per device UI/command).
                    </li>
                    <li>
                      The sensor assigns the next available <span className="font-mono">fingerprintId</span> and reports it.
                    </li>
                    <li>
                      This page polls <span className="font-mono">/api/biometric</span> and shows the latest enrolled ID as{' '}
                      <span className="font-semibold">lastId</span>.
                    </li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 bg-slate-50 rounded-sm">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    3) Link the fingerprint to the worker in the backend
                  </div>
                  <ul className="mt-2 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>
                      Take the <span className="font-semibold">lastId</span> shown above and assign it to the worker.
                    </li>
                    <li>
                      In the admin UI, update the worker record so the backend stores the fingerprint value.
                    </li>
                    <li>
                      After linking, the worker will be counted under <span className="font-semibold">Registered fingerprints</span>.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-sm">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Operational checklist</div>
                <ol className="mt-2 space-y-2 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
                  <li>Confirm ESP32 is online and accessible by the backend.</li>
                  <li>Enroll fingerprint on the device and wait for <span className="font-mono">lastId</span> to update.</li>
                  <li>Assign that fingerprint ID to the correct worker in User Management.</li>
                  <li>Test attendance by scanning the finger; logs should appear under Recent attendance logs.</li>
                </ol>
              </div>

              <div className="text-xs text-slate-500">
                Notes: If <span className="font-mono">/api/biometric</span> is secured and you are logged out, polling may stop until you
                log in.
              </div>
            </div>
          )}
        </div>

        {/* Hardware / device status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Biometric hardware (lastId)
            </div>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {lastIdLoading ? '…' : (biometricLastId && biometricLastId > 0 ? biometricLastId : 'None')}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Polled from <span className="font-mono">/api/biometric</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Registered fingerprints
            </div>
            <div className="mt-2 text-2xl font-black text-slate-800">{registeredFingerprintsCount}</div>
            <div className="mt-1 text-xs text-slate-500">
              Derived from persons with fingerprint data
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Master attendance records
            </div>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {attendanceLoading ? '…' : attendanceLogs.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Loaded from <span className="font-mono">/api/attendance</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <div>
              <div className="font-semibold text-red-800">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900" type="button">
              <X size={18} />
            </button>
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
            <div>
              <div className="font-semibold text-green-800">Success</div>
              <div className="text-sm text-green-700">{success}</div>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900" type="button">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-white">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search workers by name, team, or engineer..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* ========== Table ========== */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-[11px] font-black uppercase tracking-widest border-b">
                  <th className="px-6 py-4 border-r border-slate-100 w-16 text-center">Pic</th>
                  <th className="px-6 py-4 border-r border-slate-100">Name</th>
                  <th className="px-6 py-4 border-r border-slate-100">Assigned Team</th>
                  <th className="px-6 py-4 border-r border-slate-100">Assigned Engineer</th>
                  <th className="px-6 py-4 border-r border-slate-100 text-center">Last Admitted</th>
                  <th className="px-6 py-4 border-r border-slate-100 text-center">Overall Status</th>
                  <th className="px-6 py-4 border-r border-slate-100 text-center">Overtime</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500 text-sm">
                      Loading workers…
                    </td>
                  </tr>
                ) : filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500 text-sm">
                      No workers found.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const isEditing = editingId === worker.id;

                    return (
                      <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center">
                            <img src={getAvatarUrl(worker.name, worker.profilePictureUrl)} alt={worker.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = getFallbackAvatar(worker.name); }} />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                          {isEditing ? (
                            <input
                              className="w-full max-w-xs border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value.toUpperCase())}
                              disabled={savingEdit}
                            />
                          ) : (
                            worker.name
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-bold uppercase">{worker.team}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-bold">{worker.engineer}</td>
                        <td className="px-6 py-4 text-center text-slate-400 text-xs">{worker.lastAdmitted}</td>
                        <td className="px-6 py-4 text-center">
                          <UnifiedStatusSquare 
                            hotlist={worker.status === 'HOTLIST'} 
                            overtime={worker.attendance === 'OVERTIME'} 
                            present={worker.attendance === 'PRESENT'}
                          />

                          {worker.fingerprint ? (
                            <span className="block text-green-600 text-[9px] mt-1 font-bold uppercase">
                              FP: {worker.fingerprint}
                            </span>
                          ) : (
                            <span className="block text-amber-500 text-[9px] mt-1 font-bold uppercase">
                              No FP
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="block text-slate-700 text-sm font-bold">
                            {worker.overtimeCount}
                          </span>
                          <span className={`block text-[10px] mt-1 font-bold uppercase ${
                            worker.overtimeStatus?.toUpperCase().includes('OVERTIME') ? 'text-orange-600' :
                            worker.overtimeStatus?.toUpperCase() === 'NORMAL' ? 'text-green-600' :
                            'text-slate-400'
                          }`}>
                            {worker.overtimeStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <Link
                            to={`/worker-profile?id=${worker.id}`}
                            className="text-green-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                          >
                            Profile
                          </Link>

                          {isEditing ? (
                            <>
                              <button
                                onClick={() => void saveEdit(worker.id)}
                                className="text-blue-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2 inline-flex items-center gap-2 disabled:opacity-50"
                                type="button"
                                disabled={savingEdit}
                              >
                                <Save size={14} /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-slate-500 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2 disabled:opacity-50"
                                type="button"
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => setEditPasswordModal(worker.id)}
                                className="text-orange-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                                type="button"
                                disabled={savingEdit}
                              >
                                Change Password
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(worker)}
                                className="text-blue-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                                type="button"
                              >
                                Rename
                              </button>
                              {/* ✅ A. Assign Fingerprint button */}
                              {!worker.fingerprint && (
                                <button
                                  onClick={() => void assignFingerprint(worker.id)}
                                  disabled={assigningFingerprintId === worker.id}
                                  className="text-purple-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                                  type="button"
                                >
                                  {assigningFingerprintId === worker.id ? 'Assigning...' : 'Assign Fingerprint'}
                                </button>
                              )}
                              <button
                                onClick={() => openPasswordModal(worker.id)}
                                className="text-orange-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                                type="button"
                              >
                                Set/Reset Password
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance preview */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Recent attendance logs
              </div>
              <div className="text-xs text-slate-500 mt-1">Showing latest 10 records</div>
            </div>
            <Link
              to="/attendance"
              className="text-blue-600 font-black text-[11px] uppercase tracking-widest hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-[11px] font-black uppercase tracking-widest border-b">
                  <th className="px-6 py-4 border-r border-slate-100">Person</th>
                  <th className="px-6 py-4 border-r border-slate-100">Type</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Loading attendance…
                    </td>
                  </tr>
                ) : attendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  attendanceLogs
                    .slice()
                    .sort((a, b) => {
                      const timeA = String((a as any).timestamp || (a as any).eventTimestamp || '');
                      const timeB = String((b as any).timestamp || (b as any).eventTimestamp || '');
                      return timeB.localeCompare(timeA);
                    })
                    .slice(0, 10)
                    .map((log, idx) => {
                      const anyLog = log as any;
                      const typeStr = String(anyLog.type || anyLog.eventType || 'UNKNOWN').toUpperCase();
                      const timeStr = String(anyLog.timestamp || anyLog.eventTimestamp || '');
                      const displayTime = timeStr ? new Date(timeStr).toLocaleString() : '—';

                      return (
                        <tr key={`${anyLog.personCode || 'unk'}-${timeStr}-${idx}`}>
                          <td className="px-6 py-4 text-slate-700 text-sm font-bold">
                            {anyLog.personName || anyLog.personCode || 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-sm ${
                              typeStr === 'LOGIN' ? 'text-green-600 bg-green-50' :
                              typeStr === 'LOGOUT' ? 'text-red-600 bg-red-50' :
                              typeStr === 'OVERTIME' ? 'text-orange-600 bg-orange-50' :
                              'text-blue-600 bg-blue-50'
                            }`}>
                              {typeStr}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">{displayTime}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Modal */}
        {passwordModalId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <div className="font-black text-lg mb-2">Set/Reset Password</div>
              <div className="text-xs text-slate-500 mb-4">Set a new password for this worker. Minimum 6 characters.</div>
              <div className="relative mb-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={passwordValue}
                  required
                  minLength={6}
                  onChange={e => setPasswordValue(e.target.value)}
                  placeholder="New password"
                  disabled={passwordLoading}
                  onBlur={() => { if (passwordValue.length < 6) setPasswordError('Password must be at least 6 characters.'); else setPasswordError(null); }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative mb-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={confirmPasswordValue}
                  required
                  minLength={6}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={passwordLoading}
                  onBlur={() => { if (passwordValue !== confirmPasswordValue) setPasswordError('Passwords do not match.'); else setPasswordError(null); }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && <div className="text-xs text-red-600 mb-2">{passwordError}</div>}
              {passwordSuccess && <div className="text-xs text-green-600 mb-2">{passwordSuccess}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSetPassword}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Saving…' : 'Save Password'}
                </button>
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Password Modal (from edit) */}
        {editPasswordModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <div className="font-black text-lg mb-2">Change Password</div>
              <div className="text-xs text-slate-500 mb-4">Set a new password for this worker. Minimum 6 characters.</div>
              <div className="relative mb-2">
                <input
                  type={showEditPassword ? "text" : "password"}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editPasswordValue}
                  required
                  minLength={6}
                  onChange={e => setEditPasswordValue(e.target.value)}
                  placeholder="New password"
                  disabled={editPasswordLoading}
                  onBlur={() => { if (editPasswordValue.length < 6) setEditPasswordError('Password must be at least 6 characters.'); else setEditPasswordError(null); }}
                />
                <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative mb-2">
                <input
                  type={showEditConfirmPassword ? "text" : "password"}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={editConfirmPasswordValue}
                  required
                  minLength={6}
                  onChange={(e) => setEditConfirmPasswordValue(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={editPasswordLoading}
                  onBlur={() => { if (editPasswordValue !== editConfirmPasswordValue) setEditPasswordError('Passwords do not match.'); else setEditPasswordError(null); }}
                />
                <button type="button" onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showEditConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {editPasswordError && <div className="text-xs text-red-600 mb-2">{editPasswordError}</div>}
              {editPasswordSuccess && <div className="text-xs text-green-600 mb-2">{editPasswordSuccess}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={async () => {
                    if (editPasswordModal === null) return;
                    if (!editPasswordValue || editPasswordValue.length < 6) {
                      setEditPasswordError('Password must be at least 6 characters.');
                      return;
                    }
                    if (editPasswordValue !== editConfirmPasswordValue) {
                      setEditPasswordError('Passwords do not match.');
                      return;
                    }
                    setEditPasswordLoading(true);
                    setEditPasswordError(null);
                    setEditPasswordSuccess(null);
                    try {
                      await setPersonPassword(editPasswordModal, editPasswordValue);
                      setEditPasswordSuccess('Password updated successfully.');
                      setTimeout(() => setEditPasswordModal(null), 1200);
                    } catch (e) {
                      setEditPasswordError(e instanceof Error ? e.message : 'Failed to set password');
                    } finally {
                      setEditPasswordLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                  disabled={editPasswordLoading}
                >
                  {editPasswordLoading ? 'Saving…' : 'Save Password'}
                </button>
                <button
                  onClick={closeEditPasswordModal}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50"
                  disabled={editPasswordLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}