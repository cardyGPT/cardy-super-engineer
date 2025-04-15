
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import LoginForm from '@/components/auth/LoginForm';
import FeaturesSection from '@/components/auth/FeaturesSection';
import CardyLogo from '@/components/auth/CardyLogo';

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <motion.div 
        className="w-full md:w-1/2 bg-black p-8 md:p-16 flex flex-col justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <CardyLogo />
          <LoginForm view={view} setView={setView} />
        </div>
        
        <motion.div 
          className="text-xs text-gray-500 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Made by Cardyai.com
        </motion.div>
      </motion.div>
      
      <FeaturesSection />
    </div>
  );
}
