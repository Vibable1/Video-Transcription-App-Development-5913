import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import AuthForm from '../components/AuthForm';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {signIn, signUp, getCurrentSession} from '../services/authService';

const {FiMic} = FiIcons;

const LoginPage = () => {
  const [mode, setMode] = useState('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password);
      }

      if (result.session) {
        navigate('/');
      } else if (mode === 'signup') {
        // Show confirmation message for signup
        setError({
          type: 'success',
          message: 'Account created! Please check your email for confirmation.'
        });
        // Switch to signin mode
        setMode('signin');
      }
    } catch (err) {
      setError({
        type: 'error',
        message: err.message || 'Authentication failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center">
          <div className="p-3 bg-primary-500 rounded-lg">
            <SafeIcon icon={FiMic} className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900">
          BPAi - VidiScribe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          AI-Powered Video Transcription
        </p>
      </div>

      {error && error.type === 'success' && (
        <motion.div
          initial={{opacity: 0, y: -20}}
          animate={{opacity: 1, y: 0}}
          className="sm:mx-auto sm:w-full sm:max-w-md mb-4"
        >
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{error.message}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setMode('signin')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    mode === 'signin'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    mode === 'signup'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {error && error.type === 'error' && (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="bg-red-50 border border-red-200 rounded-md p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error.message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <AuthForm
              mode={mode}
              onSubmit={handleAuth}
              isLoading={isLoading}
              toggleMode={toggleMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;