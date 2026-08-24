import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('kevorchsbd@gmail.com');
  const [password, setPassword] = useState('kevorch123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Top Header */}
        <div className="bg-[#E31B23] text-white p-6 text-center relative">
          <div className="w-14 h-14 bg-white text-[#E31B23] font-black text-2xl rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3">
            K
          </div>
          <h2 className="text-xl font-extrabold tracking-wider uppercase">KEVORCH SBD</h2>
          <p className="text-xs text-red-100 mt-0.5">Billing & Document Management System</p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-gray-700 dark:text-gray-300 font-bold">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-[#E31B23] font-bold hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E31B23] hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/30 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-bold text-gray-900 dark:text-gray-200">Demo Account Credentials:</p>
            <p>Email: <span className="font-mono font-bold text-[#E31B23]">kevorchsbd@gmail.com</span></p>
            <p>Password: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">kevorch123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
