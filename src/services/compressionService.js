import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';

// Initialize FFmpeg with browser-compatible settings
const ffmpeg = createFFmpeg({
  log: false,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
  // Explicitly disable SharedArrayBuffer
  mainName: 'main',
  workerPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js'
});

// Ensure FFmpeg is loaded - with error handling
const ensureFFmpegLoaded = async () => {
  try {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    return ffmpeg;
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    throw new Error("Failed to initialize video processing. Your browser may not support this feature.");
  }
};

/**
 * Check if browser environment supports video compression
 * @returns {boolean} - Whether compression is supported
 */
export const isCompressionSupported = () => {
  return typeof window !== 'undefined' && 
         typeof window.Blob !== 'undefined' && 
         typeof window.File !== 'undefined' && 
         typeof window.FileReader !== 'undefined';
};

/**
 * OPTIMIZED: Fast audio extraction using Web Audio API and MediaRecorder
 * This is significantly faster than FFmpeg for audio extraction
 * @param {File} videoFile - Original video file
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Blob>} - Audio file blob
 */
export const extractAudioOnly = async (videoFile, progressCallback = null) => {
  try {
    if (progressCallback) {
      progressCallback(5, 'Initializing fast audio extraction...');
    }

    // Use native browser APIs for much faster audio extraction
    return await nativeBrowserAudioExtraction(videoFile, progressCallback);
  } catch (error) {
    console.error('Error extracting audio:', error);
    // Fallback to FFmpeg if native approach fails
    console.warn('Native audio extraction failed, falling back to FFmpeg...');
    return await ffmpegAudioExtraction(videoFile, progressCallback);
  }
};

/**
 * OPTIMIZED: Native browser audio extraction - MUCH faster than FFmpeg
 * Uses HTML5 video element + Web Audio API + MediaRecorder
 */
async function nativeBrowserAudioExtraction(videoFile, progressCallback) {
  return new Promise((resolve, reject) => {
    try {
      if (progressCallback) {
        progressCallback(10, 'Setting up native audio processing...');
      }

      // Create video element
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      // Create object URL
      const videoURL = URL.createObjectURL(videoFile);

      video.onloadedmetadata = () => {
        if (progressCallback) {
          progressCallback(20, 'Preparing audio extraction...');
        }

        try {
          // Create audio context with optimal settings for speech
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext({
            sampleRate: 16000, // Optimal for speech recognition
            latencyHint: 'playback'
          });

          // Create media element source
          const source = audioContext.createMediaElementSource(video);
          
          // Create destination for recording
          const destination = audioContext.createMediaStreamDestination();
          
          // Connect source to destination
          source.connect(destination);

          if (progressCallback) {
            progressCallback(30, 'Starting optimized audio extraction...');
          }

          // Configure MediaRecorder with optimal settings for speech
          const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/mp4'
          ];

          let selectedMimeType = 'audio/webm';
          for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
              selectedMimeType = type;
              break;
            }
          }

          const recorder = new MediaRecorder(destination.stream, {
            mimeType: selectedMimeType,
            audioBitsPerSecond: 64000 // Optimized for speech, much smaller than music quality
          });

          const chunks = [];
          let startTime = Date.now();

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: selectedMimeType });
            const processingTime = (Date.now() - startTime) / 1000;
            
            console.log(`Audio extraction completed in ${processingTime.toFixed(2)} seconds`);
            
            // Cleanup
            URL.revokeObjectURL(videoURL);
            audioContext.close();
            
            if (progressCallback) {
              progressCallback(100, `Audio extracted in ${processingTime.toFixed(1)}s`);
            }
            
            resolve(audioBlob);
          };

          // Set up progress tracking
          const progressInterval = setInterval(() => {
            if (video.duration && video.currentTime) {
              const percent = (video.currentTime / video.duration) * 60; // 60% of progress for extraction
              if (progressCallback) {
                progressCallback(30 + percent, `Extracting audio... ${Math.round((video.currentTime / video.duration) * 100)}%`);
              }
            }
          }, 100);

          video.onended = () => {
            clearInterval(progressInterval);
            if (progressCallback) {
              progressCallback(90, 'Finalizing audio extraction...');
            }
            setTimeout(() => recorder.stop(), 100);
          };

          video.onerror = (e) => {
            clearInterval(progressInterval);
            URL.revokeObjectURL(videoURL);
            reject(new Error('Video loading failed: ' + (e.message || 'Unknown error')));
          };

          // Start recording and playback
          recorder.start(100); // Collect data every 100ms
          
          // Set playback rate for faster processing (up to 16x for large files)
          const fileSizeGB = videoFile.size / (1024 * 1024 * 1024);
          if (fileSizeGB > 2) {
            video.playbackRate = 16; // 16x speed for very large files
          } else if (fileSizeGB > 1) {
            video.playbackRate = 8; // 8x speed for large files
          } else if (fileSizeGB > 0.5) {
            video.playbackRate = 4; // 4x speed for medium files
          } else {
            video.playbackRate = 2; // 2x speed for small files
          }

          video.play().catch(reject);

        } catch (audioError) {
          URL.revokeObjectURL(videoURL);
          reject(new Error('Audio context setup failed: ' + audioError.message));
        }
      };

      video.src = videoURL;

    } catch (error) {
      reject(new Error('Native audio extraction setup failed: ' + error.message));
    }
  });
}

