export enum JobStatus {
  IDLE = 'idle',
  PENDING = 'pending', // Queued and waiting for a slot
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum InputType {
  TEXT = 'text',
  IMAGE = 'image',
}

export enum VeoModel {
  FAST = 'veo-3.1-fast-generate-preview',
  QUALITY = 'veo-3.1-generate-preview',
}

export interface Job {
  id: string;
  createdAt: number;
  status: JobStatus;
  
  // Job Parameters
  prompt: string;
  inputType: InputType;
  model: VeoModel;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p'; // Defaulting based on model usually, but useful to track
  
  // Inputs
  imageFile?: File | null;
  
  // Output
  videoUri?: string;
  error?: string;
  progress?: number; // Simulated progress or step tracking
  
  // Progress Detail
  startTime?: number;
  progressMessage?: string;
}

export interface QueueConfig {
  maxConcurrent: number;
}