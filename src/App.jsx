import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TranscriptionPage from './pages/TranscriptionPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <motion.main 
            className="flex-1 p-6 lg:ml-64"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transcribe" element={<TranscriptionPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </motion.main>
        </div>
      </div>
    </Router>
  );
}

export default App;