
import { useState } from "react";

// Toast interface
export interface Toast {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = "default", action }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
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
  };

  return { 
    toast, 
    toasts
  };
}

// Export a single toast function for direct use
export const toast = ({ title, description, variant = "default", action }: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}) => {
  // This is a simplified version for direct import
  // The actual toast state is managed by the useToast hook
  console.log("Toast:", { title, description, variant, action });
  // Implementation will be handled by the Toaster component
};
