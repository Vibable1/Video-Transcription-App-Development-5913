import {createFFmpeg,fetchFile} from '@ffmpeg/ffmpeg';
import axios from 'axios';
import {saveTranscription} from './transcriptionDbService';
import {extractAudioOnly} from './compressionService';

// Initialize FFmpeg for audio extraction with optimized settings for large files
const ffmpeg=createFFmpeg({
  log: false,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
});

// This function loads FFmpeg if it's not already loaded
const ensureFFmpegLoaded=async ()=> {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  return ffmpeg;
};

/** 
 * OPTIMIZED: Extract audio from video file using the fastest available method
 * @param {File} videoFile - The video file to extract audio from
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Blob} - Audio file blob (optimized format)
 */
export const extractAudioFromVideo=async (videoFile,progressCallback=null)=> {
  try {
    const startTime=Date.now();
    
    if (progressCallback) {
      progressCallback(5,'Initializing optimized audio extraction...');
    }
    
    // Use the optimized audio extraction from compressionService
    const audioBlob=await extractAudioOnly(videoFile,progressCallback);
    
    const processingTime=(Date.now() - startTime) / 1000;
    console.log(`Total audio extraction time: ${processingTime.toFixed(2)} seconds`);
    
    return audioBlob;
  } catch (error) {
    console.error('Error extracting audio:',error);
    
    // Provide more specific error messages for large files
    if (error.message.includes('out of memory') || error.message.includes('memory')) {
      throw new Error('File too large for browser processing. Try compressing the video or using a smaller file.');
    }
    
    throw new Error('Failed to extract audio from video. The file may be corrupted or in an unsupported format.');
  }
};

/** 
 * OPTIMIZED: Transcribe audio using chunked processing for large files
 * @param {Blob} audioBlob - Audio file blob
 * @param {Object} options - Transcription options
 * @returns {Array} - Array of transcription segments
 */
export const transcribeAudio=async (audioBlob,options={})=> {
  try {
    const audioSizeMB=audioBlob.size / (1024 * 1024);
    const isLargeAudio=audioSizeMB > 25; // Audio files over 25MB are considered large
    
    if (options.progressCallback) {
      options.progressCallback(10,'Preparing transcription...');
    }
    
    // For large audio files, implement chunking
    if (isLargeAudio && options.progressCallback) {
      options.progressCallback(20,'Processing large audio file with chunking...');
      return await transcribeAudioInChunks(audioBlob,options);
    }
    
    // For smaller files, use direct processing
    return await transcribeAudioDirect(audioBlob,options);
  } catch (error) {
    console.error('Transcription error:',error);
    
    if (error.code==='ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Transcription timed out. Large files may require longer processing time.');
    }
    
    throw new Error('Failed to transcribe audio. Please try again or use a smaller file.');
  }
};

/** 
 * OPTIMIZED: Direct transcription for smaller audio files 
 */
async function transcribeAudioDirect(audioBlob,options) {
  const startTime=Date.now();
  const progressCallback = options.progressCallback || (() => {});
  
  progressCallback(30,'Sending audio for transcription...');
  
  // Create a form data object to send the audio file
  const formData=new FormData();
  formData.append('file',audioBlob,'audio.webm');
  formData.append('language',options.language || 'en-US');
  formData.append('model',options.model || 'whisper-1');
  
  // For demo purposes, we'll use a simulated response
  // In production, you would use a real API call like:
  /*
  const response=await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout
    }
  );
  */
  
  // Simulate realistic processing time based on audio size
  const audioSizeMB=audioBlob.size / (1024 * 1024);
  const baseProcessingTime=Math.min(audioSizeMB * 50, 3000); // Max 3 seconds for demo
  
  // Progress simulation
  const progressInterval=setInterval(()=> {
    const elapsed=Date.now() - startTime;
    const progress=Math.min((elapsed / baseProcessingTime) * 60, 60); // Up to 60%
    progressCallback(30 + progress, 'Processing speech recognition...');
  }, 200);
  
  await new Promise(resolve=> setTimeout(resolve, baseProcessingTime));
  clearInterval(progressInterval);
  
  progressCallback(90, 'Finalizing transcription...');
  
  // Generate optimized simulated transcription
  const simulatedResponse=generateOptimizedTranscription(options.duration || 60);
  return simulatedResponse;
}

