import { cn } from "../../utils/cn";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    trend?: string;
    variant?: 'default' | 'primary' | 'error';
}

export const StatCard = ({ label, value, icon, trend, variant = 'default' }: StatCardProps) => {
    const isPrimary = variant === 'primary';
    const isError = variant === 'error';

    return (
        <div className={cn(
            "p-6 rounded-xl border transition-transform duration-300 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,52,111,0.04)]",
            isPrimary ? "bg-primary text-on-primary border-primary" : 
            isError ? "bg-error-container text-on-error-container border-error" : 
            "bg-surface-container-lowest border-surface-container text-on-surface"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isPrimary ? "bg-white/20 text-white" : 
                    isError ? "bg-error/20 text-error" : 
                    "bg-surface-container text-primary"
                )}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                {trend && (
                    <span className={cn(
                        "px-2 py-1 rounded font-label-sm text-label-sm flex items-center",
                        isPrimary ? "bg-white/10 text-white" : 
                        isError ? "bg-error/10 text-error" : 
                        "bg-surface-variant text-primary"
                    )}>
                        <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> {trend}
                    </span>
                )}
            </div>
            <h3 className={cn("font-label-md uppercase tracking-wider mb-1", 
                isPrimary ? "text-primary-fixed" : 
                isError ? "text-error" : 
                "text-outline"
            )}>
                {label}
            </h3>
            <div className="font-h1 text-h1">{value}</div>
        </div>
    );
};