/**
 * Fallback FFmpeg audio extraction with optimizations
 */
async function ffmpegAudioExtraction(videoFile, progressCallback) {
  try {
    const ffmpegInstance = await ensureFFmpegLoaded();
    
    if (progressCallback) {
      progressCallback(20, 'Using FFmpeg fallback...');
    }

    // Write file to FFmpeg filesystem
    ffmpegInstance.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

    if (progressCallback) {
      progressCallback(40, 'Processing with FFmpeg...');
    }

    // Optimized FFmpeg command for fast audio extraction
    await ffmpegInstance.run(
      '-i', 'input.mp4',
      '-vn', // No video
      '-acodec', 'libmp3lame',
      '-ac', '1', // Mono
      '-ar', '16000', // 16kHz sample rate
      '-ab', '64k', // Low bitrate for speech
      '-f', 'mp3',
      'output.mp3'
    );

    if (progressCallback) {
      progressCallback(80, 'Reading extracted audio...');
    }

    // Read the output
    const data = ffmpegInstance.FS('readFile', 'output.mp3');
    const audioBlob = new Blob([data.buffer], { type: 'audio/mp3' });

    // Cleanup
    ffmpegInstance.FS('unlink', 'input.mp4');
    ffmpegInstance.FS('unlink', 'output.mp3');

    if (progressCallback) {
      progressCallback(100, 'FFmpeg audio extraction complete');
    }

    return audioBlob;
  } catch (error) {
    throw new Error('FFmpeg audio extraction failed: ' + error.message);
  }
}

/**
 * Compress video file using browser-friendly methods
 * @param {File} videoFile - Original video file
 * @param {Object} options - Compression options
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Object} - Compressed video information
 */
export const compressVideo = async (videoFile, options = {}, progressCallback = null) => {
  try {
    if (!isCompressionSupported()) {
      throw new Error('Your browser does not support the required features for video compression');
    }

    if (progressCallback) {
      progressCallback(5, 'Initializing compression...');
    }

    // Calculate target size based on file size
    const fileSizeGB = videoFile.size / (1024 * 1024 * 1024);

    // Default options
    const defaultOptions = {
      quality: fileSizeGB > 2 ? 'low' : 'medium', // Use lower quality for very large files
      maxWidth: 1280, // 720p width
      maxHeight: 720, // 720p height
      frameRate: 24,
      audioBitrate: '128k',
    };

    // Merge default options with provided options
    const compressionOptions = { ...defaultOptions, ...options };

    if (progressCallback) {
      progressCallback(10, 'Processing video...');
    }

    // Instead of using FFmpeg directly, use browser-native approach
    return await browserBasedCompression(videoFile, compressionOptions, progressCallback);
  } catch (error) {
    console.error('Video compression error:', error);
    throw new Error(`Failed to compress video: ${error.message}`);
  }
};

/**
 * Browser-based video compression using HTML5 video and canvas
 */
