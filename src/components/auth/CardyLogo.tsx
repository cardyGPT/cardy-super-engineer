
import React from 'react';
import { motion } from 'framer-motion';

const CardyLogo: React.FC = () => {
  return (
    <motion.div 
      className="text-white mb-16"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 3L21.7 13.6H33L23.6 20.4L27.4 31L18 24.2L8.6 31L12.4 20.4L3 13.6H14.3L18 3Z" fill="url(#paint0_linear)" />
        <defs>
          <linearGradient id="paint0_linear" x1="3" y1="3" x2="33" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF5F6D" />
            <stop offset="1" stopColor="#FFC371" />
          </linearGradient>
        </defs>
      </svg>
      <span className="ml-2 text-xl font-bold">cardy engineer</span>
    </motion.div>
  );
};

export default CardyLogo;
