import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

export const SkeletonCard = ({ lines = 3, height = 'h-32' }) => (
  <div className={`glass-panel p-5 ${height} overflow-hidden relative`}>
    <div className="space-y-3">
      <motion.div
        className="h-4 rounded-full w-3/4"
        style={{
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
          backgroundSize: '400% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-3 rounded-full ${i % 2 === 0 ? 'w-full' : 'w-5/6'}`}
          style={{
            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
            backgroundSize: '400% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="glass-panel p-5">
    <motion.div className="h-3 rounded-full w-1/2 mb-4"
      style={{ background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '400% 100%' }}
      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
    <motion.div className="h-8 rounded-full w-1/3"
      style={{ background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '400% 100%' }}
      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.1 }}
    />
  </div>
);

export default SkeletonCard;
