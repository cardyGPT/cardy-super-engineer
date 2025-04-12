
import { useState } from "react";

// Toast interface
interface Toast {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = "default" }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    const newToast = { 
      id: Date.now(), 
      title, 
      description, 
      variant 
    };
    setToasts(prev => [...prev, newToast]);
  };

  return { 
    toast, 
    toasts
  };
}

// Export a single toast function for direct use
export const toast = ({ title, description, variant = "default" }: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) => {
  // This is a simplified version for direct import
  // The actual toast state is managed by the useToast hook
  console.log("Toast:", { title, description, variant });
  // Implementation will be handled by the Toaster component
};
