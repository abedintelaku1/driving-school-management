import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
export function LoginPage() {
  const navigate = useNavigate();
  const {
    login,
    user
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);

      if (result.success && result.user) {
        // Navigate based on user role from API response
        // Accept both numbers (0, 1) and strings ('admin', 'instructor')
        const userRole = result.user.role;
        
        // Check for admin (0, '0', or 'admin')
        if (userRole === 0 || userRole === '0' || userRole === 'admin' || String(userRole).toLowerCase() === 'admin') {
          navigate('/admin', { replace: true });
          return;
        } 
        // Check for instructor (1, '1', or 'instructor')
        if (userRole === 1 || userRole === '1' || userRole === 'instructor' || String(userRole).toLowerCase() === 'instructor') {
          navigate('/instructor', { replace: true });
          return;
        } 
        
        // Fallback: determine from email
        if (email.toLowerCase().includes('admin')) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/instructor', { replace: true });
        }
      } else {
        const errorMessage = result.message || 'Invalid email or password. Please check your credentials.';
        setError(errorMessage);
        console.error('Login failed:', result);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('An error occurred. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };
  const handleDemoLogin = (role: 0 | 1) => {
    if (role === 0) { // admin
      setEmail('admin@drivershub.com');
    } else { // instructor
      setEmail('john.instructor@drivershub.com');
    }
    setPassword('demo123');
  };
  return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <CarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Drivers Hub</h1>
          <p className="text-gray-400 mt-2">Driving School Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>}

            {/* Submit */}
            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">
              Quick demo access:
            </p>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => handleDemoLogin(0)}>
                Admin Demo
              </Button>
              <Button variant="outline" fullWidth onClick={() => handleDemoLogin(1)}>
                Instructor Demo
              </Button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2024 Drivers Hub. All rights reserved.
        </p>
      </div>
    </div>;
}