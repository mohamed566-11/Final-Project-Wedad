import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        gradient:
          "bg-gradient-to-r from-primary to-primary-600 text-primary-foreground hover:from-primary-600 hover:to-primary-700 focus-visible:ring-primary/30 shadow-lg shadow-primary/30",
        coral:
          "bg-gradient-to-r from-coral-400 to-coral-500 text-white hover:from-coral-500 hover:to-coral-600 focus-visible:ring-coral-400/30 shadow-lg shadow-coral-400/30",
        blue:
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus-visible:ring-blue-500/30 shadow-lg shadow-blue-500/30",
        admin:
          "bg-gradient-to-r from-admin to-violet-600 text-admin-foreground hover:from-violet-600 hover:to-violet-700 focus-visible:ring-admin/30 shadow-lg shadow-admin/30",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground hover:from-red-600 hover:to-red-700 focus-visible:ring-destructive/30 shadow-lg shadow-destructive/30",
        outline:
          "border-2 border-primary bg-card text-primary hover:bg-primary/5 focus-visible:ring-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ElementType;
  iconPosition?: "right" | "left";
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon: Icon,
      iconPosition = "right",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size }),
            fullWidth && "w-full",
            className,
          )}
          ref={ref}
          {...props}
        />
      );
    }

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && "w-full",
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {!loading && Icon && iconPosition === "right" && <Icon size={18} />}
        {children}
        {!loading && Icon && iconPosition === "left" && <Icon size={18} />}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
