import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import WorkerProfileContent from './WorkerProfileContent';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { getAllPersons } from './api/person';
import { authenticatedFetch } from './api/fetch';


const WorkerLandingPage: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const userEmail = auth.userEmail || '';
  
  const [fallbackId, setFallbackId] = useState<number | null>(null);
  
  const workerId = auth.userId || fallbackId;
  
  const activeTab = location.pathname === '/worker_profile' ? 'profile' : 'dashboard';
  
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let currentCode = auth.personCode;
        let currentId = auth.userId;
        
        // Fallback: If not in auth context, fetch real person details using email
        if (!currentCode || !currentId) {
          const allPersons = await getAllPersons();
          const personData = allPersons.find(p => p.email === userEmail);
          
          if (personData) {
            currentId = personData.id;
            currentCode = (personData as any).personCode;
            setFallbackId(currentId);
          } else {
            throw new Error('Worker profile not found.');
          }
        }
        
        if (activeTab === 'dashboard' && currentCode) {
          const apiUrl = 'http://localhost:8080/api';
          const [summaryRes, logsRes] = await Promise.all([
            authenticatedFetch(`${apiUrl}/attendance/person/${currentCode}/summary`),
            authenticatedFetch(`${apiUrl}/attendance/person/${currentCode}`)
          ]);
          
          const summary = summaryRes.ok ? await summaryRes.json() : null;
          const logs = logsRes.ok ? await logsRes.json() : [];
          
          setAttendanceSummary(summary);
          setAttendanceLogs(Array.isArray(logs) ? logs : []);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [userEmail, activeTab, auth.personCode, auth.userId]);

  return (
    <DashboardLayout title={activeTab === 'dashboard' ? 'Worker Dashboard' : 'My Profile'}>
      <div className="p-8">
        {activeTab === 'dashboard' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-8">My Dashboard</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Days Present</div>
                    <div className="text-4xl font-black text-blue-600">{attendanceSummary?.totalDaysPresent ?? '—'}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Overtime</div>
                    <div className="text-4xl font-black text-green-600">{attendanceSummary?.totalOvertime ?? '—'}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Absences</div>
                    <div className="text-4xl font-black text-red-500">{attendanceSummary?.absences ?? '—'}</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Attendance Logs</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                        <tr>
                          <th className="px-6 py-4 border-r border-slate-100">Date</th>
                          <th className="px-6 py-4 border-r border-slate-100">Type</th>
                          <th className="px-6 py-4">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                        {attendanceLogs.slice(0, 10).map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4">{log.date || log.timestamp?.split('T')[0]}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-sm ${
                                log.type?.toUpperCase() === 'LOGIN' ? 'text-green-600 bg-green-50' :
                                log.type?.toUpperCase() === 'LOGOUT' ? 'text-red-600 bg-red-50' :
                                log.type?.toUpperCase() === 'OVERTIME' ? 'text-orange-600 bg-orange-50' :
                                'text-blue-600 bg-blue-50'
                              }`}>
                                {log.type?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </td>
                            <td className="px-6 py-4">{log.time || (log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '')}</td>
                          </tr>
                        ))}
                        {attendanceLogs.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-slate-400 py-8 text-center">No logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-5xl mx-auto">
            {workerId ? (
              <WorkerProfileContent workerId={workerId} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerLandingPage;