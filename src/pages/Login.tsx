import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectFrom =
    (location.state as { from?: string } | null)?.from || null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email, password);
        if (redirectFrom) {
          navigate(redirectFrom, { replace: true });
        } else {
          navigate(user.role === 'admin' ? '/admin' : '/dashboard', {
            replace: true,
          });
        }
      } else {
        const result = await register({ name, email, phone, address, password });
        if (result.requiresEmailConfirmation || !result.user) {
          setNotice(
            'Account created! Please check your email to confirm your address before signing in.'
          );
          setMode('login');
          return;
        }
        if (redirectFrom) {
          navigate(redirectFrom, { replace: true });
        } else {
          navigate(result.user.role === 'admin' ? '/admin' : '/dashboard', {
            replace: true,
          });
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Authentication failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'member' | 'admin') => {
    setMode('login');
    setError('');
    if (role === 'admin') {
      setEmail('admin@verdantbowl.in');
      setPassword('Admin@123');
    } else {
      setEmail('member@verdantbowl.in');
      setPassword('Member@123');
    }
  };

  return (
    <div className="max-w-[460px] mx-auto px-4 sm:px-6 py-14">
      <div className="bg-white border border-[#DCE3D8] rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-1 p-1 bg-[#EEF2EC] rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#16221A] shadow-sm'
                : 'text-[#4D5E53] hover:text-[#16221A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#16221A] shadow-sm'
                : 'text-[#4D5E53] hover:text-[#16221A]'
            }`}
          >
            Create Account
          </button>
        </div>

        <h1 className="font-display text-2xl font-semibold text-[#16221A]">
          {mode === 'login' ? 'Welcome back' : 'Join Verdant Bowl'}
        </h1>
        <p className="text-sm text-[#4D5E53] mt-1">
          {mode === 'login'
            ? 'Access your daily meal deliveries, custom bowls, or admin console.'
            : 'Create a member account to place orders and subscribe to daily salads.'}
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0] text-xs text-[#15803D]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Nair"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 44556"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4D5E53] mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="42 Palm Grove, Koramangala, Bengaluru"
                  className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4D5E53] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg text-sm text-[#16221A] focus:outline-none focus:border-[#1B5E37]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#1B5E37] text-white text-sm font-medium rounded-lg hover:bg-[#154A2B] transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Member Account'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-6 pt-5 border-t border-[#EEF2EC]">
          <p className="text-xs font-medium text-[#4D5E53] mb-2.5">
            Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('member')}
              className="py-2 px-3 text-xs font-medium text-[#16221A] bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg hover:bg-[#EEF2EC] cursor-pointer"
            >
              Fill Member Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-2 px-3 text-xs font-medium text-[#16221A] bg-[#F7F8F5] border border-[#DCE3D8] rounded-lg hover:bg-[#EEF2EC] cursor-pointer"
            >
              Fill Admin Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
