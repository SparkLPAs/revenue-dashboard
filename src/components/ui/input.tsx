import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (<input type={type} ref={ref} className={cn("flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />));
Input.displayName = "Input";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (<select ref={ref} className={cn("flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>{children}</select>));
Select.displayName = "Select";
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (<label ref={ref} className={cn("text-xs font-medium text-text-muted uppercase tracking-wider", className)} {...props} />));
Label.displayName = "Label";
