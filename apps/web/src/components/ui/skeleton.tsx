import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Maternal skeleton with soft animation
        "animate-gentle-pulse rounded-xl bg-gradient-to-r from-neutral-200/60 to-primary-100/40",
        "dark:from-neutral-700/60 dark:to-secondary-700/40",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }