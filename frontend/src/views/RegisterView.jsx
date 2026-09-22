import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserPlus, Key, Mail, User, AlertCircle } from 'lucide-react';

export const RegisterView = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-500 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Register Operator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access Disaster Decision Support Terminal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Disaster Operations Officer"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@disaster.intel"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating Account...' : 'Register Operator'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-red-400 hover:underline font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterView;
