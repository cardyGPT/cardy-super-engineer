
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, variant = "default" }) => {
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
    toasts, 
    Toaster 
  };
}
