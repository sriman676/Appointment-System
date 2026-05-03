import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Lock, Save, Camera, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setIsSubmitting(true);
    try {
      await updateProfile({ name: formData.name, password: formData.password || undefined });
      toast.success('Profile updated successfully');
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="glass-panel overflow-hidden">
          {/* Header/Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-2xl shadow-xl">
              <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center relative group">
                <User size={48} className="text-slate-300" />
                <button className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-16 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">{user?.name}</h1>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <Shield size={14} className="text-blue-500" /> {user?.role}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address (Locked)</label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input readOnly value={user?.email} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-not-allowed" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-600" /> Change Password
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">New Password</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Confirm New Password</label>
                      <input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button disabled={isSubmitting} type="submit" 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50">
                  <Save size={18} />
                  {isSubmitting ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 p-6 glass-panel border-l-4 border-l-amber-500">
          <h4 className="text-amber-800 font-bold mb-1">Security Notice</h4>
          <p className="text-sm text-amber-700">Changing your name or password will update your credentials for all future logins. Email changes are restricted and require administrative approval.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
