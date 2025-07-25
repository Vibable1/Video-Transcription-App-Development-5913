import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiFilter, FiDownload, FiPlay, FiClock, FiFileText, FiMoreVertical } = FiIcons;

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const transcriptionHistory = [
    {
      id: 1,
      name: 'Team Meeting Q4.mp4',
      duration: '45:32',
      status: 'Completed',
      date: '2024-01-15',
      size: '234 MB',
      accuracy: '98%'
    },
    {
      id: 2,
      name: 'Product Demo.mov',
      duration: '23:15',
      status: 'Processing',
      date: '2024-01-15',
      size: '156 MB',
      accuracy: '-'
    },
    {
      id: 3,
      name: 'Interview Session.mp4',
      duration: '67:42',
      status: 'Completed',
      date: '2024-01-14',
      size: '445 MB',
      accuracy: '96%'
    },
    {
      id: 4,
      name: 'Training Video.mp4',
      duration: '32:18',
      status: 'Completed',
      date: '2024-01-13',
      size: '289 MB',
      accuracy: '97%'
    },
    {
      id: 5,
      name: 'Client Presentation.mov',
      duration: '28:45',
      status: 'Failed',
      date: '2024-01-12',
      size: '198 MB',
      accuracy: '-'
    }
  ];

  const filteredHistory = transcriptionHistory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            {filteredHistory.length} of {transcriptionHistory.length} transcriptions
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-6 font-semibold text-gray-900">File Name</th>
                <th className="text-left p-6 font-semibold text-gray-900">Duration</th>
                <th className="text-left p-6 font-semibold text-gray-900">Status</th>
                <th className="text-left p-6 font-semibold text-gray-900">Date</th>
                <th className="text-left p-6 font-semibold text-gray-900">Accuracy</th>
                <th className="text-left p-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.map((item, index) => (
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
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiClock} className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{item.duration}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-6 text-gray-900">{item.date}</td>
                  <td className="p-6">
                    <span className={`font-medium ${item.accuracy !== '-' ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.accuracy}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-2">
                      {item.status === 'Completed' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <SafeIcon icon={FiPlay} className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <SafeIcon icon={FiDownload} className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <SafeIcon icon={FiMoreVertical} className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="p-12 text-center">
            <SafeIcon icon={FiFileText} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transcriptions found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryPage;