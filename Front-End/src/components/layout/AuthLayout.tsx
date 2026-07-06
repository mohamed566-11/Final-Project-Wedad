import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  variant?: 'patient' | 'doctor' | 'admin';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children,
  variant = 'patient'
}) => {
  const gradients = {
    patient: 'from-primary-50 via-white to-primary-100',
    doctor: 'from-orange-50 via-white to-rose-50',
    admin: 'from-violet-50 via-white to-purple-50',
  };

  const blobColors = {
    patient: 'bg-primary/20',
    doctor: 'bg-coral-400/20',
    admin: 'bg-admin/20',
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br py-12 px-4 relative overflow-hidden',
      gradients[variant]
    )}>
      {/* Decorative Blobs */}
      <div className={cn(
        'absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2',
        blobColors[variant]
      )} />
      <div className={cn(
        'absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2',
        blobColors[variant]
      )} />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
