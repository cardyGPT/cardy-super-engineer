
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

export function Steps({ children, className }: StepsProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-2", className)}
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
  // Determine status classes based on state - Enhanced visuals
  const getStatusClasses = () => {
    if (completed) {
      return "bg-green-50 text-green-700 border-green-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]";
    } else if (processing) {
      return "bg-blue-50 text-blue-700 border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)] animate-pulse";
    } else if (active) {
      return "bg-amber-50 text-amber-700 border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.12)]";
    } else {
      return "bg-gray-100 text-gray-500 border-gray-300";
    }
  };

  // Determine icon classes based on state - Enhanced visuals
  const getIconClasses = () => {
    if (completed) {
      return "bg-green-500 text-white";
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
        "flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all duration-300 hover:opacity-90 min-w-[100px] select-none",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300",
            statusClasses
          )}
        >
          <span className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all", 
            iconClasses
          )}>
            {completed ? "✓" : index !== undefined ? index + 1 : "•"}
          </span>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className={cn(
          "text-sm font-medium leading-none",
          completed ? "text-green-700" : 
          processing ? "text-blue-700" : 
          active ? "text-amber-700" : 
          "text-gray-500"
        )}>
          {label}
        </p>
        {subtitle && (
          <p className={cn(
            "text-xs",
            completed ? "text-green-600" : 
            processing ? "text-blue-600" : 
            active ? "text-amber-600" : 
            "text-gray-400"
          )}>
            {subtitle}
          </p>
        )}
      </div>
      {/* Add connecting line between steps */}
      {index !== undefined && index > 0 && (
        <div className={cn(
          "absolute left-[-50%] top-6 h-0.5 w-[100%] -z-10",
          completed ? "bg-green-300" : "bg-gray-200"
        )} />
      )}
    </div>
  )
}
