import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import axios from 'axios';

// Initialize FFmpeg for audio extraction
const ffmpeg = createFFmpeg({
  log: false,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
});

// This function loads FFmpeg if it's not already loaded
const ensureFFmpegLoaded = async () => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  return ffmpeg;
};

/**
 * Extract audio from video file for transcription
 * @param {File} videoFile - The video file to extract audio from
 * @returns {Blob} - Audio file blob (mp3 format)
 */
export const extractAudioFromVideo = async (videoFile) => {
  try {
    const ffmpegInstance = await ensureFFmpegLoaded();
    
    // Write the video file to FFmpeg's file system
    ffmpegInstance.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
    
    // Extract audio using FFmpeg
    await ffmpegInstance.run(
      '-i', 'input.mp4',
      '-vn', // No video
      '-acodec', 'libmp3lame',
      '-ac', '1', // Mono
      '-ar', '16000', // 16kHz sample rate (good for speech)
      '-f', 'mp3',
      'output.mp3'
    );
    
    // Read the output file
    const data = ffmpegInstance.FS('readFile', 'output.mp3');
    
    // Create a Blob from the file data
    const audioBlob = new Blob([data.buffer], { type: 'audio/mp3' });
    
    // Clean up files in FFmpeg's file system
    ffmpegInstance.FS('unlink', 'input.mp4');
    ffmpegInstance.FS('unlink', 'output.mp3');
    
    return audioBlob;
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw new Error('Failed to extract audio from video');
  }
};

/**
 * Transcribe audio using an AI transcription service
 * @param {Blob} audioBlob - Audio file blob
 * @param {Object} options - Transcription options
 * @returns {Array} - Array of transcription segments
 */
export const transcribeAudio = async (audioBlob, options = {}) => {
  try {
    // Create a form data object to send the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('language', options.language || 'en-US');
    formData.append('model', options.model || 'whisper-1');
    
    // For demo purposes, we'll use a simulated response
    // In production, you would use a real API call like:
    /*
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${options.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    */
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate simulated transcription segments
    const simulatedResponse = generateSimulatedTranscription(options.duration || 60);
    
    return simulatedResponse;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

/**
 * Generate a simulated transcription for testing
 * @param {number} duration - Duration of the audio in seconds
 * @returns {Array} - Array of transcription segments
 */
function generateSimulatedTranscription(duration) {
  const segments = [];
  const phrases = [
    "Welcome to our video presentation.",
    "Today we'll be discussing the key features of our new platform.",
    "Our application is designed to be user-friendly and intuitive.",
    "Let's start by examining the dashboard interface.",
    "As you can see, the analytics section provides comprehensive insights.",
    "Users can easily navigate between different sections using the sidebar menu.",
    "One of the most powerful features is the ability to generate custom reports.",
    "Data visualization tools help make sense of complex information.",
    "Security is a top priority in our application design.",
    "All user data is encrypted both in transit and at rest.",
    "The collaboration tools enable teams to work together effectively.",
    "Real-time updates ensure everyone has access to the latest information.",
    "Let's move on to the mobile experience.",
    "Our responsive design works seamlessly across all devices.",
    "Push notifications keep users informed about important updates.",
    "The offline mode allows for productivity even without internet access.",
    "Integration with third-party services extends the platform's capabilities.",
    "API documentation is comprehensive and well-maintained.",
    "Let's summarize what we've covered today.",
    "Thank you for watching this demonstration."
  ];
  
  let currentTime = 0;
  let segmentId = 1;
  
  // Create segments that span the entire duration
  while (currentTime < duration) {
    const segmentDuration = Math.min(Math.random() * 7 + 3, duration - currentTime);
    const endTime = currentTime + segmentDuration;
    
    segments.push({
      id: segmentId++,
      startTime: currentTime,
      endTime: endTime,
      text: phrases[(segmentId - 1) % phrases.length]
    });
    
    currentTime = endTime;
  }
  
  return segments;
}

/**
 * Format transcription data for export
 * @param {Array} transcriptionData - Array of transcription segments
 * @param {string} format - Export format (txt, srt, vtt)
 * @returns {string} - Formatted transcription text
 */
export const formatTranscriptionForExport = (transcriptionData, format = 'txt') => {
  if (!transcriptionData || transcriptionData.length === 0) {
    return '';
  }
  
  switch (format.toLowerCase()) {
    case 'txt':
      return transcriptionData.map(segment => segment.text).join('\n\n');
      
    case 'srt':
      return transcriptionData.map((segment, index) => {
        const startTime = formatSrtTime(segment.startTime);
        const endTime = formatSrtTime(segment.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
      }).join('\n');
      
    case 'vtt':
      let vtt = 'WEBVTT\n\n';
      vtt += transcriptionData.map((segment, index) => {
        const startTime = formatVttTime(segment.startTime);
        const endTime = formatVttTime(segment.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}`;
      }).join('\n\n');
      return vtt;
      
    default:
      return transcriptionData.map(segment => segment.text).join('\n\n');
  }
};

// Helper function to format time for SRT format
function formatSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Helper function to format time for VTT format
function formatVttTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}