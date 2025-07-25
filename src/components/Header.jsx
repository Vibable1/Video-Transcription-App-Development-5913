import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMenu, FiMic, FiBell, FiUser } = FiIcons;

const Header = ({ onMenuClick }) => {
  return (
    <motion.header 
      className="bg-white shadow-sm border-b border-gray-200 px-6 py-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <SafeIcon icon={FiMic} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TranscribeAI</h1>
              <p className="text-sm text-gray-500">Professional Video Transcription</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <SafeIcon icon={FiBell} className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </motion.button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiUser} className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">John Doe</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;