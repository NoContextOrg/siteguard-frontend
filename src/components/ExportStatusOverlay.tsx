import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';
import { type ExportState } from '../hooks/useExportJob';

interface ExportStatusOverlayProps {
  state: ExportState;
  progress: number;
  error: string | null;
  onReset: () => void;
  onDownloadAgain?: () => void;
  title?: string;
}

/**
 * A non-blocking overlay to show export progress and status.
 * Positioned in the bottom-right corner.
 */
export const ExportStatusOverlay: React.FC<ExportStatusOverlayProps> = ({
  state,
  progress,
  error,
  onReset,
  onDownloadAgain,
  title = "Exporting Data"
}) => {
  if (state === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-[60] w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              state === 'completed' ? 'bg-green-500' : 
              state === 'failed' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
            }`} />
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{title}</h4>
          </div>
          <button 
            onClick={onReset} 
            className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {state === 'creating' || state === 'processing' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Loader2 className="text-blue-600 animate-spin" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    {state === 'creating' ? 'Preparing export...' : 'Processing dataset...'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Please wait while we generate your file</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight italic">
                You can continue browsing while the export runs in the background.
              </p>
            </div>
          ) : state === 'completed' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  <CheckCircle2 className="text-green-600" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Export Ready!</span>
                  <span className="text-[10px] text-slate-400 font-medium">Success fully generated report</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your export is complete. If the download didn't start, use the button below.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={onDownloadAgain}
                  className="flex-[2] bg-blue-600 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download size={14} /> Download
                </button>
                <button 
                  onClick={onReset}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl">
                  <XCircle className="text-red-600" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Export Failed</span>
                  <span className="text-[10px] text-slate-400 font-medium">Error encountered during generation</span>
                </div>
              </div>
              <div className="text-[11px] text-red-600 bg-red-50/50 p-3 rounded-xl border border-red-100 break-words font-medium">
                {error || 'An unexpected error occurred while processing your request.'}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onReset}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <RefreshCw size={14} /> Try New Export
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
