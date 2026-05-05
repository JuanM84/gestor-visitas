import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {

        // El diseño dice: Primary usa primary blue. Secondary usa outline de secondary blue.
        const baseStyles = "px-6 py-2.5 rounded font-semibold text-sm transition-all flex items-center justify-center gap-2";

        const variants = {
            primary: "bg-primary text-on-primary hover:bg-primary-container shadow-sm",
            secondary: "bg-secondary text-on-secondary hover:bg-secondary-container shadow-sm",
            outline: "border border-secondary text-secondary hover:bg-surface-container-low"
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], className)}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";