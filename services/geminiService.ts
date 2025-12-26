import { GoogleGenAI } from "@google/genai";
import { Job, VeoModel } from "../types";

// Helper to convert File to Base64
const fileToBas64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const generateVideoForJob = async (
  job: Job, 
  onProgress?: (message: string) => void
): Promise<string> => {
  // Ensure we get a fresh key for every request to handle potential timeouts/changes
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let operation;

  try {
    const commonConfig = {
      numberOfVideos: 1,
      aspectRatio: job.aspectRatio,
      resolution: '720p', // Safe default for both models, though 1080p is supported on fast
    };

    if (onProgress) onProgress("Uploading input data...");

    if (job.inputType === 'image' && job.imageFile) {
      const base64Image = await fileToBas64(job.imageFile);
      
      if (onProgress) onProgress("Sending generation request...");
      operation = await ai.models.generateVideos({
        model: job.model,
        prompt: job.prompt || undefined, // Prompt is optional for image-to-video sometimes, but good to include
        image: {
          imageBytes: base64Image,
          mimeType: job.imageFile.type,
        },
        config: commonConfig,
      });

    } else {
      // Text to Video
      if (onProgress) onProgress("Sending generation request...");
      operation = await ai.models.generateVideos({
        model: job.model,
        prompt: job.prompt,
        config: commonConfig,
      });
    }

    // Polling Logic
    // Veo generation takes time. We poll every 5 seconds.
    let attempts = 0;
    const pollingInterval = 5000;

    while (!operation.done) {
      attempts++;
      // Calculate roughly how long we've been waiting
      const elapsed = Math.floor(attempts * (pollingInterval / 1000));
      if (onProgress) onProgress(`Generating video... (${elapsed}s elapsed)`);

      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log(`Job ${job.id} polling attempt ${attempts}...`);
    }

    if (onProgress) onProgress("Finalizing download...");

    // Check for errors in response
    if (operation.error) {
      throw new Error(operation.error.message || "Unknown error during video generation");
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
        throw new Error("No video URI returned from API");
    }

    // We must append the API key to download the file
    // Note: In a production app, you might want to proxy this to hide the key, 
    // but for client-side functionality per requirements:
    return `${videoUri}&key=${apiKey}`;

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};