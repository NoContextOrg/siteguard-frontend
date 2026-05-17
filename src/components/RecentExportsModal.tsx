import React, { useEffect, useState } from 'react';
import { Download, X, FileText, Clock, RefreshCw } from 'lucide-react';
import { getExportHistory, downloadExportFile, type ExportJob } from '../api/export';

interface RecentExportsModalProps {
  onClose: () => void;
}

export const RecentExportsModal: React.FC<RecentExportsModalProps> = ({ onClose }) => {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExportHistory();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load export history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownload = async (job: ExportJob) => {
    try {
      await downloadExportFile(job.id, `${job.exportType}_${job.createdAt.split('T')[0]}.${job.format.toLowerCase()}`);
    } catch (err: any) {
      alert(err.message || 'Failed to download file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Exports</h2>
              <p className="text-sm text-slate-400">View and redownload your recently generated files</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="animate-spin mb-4" size={32} />
              <p>Loading export history...</p>
            </div>
          ) : error ? (
            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>No recent exports found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-700/50 rounded-lg text-slate-300">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200 uppercase">{job.exportType.replace(/_/g, ' ')}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-blue-400">{job.format}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                          job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          job.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {job.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleDownload(job)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
