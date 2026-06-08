import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const variantesBadge = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-yellow-100 text-yellow-800",
        info: "border-transparent bg-blue-100 text-blue-800",
        purple: "border-transparent bg-purple-100 text-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof variantesBadge> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(variantesBadge({ variant }), className)} {...props} />
}

export { Badge, variantesBadge }
