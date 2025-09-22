import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden border",
  {
    variants: {
      variant: {
        // Primary badge with maternal coral
        default: "border-primary-200 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 [a&]:hover:from-primary-200 [a&]:hover:to-primary-100 [a&]:hover:scale-105",
        
        // Secondary badge with soft lavender
        secondary: "border-secondary-200 bg-gradient-to-r from-secondary-100 to-secondary-50 text-secondary-700 [a&]:hover:from-secondary-200 [a&]:hover:to-secondary-100 [a&]:hover:scale-105",
        
        // Accent badge with mint green
        accent: "border-accent-DEFAULT/30 bg-gradient-to-r from-accent-light to-accent-light/50 text-accent-foreground [a&]:hover:from-accent-DEFAULT [a&]:hover:to-accent-light [a&]:hover:scale-105",
        
        // Success badge for positive status
        success: "border-success-DEFAULT/30 bg-gradient-to-r from-success-light to-success-light/50 text-success-foreground [a&]:hover:from-success-DEFAULT [a&]:hover:to-success-light [a&]:hover:scale-105",
        
        // Warning badge for attention
        warning: "border-warning-DEFAULT/30 bg-gradient-to-r from-warning-light to-warning-light/50 text-warning-foreground [a&]:hover:from-warning-DEFAULT [a&]:hover:to-warning-light [a&]:hover:scale-105",
        
        // Error badge for issues
        destructive: "border-error-DEFAULT/30 bg-gradient-to-r from-error-light to-error-light/50 text-error-foreground [a&]:hover:from-error-DEFAULT [a&]:hover:to-error-light [a&]:hover:scale-105",
        
        // Outline badge
        outline: "border-neutral-300 bg-transparent text-neutral-600 [a&]:hover:bg-neutral-50 [a&]:hover:text-neutral-800 [a&]:hover:scale-105",
        
        // Pregnancy week badge
        pregnancy: "border-accent-DEFAULT/30 bg-gradient-to-r from-accent-light/50 to-primary-50 text-primary-700 [a&]:hover:from-accent-light [a&]:hover:to-primary-100 [a&]:hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
