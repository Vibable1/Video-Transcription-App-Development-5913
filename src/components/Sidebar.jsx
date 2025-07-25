import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiMic, FiClock, FiSettings, FiX } = FiIcons;

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/transcribe', icon: FiMic, label: 'Transcribe' },
  { path: '/history', icon: FiClock, label: 'History' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 w-64 h-full bg-white shadow-xl z-50 lg:translate-x-0 lg:static lg:z-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <SafeIcon icon={FiX} className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon 
                    icon={item.icon} 
                    className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} 
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;