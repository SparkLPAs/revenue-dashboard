import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { default: "bg-accent text-background hover:bg-accent/90 font-semibold", digital: "bg-accent-digital text-background hover:bg-accent-digital/90 font-semibold", outline: "border border-border bg-transparent text-text-primary hover:bg-border/40", ghost: "bg-transparent text-text-muted hover:bg-border/40 hover:text-text-primary", destructive: "border border-red-500/40 bg-transparent text-red-400 hover:bg-red-500/10" }, size: { default: "h-9 px-4 py-2", sm: "h-7 px-2.5", icon: "h-8 w-8" } },
  defaultVariants: { variant: "default", size: "default" },
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (<button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />));
Button.displayName = "Button";
export { buttonVariants };
