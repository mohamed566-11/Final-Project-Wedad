import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'flat' | 'glow';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
}

interface CardSubComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardSubComponentProps>;
  Content: React.FC<CardSubComponentProps>;
  Footer: React.FC<CardSubComponentProps>;
} = ({
  children,
  variant = 'elevated',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) => {
  const variants: Record<string, string> = {
    elevated: 'bg-card shadow-soft',
    outlined: 'bg-card border-2 border-border',
    flat: 'bg-card',
    glow: 'bg-card shadow-glow',
  };

  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-elevated hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardSubComponentProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

const CardContent: React.FC<CardSubComponentProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

const CardFooter: React.FC<CardSubComponentProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={cn('mt-4 pt-4 border-t border-border', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
