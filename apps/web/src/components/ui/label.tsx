import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none text-neutral-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-neutral-200",
  {
    variants: {
      variant: {
        default: "text-neutral-700 dark:text-neutral-200",
        // Maternal accent for important labels
        accent: "text-primary-600 dark:text-primary-400",
        // Secondary for supporting labels
        secondary: "text-secondary-600 dark:text-secondary-400",
        // Muted for helper text
        muted: "text-neutral-500 dark:text-neutral-400 font-normal",
        // Error state
        error: "text-error-DEFAULT dark:text-error-light",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base", // Larger for better readability
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, size, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant, size }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label, labelVariants }