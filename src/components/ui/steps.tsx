
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
    label?: string
    subtitle?: string
    index?: number
  }
>(({ className, active, completed, label, subtitle, index, ...props }, ref) => (
  <div className="flex flex-col items-center">
    <div
      ref={ref}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-center",
        active && "border-primary bg-primary text-primary-foreground",
        completed && "border-primary bg-primary/20 text-primary",
        !active && !completed && "border-muted-foreground/20 text-muted-foreground",
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
          active && "text-primary",
          completed && "text-primary/80",
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
))
Step.displayName = "Step"

export { Steps, Step }
