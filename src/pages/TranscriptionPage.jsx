import React, {useState, useRef, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import VideoUpload from '../components/VideoUpload';
import VideoCompression from '../components/VideoCompression';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptionPanel from '../components/TranscriptionPanel';
import ExportModal from '../components/ExportModal';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {extractAudioFromVideo, transcribeAudio, saveTranscriptionToDatabase} from '../services/transcriptionService';
import {useAuth} from '../context/AuthContext';

const {FiUpload, FiPlay, FiPause, FiDownload, FiSettings, FiLoader, FiSave, FiCheck, FiAlertTriangle, FiMusic} = FiIcons;

const TranscriptionPage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [transcriptionId, setTranscriptionId] = useState(null);
  const [showLargeFileWarning, setShowLargeFileWarning] = useState(false);
  const [showCompressionOption, setShowCompressionOption] = useState(false);
  const [compressionResults, setCompressionResults] = useState(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const {user} = useAuth();
  const navigate = useNavigate();

  // Reset state when a new file is uploaded
  const handleFileUpload = (file) => {
    setVideoFile(file);
    setTranscriptionData([]);
    setError(null);
    setProgress(0);
    setProgressStage('');
    setSaveSuccess(false);
    setTranscriptionId(null);
    setCompressionResults(null);
    setIsAudioOnly(false);

    // Check if it's a large file and show warning
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    if (fileSizeGB > 2) {
      setShowLargeFileWarning(true);
    }

    // Show compression option for all files, making audio extraction the default
    setShowCompressionOption(true);
  };

  // Get video/audio duration after media is loaded
  useEffect(() => {
    if (videoFile) {
      if (isAudioOnly && audioRef.current) {
        const handleMetadataLoaded = () => {
          setVideoDuration(audioRef.current.duration);
        };
        
        audioRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
          }
        };
      } else if (!isAudioOnly && videoRef.current) {
        const handleMetadataLoaded = () => {
          setVideoDuration(videoRef.current.duration);
        };
        
        videoRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
          }
        };
      }
    }
  }, [videoFile, isAudioOnly]);

  const startTranscription = async () => {
    if (!videoFile) return;

    setIsTranscribing(true);
    setProgress(0);
    setError(null);

    try {
      const fileSizeGB = videoFile.size / (1024 * 1024 * 1024);
      const isLargeFile = fileSizeGB > 1;

      // Extract audio or use audio file directly
      let audioBlob;
      if (isAudioOnly) {
        // If we already have an audio file, use it directly
        audioBlob = videoFile;
        setProgress(40);
        setProgressStage('Using audio file directly...');
      } else {
        // Step 1: Extract audio from video with progress callback
        const audioExtractionCallback = (progress, stage) => {
          setProgress(Math.min(progress * 0.4, 40)); // Audio extraction takes 40% of progress
          setProgressStage(stage);
        };
        
        audioBlob = await extractAudioFromVideo(videoFile, audioExtractionCallback);
      }

      // Step 2: Send audio for transcription
      setProgressStage(isLargeFile ? 'Processing large file - this may take several minutes...' : 'Processing speech to text...');
      setProgress(50);

      // Get settings from localStorage or use defaults
      const settings = JSON.parse(localStorage.getItem('transcriptionSettings')) || {
        language: 'en-US',
        model: 'standard',
      };

      const transcriptionOptions = {
        language: settings.language,
        model: settings.model,
        duration: videoDuration,
        progressCallback: (progress, stage) => {
          setProgress(50 + (progress * 0.4)); // Transcription takes 40% of progress
          if (stage) setProgressStage(stage);
        }
      };

      const transcriptionResult = await transcribeAudio(audioBlob, transcriptionOptions);
      setProgress(95);

      // Step 3: Update UI with transcription
      setProgressStage('Finalizing transcription...');
      setTranscriptionData(transcriptionResult);
      setProgress(100);

      // Delay to show 100% completion
      setTimeout(() => {
        setIsTranscribing(false);
        setProgressStage('');
        setShowLargeFileWarning(false);
      }, 500);

    } catch (err) {
      console.error('Transcription failed:', err);
      setError(`Transcription failed: ${err.message}`);
      setIsTranscribing(false);
    }
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const jumpToTime = (time) => {
    if (isAudioOnly && audioRef.current) {
      audioRef.current.currentTime = time;
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const saveToDatabase = async () => {
    if (!transcriptionData || transcriptionData.length === 0 || !videoFile) return;

    setIsSaving(true);
    setError(null);

    try {
      // Get settings from localStorage
      const settings = JSON.parse(localStorage.getItem('transcriptionSettings')) || {
        language: 'en-US',
      };

      const options = {
        language: settings.language,
        duration: videoDuration,
        title: videoFile.name.split('.')[0],
        compressionApplied: !!compressionResults,
        originalSize: compressionResults?.originalSize,
        isAudioOnly: isAudioOnly
      };

      const id = await saveTranscriptionToDatabase(videoFile, transcriptionData, options);
      setTranscriptionId(id);
      setSaveSuccess(true);

      // Clear success message after a few seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Failed to save transcription:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const viewHistory = () => {
    navigate('/history');
  };

  const handleCompressionComplete = (compressedFile, results) => {
    setVideoFile(compressedFile);
    setCompressionResults(results);
    setShowCompressionOption(false);
    setIsAudioOnly(results.audioOnly || false);
  };

  const cancelCompression = () => {
    setShowCompressionOption(false);
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

  const renderMediaPlayer = () => {
    if (isAudioOnly) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Audio File</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-6 bg-primary-100 rounded-lg">
              <SafeIcon icon={FiMusic} className="w-12 h-12 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{videoFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(videoFile.size)} • {videoDuration ? `${Math.floor(videoDuration / 60)}:${Math.floor(videoDuration % 60).toString().padStart(2, '0')}` : 'Loading...'}
              </p>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={videoFile ? URL.createObjectURL(videoFile) : ''}
            controls
            className="w-full"
            onTimeUpdate={(e) => handleTimeUpdate(e.target.currentTime)}
          />
          {compressionResults && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
              <div className="flex items-start gap-2">
                <SafeIcon icon={FiCheck} className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Audio extracted from video</p>
                  <p className="text-xs mt-1">
                    Original: {formatFileSize(compressionResults.originalSize)} • Audio size: {formatFileSize(compressionResults.compressedSize)} • Saved: {compressionResults.savedSpaceMB} MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <VideoPlayer
          ref={videoRef}
          videoFile={videoFile}
          onTimeUpdate={handleTimeUpdate}
          transcriptionData={transcriptionData}
          currentTime={currentTime}
        />
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5}}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Transcription</h1>
        <p className="text-gray-600">
          Upload your video file and get accurate AI-powered transcriptions with BPAi - VidiScribe. Audio extraction is enabled by default for optimal transcription quality.
        </p>
      </motion.div>

      {!videoFile ? (
        <VideoUpload onFileUpload={handleFileUpload} />
      ) : showCompressionOption ? (
        <VideoCompression
          videoFile={videoFile}
          onCompressionComplete={handleCompressionComplete}
          onCancel={cancelCompression}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player Section */}
          <motion.div
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.5}}
            className="space-y-6"
          >
            {renderMediaPlayer()}

            {/* File Info */}
            {!isAudioOnly && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{videoFile.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(videoFile.size)} • {videoDuration ? `${Math.floor(videoDuration / 60)}:${Math.floor(videoDuration % 60).toString().padStart(2, '0')}` : 'Loading...'}
                      {compressionResults && !isAudioOnly && (
                        <span className="ml-2 text-green-600">
                          (Compressed {compressionResults.compressionRatio}x)
                        </span>
                      )}
                    </p>
                  </div>
                  {videoFile.size > (2 * 1024 * 1024 * 1024) && !compressionResults && !isAudioOnly && (
                    <div className="flex items-center space-x-1 text-amber-600">
                      <SafeIcon icon={FiAlertTriangle} className="w-4 h-4" />
                      <span className="text-xs font-medium">Large File</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Large File Warning */}
            {showLargeFileWarning && !compressionResults && !isAudioOnly && (
              <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-2">
                  <SafeIcon icon={FiAlertTriangle} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Large File Processing</p>
                    <p>This file is over 2GB and may take 15-30 minutes to process. Please be patient and keep this tab open during processing.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transcription Controls</h3>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiSettings} className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  whileHover={{scale: 1.05}}
                  whileTap={{scale: 0.95}}
                  onClick={startTranscription}
                  disabled={isTranscribing}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isTranscribing 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  <SafeIcon icon={isTranscribing ? FiLoader : FiPlay} className={`w-5 h-5 ${isTranscribing ? 'animate-spin' : ''}`} />
                  <span>{isTranscribing ? 'Transcribing...' : 'Start Transcription'}</span>
                </motion.button>

                {transcriptionData.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{scale: 1.05}}
                      whileTap={{scale: 0.95}}
                      onClick={() => setShowExportModal(true)}
                      className="flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      <SafeIcon icon={FiDownload} className="w-5 h-5" />
                      <span>Export Files</span>
                    </motion.button>

                    <motion.button
                      whileHover={{scale: 1.05}}
                      whileTap={{scale: 0.95}}
                      onClick={saveToDatabase}
                      disabled={isSaving || saveSuccess}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold transition-colors ${
                        saveSuccess 
                          ? 'bg-green-500 text-white' 
                          : isSaving 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      <SafeIcon icon={saveSuccess ? FiCheck : isSaving ? FiLoader : FiSave} className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                      <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save to Library'}</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {isTranscribing && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">{progressStage}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${progress}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{progress.toFixed(0)}% complete</span>
                    {videoFile && videoFile.size > (1024 * 1024 * 1024) && !isAudioOnly && (
                      <span>Large file processing may take several minutes</span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {transcriptionId && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Transcription saved to your library!</p>
                    <button
                      onClick={viewHistory}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View History
                    </button>
                  </div>
                </div>
              )}

              {/* Compression Results Summary */}
              {compressionResults && !isAudioOnly && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <SafeIcon icon={FiCheck} className="w-4 h-4 mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Video compressed successfully!</p>
                      <p className="text-xs mt-1">
                        Original: {formatFileSize(compressionResults.originalSize)} • Compressed: {formatFileSize(compressionResults.compressedSize)} • Saved: {compressionResults.savedSpaceMB} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Transcription Panel */}
          <motion.div
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.5, delay: 0.2}}
          >
            <TranscriptionPanel
              transcriptionData={transcriptionData}
              currentTime={currentTime}
              onJumpToTime={jumpToTime}
              isTranscribing={isTranscribing}
            />
          </motion.div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        transcriptionData={transcriptionData}
        videoFileName={videoFile?.name}
      />
    </div>
  );
};

export default TranscriptionPage;