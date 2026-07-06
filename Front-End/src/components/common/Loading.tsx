import React from "react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  size = "md",
  text = "جاري التحميل...",
}) => {
  const ringSize: Record<string, string> = {
    sm: "w-8 h-8 border-2",
    md: "w-12 h-12 border-[3px]",
    lg: "w-16 h-16 border-4",
  };

  const dotSizes: Record<string, string> = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-5" dir="rtl">
      {/* Spinner Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div
          className={cn(
            "absolute rounded-full bg-primary/10 animate-ping",
            size === "sm" ? "w-10 h-10" : size === "md" ? "w-16 h-16" : "w-20 h-20"
          )}
        />
        {/* Spinner */}
        <div
          className={cn(
            "rounded-full border-primary/20 border-t-primary animate-spin",
            ringSize[size]
          )}
        />
        {/* Inner dot */}
        <div
          className={cn(
            "absolute rounded-full bg-primary",
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
          )}
        />
      </div>

      {/* Dot animation */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-primary/60",
              dotSizes[size]
            )}
            style={{
              animation: `loadingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Text */}
      {text && (
        <p className="text-muted-foreground text-sm font-medium tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-2xl shadow-xl px-10 py-8">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-10">{content}</div>
  );
};

export default Loading;

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
  variant?: "text" | "title" | "avatar" | "card" | "button";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
}) => {
  const variants: Record<string, string> = {
    text: "h-4 rounded",
    title: "h-8 rounded",
    avatar: "w-12 h-12 rounded-full",
    card: "h-48 rounded-xl",
    button: "h-12 rounded-xl",
  };

  return (
    <div
      className={cn("bg-muted animate-pulse", variants[variant], className)}
    />
  );
};
