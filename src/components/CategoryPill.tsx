import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryPillProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    iconUrl?: string;
    className?: string
}

export function CategoryPill({ label, isActive, onClick, iconUrl, className }: CategoryPillProps) {
    return (
        <Button
            variant={isActive ? "default" : "secondary"}
            onClick={onClick}
            className={cn(
                "rounded-full px-4 h-9 flex items-center gap-2 transition-all duration-300",
                isActive ? "shadow-md scale-105" : "hover:bg-secondary/80",
                "whitespace-nowrap",
                className
            )}
        >
            {iconUrl && (
                <img src={iconUrl} alt="" className="w-4 h-4 object-contain" />
            )}
            {label}
        </Button>
    )
}
