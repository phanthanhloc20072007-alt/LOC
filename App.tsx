import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus } from './types';
import JobForm from './components/JobForm';
import JobQueue from './components/JobQueue';
import { generateVideoForJob } from './services/geminiService';

const MAX_CONCURRENT_JOBS = 4;

const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  
  // Initialize API Key
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const aistudio = (window as any).aistudio;
        if (aistudio && aistudio.hasSelectedApiKey) {
          const hasKey = await aistudio.hasSelectedApiKey();
          if (hasKey) {
            setApiKeyReady(true);
          }
        }
      } catch (e) {
        console.error("Error checking API key status", e);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.openSelectKey) {
      aistudio.openSelectKey();
      // Assume success after interaction for better UX, usually reloads or injects key
      setApiKeyReady(true); 
    }
  };

  // Job Management
  const addJob = useCallback((job: Job) => {
    setJobs(prev => [...prev, job]);
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const duplicateJob = useCallback((job: Job) => {
    const newJob: Job = {
        ...job,
        id: uuidv4(),
        createdAt: Date.now(),
        status: JobStatus.IDLE,
        error: undefined,
        videoUri: undefined,
        progressMessage: undefined,
        startTime: undefined,
    };
    setJobs(prev => [...prev, newJob]);
  }, []);

  // Update a specific job
  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  // Queue Processing Logic
  useEffect(() => {
    if (!isQueueRunning || !apiKeyReady) return;

    const processQueue = async () => {
      // 1. Check current concurrency
      const processingCount = jobs.filter(j => j.status === JobStatus.PROCESSING).length;
      
      if (processingCount >= MAX_CONCURRENT_JOBS) return;

      // 2. Find next idle job
      const nextJob = jobs.find(j => j.status === JobStatus.IDLE);
      
      if (!nextJob) return;

      // 3. Start processing
      const jobId = nextJob.id;
      updateJob(jobId, { 
        status: JobStatus.PROCESSING,
        startTime: Date.now(),
        progressMessage: 'Initializing...'
      });

      try {
        const videoUri = await generateVideoForJob(nextJob, (progressMessage) => {
             updateJob(jobId, { progressMessage });
        });

        updateJob(jobId, { 
            status: JobStatus.COMPLETED, 
            videoUri,
            progressMessage: 'Completed'
        });
      } catch (error: any) {
        let errorMessage = error.message || 'Unknown error';
        
        // Handle specific API key errors
        if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API key")) {
             setApiKeyReady(false); // Force re-selection
             setIsQueueRunning(false); // Stop queue
             errorMessage = "API Key Invalid or Expired. Please select key again.";
        }

        updateJob(jobId, { 
            status: JobStatus.FAILED, 
            error: errorMessage 
        });
      }
    };

    // Run the check frequently, but not in a tight loop to avoid React thrashing
    const interval = setInterval(processQueue, 1000);
    return () => clearInterval(interval);

  }, [jobs, isQueueRunning, apiKeyReady, updateJob]);


  // Computed stats
  const stats = useMemo(() => {
      return {
          total: jobs.length,
          completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
          failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
          pending: jobs.filter(j => j.status === JobStatus.IDLE || j.status === JobStatus.PROCESSING).length
      }
  }, [jobs]);

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Veo Batch Studio</h1>
          <p className="text-gray-400 mb-8">
            To generate videos with Veo, you need to select a paid Google Cloud Project API key.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform active:scale-95"
          >
            Select API Key
          </button>
          <div className="mt-6 text-xs text-gray-500">
             See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 underline">Billing Documentation</a> for more info.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             </div>
             <h1 className="text-2xl font-bold tracking-tight">Veo Batch Studio</h1>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 flex gap-4 mr-4">
                  <span>Completed: <strong className="text-green-400">{stats.completed}</strong></span>
                  <span>Failed: <strong className="text-red-400">{stats.failed}</strong></span>
                  <span>Pending: <strong className="text-blue-400">{stats.pending}</strong></span>
              </div>
              
              <button
                onClick={() => setIsQueueRunning(!isQueueRunning)}
                className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                    isQueueRunning 
                    ? 'bg-red-600/20 text-red-400 border border-red-800 hover:bg-red-600/30' 
                    : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/50'
                }`}
              >
                {isQueueRunning ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                        Pause Queue
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                         Start Processing
                    </>
                )}
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-80px)]">
        
        {/* Left Col: Input Form */}
        <div className="lg:col-span-1 overflow-y-auto pr-2 custom-scrollbar">
            <JobForm onAddJob={addJob} />
            
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-800 text-sm text-gray-400">
                <h3 className="font-bold text-gray-300 mb-2">System Info</h3>
                <ul className="space-y-1">
                    <li>Max Concurrent Jobs: <span className="text-white font-mono">{MAX_CONCURRENT_JOBS}</span></li>
                    <li>API Key: <span className="text-green-400">Active</span></li>
                    <li>Supported Models: Veo 3.1 Fast, Veo 3.1</li>
                </ul>
            </div>
        </div>

        {/* Right Col: Queue */}
        <div className="lg:col-span-2 h-full min-h-[500px]">
            <JobQueue 
                jobs={jobs} 
                onRemoveJob={removeJob} 
                onDuplicateJob={duplicateJob}
                isRunning={isQueueRunning} 
            />
        </div>

      </main>
    </div>
  );
};

export default App;