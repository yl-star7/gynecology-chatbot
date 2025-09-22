import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base maternal input styling
        "flex h-12 w-full rounded-xl border-2 border-neutral-300 bg-neutral-50 px-4 py-3 text-base",
        "placeholder:text-neutral-400 selection:bg-primary-100 selection:text-primary-800",
        "transition-all duration-200 outline-none",
        // Focus states with maternal colors
        "focus:border-primary-300 focus:ring-4 focus:ring-primary-100 focus:bg-white",
        "hover:border-primary-200 hover:bg-neutral-25",
        // File input styling
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-600",
        "file:inline-flex file:h-8 file:rounded-lg file:bg-primary-50 file:px-3 file:py-1",
        "file:hover:bg-primary-100 file:transition-colors",
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100",
        // Error states
        "aria-invalid:border-error-DEFAULT aria-invalid:ring-error-light/20 aria-invalid:focus:ring-error-light/40",
        // Dark mode support
        "dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-400",
        "dark:focus:border-primary-400 dark:focus:ring-primary-500/20",
        // Large touch targets for pregnancy-friendly usage
        "md:h-11 md:text-sm touch-target",
        className
      )}
      {...props}
    />
  )
}

export { Input }
