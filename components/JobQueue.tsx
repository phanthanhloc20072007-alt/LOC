import React, { useEffect, useState } from 'react';
import { Job, JobStatus, InputType } from '../types';

interface JobQueueProps {
  jobs: Job[];
  onRemoveJob: (id: string) => void;
  onDuplicateJob: (job: Job) => void;
  isRunning: boolean;
}

// Internal component for displaying elapsed time
const ElapsedTimer: React.FC<{ startTime?: number }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        
        // Calculate initial elapsed
        setElapsed(Math.floor((Date.now() - startTime) / 1000));

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return <span className="font-mono text-xs">{formatTime(elapsed)}</span>;
};

const JobQueue: React.FC<JobQueueProps> = ({ jobs, onRemoveJob, onDuplicateJob, isRunning }) => {
  
  const getStatusColor = (status: JobStatus) => {
    switch(status) {
      case JobStatus.IDLE: return 'bg-gray-600';
      case JobStatus.PROCESSING: return 'bg-blue-500';
      case JobStatus.COMPLETED: return 'bg-green-500';
      case JobStatus.FAILED: return 'bg-red-500';
      default: return 'bg-gray-600';
    }
  };

  const StatusIcon = ({ status }: { status: JobStatus }) => {
     if (status === JobStatus.PROCESSING) {
         return (
             <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
         );
     }
     if (status === JobStatus.COMPLETED) {
         return <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
     }
     if (status === JobStatus.FAILED) {
         return <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
     }
     return <div className="h-5 w-5 rounded-full border-2 border-gray-600"></div>;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-gray-200">
            Queue ({jobs.length})
        </h3>
        <div className="flex items-center gap-2">
           <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
             {isRunning ? 'System Active' : 'System Paused'}
           </span>
           <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {jobs.length === 0 && (
            <div className="text-center py-10 text-gray-500 italic">
                No jobs in queue. Add one to start.
            </div>
        )}

        {jobs.map((job) => (
          <div 
            key={job.id} 
            className={`relative group p-4 rounded-lg border border-gray-800 transition-all duration-200 ${
                job.status === JobStatus.PROCESSING ? 'bg-gray-800/80 ring-1 ring-blue-500/50' : 'bg-gray-800/40 hover:bg-gray-800'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <StatusIcon status={job.status} />
                    <span className="text-xs font-mono text-gray-500">{job.id.slice(0, 8)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${job.inputType === InputType.IMAGE ? 'bg-purple-900/50 text-purple-300' : 'bg-indigo-900/50 text-indigo-300'}`}>
                        {job.inputType === InputType.IMAGE ? 'IMG' : 'TXT'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {job.aspectRatio}
                    </span>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Duplicate Button */}
                    <button 
                        onClick={() => onDuplicateJob(job)}
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                        title="Duplicate Job"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    {/* Delete Button */}
                    {(job.status === JobStatus.IDLE || job.status === JobStatus.FAILED || job.status === JobStatus.COMPLETED) && (
                        <button 
                            onClick={() => onRemoveJob(job.id)}
                            className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700"
                            title="Remove Job"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                {job.prompt || (job.imageFile ? `Image: ${job.imageFile.name}` : 'No description')}
            </p>

            {job.error && (
                <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded mb-2">
                    Error: {job.error}
                </div>
            )}

            {job.videoUri && (
                <div className="mt-2">
                    <a 
                        href={job.videoUri} 
                        download={`veo_output_${job.id}.mp4`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-green-400 hover:text-green-300 border border-green-900 bg-green-900/20 px-3 py-1.5 rounded transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Video
                    </a>
                </div>
            )}
            
            {/* Extended Progress View for Processing Jobs */}
            {job.status === JobStatus.PROCESSING ? (
                <div className="mt-3 bg-gray-900/50 rounded p-3 border border-gray-700 shadow-inner">
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-blue-300 font-semibold">{job.progressMessage || 'Processing...'}</span>
                        <div className="flex items-center gap-1.5 text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <ElapsedTimer startTime={job.startTime} />
                        </div>
                    </div>
                    {/* Animated Indeterminate Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden relative">
                         <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 w-1/2 animate-pulse rounded-full"></div>
                    </div>
                </div>
            ) : (
                /* Simple status bar for other states */
                <div className="h-1 w-full bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${getStatusColor(job.status)}`} style={{ width: job.status === JobStatus.COMPLETED ? '100%' : '0%' }}></div>
                </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default JobQueue;