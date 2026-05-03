import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, X, Send } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FeedbackModal = ({ appointment, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/feedback/${appointment._id}`, { rating, comment });
      toast.success('Feedback submitted! Thank you.');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Aesthetic background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 -z-10 opacity-60"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Session Feedback</h2>
          <p className="text-sm text-slate-500 mt-1">How was your experience with <br/><span className="font-bold text-slate-800">{appointment?.hostId?.name}</span>?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                <Star size={36} 
                  fill={(hover || rating) >= star ? '#f59e0b' : 'none'} 
                  stroke={(hover || rating) >= star ? '#f59e0b' : '#cbd5e1'} 
                  className="transition-colors"
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Comments (Optional)</label>
            <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="What went well? Any areas of improvement?"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm resize-none h-32 placeholder:text-slate-300" 
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
              <Send size={18} />
              {isSubmitting ? 'Sending...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;
