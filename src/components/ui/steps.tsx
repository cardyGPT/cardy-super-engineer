
import * as React from "react"
import { cn } from "@/lib/utils"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  index?: number
  label?: string
  subtitle?: string
  active?: boolean
  completed?: boolean
  processing?: boolean
  className?: string
}

/* The default variant is secondary, which applies neutral colors. */
export function Steps({ children, className }: StepsProps) {
  return (
    <div
      className={cn("flex gap-2", className)}
    >
      {children}
    </div>
  )
}

export function Step({
  index,
  label,
  subtitle,
  active = false,
  completed = false,
  processing = false,
  className,
  ...props
}: StepProps) {
  // Determine color classes based on state
  const getColorClasses = () => {
    if (completed) {
      return "bg-green-500 text-white border-green-500";
    } else if (processing) {
      return "bg-blue-500 text-white border-blue-500";
    } else if (active) {
      return "bg-orange-500 text-white border-orange-500";
    } else {
      return "bg-muted text-muted-foreground border-muted-foreground/50";
    }
  };

  const colorClasses = getColorClasses();
  
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 text-center",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
            colorClasses
          )}
        >
          {completed ? "✓" : index !== undefined ? index + 1 : "•"}
        </div>
      </div>
      <div className="space-y-0.5">
        <p className={cn("text-sm font-medium leading-none", active ? "text-primary" : "")}>
          {label}
        </p>
        {subtitle && (
          <p className={cn("text-xs", active ? "text-primary" : "text-muted-foreground")}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
