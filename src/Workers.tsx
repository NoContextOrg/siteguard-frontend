import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Filter, X, Save } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons, type PersonResponse } from './api/person';

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
  const upperDept = (p.department || '').toUpperCase();

  return {
    id: p.id,
    name: upperName,
    team: upperDept || 'UNASSIGNED',
    // Backend doesn't provide these in /persons payload today
    attendance: 'UNKNOWN',
    engineer: 'N/A',
    lastAdmitted: 'N/A',
    status: 'NORMAL',
  };
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [editingWorker, setEditingWorker] = useState<WorkerRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const persons = await getAllPersons();
        if (cancelled) return;

        setWorkers(persons.map(toWorkerRow));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load workers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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

  // ========== Handle Edit Submission ==========
  // NOTE: This currently updates local state only. Wire this to a backend update endpoint when available.
  const handleUpdateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    setWorkers((prev) => prev.map((w) => (w.id === editingWorker.id ? editingWorker : w)));
    setEditingWorker(null);
  };

  return (
    <DashboardLayout title="Workers">
      <div className="p-10">
        <div className="flex items-center justify-between gap-4 mb-10">
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">WORKERS</h2>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {loading ? 'Loading…' : `${filteredWorkers.length} shown / ${workers.length} total`}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <div>
              <div className="font-semibold text-red-800">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
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
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition" type="button">
                <Calendar size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition" type="button">
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
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{worker.name}</td>
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
                        <button
                          onClick={() => setEditingWorker(worker)}
                          className="text-blue-600 font-black text-[11px] uppercase tracking-widest hover:underline px-3 py-2"
                          type="button"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== EDIT MODAL ========== */}
      {editingWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1e293b] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight">Edit Worker Details</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">ID: #{editingWorker.id}</p>
              </div>
              <button
                onClick={() => setEditingWorker(null)}
                className="hover:bg-white/10 p-2 rounded-full transition"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateWorker} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full border-b-2 border-slate-100 focus:border-blue-500 py-2 outline-none font-bold text-slate-700 transition"
                    value={editingWorker.name}
                    onChange={(e) =>
                      setEditingWorker({ ...editingWorker, name: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Assigned Team
                  </label>
                  <select
                    className="w-full border-b-2 border-slate-100 focus:border-blue-500 py-2 outline-none font-bold text-slate-700 bg-transparent"
                    value={editingWorker.team}
                    onChange={(e) => setEditingWorker({ ...editingWorker, team: e.target.value })}
                  >
                    <option value="MASONRY">MASONRY</option>
                    <option value="LINE & GRADE">LINE & GRADE</option>
                    <option value="MEPF">MEPF</option>
                    <option value="STRUCTURAL">STRUCTURAL</option>
                    <option value="FINISHING">FINISHING</option>
                    <option value="UNASSIGNED">UNASSIGNED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Status
                  </label>
                  <select
                    className="w-full border-b-2 border-slate-100 focus:border-blue-500 py-2 outline-none font-bold text-slate-700 bg-transparent"
                    value={editingWorker.status}
                    onChange={(e) => setEditingWorker({ ...editingWorker, status: e.target.value as WorkerStatus })}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HOTLIST">HOTLIST</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  <Save size={18} /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-8 bg-slate-100 text-slate-500 py-4 rounded-lg font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}