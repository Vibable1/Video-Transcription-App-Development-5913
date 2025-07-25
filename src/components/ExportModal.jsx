import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { exportTranscription } from '../services/exportService';

const { FiDownload, FiX, FiCheck, FiLoader, FiFileText, FiFile, FiCode } = FiIcons;

const ExportModal = ({ isOpen, onClose, transcriptionData, videoFileName }) => {
  const [selectedExports, setSelectedExports] = useState({
    full: { enabled: true, format: 'txt' },
    summary: { enabled: true, format: 'txt' },
    keypoints: { enabled: true, format: 'txt' }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResults, setExportResults] = useState([]);
  const [error, setError] = useState(null);

  const exportTypes = [
    {
      key: 'full',
      title: 'Full Transcript',
      description: 'Complete transcription with all spoken content',
      icon: FiFileText,
      color: 'blue'
    },
    {
      key: 'summary',
      title: 'Summary',
      description: 'Condensed version highlighting main points',
      icon: FiFile,
      color: 'green'
    },
    {
      key: 'keypoints',
      title: 'Key Points',
      description: 'Bullet points of important topics',
      icon: FiCode,
      color: 'purple'
    }
  ];

  const fileFormats = [
    { value: 'txt', label: 'Text (.txt)', icon: '📄' },
    { value: 'html', label: 'HTML (.html)', icon: '🌐' },
    { value: 'docx', label: 'Word (.docx)', icon: '📝' }
  ];

  const handleExportToggle = (exportType) => {
    setSelectedExports(prev => ({
      ...prev,
      [exportType]: {
        ...prev[exportType],
        enabled: !prev[exportType].enabled
      }
    }));
  };

  const handleFormatChange = (exportType, format) => {
    setSelectedExports(prev => ({
      ...prev,
      [exportType]: {
        ...prev[exportType],
        format
      }
    }));
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    setError(null);
    setExportResults([]);

    const baseFilename = videoFileName ? videoFileName.split('.')[0] : 'transcription';
    const enabledExports = Object.entries(selectedExports).filter(([, config]) => config.enabled);

    try {
      const results = [];
      
      for (const [exportType, config] of enabledExports) {
        try {
          const result = await exportTranscription(
            transcriptionData,
            exportType,
            config.format,
            baseFilename
          );
          
          results.push({
            type: exportType,
            format: config.format,
            filename: result.filename,
            success: true
          });
        } catch (err) {
          console.error(`Export failed for ${exportType}:`, err);
          results.push({
            type: exportType,
            format: config.format,
            success: false,
            error: err.message
          });
        }
      }

      setExportResults(results);
      
      // Show success message for a few seconds then close modal
      setTimeout(() => {
        onClose();
        setExportResults([]);
      }, 3000);
      
    } catch (err) {
      console.error('Export process failed:', err);
      setError(err.message || 'Failed to export files. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getSelectedCount = () => {
    return Object.values(selectedExports).filter(config => config.enabled).length;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Export Transcription</h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose what to export and in which format
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Export Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Select Export Types</h4>
              
              {exportTypes.map((exportType) => (
                <motion.div
                  key={exportType.key}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedExports[exportType.key].enabled
                      ? `border-${exportType.color}-200 bg-${exportType.color}-50`
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExports[exportType.key].enabled}
                        onChange={() => handleExportToggle(exportType.key)}
                        className={`w-5 h-5 text-${exportType.color}-600 rounded focus:ring-${exportType.color}-500`}
                      />
                    </label>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <SafeIcon 
                          icon={exportType.icon} 
                          className={`w-5 h-5 text-${exportType.color}-600`} 
                        />
                        <h5 className="font-medium text-gray-900">{exportType.title}</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{exportType.description}</p>
                      
                      {selectedExports[exportType.key].enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <label className="block text-xs font-medium text-gray-700">
                            File Format:
                          </label>
                          <div className="flex space-x-2">
                            {fileFormats.map((format) => (
                              <button
                                key={format.value}
                                onClick={() => handleFormatChange(exportType.key, format.value)}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                  selectedExports[exportType.key].format === format.value
                                    ? `bg-${exportType.color}-500 text-white`
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                <span>{format.icon}</span>
                                <span>{format.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Export Results */}
            {exportResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 mb-3">Export Results</h4>
                <div className="space-y-2">
                  {exportResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 text-sm ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      <SafeIcon 
                        icon={result.success ? FiCheck : FiX} 
                        className="w-4 h-4" 
                      />
                      <span>
                        {result.success
                          ? `${result.filename} downloaded successfully`
                          : `${result.type} export failed: ${result.error}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <SafeIcon icon={FiX} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Export Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="text-sm text-gray-600">
              {getSelectedCount()} export{getSelectedCount() !== 1 ? 's' : ''} selected
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              
              <motion.button
                whileHover={{ scale: isExporting ? 1 : 1.02 }}
                whileTap={{ scale: isExporting ? 1 : 0.98 }}
                onClick={handleExportAll}
                disabled={isExporting || getSelectedCount() === 0}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  isExporting || getSelectedCount() === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                <SafeIcon 
                  icon={isExporting ? FiLoader : FiDownload} 
                  className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} 
                />
                <span>
                  {isExporting 
                    ? 'Exporting...' 
                    : `Export ${getSelectedCount()} File${getSelectedCount() !== 1 ? 's' : ''}`
                  }
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;