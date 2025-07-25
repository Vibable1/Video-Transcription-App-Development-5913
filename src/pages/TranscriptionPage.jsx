import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoUpload from '../components/VideoUpload';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptionPanel from '../components/TranscriptionPanel';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { extractAudioFromVideo, transcribeAudio, formatTranscriptionForExport } from '../services/transcriptionService';

const { FiUpload, FiPlay, FiPause, FiDownload, FiSettings, FiLoader } = FiIcons;

const TranscriptionPage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);

  // Reset state when a new file is uploaded
  const handleFileUpload = (file) => {
    setVideoFile(file);
    setTranscriptionData([]);
    setError(null);
    setProgress(0);
    setProgressStage('');
  };

  // Get video duration after video is loaded
  useEffect(() => {
    if (videoRef.current && videoFile) {
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
  }, [videoFile]);

  const startTranscription = async () => {
    if (!videoFile) return;
    
    setIsTranscribing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Step 1: Extract audio from video
      setProgressStage('Extracting audio from video...');
      setProgress(10);
      
      const audioBlob = await extractAudioFromVideo(videoFile);
      setProgress(40);
      
      // Step 2: Send audio for transcription
      setProgressStage('Processing speech to text...');
      
      // Get settings from localStorage or use defaults
      const settings = JSON.parse(localStorage.getItem('transcriptionSettings')) || {
        language: 'en-US',
        model: 'standard',
      };
      
      const transcriptionOptions = {
        language: settings.language,
        model: settings.model,
        duration: videoDuration // Pass video duration for better simulated results
      };
      
      const transcriptionResult = await transcribeAudio(audioBlob, transcriptionOptions);
      setProgress(90);
      
      // Step 3: Update UI with transcription
      setProgressStage('Finalizing transcription...');
      setTranscriptionData(transcriptionResult);
      setProgress(100);
      
      // Delay to show 100% completion
      setTimeout(() => {
        setIsTranscribing(false);
        setProgressStage('');
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
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const exportTranscription = (format = 'txt') => {
    if (!transcriptionData || transcriptionData.length === 0) return;
    
    const formattedText = formatTranscriptionForExport(transcriptionData, format);
    const filename = `${videoFile.name.split('.')[0]}_transcription.${format}`;
    
    // Create a downloadable link
    const blob = new Blob([formattedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Transcription</h1>
        <p className="text-gray-600">Upload your video file and get accurate AI-powered transcriptions.</p>
      </motion.div>

      {!videoFile ? (
        <VideoUpload onFileUpload={handleFileUpload} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <VideoPlayer
              ref={videoRef}
              videoFile={videoFile}
              onTimeUpdate={handleTimeUpdate}
              transcriptionData={transcriptionData}
              currentTime={currentTime}
            />

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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportTranscription('txt')}
                      className="flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      <SafeIcon icon={FiDownload} className="w-5 h-5" />
                      <span>Export (.txt)</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportTranscription('srt')}
                      className="flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      <SafeIcon icon={FiDownload} className="w-5 h-5" />
                      <span>Export (.srt)</span>
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
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Transcription Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
    </div>
  );
};

export default TranscriptionPage;