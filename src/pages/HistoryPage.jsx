import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getUserTranscriptions, deleteTranscription } from '../services/transcriptionDbService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const { FiSearch, FiFilter, FiDownload, FiPlay, FiClock, FiFileText, FiMoreVertical, FiTrash2, FiLoader, FiAlertCircle } = FiIcons;

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [transcriptions, setTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transcriptionToDelete, setTranscriptionToDelete] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTranscriptions();
  }, [user]);

  const fetchTranscriptions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserTranscriptions();
      setTranscriptions(data);
    } catch (err) {
      console.error('Failed to fetch transcriptions:', err);
      setError('Failed to load your transcription history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirmation = (transcription) => {
    setTranscriptionToDelete(transcription);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!transcriptionToDelete) return;
    
    setDeletingId(transcriptionToDelete.id);
    try {
      await deleteTranscription(transcriptionToDelete.id);
      setTranscriptions(transcriptions.filter(t => t.id !== transcriptionToDelete.id));
    } catch (err) {
      console.error('Failed to delete transcription:', err);
      setError('Failed to delete transcription. Please try again.');
    } finally {
      setDeletingId(null);
      setShowConfirmation(false);
      setTranscriptionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
    setTranscriptionToDelete(null);
  };

  const viewTranscription = (id) => {
    navigate(`/transcription/${id}`);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const filteredTranscriptions = transcriptions.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transcription History</h1>
        <p className="text-gray-600">View and manage all your transcription projects.</p>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transcriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiFilter} className="w-4 h-4 text-gray-500" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {filteredTranscriptions.length} of {transcriptions.length} transcriptions
          </div>
        </div>
      </motion.div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <SafeIcon icon={FiAlertCircle} className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transcriptions</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchTranscriptions}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="p-12 text-center">
            <SafeIcon icon={FiFileText} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcriptions Yet</h3>
            <p className="text-gray-500 mb-4">You haven't created any transcriptions yet.</p>
            <button
              onClick={() => navigate('/transcribe')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Create Your First Transcription
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-6 font-semibold text-gray-900">File Name</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Duration</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Date</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Language</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTranscriptions.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <SafeIcon icon={FiFileText} className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title || item.file_name}</h4>
                          <p className="text-sm text-gray-500">{formatFileSize(item.file_size)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiClock} className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDuration(item.duration)}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-6 text-gray-900">{formatDate(item.created_at)}</td>
                    <td className="p-6 text-gray-900">{item.language}</td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        {item.status.toLowerCase() === 'completed' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => viewTranscription(item.id)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <SafeIcon icon={FiPlay} className="w-4 h-4" />
                            </motion.button>
                          </>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteConfirmation(item)}
                          disabled={deletingId === item.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <SafeIcon 
                            icon={deletingId === item.id ? FiLoader : FiTrash2} 
                            className={`w-4 h-4 ${deletingId === item.id ? 'animate-spin' : ''}`} 
                          />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredTranscriptions.length === 0 && transcriptions.length > 0 && (
          <div className="p-12 text-center">
            <SafeIcon icon={FiFileText} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transcriptions found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Transcription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{transcriptionToDelete?.title || transcriptionToDelete?.file_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;