async function browserBasedCompression(videoFile, options, progressCallback) {
  return new Promise((resolve, reject) => {
    try {
      if (progressCallback) {
        progressCallback(15, 'Creating video element...');
      }

      // Create video element
      const video = document.createElement('video');
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Create URL for the video file
      const videoURL = URL.createObjectURL(videoFile);

      // Set up video metadata loaded handler
      video.onloadedmetadata = () => {
        if (progressCallback) {
          progressCallback(25, 'Preparing compression...');
        }

        // Set canvas dimensions based on compression options
        const targetWidth = Math.min(options.maxWidth, video.videoWidth);
        const targetHeight = Math.min(options.maxHeight, video.videoHeight);
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Configure MediaRecorder options
        const quality = options.quality === 'high' ? 0.8 : options.quality === 'medium' ? 0.6 : 0.4;
        const bitrate = options.quality === 'high' ? 2500000 : options.quality === 'medium' ? 1500000 : 800000;

        let recorderOptions = {};
        let mimeType = 'video/webm';

        // Try to find a supported codec
        const supportedMimeTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];

        for (const type of supportedMimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            recorderOptions = {
              mimeType: type,
              videoBitsPerSecond: bitrate
            };
            break;
          }
        }

        if (progressCallback) {
          progressCallback(30, `Setting up compression with ${mimeType}...`);
        }

        // Create MediaRecorder
        const stream = canvas.captureStream(options.frameRate);
        let recorder;
        try {
          recorder = new MediaRecorder(stream, recorderOptions);
        } catch (e) {
          console.warn('Failed to create MediaRecorder with options, falling back to defaults', e);
          // Fallback to default options if specified codec is not supported
          recorder = new MediaRecorder(stream);
        }

        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          // Create blob from chunks
          const blob = new Blob(chunks, { type: mimeType });

          // Clean up
          URL.revokeObjectURL(videoURL);

          // Calculate compression stats
          const compressionRatio = (videoFile.size / blob.size).toFixed(2);
          const savedSpace = ((videoFile.size - blob.size) / (1024 * 1024)).toFixed(2);

          if (progressCallback) {
            progressCallback(100, `Compressed ${compressionRatio}x (saved ${savedSpace} MB)`);
          }

          resolve({
            blob: blob,
            originalSize: videoFile.size,
            compressedSize: blob.size,
            compressionRatio: parseFloat(compressionRatio),
            savedSpaceMB: parseFloat(savedSpace),
          });
        };

        // Set up video playback handler
        video.onplay = () => {
          if (progressCallback) {
            progressCallback(40, 'Compressing video...');
          }

          recorder.start(1000); // Collect data in 1-second chunks

          // Draw video frames to canvas
          const drawFrame = () => {
            if (video.paused || video.ended) {
              recorder.stop();
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);

            // Update progress based on video position
            if (progressCallback && video.duration) {
              const percent = (video.currentTime / video.duration) * 60; // 60% of progress is drawing frames
              progressCallback(40 + percent, 'Compressing video...');
            }
          };

          drawFrame();
        };

        // Set up video error handler
        video.onerror = (e) => {
          URL.revokeObjectURL(videoURL);
          reject(new Error('Error loading video: ' + (e.message || 'Unknown error')));
        };

        // Start playback
        video.play().catch((e) => {
          reject(new Error('Failed to play video: ' + (e.message || 'Browser prevented playback')));
        });
      };

      // Load the video
      video.src = videoURL;

    } catch (error) {
      reject(new Error('Browser-based compression failed: ' + error.message));
    }
  });
}

/**
 * Get recommended compression settings based on file size
 * @param {number} fileSizeBytes - File size in bytes
 * @returns {Object} - Recommended compression options
 */
export const getRecommendedCompressionSettings = (fileSizeBytes) => {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);

  if (fileSizeGB > 4) {
    return {
      quality: 'low',
      maxWidth: 854,
      maxHeight: 480,
      frameRate: 24,
      audioBitrate: '96k',
    };
  } else if (fileSizeGB > 2) {
    return {
      quality: 'low',
      maxWidth: 1280,
      maxHeight: 720,
      frameRate: 24,
      audioBitrate: '128k',
    };
  } else if (fileSizeGB > 1) {
    return {
      quality: 'medium',
      maxWidth: 1280,
      maxHeight: 720,
      frameRate: 30,
      audioBitrate: '128k',
    };
  } else {
    return {
      quality: 'high',
      maxWidth: 1920,
      maxHeight: 1080,
      frameRate: 30,
      audioBitrate: '192k',
    };
  }
};