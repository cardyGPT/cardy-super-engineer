
import { useState } from "react";

// Toast interface
export interface Toast {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  action?: React.ReactNode;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = "default", action }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
    action?: React.ReactNode;
  }) => {
    const newToast = { 
      id: Date.now(), 
      title, 
      description, 
      variant,
      action
    };
    setToasts(prev => [...prev, newToast]);
    
    // Also log to console for debugging
    console.log(`Toast [${variant}]: ${title} - ${description}`);
  };

  const dismiss = (toastId?: number) => {
    setToasts(toasts => {
      if (toastId) {
        return toasts.filter(t => t.id !== toastId);
      }
      return [];
    });
  };

  return { 
    toast, 
    toasts,
    dismiss
  };
}

// Export a single toast function for direct use
export const toast = ({ title, description, variant = "default", action }: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  action?: React.ReactNode;
}) => {
  // This is a simplified version for direct import
  console.log(`Global Toast [${variant}]: ${title} - ${description}`);
  // Implementation will be handled by the Toaster component
};
