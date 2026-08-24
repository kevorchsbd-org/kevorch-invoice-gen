import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-3xl shadow-2xl p-8 space-y-6">
        <Link to="/login" className="inline-flex items-center space-x-2 text-xs font-bold text-[#E31B23]">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Reset Password</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter your admin email address to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>Password reset link sent to {email}!</p>
          </div>
        ) : (
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
                  placeholder="kevorchsbd@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-1 focus:ring-[#E31B23]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#E31B23] hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
