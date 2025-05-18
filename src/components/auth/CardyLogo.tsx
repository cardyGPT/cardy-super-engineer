
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
      <div className="flex items-center">
        <img src="/lovable-uploads/9dc34b8b-96f1-4765-947e-ace7a4bd8a76.png" alt="Cardy Logo" className="h-12 w-12 mr-2" />
        <span className="ml-2 text-xl font-bold">Cardy Super Engineer</span>
      </div>
    </motion.div>
  );
};

export default CardyLogo;
