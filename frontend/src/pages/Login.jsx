import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, verifyOTP, resendOTP, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Signed in with Google!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Sign-In failed');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Check if backend specifically threw a 403 requiring OTP
      if (err.response?.status === 403 && err.response?.data?.requiresOTP) {
        toast('Your email is unverified. Please enter OTP.', { icon: '⚠️' });
        setOtpMode(true);
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await verifyOTP(email, otp);
      toast.success('Email Verified! Welcome.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(email);
      toast.success('A new OTP has been mailed to you.');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel p-8 relative overflow-hidden"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gradient">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to your Dashboard</p>
        </div>

        <AnimatePresence mode="wait">
          {!otpMode ? (
            <motion.form 
              key="login-form"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="space-y-6" 
              onSubmit={handleLoginSubmit}
            >
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50" 
                    placeholder="University Email" />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50" 
                    placeholder="Password" />
                </div>
                <div className="flex justify-end pr-2">
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button disabled={isSubmitting} type="submit" 
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30">
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
                <LogIn size={18} />
              </button>
              
              <p className="text-center text-sm text-slate-600 mt-4">
                New User? <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500">Register Here</Link>
              </p>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Or continue with</span></div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess} 
                  onError={() => toast.error('Google Sign-In failed')}
                  useOneTap
                  shape="pill"
                  theme="outline"
                />
              </div>
            </motion.form>

          ) : (

            <motion.form 
              key="otp-form"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="space-y-6 text-center" 
              onSubmit={handleVerifySubmit}
            >
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <KeyRound className="text-blue-600" size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800">Account Unverified</h3>
              <p className="text-sm text-slate-500">Please enter the security code sent to <br/><span className="font-semibold text-slate-800">{email}</span></p>

              <div className="mt-8">
                <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                  className="w-full text-center text-3xl tracking-[0.5em] py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 font-mono" 
                  placeholder="------" />
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button disabled={isSubmitting || otp.length !== 6} type="submit" 
                  className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-300 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30">
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </button>
                <button type="button" onClick={handleResend} className="text-sm text-blue-600 hover:text-blue-800 font-medium pb-2 outline-none">
                  Didn't receive it? Resend OTP
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
