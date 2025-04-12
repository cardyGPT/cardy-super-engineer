
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
      case "warning":
        return <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />;
      case "info":
        return <InfoIcon className="h-4 w-4 mr-2 text-blue-500" />;
      default:
        return <InfoIcon className="h-4 w-4 mr-2 text-blue-500" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Map non-standard variants to standard ones
        let mappedVariant = variant;
        if (variant === "warning" || variant === "info") {
          mappedVariant = "default";
        }

        return (
          <Toast key={id} variant={mappedVariant} {...props}>
            <div className="grid gap-1">
              {title && (
                <ToastTitle className="flex items-center">
                  {getIconForVariant(variant || "default")}
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription>{description}</ToastDescription>
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
