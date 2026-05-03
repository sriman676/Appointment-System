import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, ClipboardList, CheckCircle2, Clock, PlusCircle,
  AlertCircle, XCircle, MessageSquare, ExternalLink, Star
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonStat } from '../components/SkeletonCard';
import { format } from 'date-fns';
import FeedbackModal from '../components/FeedbackModal';
import SlotPickerModal from '../components/SlotPickerModal';
import { downloadICS } from '../utils/icsGenerator';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending:   'bg-amber-100 text-amber-700 border-amber-200',
    Accepted:  'bg-blue-100 text-blue-700 border-blue-200',
    Completed: 'bg-green-100 text-green-700 border-green-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
    Scheduled: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Rescheduled: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ subject: '', description: '', categoryId: '', meetingMode: 'Online', preferredDate: '' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, appRes, catRes] = await Promise.all([
        api.get('/requests'),
        api.get('/appointments'),
        api.get('/admin/categories'),
      ]);
      setRequests(reqRes.data.requests || reqRes.data || []);
      setAppointments(appRes.data.appointments || appRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', form);
      toast.success('Request submitted!');
      setShowModal(false);
      setForm({ subject: '', description: '', categoryId: '', meetingMode: 'Online', preferredDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  const activeApps = appointments.filter(a => ['Scheduled', 'Rescheduled'].includes(a.status));
  const completedApps = appointments.filter(a => a.status === 'Completed');

  return (
    <div className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Requests & Stats */}
        <div className="flex-1 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Student Portal</h1>
              <p className="text-slate-500 mt-1">Manage your counselling journey</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
              <PlusCircle size={20} /> New Request
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border-l-4 border-blue-500">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Requests</p>
              <p className="text-2xl font-bold text-slate-800">{requests.length}</p>
            </div>
            <div className="glass-panel p-5 border-l-4 border-amber-500">
              <p className="text-[10px] uppercase font-bold text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-800">{requests.filter(r => r.status === 'Pending').length}</p>
            </div>
            <div className="glass-panel p-5 border-l-4 border-indigo-500">
              <p className="text-[10px] uppercase font-bold text-slate-400">Scheduled</p>
              <p className="text-2xl font-bold text-slate-800">{activeApps.length}</p>
            </div>
            <div className="glass-panel p-5 border-l-4 border-green-500">
              <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-slate-800">{completedApps.length}</p>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList size={20} className="text-blue-600" /> Requests
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                {['All', 'Pending', 'Accepted'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${filter === f ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {loading ? <SkeletonCard lines={3} /> : requests.filter(r => filter === 'All' || r.status === filter).length === 0 ? (
                <div className="p-8 text-center glass-panel text-slate-400 text-sm">No {filter !== 'All' ? filter.toLowerCase() : ''} requests found</div>
              ) : (
                requests.filter(r => filter === 'All' || r.status === filter).slice(0, 8).map(req => {
                  // Check if this accepted request already has an appointment
                  const hasApp = appointments.some(a => a.requestId?._id === req._id || a.requestId === req._id);
                  return (
                    <div key={req._id} className="glass-panel p-4 flex items-center justify-between group hover:border-blue-200 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={req.status} />
                          <span className="font-bold text-slate-800">{req.subject}</span>
                        </div>
                        <p className="text-xs text-slate-500">{req.meetingMode} · {format(new Date(req.createdAt), 'MMM d, h:mm a')}</p>
                      </div>
                      
                      {req.status === 'Accepted' && !hasApp ? (
                        <button 
                          onClick={() => { setSelectedRequest(req); setShowSlotPicker(true); }}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                        >
                          <CalendarDays size={12} /> Schedule
                        </button>
                      ) : (
                        <CheckCircle2 size={18} className={hasApp ? 'text-green-500' : 'text-slate-200'} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Appointments & Feedback */}
        <div className="w-full md:w-80 lg:w-96 space-y-8">
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarDays size={20} className="text-indigo-600" /> Upcoming Sessions
            </h3>
            {activeApps.length === 0 ? (
              <div className="p-6 glass-panel text-center text-slate-400 text-sm">No scheduled sessions</div>
            ) : (
              <div className="space-y-4">
                {activeApps.map(app => (
                  <div key={app._id} className="glass-panel p-5 bg-gradient-to-br from-white to-indigo-50/30 border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">Confirmed Session</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">{app.requestId?.subject}</h4>
                    <p className="text-xs text-slate-500 mb-4">{app.hostId?.name} ({app.hostId?.role})</p>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-white/60 p-2 rounded-lg mb-4">
                       <span className="flex items-center gap-1"><CalendarDays size={14} className="text-blue-500" /> {format(new Date(app.date), 'EEE, MMM d')}</span>
                       <span className="flex items-center gap-1"><Clock size={14} className="text-blue-500" /> {app.startTime}</span>
                    </div>

                    <div className="flex gap-2">
                      {app.googleMeetLink && (
                        <a href={app.googleMeetLink} target="_blank" rel="noreferrer" 
                          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20">
                          <ExternalLink size={14} /> Join Meeting
                        </a>
                      )}
                      <button 
                        onClick={() => downloadICS(app.requestId?.subject, `Meeting with ${app.hostId?.name}`, app.date, app.startTime)}
                        className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                        <CalendarDays size={14} /> Add to Cal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star size={18} className="text-amber-500" /> Pending Feedback
            </h3>
            <div className="space-y-3">
              {completedApps.map(app => (
                <div key={app._id} className="glass-panel p-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{app.hostId?.name}</h5>
                    <p className="text-[10px] text-slate-500">{format(new Date(app.date), 'MMM d')}</p>
                  </div>
                  <button onClick={() => setSelectedAppointment(app)}
                    className="text-[10px] font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2">
                    <MessageSquare size={12} /> Rate Now
                  </button>
                </div>
              ))}
              {completedApps.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No pending feedback</p>}
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">Request Counselling</h3>
                 <button onClick={() => setShowModal(false)}><XCircle size={20} className="text-slate-300" /></button>
               </div>
               <form onSubmit={handleCreate} className="space-y-4">
                 <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Subject - What can we help with?" className="w-full border rounded-xl px-4 py-2" />
                 <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full border rounded-xl px-4 py-2 bg-white">
                   <option value="">Select Category</option>
                   {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                 </select>
                 <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your needs..." className="w-full border rounded-xl px-4 py-2 resize-none" />
                 <div className="grid grid-cols-2 gap-4">
                    <select value={form.meetingMode} onChange={e => setForm({...form, meetingMode: e.target.value})} className="border rounded-xl px-4 py-2 bg-white">
                      <option>Online</option><option>In-Person</option>
                    </select>
                    <input type="date" value={form.preferredDate} onChange={e => setForm({...form, preferredDate: e.target.value})} className="border rounded-xl px-4 py-2" />
                 </div>
                 <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4">Submit Request</button>
               </form>
            </motion.div>
          </div>
        )}

        {selectedAppointment && (
          <FeedbackModal 
            appointment={selectedAppointment} 
            onClose={() => setSelectedAppointment(null)} 
            onSuccess={() => { setSelectedAppointment(null); fetchData(); }} 
          />
        )}

        {showSlotPicker && (
          <SlotPickerModal 
            request={selectedRequest}
            onClose={() => setShowSlotPicker(false)}
            onSuccess={() => { setShowSlotPicker(false); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
