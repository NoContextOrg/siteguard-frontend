import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Filter, X, Save } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons, updatePersonUi, type PersonResponse } from './api/person';
import { getAllAttendance, getBiometricLastId, type AttendanceLog } from './api/attendance';

// ========== Types ==========
type WorkerStatus = 'NORMAL' | 'HOTLIST';

type WorkerAttendance = 'PRESENT' | 'ABSENT' | 'ON LEAVE' | 'UNKNOWN';

interface WorkerRow {
  id: number;
  name: string;
  team: string;
  attendance: WorkerAttendance;
  engineer: string;
  lastAdmitted: string;
  status: WorkerStatus;
}

const toWorkerRow = (p: PersonResponse): WorkerRow => {
  const upperName = (p.name || '').toUpperCase();

  return {
    id: p.id,
    name: upperName,
    // Backend attaches teamId; show it as TEAM-{id} for now.
    team: p.teamId ? `TEAM-${p.teamId}` : 'UNASSIGNED',
    attendance: 'UNKNOWN',
    engineer: 'N/A',
    lastAdmitted: 'N/A',
    status: 'NORMAL',
  };
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardware-centric state
  const [biometricLastId, setBiometricLastId] = useState<number | null>(null);
  const [lastIdLoading, setLastIdLoading] = useState(false);

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Inline rename state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      await loadPersons();
      if (!cancelled) {
        void loadAttendance({ silent: false });
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
      // Option B: if endpoint is secured, we should only poll when logged in.
      // Option A: endpoint may be public, so polling can still succeed.
      const hasToken = Boolean(localStorage.getItem('accessToken'));

      try {
        setLastIdLoading(true);

        // If we are not logged in and backend is still secured, avoid spamming the endpoint.
        // We'll try once (so Option A still works), then if it fails we stop polling until login.
        const lastId = await getBiometricLastId();
        if (!cancelled) setBiometricLastId(lastId);

        // If we got a value, keep polling regardless of hasToken.
      } catch (e) {
        console.warn('Failed to poll biometric lastId', e);
        if (!cancelled) setBiometricLastId(null);

        // If no token, stop polling until the user logs in.
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
    () => persons.filter((p) => Boolean(p.fingerprint)).length,
    [persons]
  );

  // ========== Filter workers based on search ==========
  const filteredWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workers;

    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.team.toLowerCase().includes(q) ||
        w.engineer.toLowerCase().includes(q)
    );
  }, [workers, searchQuery]);

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

      // Update via UI name mapping -> backend firstName/lastName
      await updatePersonUi(id, {
        name: next,
        email: (persons.find((p) => p.id === id)?.email ?? '').toString(),
        phone: persons.find((p) => p.id === id)?.phoneNumber ?? '',
        role: 'WORKER',
      });

      await loadPersons({ silent: true });
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename worker');
    } finally {
      setSavingEdit(false);
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

        {/* Hardware / device status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Biometric hardware (lastId)
            </div>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {lastIdLoading ? '…' : biometricLastId ?? '—'}
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
            <div className="flex gap-3">
              <button
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition"
                type="button"
              >
                <Calendar size={20} />
              </button>
              <button
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition"
                type="button"
              >
                <Filter size={20} />
              </button>
            </div>
          </div>

          {/* ========== Table ========== */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-[11px] font-black uppercase tracking-widest border-b">
                  <th className="px-6 py-4 border-r border-slate-100">Name</th>
                  <th className="px-6 py-4 border-r border-slate-100">Assigned Team</th>
                  <th className="px-6 py-4 border-r border-slate-100">Attendance</th>
                  <th className="px-6 py-4 border-r border-slate-100">Assigned Engineer</th>
                  <th className="px-6 py-4 border-r border-slate-100 text-center">Last Admitted</th>
                  <th className="px-6 py-4 border-r border-slate-100 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-sm">
                      Loading workers…
                    </td>
                  </tr>
                ) : filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-sm">
                      No workers found.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const isEditing = editingId === worker.id;

                    return (
                      <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
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
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-sm ${
                              worker.attendance === 'PRESENT'
                                ? 'text-green-600 bg-green-50'
                                : worker.attendance === 'ABSENT'
                                  ? 'text-red-600 bg-red-50'
                                  : worker.attendance === 'ON LEAVE'
                                    ? 'text-orange-600 bg-orange-50'
                                    : 'text-slate-600 bg-slate-100'
                            }`}
                          >
                            {worker.attendance}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-bold">{worker.engineer}</td>
                        <td className="px-6 py-4 text-center text-slate-400 text-xs">{worker.lastAdmitted}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-[10px] font-black tracking-widest ${
                              worker.status === 'HOTLIST' ? 'text-red-500' : 'text-slate-500'
                            }`}
                          >
                            {worker.status}
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
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(worker)}
                              className="text-blue-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                              type="button"
                            >
                              Rename
                            </button>
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

        {/* Attendance preview (optional) */}
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
                    .sort((a, b) => (b.eventTimestamp || '').localeCompare(a.eventTimestamp || ''))
                    .slice(0, 10)
                    .map((log) => (
                      <tr key={`${log.personCode}-${log.eventTimestamp}-${log.eventType}`}>
                        <td className="px-6 py-4 text-slate-700 text-sm font-bold">
                          {log.personName || log.personCode}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-bold uppercase">{log.eventType}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">{log.eventTimestamp}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}