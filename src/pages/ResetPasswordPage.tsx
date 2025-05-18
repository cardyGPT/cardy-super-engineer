
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import CardyLogo from '@/components/auth/CardyLogo';
import { motion } from 'framer-motion';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const { resetPassword, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get token from URL
  const token = searchParams.get('token') || '';
  const type = searchParams.get('type') || '';
  
  console.log("Reset password token:", token);
  console.log("Reset password type:", type);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid reset link",
        description: "The password reset link is invalid or has expired.",
        variant: "destructive",
      });
    }
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your new password",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Attempting password reset with token:", token);
      const success = await resetPassword(token, password);
      if (success) {
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now log in with your new password.",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

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
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              className="text-4xl font-bold text-white mb-4"
              variants={itemVariants}
            >
              Reset your password
            </motion.h1>
            
            <motion.p 
              className="text-gray-400 mb-6"
              variants={itemVariants}
            >
              Create a new password for your account
            </motion.p>

            <motion.form 
              onSubmit={handleSubmit}
              className="space-y-4"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm text-gray-400 mb-1">New Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white pr-10 focus:border-cardy-blue-light focus:ring-cardy-blue-light"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <label htmlFor="confirmPassword" className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white focus:border-cardy-blue-light focus:ring-cardy-blue-light"
                  placeholder="••••••••"
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  className="w-full bg-cardy-blue-light hover:bg-cardy-blue-dark text-white font-medium"
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </motion.div>
              
              <motion.div variants={itemVariants} className="text-center">
                <button 
                  type="button" 
                  className="text-sm text-gray-400 hover:text-white"
                  onClick={() => navigate('/')}
                >
                  Back to sign in
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
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
      
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-cardy-blue-light to-cardy-blue-dark p-16">
        <div className="h-full flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">Secure Your Account</h2>
          <p className="text-white text-opacity-80">
            Create a strong password that you don't use for other websites.
            For a strong password, use a mix of letters, numbers, and symbols.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
