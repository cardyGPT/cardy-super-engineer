
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
  // Determine status classes based on state
  const getStatusClasses = () => {
    if (completed) {
      return "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]";
    } else if (processing) {
      return "bg-blue-50 text-blue-700 border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)] animate-pulse";
    } else if (active) {
      return "bg-amber-50 text-amber-700 border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.1)]";
    } else {
      return "bg-gray-100 text-gray-500 border-gray-300";
    }
  };

  // Determine icon classes based on state
  const getIconClasses = () => {
    if (completed) {
      return "bg-emerald-500 text-white";
    } else if (processing) {
      return "bg-blue-500 text-white";
    } else if (active) {
      return "bg-amber-500 text-white";
    } else {
      return "bg-gray-200 text-gray-500";
    }
  };
  
  const statusClasses = getStatusClasses();
  const iconClasses = getIconClasses();
  
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
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200",
            statusClasses
          )}
        >
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all", 
            iconClasses
          )}>
            {completed ? "✓" : index !== undefined ? index + 1 : "•"}
          </span>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className={cn(
          "text-sm font-medium leading-none",
          completed ? "text-emerald-700" : 
          processing ? "text-blue-700" : 
          active ? "text-amber-700" : 
          "text-gray-500"
        )}>
          {label}
        </p>
        {subtitle && (
          <p className={cn(
            "text-xs",
            completed ? "text-emerald-600" : 
            processing ? "text-blue-600" : 
            active ? "text-amber-600" : 
            "text-gray-400"
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
