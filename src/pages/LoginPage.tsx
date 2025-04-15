
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Github, Mail, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loginWithGitHub, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    
    let success;
    if (isSignUp) {
      success = await signUp(email, password, name);
    } else {
      success = await login(email, password);
    }
    
    if (success) {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate('/');
    }
  };

  const handleGitHubLogin = async () => {
    const success = await loginWithGitHub();
    if (success) {
      navigate('/');
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

  const featureVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: (i: number) => ({ 
      x: 0, 
      opacity: 1,
      transition: { 
        delay: 0.5 + (i * 0.1),
        type: "spring",
        stiffness: 100
      }
    })
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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              className="text-4xl font-bold text-white mb-4"
              variants={itemVariants}
            >
              {isSignUp ? 'Create account' : 'Sign in'}
            </motion.h1>
            
            <motion.p 
              className="text-gray-400 mb-6"
              variants={itemVariants}
            >
              {isSignUp 
                ? 'Join Cardy Engineer to enhance your development workflow'
                : "Don't have an account? "} 
              <button 
                className="text-cardy-blue-light hover:underline" 
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Sign in instead' : 'Create one'}
              </button>
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mb-4"
            >
              <Button 
                variant="outline" 
                className="w-full mb-3 bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                onClick={handleGitHubLogin}
              >
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </motion.div>

            <motion.div 
              className="flex items-center my-6"
              variants={itemVariants}
            >
              <div className="flex-1 border-t border-zinc-700"></div>
              <div className="px-4 text-sm text-zinc-500">OR</div>
              <div className="flex-1 border-t border-zinc-700"></div>
            </motion.div>

            <motion.form 
              onSubmit={handleSubmit}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {isSignUp && (
                <motion.div 
                  className="mb-4"
                  variants={itemVariants}
                >
                  <label htmlFor="name" className="block text-sm text-gray-400 mb-1">Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white focus:border-cardy-blue-light focus:ring-cardy-blue-light"
                    placeholder="Your name"
                  />
                </motion.div>
              )}
              
              <motion.div 
                className="mb-4"
                variants={itemVariants}
              >
                <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white focus:border-cardy-blue-light focus:ring-cardy-blue-light"
                  placeholder="name@example.com"
                />
              </motion.div>
              
              <motion.div 
                className="mb-6"
                variants={itemVariants}
              >
                <label htmlFor="password" className="block text-sm text-gray-400 mb-1">Password</label>
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
              
              {!isSignUp && (
                <motion.div 
                  className="flex justify-end mb-6"
                  variants={itemVariants}
                >
                  <button type="button" className="text-sm text-gray-400 hover:text-white">
                    Forgot password?
                  </button>
                </motion.div>
              )}
              
              <motion.div
                variants={itemVariants}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-cardy-blue-light hover:bg-cardy-blue-dark text-white font-medium"
                >
                  {isSignUp ? 'Create account' : 'Sign in'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
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
          Made with love in Stockholm.
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="w-full md:w-1/2 bg-gradient-to-br from-purple-900 to-black p-8 md:p-16 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="max-w-lg">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          >
            Your superhuman full stack engineer.
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-300 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          >
            You ask, Cardy Engineer builds interactive prototypes.
          </motion.p>
          
          <div className="space-y-4">
            {[
              "AI-powered code generation",
              "Knowledge base integration",
              "Jira story visualization",
              "Low-level design automation"
            ].map((feature, i) => (
              <motion.div 
                key={feature}
                className="flex items-center text-white"
                custom={i}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
              >
                <svg className="h-5 w-5 mr-3 text-cardy-green-DEFAULT" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
