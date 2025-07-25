import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { compressVideo, getRecommendedCompressionSettings, isCompressionSupported, extractAudioOnly } from '../services/compressionService';

const { FiCheckCircle, FiSettings, FiAlertTriangle, FiZoomOut, FiSliders, FiMusic, FiVideo, FiCpu, FiZap } = FiIcons;

const VideoCompression = ({ videoFile, onCompressionComplete, onCancel }) => {
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStage, setCompressionStage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 'medium',
    maxWidth: 1280,
    maxHeight: 720,
    frameRate: 30,
    audioBitrate: '128k',
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [compressionResults, setCompressionResults] = useState(null);
  const [error, setError] = useState(null);
  const [compressionMode, setCompressionMode] = useState('audio'); // Default to audio since it's more reliable
  const [browserSupport, setBrowserSupport] = useState(true);
  const [showFallbackUI, setShowFallbackUI] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);

  // Check browser support on component mount
  useEffect(() => {
    const supported = isCompressionSupported();
    setBrowserSupport(supported);
    
    // If browser doesn't support basic requirements, show fallback UI
    if (!supported) {
      setShowFallbackUI(true);
    }
    
    // Auto-start audio extraction for large files
    if (videoFile && videoFile.size > (1024 * 1024 * 500)) { // 500MB threshold
      startCompression();
    }
  }, [videoFile]);

  // Update recommended settings when video file changes
  useEffect(() => {
    if (videoFile) {
      const recommended = getRecommendedCompressionSettings(videoFile.size);
      setCompressionSettings(recommended);
      
      // Calculate estimated processing time
      const fileSizeGB = videoFile.size / (1024 * 1024 * 1024);
      if (compressionMode === 'audio') {
        // Audio extraction is much faster
        const audioTime = Math.max(fileSizeGB * 2, 0.5); // 2 seconds per GB, minimum 0.5 seconds
        setEstimatedTime(audioTime);
      } else {
        // Video compression takes longer
        const videoTime = Math.max(fileSizeGB * 30, 5); // 30 seconds per GB, minimum 5 seconds
        setEstimatedTime(videoTime);
      }
    }
  }, [videoFile, compressionMode]);

  const handleCompressionSettingChange = (setting, value) => {
    setCompressionSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const startCompression = async () => {
    setIsCompressing(true);
    setCompressionProgress(0);
    setError(null);
    setCompressionResults(null);

    const startTime = Date.now();

    try {
      const progressCallback = (progress, stage) => {
        setCompressionProgress(progress);
        setCompressionStage(stage);
      };

      let results;
      
      if (compressionMode === 'audio') {
        // Extract audio only - MUCH faster
        const audioBlob = await extractAudioOnly(videoFile, progressCallback);
        
        // Create a new file object from the audio blob
        const audioFileName = videoFile.name.replace(/\.[^/.]+$/, "") + "_audio.webm";
        const audioFile = new File([audioBlob], audioFileName, {
          type: audioBlob.type || 'audio/webm',
          lastModified: new Date().getTime()
        });

        // Calculate compression stats
        const compressionRatio = (videoFile.size / audioBlob.size).toFixed(2);
        const savedSpace = ((videoFile.size - audioBlob.size) / (1024 * 1024)).toFixed(2);
        const processingTime = (Date.now() - startTime) / 1000;

        results = {
          blob: audioBlob,
          originalSize: videoFile.size,
          compressedSize: audioBlob.size,
          compressionRatio: parseFloat(compressionRatio),
          savedSpaceMB: parseFloat(savedSpace),
          audioOnly: true,
          file: audioFile,
          processingTime: processingTime
        };
      } else {
        // Full video compression
        results = await compressVideo(videoFile, compressionSettings, progressCallback);
        
        // Create a new file object from the compressed blob
        const compressedFileName = videoFile.name.replace(/\.[^/.]+$/, "") + "_compressed.webm";
        const compressedFile = new File([results.blob], compressedFileName, {
          type: results.blob.type || 'video/webm',
          lastModified: new Date().getTime()
        });
        
        results.file = compressedFile;
        results.processingTime = (Date.now() - startTime) / 1000;
      }

      setCompressionResults(results);

      // Show performance info
      console.log(`${compressionMode} processing completed in ${results.processingTime.toFixed(2)} seconds`);
      console.log(`Size reduction: ${results.compressionRatio}x (saved ${results.savedSpaceMB} MB)`);

      // Delay to show complete progress
      setTimeout(() => {
        setIsCompressing(false);
        onCompressionComplete(results.file, results);
      }, 1000);

    } catch (err) {
      console.error('Compression failed:', err);
      setError(`Processing failed: ${err.message}`);
      setIsCompressing(false);
      setShowFallbackUI(true);
    }
  };

  const formatFileSize = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else {
      return `${mb.toFixed(1)} MB`;
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  };

  // If compression failed or browser doesn't support it, show fallback UI
  if (showFallbackUI) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Video Processing</h3>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <SafeIcon icon={FiCpu} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Advanced Processing Unavailable</p>
                <p>Your browser doesn't fully support the required features for video processing.</p>
                <p className="mt-2">We recommend these alternatives:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Try a different browser (Chrome or Edge recommended)</li>
                  <li>Use a smaller video file (under 1GB)</li>
                  <li>Compress your video with external software before uploading</li>
                  <li>Continue with the original file (may be slow for large files)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Use Original Video
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Optimized Video Processing</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        {/* File Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{videoFile.name}</h4>
              <p className="text-sm text-gray-500">Original size: {formatFileSize(videoFile.size)}</p>
            </div>
            {videoFile.size > (2 * 1024 * 1024 * 1024) && (
              <div className="flex items-center space-x-1 text-amber-600">
                <SafeIcon icon={FiAlertTriangle} className="w-4 h-4" />
                <span className="text-xs font-medium">Large File</span>
              </div>
            )}
          </div>
        </div>

        {/* Processing Mode Selection */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Processing Mode</h4>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCompressionMode('video')}
              className={`py-3 px-4 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                compressionMode === 'video' 
                  ? 'bg-primary-50 border-2 border-primary-500 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <SafeIcon icon={FiVideo} className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Compress Video</div>
                <div className="text-xs">Reduce file size while keeping video</div>
                {estimatedTime && compressionMode === 'video' && (
                  <div className="text-xs text-orange-600 mt-1">
                    Est. time: {formatTime(estimatedTime)}
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setCompressionMode('audio')}
              className={`py-3 px-4 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                compressionMode === 'audio' 
                  ? 'bg-primary-50 border-2 border-primary-500 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <div className="relative">
                <SafeIcon icon={FiMusic} className="w-6 h-6" />
                <SafeIcon icon={FiZap} className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
              </div>
              <div className="text-center">
                <div className="font-medium">Extract Audio Only</div>
                <div className="text-xs">Maximum size reduction + fastest processing</div>
                {estimatedTime && compressionMode === 'audio' && (
                  <div className="text-xs text-green-600 mt-1">
                    Est. time: {formatTime(estimatedTime)}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Video Compression Settings - Only show for video mode */}
        {compressionMode === 'video' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Compression Quality</h4>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-xs flex items-center space-x-1 text-primary-600 hover:text-primary-700"
              >
                <SafeIcon icon={FiSettings} className="w-3 h-3" />
                <span>{showAdvancedSettings ? "Hide" : "Show"} Advanced Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {['low', 'medium', 'high'].map(quality => (
                <button
                  key={quality}
                  onClick={() => handleCompressionSettingChange('quality', quality)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    compressionSettings.quality === quality
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
            </div>

            {/* Compression Size Estimate */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <SafeIcon icon={FiZoomOut} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Estimated compressed size: </span>
                    {compressionSettings.quality === 'high' ? '60-70%' : 
                     compressionSettings.quality === 'medium' ? '40-50%' : '25-35%'} of original
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Higher compression = smaller file size, lower quality
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <SafeIcon icon={FiSliders} className="w-4 h-4 text-gray-500" />
                  Advanced Settings
                </h4>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Max Resolution
                  </label>
                  <select
                    value={`${compressionSettings.maxWidth}x${compressionSettings.maxHeight}`}
                    onChange={(e) => {
                      const [width, height] = e.target.value.split('x').map(Number);
                      handleCompressionSettingChange('maxWidth', width);
                      handleCompressionSettingChange('maxHeight', height);
                    }}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="1920x1080">1080p (1920×1080)</option>
                    <option value="1280x720">720p (1280×720)</option>
                    <option value="854x480">480p (854×480)</option>
                    <option value="640x360">360p (640×360)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Lower resolution = smaller file size</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Frame Rate
                  </label>
                  <select
                    value={compressionSettings.frameRate}
                    onChange={(e) => handleCompressionSettingChange('frameRate', parseInt(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="30">30 fps (Standard)</option>
                    <option value="24">24 fps (Film)</option>
                    <option value="15">15 fps (Reduced)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Lower frame rate = smaller file size</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Audio Extraction Info - Only show for audio mode */}
        {compressionMode === 'audio' && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <SafeIcon icon={FiZap} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Optimized Audio Extraction</p>
                <p className="text-sm text-green-700 mt-1">
                  This option uses advanced browser APIs to extract audio much faster than traditional methods.
                </p>
                <ul className="list-disc list-inside mt-2 text-xs text-green-700 space-y-1">
                  <li>Up to 16x faster processing using playback acceleration</li>
                  <li>Typically reduces file size by 90-95%</li>
                  <li>Preserves all speech content for accurate transcription</li>
                  <li>Optimized 16kHz sample rate for speech recognition</li>
                  <li>Perfect when you only need the transcript, not the video</li>
                </ul>
                {estimatedTime && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    Estimated processing time: {formatTime(estimatedTime)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning for large files */}
        {videoFile.size > (3 * 1024 * 1024 * 1024) && compressionMode === 'video' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <SafeIcon icon={FiAlertTriangle} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Very Large File Detected</p>
                <p>Files over 3GB may take a long time to process and might cause your browser to become unresponsive.</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>We strongly recommend using the "Extract Audio Only" option</li>
                  <li>Close other browser tabs to free up memory</li>
                  <li>Consider using lower quality settings if using video compression</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Compression Progress */}
        {isCompressing && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">{compressionStage || 'Preparing processing...'}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${compressionProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{compressionProgress.toFixed(0)}% complete</span>
              {estimatedTime && (
                <span>Est. time remaining: {formatTime(estimatedTime * (1 - compressionProgress / 100))}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Please don't close this tab during processing
            </p>
          </div>
        )}

        {/* Compression Results */}
        {compressionResults && !isCompressing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-2">
              <SafeIcon icon={FiCheckCircle} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {compressionResults.audioOnly ? 'Audio Extraction Complete!' : 'Compression Complete!'}
                </p>
                <ul className="text-xs text-green-700 mt-1 space-y-1">
                  <li>Original size: {formatFileSize(compressionResults.originalSize)}</li>
                  <li>
                    {compressionResults.audioOnly ? 'Audio size: ' : 'Compressed size: '}
                    {formatFileSize(compressionResults.compressedSize)}
                  </li>
                  <li>Reduction ratio: {compressionResults.compressionRatio}x</li>
                  <li>Space saved: {compressionResults.savedSpaceMB} MB</li>
                  <li>Processing time: {formatTime(compressionResults.processingTime)}</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <SafeIcon icon={FiAlertTriangle} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Processing Failed</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Try extracting audio only or use a smaller video file.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {compressionResults ? 'Use Original Video' : 'Cancel'}
          </button>
          {compressionResults ? (
            <button
              onClick={() => onCompressionComplete(compressionResults.file, compressionResults)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              {compressionResults.audioOnly ? 'Use Audio File' : 'Use Compressed Video'}
            </button>
          ) : (
            <button
              onClick={startCompression}
              disabled={isCompressing}
              className={`px-4 py-2 rounded-lg ${
                isCompressing 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isCompressing ? 'Processing...' : 
               compressionMode === 'audio' ? 'Extract Audio' : 'Compress Video'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCompression;