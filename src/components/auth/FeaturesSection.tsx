import React from 'react';
import { motion } from 'framer-motion';
const FeaturesSection: React.FC = () => {
  const featureVariants = {
    hidden: {
      x: 50,
      opacity: 0
    },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        type: "spring",
        stiffness: 100
      }
    })
  };
  return <motion.div className="w-full md:w-1/2 bg-gradient-to-br from-purple-900 to-black p-8 md:p-16 flex items-center justify-center" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.5,
    delay: 0.3
  }}>
      <div className="max-w-lg">
        <motion.h2 className="text-3xl md:text-4xl font-bold text-white mb-6" initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.4,
        type: "spring",
        stiffness: 100
      }}>Cardy Super Engineer</motion.h2>
        
        <motion.p className="text-xl text-gray-300 mb-8" initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.5,
        type: "spring",
        stiffness: 100
      }}>Cardy Super Engineer builds interactive prototypes.</motion.p>
        
        <div className="space-y-4">
          {["AI-powered code generation", "Knowledge base integration", "Jira story visualization", "Low-level design automation"].map((feature, i) => <motion.div key={feature} className="flex items-center text-white" custom={i} variants={featureVariants} initial="hidden" animate="visible">
              <svg className="h-5 w-5 mr-3 text-cardy-green-DEFAULT" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{feature}</span>
            </motion.div>)}
        </div>
      </div>
    </motion.div>;
};
export default FeaturesSection;