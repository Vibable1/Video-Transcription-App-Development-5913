import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TranscriptionPage from './pages/TranscriptionPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
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
                    <Dashboard />
                  </motion.main>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/transcribe" element={
            <ProtectedRoute>
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
                    <TranscriptionPage />
                  </motion.main>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute>
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
                    <HistoryPage />
                  </motion.main>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
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
                    <SettingsPage />
                  </motion.main>
                </div>
              </div>
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;