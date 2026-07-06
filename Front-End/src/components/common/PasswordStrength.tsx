import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Criterion {
  label: string;
  test: (password: string) => boolean;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className }) => {
  const criteria: Criterion[] = [
    { label: '8 أحرف على الأقل', test: (p) => p.length >= 8 },
    { label: 'حرف كبير واحد', test: (p) => /[A-Z]/.test(p) },
    { label: 'رقم واحد', test: (p) => /[0-9]/.test(p) },
    { label: 'رمز خاص (!@#$%)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const { strength, label, color, passedCount } = useMemo(() => {
    const passed = criteria.filter((c) => c.test(password)).length;
    const total = criteria.length;
    const percentage = (passed / total) * 100;

    if (passed === 0) {
      return { strength: 0, label: '', color: 'bg-muted', passedCount: passed };
    } else if (passed === 1) {
      return { strength: 25, label: 'ضعيفة', color: 'bg-destructive', passedCount: passed };
    } else if (passed === 2) {
      return { strength: 50, label: 'متوسطة', color: 'bg-warning', passedCount: passed };
    } else if (passed === 3) {
      return { strength: 75, label: 'جيدة', color: 'bg-info', passedCount: passed };
    } else {
      return { strength: 100, label: 'قوية', color: 'bg-success', passedCount: passed };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('mt-3 space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">قوة كلمة المرور</span>
          {label && (
            <span className={cn(
              'font-medium',
              strength <= 25 && 'text-destructive',
              strength === 50 && 'text-warning',
              strength === 75 && 'text-info',
              strength === 100 && 'text-success'
            )}>
              {label}
            </span>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', color)}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Criteria List */}
      <div className="grid grid-cols-2 gap-2">
        {criteria.map((criterion, index) => {
          const passed = criterion.test(password);
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                passed ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{criterion.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;
