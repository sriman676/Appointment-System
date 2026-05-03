import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock, CalendarDays, 
  ExternalLink, MessageSquare, AlertCircle, Trash2, 
  PlusCircle, XCircle, Save, Ban
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/SkeletonCard';
import { format } from 'date-fns';

const CounselorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [blockForm, setBlockForm] = useState({ date: '', reason: '' });

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

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleNotesSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/appointments/${selectedApp._id}`, { notes });
      toast.success('Session notes saved');
      setShowNotesModal(false);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to save notes');
    }
  };

  const handleBlockDay = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments/block-day', blockForm);
      toast.success('Day blocked successfully');
      setShowBlockModal(false);
      setBlockForm({ date: '', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block day');
    }
  };

  const upcoming = appointments.filter(a => ['Scheduled', 'Rescheduled'].includes(a.status));
  const completed = appointments.filter(a => a.status === 'Completed');

  return (
    <div className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Counselor Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your sessions and availability</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBlockModal(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all">
            <Ban size={18} /> Block a Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Sessions Panel */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Upcoming Sessions
              </h2>
              <div className="relative group max-w-xs w-full">
                 <input 
                   type="text" 
                   placeholder="Search student name..." 
                   className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 ring-blue-500/20 transition-all font-medium"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Clock size={16} />
                 </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">{[0,1,2].map(i => <SkeletonCard key={i} lines={4} />)}</div>
            ) : upcoming.filter(a => a.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <div className="glass-panel p-12 text-center">
                <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No sessions found {searchTerm ? `matching "${searchTerm}"` : 'yet'}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming
                  .filter(a => a.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(app => (
                  <motion.div key={app._id} 
                    className="glass-panel p-5 border-t-4 border-t-blue-500 hover:shadow-xl transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">{app.studentId?.name}</h4>
                        <p className="text-xs text-slate-500">{app.requestId?.subject}</p>
                      </div>
                      <span className="text-[10px] uppercase font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{app.status}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-lg mb-4">
                       <span className="flex items-center gap-1"><CalendarDays size={14} className="text-blue-500" /> {format(new Date(app.date), 'MMM d')}</span>
                       <span className="flex items-center gap-1"><Clock size={14} className="text-blue-500" /> {app.startTime}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {app.googleMeetLink && (
                        <a href={app.googleMeetLink} target="_blank" rel="noreferrer" 
                          className="py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-700">
                          <ExternalLink size={12} /> Meet Link
                        </a>
                      )}
                      <button onClick={() => { setSelectedApp(app); setNotes(app.notes || ''); setShowNotesModal(true); }}
                        className="py-2 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-slate-200">
                        <MessageSquare size={12} /> Notes
                      </button>
                      <button onClick={() => updateStatus(app._id, 'Completed')}
                        className="col-span-2 py-2 bg-green-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-green-600">
                        <CheckCircle2 size={12} /> Mark Completed
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent & Completed Panel */}
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" /> Completed Sessions
            </h3>
            <div className="space-y-3">
              {completed.slice(0, 5).map(app => (
                <div key={app._id} className="glass-panel p-4 flex items-center justify-between group">
                  <div>
                    <h5 className="text-[13px] font-bold text-slate-800">{app.studentId?.name}</h5>
                    <p className="text-[10px] text-slate-500">{format(new Date(app.date), 'MMM d, yyyy')}</p>
                  </div>
                  <button onClick={() => { setSelectedApp(app); setNotes(app.notes || ''); setShowNotesModal(true); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <MessageSquare size={16} />
                  </button>
                </div>
              ))}
              {completed.length === 0 && <p className="text-center text-slate-400 text-xs py-10">No sessions completed yet</p>}
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNotesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotesModal(false)}>
            <motion.div initial={{scale:0.9, opacity: 0}} animate={{scale:1, opacity: 1}} exit={{scale:0.9, opacity: 0}}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Session Notes</h3>
                  <p className="text-xs text-slate-500">Private notes for: {selectedApp?.studentId?.name}</p>
                </div>
                <button onClick={() => setShowNotesModal(false)}><XCircle size={20} className="text-slate-300" /></button>
              </div>
              <form onSubmit={handleNotesSubmit} className="space-y-4">
                <textarea rows={8} value={notes} onChange={e => setNotes(e.target.value)} 
                  placeholder="Summarize the session, key takeaways, and next steps..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 text-sm resize-none" />
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                  <Save size={18} /> Save Session Notes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowBlockModal(false)}>
            <motion.div initial={{scale:0.9, opacity: 0}} animate={{scale:1, opacity: 1}} exit={{scale:0.9, opacity: 0}}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Block a Day</h3>
                <button onClick={() => setShowBlockModal(false)}><XCircle size={20} className="text-slate-300" /></button>
              </div>
              <form onSubmit={handleBlockDay} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium mb-1">Date</label>
                   <input required type="date" value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})} 
                     className="w-full border rounded-xl px-4 py-2" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Reason (Internal)</label>
                   <input required value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})} 
                     placeholder="Sick leave, Workshop, etc." className="w-full border rounded-xl px-4 py-2" />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowBlockModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-black">Block Day</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CounselorDashboard;
