import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({ 
  length = 5, 
  value = '', 
  onChange, 
  error 
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(
    value ? value.split('').slice(0, length) : Array(length).fill('')
  );

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Sync with external value
    if (value !== otp.join('')) {
      setOtp(value ? value.split('').slice(0, length) : Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Move to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((digit, i) => {
      if (i < length) newOtp[i] = digit;
    });
    setOtp(newOtp);
    onChange(newOtp.join(''));
    
    // Focus last filled input or last input
    const lastIndex = Math.min(pastedData.length, length) - 1;
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 justify-center" dir="ltr">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              'w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all',
              'bg-card text-foreground focus:outline-none',
              error 
                ? 'border-destructive/50 focus:border-destructive focus:ring-4 focus:ring-destructive/20' 
                : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/20'
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}
    </div>
  );
};

export default OTPInput;
