import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEdit3, FiCopy, FiDownload, FiSearch, FiClock, FiCheck, FiSave, FiTrash2, FiCheckCircle } = FiIcons;

const TranscriptionPanel = ({ transcriptionData, currentTime, onJumpToTime, isTranscribing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editedData, setEditedData] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Initialize edited data when transcription data changes
  useEffect(() => {
    setEditedData(transcriptionData);
  }, [transcriptionData]);

  const filteredData = editedData.filter(item =>
    item.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const handleSaveEdit = (id) => {
    setEditedData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, text: editText } : item
      )
    );
    setEditingId(null);
    setEditText('');
  };

  const handleCopySegment = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(text);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const fullText = editedData.map(item => item.text).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedIndex('all');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isCurrentSegment = (item) => {
    return currentTime >= item.startTime && currentTime <= item.endTime;
  };

  const getSearchHighlightedText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transcription</h3>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyAll}
              disabled={editedData.length === 0}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 relative"
            >
              <SafeIcon icon={copiedIndex === 'all' ? FiCheckCircle : FiCopy} className={`w-4 h-4 ${copiedIndex === 'all' ? 'text-green-500' : ''}`} />
              {copiedIndex === 'all' && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded">
                  Copied!
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transcription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isTranscribing && editedData.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Processing audio...</p>
            </div>
          </div>
        )}

        {editedData.length === 0 && !isTranscribing && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <SafeIcon icon={FiClock} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transcription data yet</p>
              <p className="text-sm text-gray-400">Upload a video and start transcribing</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          <div className="space-y-4">
            {filteredData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  isCurrentSegment(item)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onJumpToTime(item.startTime)}
                    className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <SafeIcon icon={FiClock} className="w-4 h-4" />
                    <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                  </motion.button>
                  
                  <div className="flex items-center space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopySegment(item.text)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors relative"
                    >
                      <SafeIcon 
                        icon={copiedIndex === item.text ? FiCheckCircle : FiCopy} 
                        className={`w-3 h-3 ${copiedIndex === item.text ? 'text-green-500' : ''}`} 
                      />
                      {copiedIndex === item.text && (
                        <span className="absolute -top-8 right-0 text-xs bg-gray-800 text-white px-2 py-1 rounded">
                          Copied!
                        </span>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(item)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <SafeIcon icon={FiEdit3} className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>

                {editingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                      >
                        <SafeIcon icon={FiSave} className="w-3 h-3" />
                        <span>Save</span>
                      </motion.button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {getSearchHighlightedText(item.text, searchTerm)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
        
        {/* No search results message */}
        {searchTerm && filteredData.length === 0 && editedData.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <SafeIcon icon={FiSearch} className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No results found for "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-2 text-primary-500 hover:text-primary-600 text-sm"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TranscriptionPanel;