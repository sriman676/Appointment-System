import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, CheckCircle2, XCircle, Users
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonStat } from '../components/SkeletonCard';
import { format } from 'date-fns';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const StaffDashboard = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 60000); // 1 minute polling
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.appointments || res.data || []);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(a => new Date(a.date) >= new Date()).length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    cancelled: appointments.filter(a => a.status === 'Cancelled').length,
  };

  return (
    <div className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-gradient">Staff Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, <span className="font-semibold text-slate-700">{user?.name}</span></p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? [0,1,2,3].map(i => <SkeletonStat key={i} />) : (
            <>
              {[
                { label: 'Total Appts.', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50', Icon: Users },
                { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-600', bg: 'bg-blue-50', Icon: Calendar },
                { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50', Icon: CheckCircle2 },
                { label: 'Cancelled', value: stats.cancelled, color: 'text-red-500', bg: 'bg-red-50', Icon: XCircle },
              ].map((s) => (
                <motion.div key={s.label} whileHover={{ y: -4 }} className="glass-panel p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                    <s.Icon size={20} className={s.color} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>

        {/* Appointments List */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            My Schedule
          </h2>

          {loading ? (
            <div className="space-y-4">{[0,1,2].map(i => <SkeletonCard key={i} lines={4} />)}</div>
          ) : appointments.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No appointments scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <motion.div
                  key={appt._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{appt.requestId?.subject || 'Session'}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar size={13} />
                        {format(new Date(appt.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock size={13} />
                        {appt.startTime} – {appt.endTime}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Student: {appt.studentId?.name || 'Unknown'}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border self-start sm:self-auto ${
                    appt.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                    appt.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {appt.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StaffDashboard;
