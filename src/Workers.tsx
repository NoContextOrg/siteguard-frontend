import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Filter, X, Save } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';

// ========== Types ==========
interface Worker {
  id: number;
  name: string;
  team: string;
  attendance: string;
  engineer: string;
  lastAdmitted: string;
  status: 'NORMAL' | 'HOTLIST';
}

// ========== Dummy Initial Data ========== 
const initialWorkers: Worker[] = [
  { id: 1, name: 'JUAN DELA CRUZ', team: 'MASONRY', attendance: 'PRESENT', engineer: 'ENGR. SANTOS', lastAdmitted: 'N/A', status: 'NORMAL' },
  { id: 2, name: 'MARIA LOPEZ', team: 'LINE & GRADE', attendance: 'ABSENT', engineer: 'ENGR. MACASPAC', lastAdmitted: '01/19/26', status: 'HOTLIST' },
  { id: 3, name: 'PEDRO RAMOS', team: 'MASONRY', attendance: 'ON LEAVE', engineer: 'ENGR. CRUZ', lastAdmitted: 'N/A', status: 'NORMAL' },
  { id: 4, name: 'ANA VILLANUEVA', team: 'LINE & GRADE', attendance: 'PRESENT', engineer: 'ENGR. LIMUNOZ', lastAdmitted: 'N/A', status: 'NORMAL' },
  { id: 5, name: 'ROBERTO MENDOZA', team: 'MEPF', attendance: 'ON LEAVE', engineer: 'ENGR. LIMUNOZ', lastAdmitted: '01/19/26', status: 'HOTLIST' },
  { id: 6, name: 'LIZA FERNANDEZ', team: 'STRUCTURAL', attendance: 'PRESENT', engineer: 'ENGR. MACASPAC', lastAdmitted: 'N/A', status: 'NORMAL' },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ========== Filter workers based on search ==========
  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========== Handle Edit Submission ==========
  const handleUpdateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorker) {
      setWorkers(workers.map(w => w.id === editingWorker.id ? editingWorker : w));
      setEditingWorker(null);
    }
  };

  return (
    <DashboardLayout title="Workers">
      <div className="p-10">
        <h2 className="text-4xl font-black text-gray-800 mb-10 tracking-tight">WORKERS</h2>
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-white">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search workers by name or team..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition"><Calendar size={20}/></button>
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition"><Filter size={20}/></button>
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
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{worker.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-bold uppercase">{worker.team}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-sm ${
                        worker.attendance === 'PRESENT' ? 'text-green-600 bg-green-50' : 
                        worker.attendance === 'ABSENT' ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'
                      }`}>
                        {worker.attendance}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-bold">{worker.engineer}</td>
                    <td className="px-6 py-4 text-center text-slate-400 text-xs">{worker.lastAdmitted}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black tracking-widest ${worker.status === 'HOTLIST' ? 'text-red-500' : 'text-slate-500'}`}>
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
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
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
              <button onClick={() => setEditingWorker(null)} className="hover:bg-white/10 p-2 rounded-full transition"><X size={24}/></button>
            </div>

            <form onSubmit={handleUpdateWorker} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full border-b-2 border-slate-100 focus:border-blue-500 py-2 outline-none font-bold text-slate-700 transition"
                    value={editingWorker.name}
                    onChange={(e) => setEditingWorker({...editingWorker, name: e.target.value.toUpperCase()})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Assigned Team</label>
                  <select 
                    className="w-full border-b-2 border-slate-100 focus:border-blue-500 py-2 outline-none font-bold text-slate-700 bg-transparent"
                    value={editingWorker.team}
                    onChange={(e) => setEditingWorker({...editingWorker, team: e.target.value})}
                  >
                    <option value="MASONRY">MASONRY</option>
                    <option value="LINE & GRADE">LINE & GRADE</option>
                    <option value="MEPF">MEPF</option>
                    <option value="STRUCTURAL">STRUCTURAL</option>
                    <option value="FINISHING">FINISHING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Status</label>
                  <select 
                    className="w-full border-b-2 border-slate-100 focus:border-blue-500 py-2 outline-none font-bold text-slate-700 bg-transparent"
                    value={editingWorker.status}
                    onChange={(e) => setEditingWorker({...editingWorker, status: e.target.value as any})}
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