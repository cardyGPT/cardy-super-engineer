
import * as React from "react"
import { cn } from "@/lib/utils"

const Steps = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex w-full flex-row gap-2", className)}
    {...props}
  />
))
Steps.displayName = "Steps"

const Step = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    completed?: boolean
    processing?: boolean
    label?: string
    subtitle?: string
    index?: number
  }
>(({ className, active, completed, processing, label, subtitle, index, ...props }, ref) => {
  // Determine what color to apply based on state
  const getStateClasses = () => {
    if (completed) return "border-green-500 bg-green-500 text-white";
    if (processing) return "border-blue-500 bg-blue-500 text-white animate-pulse";
    if (active) return "border-orange-500 bg-orange-500 text-white";
    return "border-muted-foreground/20 text-muted-foreground";
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={ref}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-center",
          getStateClasses(),
          className
        )}
        {...props}
      >
        {index !== undefined ? index + 1 : null}
      </div>
      {label && (
        <div className="mt-2 text-center">
          <div className={cn(
            "text-sm font-medium", 
            active && !completed && !processing && "text-orange-600 font-bold",
            completed && "text-green-600 font-bold",
            processing && "text-blue-600 font-bold",
          )}>
            {label}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
})
Step.displayName = "Step"

export { Steps, Step }
