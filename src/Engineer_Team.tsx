import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  X,
  List,
  Calendar,
  Search
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from './components/DashboardLayout';
import { Link } from 'react-router-dom';

// ================= TYPES ================= //
type Person = {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  teamName?: string;
};

type OvertimePoint = {
  name: string;
  Hotlist: number;
  Workers: number;
};

// ================= COMPONENT ================= //
const EngineerTeam = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'list' | 'add' | null>(null);

  const [persons, setPersons] = useState<Person[]>([]);
  const [overtimeData, setOvertimeData] = useState<OvertimePoint[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DATA ================= //
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [personsRes, overtimeRes, statsRes, alertsRes] = await Promise.all([
          fetch('/api/persons'),
          fetch('/api/analytics/overtime'),
          fetch('/api/analytics/stats'),
          fetch('/api/alerts/count/active')
        ]);

        const personsData = await personsRes.json();
        const overtimeJson = await overtimeRes.json();
        const statsJson = await statsRes.json();
        const alertsJson = await alertsRes.json();

        setPersons(personsData || []);
        setOvertimeData(overtimeJson?.data || overtimeJson || []);
        setStats(statsJson);
        setActiveAlerts(alertsJson || 0);

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
    return persons.filter(p =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [persons, searchTerm]);

  const mapName = (p: Person) => `${p.firstName} ${p.lastName}`;

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
              <Calendar size={20} />
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

          <div className="p-6 flex justify-between items-center border-b">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} />
              <input
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-full"
                placeholder="Search workers..."
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
                        {mapName(p)}
                      </td>
                      <td>{p.role}</td>
                      <td>
                        <Link to={`/worker-profile/${p.id}`} className="text-blue-500">
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
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalType(null)} />
          <div className="relative bg-white p-8 rounded-xl w-[400px]">
            <div className="flex justify-between">
              <h2 className="font-bold uppercase">
                {modalType === 'list' ? 'Worker List' : 'Add Worker'}
              </h2>
              <X onClick={() => setModalType(null)} />
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Backend integration ready (connect POST /api/persons/ui here next step).
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EngineerTeam;