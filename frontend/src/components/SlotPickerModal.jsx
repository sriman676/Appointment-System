import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SlotPickerModal = ({ request, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const hostId = request.counselorId?._id || request.counselorId || request.staffId?._id || request.staffId;

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/slots?hostId=${hostId}&date=${selectedDate}`);
      setSlots(res.data.slots || []);
    } catch (err) {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await api.post('/appointments', {
        requestId: request._id,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end
      });
      toast.success('Appointment Scheduled!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Finalize Schedule</h3>
            <p className="text-xs text-slate-500 mt-1">Pick a time slot for: {request.subject}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XCircle size={22} className="text-slate-300" /></button>
        </div>

        <div className="space-y-6">
          {/* Date Selector */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Date</label>
               <div className="flex gap-1">
                 <button onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), -1), 'yyyy-MM-dd'))} className="p-1 px-2 border rounded-lg hover:bg-slate-50 transition-colors"><ChevronLeft size={16} /></button>
                 <button onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))} className="p-1 px-2 border rounded-lg hover:bg-slate-50 transition-colors"><ChevronRight size={16} /></button>
               </div>
            </div>
            <input 
              type="date" 
              min={format(new Date(), 'yyyy-MM-dd')}
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-medium"
            />
          </div>

          {/* Slots Grid */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Available Times</label>
            {loading ? (
              <div className="grid grid-cols-3 gap-2 animate-pulse">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>)}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">No slots available for this day</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot, i) => (
                  <button 
                  key={i} 
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    !slot.available ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' :
                    selectedSlot?.start === slot.start ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-200' :
                    'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
               onClick={handleBook}
               disabled={!selectedSlot || booking}
               className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                 !selectedSlot ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20'
               }`}
            >
              {booking ? 'Scheduling...' : 'Confirm Appointment'}
              {!booking && <CheckCircle2 size={18} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SlotPickerModal;
