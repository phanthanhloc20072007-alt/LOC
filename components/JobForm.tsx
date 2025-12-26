import React, { useState, useRef } from 'react';
import { Job, JobStatus, InputType, VeoModel } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface JobFormProps {
  onAddJob: (job: Job) => void;
}

const JobForm: React.FC<JobFormProps> = ({ onAddJob }) => {
  const [prompt, setPrompt] = useState('');
  const [inputType, setInputType] = useState<InputType>(InputType.TEXT);
  const [model, setModel] = useState<VeoModel>(VeoModel.FAST);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [quantity, setQuantity] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputType === InputType.TEXT && !prompt.trim()) {
      alert("Prompt is required for Text-to-Video");
      return;
    }
    if (inputType === InputType.IMAGE && !imageFile) {
      alert("Image is required for Image-to-Video");
      return;
    }

    // Create N jobs based on quantity
    for (let i = 0; i < quantity; i++) {
      const newJob: Job = {
        id: uuidv4(),
        createdAt: Date.now(),
        status: JobStatus.IDLE,
        prompt: prompt,
        inputType,
        model,
        aspectRatio,
        resolution: '720p',
        imageFile: imageFile,
      };
      onAddJob(newJob);
    }
    
    // Reset basic fields but keep configuration for ease of batch entry
    setPrompt('');
    // Optional: Keep the image or clear it? Clearing for safety.
    setImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mb-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Job Entry
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Input Type & Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Input Type</label>
            <select 
              value={inputType} 
              onChange={(e) => setInputType(e.target.value as InputType)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={InputType.TEXT}>Text Prompt</option>
              <option value={InputType.IMAGE}>Image / Frame</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Model</label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value as VeoModel)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={VeoModel.FAST}>Veo 3.1 Fast (Preview)</option>
              <option value={VeoModel.QUALITY}>Veo 3.1 (High Quality)</option>
            </select>
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Prompt {inputType === InputType.IMAGE && '(Optional)'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={inputType === InputType.TEXT ? "A cinematic drone shot of a futuristic city..." : "Describe motion for the image..."}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none"
          />
        </div>

        {/* Image Upload */}
        {inputType === InputType.IMAGE && (
          <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg bg-gray-900/50">
            <label className="block text-sm font-medium text-gray-400 mb-2">Upload Source Image</label>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
            <select 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">Batch Count (Copies)</label>
             <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
             />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition active:scale-95 flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add to Queue
        </button>
      </form>
    </div>
  );
};

export default JobForm;