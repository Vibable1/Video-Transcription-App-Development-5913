import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiClock, FiFileText, FiTrendingUp, FiPlay, FiDownload } = FiIcons;

const Dashboard = () => {
  const stats = [
    { label: 'Total Transcriptions', value: '156', icon: FiFileText, color: 'blue' },
    { label: 'Hours Processed', value: '342', icon: FiClock, color: 'green' },
    { label: 'Active Projects', value: '12', icon: FiPlay, color: 'purple' },
    { label: 'Downloads', value: '89', icon: FiDownload, color: 'orange' },
  ];

  const recentFiles = [
    { name: 'Team Meeting Q4.mp4', duration: '45:32', status: 'Completed', date: '2 hours ago' },
    { name: 'Product Demo.mov', duration: '23:15', status: 'Processing', date: '4 hours ago' },
    { name: 'Interview Session.mp4', duration: '67:42', status: 'Completed', date: '1 day ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your transcription activity.</p>
      </motion.div>

      {/* Quick Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Start Transcribing</h2>
            <p className="text-primary-100 mb-6">Upload your video file and get accurate transcriptions in minutes.</p>
            <Link
              to="/transcribe"
              className="inline-flex items-center space-x-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <SafeIcon icon={FiUpload} className="w-5 h-5" />
              <span>Upload Video</span>
            </Link>
          </div>
          <div className="hidden lg:block">
            <SafeIcon icon={FiFileText} className="w-32 h-32 text-primary-200" />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Files */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transcriptions</h3>
            <Link
              to="/history"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentFiles.map((file, index) => (
            <motion.div
              key={index}
              whileHover={{ backgroundColor: '#f9fafb' }}
              className="p-6 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <SafeIcon icon={FiFileText} className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{file.name}</h4>
                  <p className="text-sm text-gray-500">{file.duration} • {file.date}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  file.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {file.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;