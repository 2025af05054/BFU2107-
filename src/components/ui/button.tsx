import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-hover shadow-button",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-hover shadow-card border border-border",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-button",
        outline: "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-card hover:shadow-button",
        ghost: "hover:bg-muted hover:text-foreground transition-smooth",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        // Modern Alibaba-style Variants
        hero: "gradient-hero text-white hover:shadow-glow transition-spring font-bold tracking-wide transform hover:scale-105",
        rfq: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-button font-semibold border border-accent/20",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-button hover:shadow-hover",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-button hover:shadow-hover",
        premium: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-button hover:shadow-glow border-2 border-accent/30",
        supplier: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-card hover:shadow-button border border-border",
        modern: "bg-foreground text-background hover:bg-foreground/90 shadow-button hover:shadow-hover font-bold",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs font-medium",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-10 text-lg font-bold tracking-wide",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
