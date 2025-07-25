import React, { forwardRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiSettings } = FiIcons;

const VideoPlayer = forwardRef(({ videoFile, onTimeUpdate, transcriptionData, currentTime }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [ref, onTimeUpdate]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    const video = ref.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const toggleMute = () => {
    const video = ref.current;
    if (video) {
      if (isMuted) {
        video.volume = prevVolume;
        setVolume(prevVolume);
      } else {
        setPrevVolume(volume);
        video.volume = 0;
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (ref.current) {
      ref.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    const video = ref.current;
    if (video) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * duration;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentTranscription = () => {
    return transcriptionData.find(
      item => currentTime >= item.startTime && currentTime <= item.endTime
    );
  };

  const currentTranscript = getCurrentTranscription();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      ref={containerRef}
    >
      <div 
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onMouseMove={() => setShowControls(true)}
      >
        <video
          ref={ref}
          src={videoFile ? URL.createObjectURL(videoFile) : ''}
          className={`w-full object-contain bg-black ${isFullscreen ? 'h-screen' : 'h-64 lg:h-80'}`}
          onClick={togglePlay}
        />

        {/* Current Transcription Overlay */}
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute ${isFullscreen ? 'bottom-24' : 'bottom-16'} left-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg`}
          >
            <p className={`${isFullscreen ? 'text-lg' : 'text-sm'} font-medium`}>{currentTranscript.text}</p>
          </motion.div>
        )}

        {/* Video Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="text-white hover:text-primary-300 transition-colors"
            >
              <SafeIcon icon={isPlaying ? FiPause : FiPlay} className="w-6 h-6" />
            </motion.button>

            <div className="flex-1">
              <div 
                className="bg-gray-600 h-2 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="bg-primary-500 h-2 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                </div>
              </div>
            </div>

            <span className="text-white text-sm hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex items-center space-x-2 group relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="text-white hover:text-primary-300 transition-colors"
              >
                <SafeIcon icon={isMuted ? FiVolumeX : FiVolume2} className="w-5 h-5" />
              </motion.button>
              
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 rounded p-2 w-24">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              className="text-white hover:text-primary-300 transition-colors"
            >
              <SafeIcon icon={isFullscreen ? FiMinimize : FiMaximize} className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Video Info (Only show when not in fullscreen) */}
      {!isFullscreen && (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{videoFile?.name}</h3>
              <p className="text-sm text-gray-500">
                {videoFile && `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
              </p>
            </div>
            <SafeIcon icon={FiSettings} className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      )}
    </motion.div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;