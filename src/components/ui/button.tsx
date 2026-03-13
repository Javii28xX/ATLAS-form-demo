import * as React from "react"
import { cn } from "@/src/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "destructive" }>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none ring-offset-white",
          {
            "bg-slate-900 text-white hover:bg-slate-800 h-10 py-2 px-4": variant === "default",
            "border border-slate-200 hover:bg-slate-100 h-10 py-2 px-4": variant === "outline",
            "hover:bg-slate-100 hover:text-slate-900 h-10 py-2 px-4": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 h-10 py-2 px-4": variant === "destructive",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
