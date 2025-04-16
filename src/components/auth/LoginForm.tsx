
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ChevronRight, ArrowLeft, Github, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

interface LoginFormProps {
  view: 'login' | 'signup' | 'forgot-password';
  setView: (view: 'login' | 'signup' | 'forgot-password') => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ view, setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signUp, forgotPassword, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to dashboard or the page they were trying to access
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from || { pathname: '/dashboard' };
      navigate(from.pathname, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!email) {
        toast({
          title: "Email required",
          description: "Please enter your email address",
          variant: "destructive",
        });
        return;
      }
      
      if (view === 'forgot-password') {
        await forgotPassword(email);
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
      
      if (view === 'signup') {
        if (password !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match",
            variant: "destructive",
          });
          return;
        }
        
        const success = await signUp(email, password, name);
        if (success) {
          const from = (location.state as { from?: Location })?.from || { pathname: '/dashboard' };
          navigate(from.pathname, { replace: true });
        }
      } else {
        const success = await login(email, password);
        if (success) {
          const from = (location.state as { from?: Location })?.from || { pathname: '/dashboard' };
          navigate(from.pathname, { replace: true });
        }
      }
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {view === 'forgot-password' ? (
        <motion.div variants={itemVariants}>
          <div className="mb-4">
            <button 
              className="flex items-center text-gray-400 hover:text-white transition-colors" 
              onClick={() => setView('login')}
              type="button"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </button>
          </div>
          <motion.h1 
            className="text-4xl font-bold text-white mb-4"
            variants={itemVariants}
          >
            Reset password
          </motion.h1>
          <motion.p 
            className="text-gray-400 mb-6"
            variants={itemVariants}
          >
            Enter your email address and we'll send you instructions to reset your password.
          </motion.p>
        </motion.div>
      ) : (
        <>
          <motion.h1 
            className="text-4xl font-bold text-white mb-4"
            variants={itemVariants}
          >
            {view === 'signup' ? 'Create account' : 'Sign in'}
          </motion.h1>
          
          <motion.p 
            className="text-gray-400 mb-6"
            variants={itemVariants}
          >
            {view === 'signup' 
              ? 'Join Cardy Engineer to enhance your development workflow'
              : "Don't have an account? "} 
            <button 
              className="text-cardy-blue-light hover:underline" 
              onClick={() => setView(view === 'signup' ? 'login' : 'signup')}
              type="button"
            >
              {view === 'signup' ? 'Sign in instead' : 'Create one'}
            </button>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-4"
          >
            <SocialLoginButtons />
          </motion.div>

          <motion.div 
            className="flex items-center my-6"
            variants={itemVariants}
          >
            <div className="flex-1 border-t border-zinc-700"></div>
            <div className="px-4 text-sm text-zinc-500">OR</div>
            <div className="flex-1 border-t border-zinc-700"></div>
          </motion.div>
        </>
      )}

      <motion.form 
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {view === 'signup' && (
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
        
        {view !== 'forgot-password' && (
          <motion.div 
            className="mb-4"
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
        )}
        
        {view === 'signup' && (
          <motion.div 
            className="mb-6"
            variants={itemVariants}
          >
            <label htmlFor="confirmPassword" className="block text-sm text-gray-400 mb-1">Confirm Password</label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white pr-10 focus:border-cardy-blue-light focus:ring-cardy-blue-light"
                placeholder="••••••••"
              />
            </div>
          </motion.div>
        )}
        
        {view === 'login' && (
          <motion.div 
            className="flex justify-end mb-6"
            variants={itemVariants}
          >
            <button 
              type="button" 
              className="text-sm text-gray-400 hover:text-white"
              onClick={() => setView('forgot-password')}
            >
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                {view === 'signup' 
                  ? 'Create account' 
                  : view === 'forgot-password'
                    ? 'Send reset instructions'
                    : 'Sign in'
                }
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

const SocialLoginButtons: React.FC = () => {
  const { loginWithGoogle, loginWithGitHub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    await loginWithGoogle();
    setIsLoading(null);
  };

  const handleGitHubLogin = async () => {
    setIsLoading('github');
    await loginWithGitHub();
    setIsLoading(null);
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full mb-3 bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
        onClick={handleGitHubLogin}
        disabled={isLoading !== null}
      >
        {isLoading === 'github' ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          <>
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
          </>
        )}
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
        onClick={handleGoogleLogin}
        disabled={isLoading !== null}
      >
        {isLoading === 'google' ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </>
        )}
      </Button>
    </>
  );
};

export default LoginForm;
