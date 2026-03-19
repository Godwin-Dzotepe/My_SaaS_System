'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Loader2, BookOpen, Users, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/dashboard/super-admin',
  school_admin: '/dashboard/school-admin',
  finance_admin: '/dashboard/finance-admin',
  teacher: '/dashboard/teacher',
  parent: '/dashboard/parent',
  secretary: '/dashboard/secretary',
};

const floatingIcons = [
  { icon: BookOpen, x: '10%', y: '20%', delay: 0, size: 24 },
  { icon: Users, x: '85%', y: '15%', delay: 0.5, size: 20 },
  { icon: School, x: '75%', y: '70%', delay: 1, size: 28 },
  { icon: GraduationCap, x: '15%', y: '75%', delay: 1.5, size: 22 },
  { icon: BookOpen, x: '50%', y: '8%', delay: 0.8, size: 18 },
  { icon: Users, x: '90%', y: '45%', delay: 0.3, size: 16 },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      const redirect = ROLE_REDIRECTS[data.user.role] || '/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
          style={{ top: '-10%', left: '-10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl"
          style={{ bottom: '-5%', right: '-5%' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-cyan-400/10 blur-2xl"
          style={{ top: '40%', left: '60%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Floating icons */}
      {floatingIcons.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            className="absolute text-white/10 pointer-events-none"
            style={{ left: item.x, top: item.y }}
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
          >
            <Icon size={item.size} />
          </motion.div>
        );
      })}

      {/* Login card */}
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <GraduationCap className="w-9 h-9 text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-white">EduManage</h1>
            <p className="text-blue-200 text-sm mt-1">School Management System</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
            <p className="text-blue-200 text-sm mb-6">Sign in to your account to continue</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="text-sm font-medium text-blue-100">Email or Phone</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter your email or phone"
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="text-sm font-medium text-blue-100">Password</label>
              <div className="relative">
                <input
                  key={showPassword ? 'text' : 'password'}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-blue-800 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </motion.div>
          </form>

          <motion.p
            className="text-center text-blue-300 text-xs mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Contact your school administrator if you need access.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
