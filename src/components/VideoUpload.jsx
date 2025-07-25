import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUploadCloud, FiFile, FiX, FiCheck, FiAlertCircle } = FiIcons;

const VideoUpload = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    setError(null);
    
    // Check if any video files are present
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (!videoFile) {
      setError('Please upload a valid video file.');
      return;
    }
    
    // Check file size (max 500MB)
    const maxSizeMB = 500;
    const fileSizeMB = videoFile.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds ${maxSizeMB}MB limit. Your file is ${fileSizeMB.toFixed(1)}MB.`);
      return;
    }
    
    processUpload(videoFile);
  };

  const processUpload = (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload with progress
    const totalTime = Math.min(file.size / (1024 * 1024) * 20, 3000); // Larger files take longer
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            onFileUpload(file);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, totalTime / 20);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 p-12"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`text-center transition-all duration-300 ${
          isDragOver ? 'bg-primary-50 border-primary-300' : ''
        }`}
      >
        {!isUploading ? (
          <>
            <motion.div
              animate={{ y: isDragOver ? -10 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="mb-6"
            >
              <SafeIcon 
                icon={FiUploadCloud} 
                className={`w-16 h-16 mx-auto transition-colors ${
                  isDragOver ? 'text-primary-500' : 'text-gray-400'
                }`} 
              />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Video File</h3>
            <p className="text-gray-600 mb-8">
              Drag and drop your video file here, or click to browse
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 max-w-md mx-auto">
                <SafeIcon icon={FiAlertCircle} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                <SafeIcon icon={FiFile} className="w-5 h-5" />
                <span>Choose Video File</span>
              </motion.button>

              <p className="text-sm text-gray-500">
                Supported formats: MP4, MOV, AVI, MKV, WebM (Max 500MB)
              </p>
              <p className="text-xs text-gray-400">
                For best results, use videos with clear audio and minimal background noise
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center"
            >
              <SafeIcon icon={FiUploadCloud} className="w-8 h-8 text-primary-500" />
            </motion.div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Uploading Video...</h3>
              <p className="text-gray-600 mb-4">Please wait while we process your video file</p>
              
              <div className="bg-gray-200 rounded-full h-3 mb-2 max-w-md mx-auto">
                <motion.div
                  className="bg-primary-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoUpload;