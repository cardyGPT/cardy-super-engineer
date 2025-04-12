
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle, AlertCircle, InfoIcon } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getIconForVariant = (variant: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
      case "destructive":
        return <AlertCircle className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <InfoIcon className="h-4 w-4 mr-2 text-blue-500" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && (
                <ToastTitle className={`flex items-center ${variant === 'success' ? 'font-bold text-green-700' : ''}`}>
                  {getIconForVariant(variant || "default")}
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className={variant === 'success' ? 'text-green-600 font-medium' : ''}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
