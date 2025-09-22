import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28b5c] focus-visible:ring-offset-2 touch-target",
  {
    variants: {
      variant: {
        // Primary maternal variant with warm coral
        default: "bg-[#f28b5c] text-white shadow-lg hover:bg-[#e16947] hover:shadow-xl hover:scale-[1.02] active:scale-95",
        
        // Secondary maternal variant with soft lavender
        secondary: "bg-[#f3eff7] text-[#573a69] border border-[#e9dff0] shadow-lg hover:bg-[#e9dff0] hover:shadow-xl hover:scale-[1.02] active:scale-95",
        
        // Accent variant with mint green
        accent: "bg-[#6ee7b7] text-[#064e3b] shadow-lg hover:bg-[#34d399] hover:shadow-xl hover:scale-[1.02] active:scale-95",
        
        // Gentle destructive variant
        destructive: "bg-[#ef4444] text-white shadow-lg hover:bg-[#dc2626] hover:shadow-xl hover:scale-[1.02] active:scale-95",
        
        // Outline variant with maternal colors
        outline: "border-2 border-[#fbbf9a] bg-transparent text-[#e16947] hover:bg-[#fef7f0] hover:border-[#f7a072] hover:scale-[1.02] active:scale-95",
        
        // Ghost variant for subtle interactions
        ghost: "text-[#e16947] hover:bg-[#fef7f0] hover:text-[#c54d34] hover:scale-[1.02] active:scale-95",
        
        // Link variant
        link: "text-[#e16947] underline-offset-4 hover:underline hover:text-[#c54d34]",
        
        // Success variant for positive actions
        success: "bg-[#4ade80] text-white shadow-lg hover:bg-[#22c55e] hover:shadow-xl hover:scale-[1.02] active:scale-95",
        
        // Warning variant for caution
        warning: "bg-[#fb923c] text-white shadow-lg hover:bg-[#ea580c] hover:shadow-xl hover:scale-[1.02] active:scale-95",
      },
      size: {
        // Pregnancy-friendly large touch targets
        default: "h-11 px-6 py-3 has-[>svg]:px-4",
        sm: "h-9 px-4 py-2 text-sm has-[>svg]:px-3",
        lg: "h-14 px-8 py-4 text-base has-[>svg]:px-6", // Extra large for easy touching
        icon: "h-11 w-11", // Square touch target
        xl: "h-16 px-10 py-5 text-lg has-[>svg]:px-8", // Maximum comfort size
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
