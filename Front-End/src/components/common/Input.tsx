import React, { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ElementType;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  helperText,
  icon: Icon,
  type = 'text',
  className = '',
  required,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon size={20} />
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200',
            'bg-card text-foreground placeholder:text-muted-foreground',
            'focus:outline-none',
            Icon && 'pr-11',
            isPassword && 'pl-11',
            error 
              ? 'border-destructive/50 focus:border-destructive focus:ring-4 focus:ring-destructive/20' 
              : success
              ? 'border-success/50 focus:border-success focus:ring-4 focus:ring-success/20'
              : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/20',
            disabled && 'bg-muted cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        
        {success && !error && !isPassword && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-success">
            <Check size={20} />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={cn(
          'flex items-start gap-1 mt-1.5 text-sm',
          error ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {error && <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
