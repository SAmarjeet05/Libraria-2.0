import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LibraryScene3D } from '../3d';
import { useAuth } from '../../hooks/useAuth';
import { BookOpenIcon, FireIcon, SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { SignupForm } from './SignupForm';

export const LibraryLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Store user preferences in local storage
        if (data.user?.preferences) {
          localStorage.setItem('userPreferences', JSON.stringify(data.user.preferences));
          // Apply theme if it exists in preferences
          if (data.user.preferences.theme) {
            document.documentElement.classList.toggle('dark', data.user.preferences.theme === 'dark');
          }
        }
        await login(data.access_token, data.user);
        navigate('/app');
      } else {
        const errorMessage = typeof data.detail === 'string' ? data.detail : 'Login failed. Please check your credentials.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.fullName,
          username: data.username,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Automatically log in after successful signup
        await login(responseData.access_token, responseData.user);
        navigate('/app');
      } else {
        const errorMessage = typeof responseData.detail === 'string' ? responseData.detail : 'Registration failed. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D Library Scene Background */}
      <div className="absolute inset-0 z-0">
        <LibraryScene3D enableFireplace={true} enableWind={true} />
      </div>

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />

      {/* Fireplace glow effect */}
      <motion.div
        className="absolute left-0 top-1/2 w-96 h-96 -translate-y-1/2 z-10 pointer-events-none"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(255,102,0,0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-20 w-full h-full flex items-center justify-center px-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Welcome */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white space-y-6 px-4"
          >
            {/* Logo/Title */}
            <div className="flex items-center gap-4 mb-8">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BookOpenIcon className="w-16 h-16 text-orange-400" />
              </motion.div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                  Libraria
                </h1>
                <p className="text-sm text-gray-300 flex items-center gap-2 mt-1">
                  <SparklesIcon className="w-4 h-4" />
                  AI-Powered Library System
                </p>
              </div>
            </div>

            {/* Welcome Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-4xl font-bold leading-tight">
                Welcome to Your
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                  Digital Library
                </span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Experience the warmth of a traditional library combined with cutting-edge AI technology.
                Your journey through knowledge begins here.
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-4 pt-6"
            >
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <FireIcon className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold">Cozy Reading</p>
                  <p className="text-xs text-gray-400">Comfortable environment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <SparklesIcon className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold">AI-Powered</p>
                  <p className="text-xs text-gray-400">Smart recommendations</p>
                </div>
              </div>
            </motion.div>

            {/* Animated quote */}
            <motion.blockquote
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="border-l-4 border-orange-400 pl-4 italic text-gray-300 mt-8"
            >
              "A library is not a luxury but one of the necessities of life."
              <footer className="text-sm text-gray-400 mt-2">— Henry Ward Beecher</footer>
            </motion.blockquote>
          </motion.div>

          {/* Right Side - Login/Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              {/* Form Header */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isSignup ? 'Create Account' : 'Sign In'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {isSignup ? 'Join our library community' : 'Enter your credentials to continue'}
                </p>
              </div>

              {/* Login/Signup Forms */}
              {isSignup ? (
                <SignupForm 
                  onSubmit={handleSignup}
                  onCancel={() => setIsSignup(false)}
                  error={error}
                  isLoading={isLoading}
                />
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                      </label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        className="mr-2 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Remember me
                    </label>
                    <Link
                      to="/"
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              )}

              {/* Toggle between Login and Signup */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                >
                  {isSignup ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
                </button>
              </div>

              {/* Back to home link */}
              <div className="mt-4 text-center">
                <Link
                  to="/"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating particles for ambient effect */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};