/** 
 * OPTIMIZED: Chunked transcription for large audio files 
 */
async function transcribeAudioInChunks(audioBlob, options) {
  const progressCallback = options.progressCallback || (() => {});
  const chunkSize=20 * 1024 * 1024; // 20MB chunks
  const chunks=[];
  
  // Split audio into chunks (simplified for demo)
  const totalChunks=Math.ceil(audioBlob.size / chunkSize);
  progressCallback(25, `Processing ${totalChunks} audio chunks...`);
  
  for (let i=0; i < totalChunks; i++) {
    const start=i * chunkSize;
    const end=Math.min(start + chunkSize, audioBlob.size);
    const chunk=audioBlob.slice(start, end);
    
    const progress=(i / totalChunks) * 60; // Up to 60% for chunking
    progressCallback(25 + progress, `Processing chunk ${i + 1} of ${totalChunks}...`);
    
    // Process each chunk (simulated)
    const chunkDuration=(options.duration || 60) / totalChunks;
    const chunkResult=generateOptimizedTranscription(chunkDuration, i * chunkDuration);
    chunks.push(...chunkResult);
    
    // Small delay to prevent browser blocking
    await new Promise(resolve=> setTimeout(resolve, 100));
  }
  
  progressCallback(90, 'Combining chunk results...');
  
  return chunks;
}

/** 
 * OPTIMIZED: Generate a more realistic simulated transcription
 * @param {number} duration - Duration of the audio in seconds
 * @param {number} startOffset - Start time offset for chunks
 * @returns {Array} - Array of transcription segments
 */
function generateOptimizedTranscription(duration, startOffset=0) {
  const segments=[];
  const phrases=[
    "Welcome to our comprehensive video presentation.",
    "Today we'll be discussing the key features and capabilities of our new platform.",
    "Our application is designed to be user-friendly, intuitive, and scalable for enterprise use.",
    "Let's start by examining the dashboard interface and its various components.",
    "As you can see, the analytics section provides comprehensive insights into user behavior.",
    "Users can easily navigate between different sections using the responsive sidebar menu.",
    "One of the most powerful features is the ability to generate custom reports and visualizations.",
    "Data visualization tools help make sense of complex information and trends over time.",
    "Security is a top priority in our application design and architecture.",
    "All user data is encrypted both in transit and at rest using industry-standard protocols.",
    "The collaboration tools enable teams to work together effectively across different time zones.",
    "Real-time updates ensure everyone has access to the latest information and changes.",
    "Let's move on to the mobile experience and responsive design capabilities.",
    "Our responsive design works seamlessly across all devices and screen sizes.",
    "Push notifications keep users informed about important updates and deadlines.",
    "The offline mode allows for productivity even without a stable internet connection.",
    "Integration with third-party services extends the platform's capabilities significantly.",
    "API documentation is comprehensive, well-maintained, and includes practical examples.",
    "Performance optimization ensures fast loading times even with large datasets.",
    "Automated backup systems protect against data loss and ensure business continuity.",
    "User access controls and permissions provide granular security management.",
    "The reporting system generates detailed analytics and insights for decision making.",
    "Customizable workflows adapt to different business processes and requirements.",
    "Let's summarize what we've covered in today's comprehensive demonstration.",
    "Thank you for watching this detailed presentation of our platform capabilities."
  ];
  
  let currentTime=startOffset;
  let segmentId=Math.floor(startOffset / 8) + 1;
  
  // Create more realistic segment timing
  const avgSegmentDuration=8; // 8 seconds average
  const segmentCount=Math.ceil(duration / avgSegmentDuration);
  
  for (let i=0; i < segmentCount && currentTime < startOffset + duration; i++) {
    // Vary segment duration realistically (6-12 seconds)
    const segmentDuration=Math.min(
      avgSegmentDuration + (Math.random() * 4 - 2), // ±2 seconds variation
      (startOffset + duration) - currentTime
    );
    const endTime=currentTime + segmentDuration;
    
    // Select phrase with some variation
    const phraseIndex=(segmentId - 1) % phrases.length;
    let text=phrases[phraseIndex];
    
    // Occasionally combine phrases for more natural variation
    if (Math.random() > 0.8 && i < segmentCount - 1) {
      text +=" " + phrases[(phraseIndex + 1) % phrases.length];
    }
    
    segments.push({
      id: segmentId++,
      startTime: currentTime,
      endTime: endTime,
      text: text,
      confidence: Math.random() * 0.15 + 0.85 // Confidence between 0.85 and 1.0
    });
    
    currentTime=endTime;
  }
  
  return segments;
}

