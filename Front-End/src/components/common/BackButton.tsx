import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  label?: string;
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({
  className,
  label = "رجوع",
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      dir="rtl"
      aria-label={`${label} — العودة للصفحة السابقة`}
      className={cn(
        // Layout
        "inline-flex items-center gap-2",
        // Base styling - theme-aware semantic colors
        "text-muted-foreground hover:text-foreground",
        "transition-all duration-200 ease-in-out",
        // Typography
        "text-sm font-medium",
        // Subtle background on hover
        "px-3 py-1.5 -mx-3 rounded-lg",
        "hover:bg-accent/60",
        // Icon animation
        "group",
        className
      )}
    >
      {/* RTL: ArrowRight = visually points right, which is "back" in RTL layout */}
      <ArrowRight
        className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
