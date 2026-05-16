import { useState, useCallback, useRef, useEffect } from 'react';
import { type ExportJob, getExportJobStatus, downloadExportFile } from '../api/export';

export type ExportState = 'idle' | 'creating' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface UseExportJobOptions {
  pollingInterval?: number;
  autoDownload?: boolean;
  onSuccess?: (job: ExportJob) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to manage an asynchronous export job lifecycle.
 * Handles job creation, polling for status, and automatic downloading.
 */
export const useExportJob = (options: UseExportJobOptions = {}) => {
  const {
    pollingInterval = 3000,
    autoDownload = true,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<ExportState>('idle');
  const [job, setJob] = useState<ExportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<number | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (jobId: number) => {
    try {
      const currentJob = await getExportJobStatus(jobId);
      setJob(currentJob);

      if (currentJob.status === 'COMPLETED') {
        setState('completed');
        clearPolling();
        
        if (autoDownload) {
          try {
            await downloadExportFile(jobId);
          } catch (downloadErr) {
            console.error('Download error:', downloadErr);
            // Don't fail the job state if just the download failed (user can retry download)
          }
        }
        
        onSuccess?.(currentJob);
      } else if (currentJob.status === 'FAILED') {
        setState('failed');
        setError(currentJob.errorMessage || 'Export failed on server');
        clearPolling();
        onError?.(new Error(currentJob.errorMessage || 'Export failed on server'));
      }
    } catch (err) {
      console.error('Polling network error:', err);
      // We continue polling on transient network errors
    }
  }, [autoDownload, clearPolling, onError, onSuccess]);

  const startJob = useCallback(async (startFn: () => Promise<{ jobId: number }>) => {
    if (state !== 'idle' && state !== 'completed' && state !== 'failed' && state !== 'cancelled') {
      return; // Already running
    }

    setState('creating');
    setError(null);
    setJob(null);

    try {
      const { jobId } = await startFn();
      setState('processing');
      
      // Start polling immediately then at intervals
      await pollStatus(jobId);
      
      // Clear any existing interval just in case
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      
      pollingRef.current = window.setInterval(() => pollStatus(jobId), pollingInterval);
    } catch (err) {
      setState('failed');
      const msg = err instanceof Error ? err.message : 'Failed to initiate export job';
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    }
  }, [pollStatus, pollingInterval, onError, state]);

  const downloadAgain = useCallback(async () => {
    if (job?.id && state === 'completed') {
      try {
        await downloadExportFile(job.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Download failed';
        setError(msg);
      }
    }
  }, [job, state]);

  const reset = useCallback(() => {
    clearPolling();
    setState('idle');
    setJob(null);
    setError(null);
  }, [clearPolling]);

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  return {
    state,
    job,
    error,
    startJob,
    reset,
    downloadAgain,
    isExporting: state === 'creating' || state === 'processing',
    progress: job?.progressPercentage || 0,
  };
};