/** 
 * Format transcription data for export with large file optimizations
 * @param {Array} transcriptionData - Array of transcription segments
 * @param {string} format - Export format (txt, srt, vtt)
 * @returns {string} - Formatted transcription text
 */
export const formatTranscriptionForExport=(transcriptionData, format='txt')=> {
  if (!transcriptionData || transcriptionData.length===0) {
    return '';
  }
  
  switch (format.toLowerCase()) {
    case 'txt':
      return transcriptionData.map(segment=> segment.text).join('\n\n');
      
    case 'srt':
      return transcriptionData.map((segment, index)=> {
        const startTime=formatSrtTime(segment.startTime);
        const endTime=formatSrtTime(segment.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
      }).join('\n');
      
    case 'vtt':
      let vtt='WEBVTT\n\n';
      vtt +=transcriptionData.map((segment, index)=> {
        const startTime=formatVttTime(segment.startTime);
        const endTime=formatVttTime(segment.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}`;
      }).join('\n\n');
      return vtt;
      
    default:
      return transcriptionData.map(segment=> segment.text).join('\n\n');
  }
};

/** 
 * Save transcription to Supabase database with large file metadata
 * @param {Object} videoFile - The original video file
 * @param {Array} transcriptionData - Array of transcription segments
 * @param {Object} options - Additional options
 * @returns {Promise} - Promise with the saved transcription ID
 */
export const saveTranscriptionToDatabase=async (videoFile, transcriptionData, options={})=> {
  try {
    if (!videoFile || !transcriptionData || transcriptionData.length===0) {
      throw new Error('Missing required data for saving transcription');
    }
    
    const fileSizeGB=videoFile.size / (1024 * 1024 * 1024);
    
    const transcriptionMetadata={
      title: options.title || videoFile.name.split('.')[0],
      file_name: videoFile.name,
      duration: options.duration || transcriptionData.reduce((max, segment)=> Math.max(max, segment.endTime), 0),
      language: options.language || 'en-US',
      file_size: videoFile.size,
      file_type: videoFile.type,
      // Add metadata for large files
      is_large_file: fileSizeGB > 1,
      processing_notes: fileSizeGB > 2 ? 'Large file processed with optimized settings' : null,
      compression_applied: options.compressionApplied || false,
      original_size: options.originalSize || videoFile.size
    };
    
    // Save to database using the transcriptionDbService
    const transcriptionId=await saveTranscription(transcriptionMetadata, transcriptionData);
    return transcriptionId;
    
  } catch (error) {
    console.error('Error saving transcription to database:', error);
    throw error;
  }
};

// Helper function to format time for SRT format
function formatSrtTime(seconds) {
  const hours=Math.floor(seconds / 3600);
  const minutes=Math.floor((seconds % 3600) / 60);
  const secs=Math.floor(seconds % 60);
  const ms=Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Helper function to format time for VTT format
function formatVttTime(seconds) {
  const hours=Math.floor(seconds / 3600);
  const minutes=Math.floor((seconds % 3600) / 60);
  const secs=Math.floor(seconds % 60);
  const ms=Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}