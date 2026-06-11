'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Input } from './input';

const timeInputVariants = cva('');

export interface TimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'>,
    VariantProps<typeof timeInputVariants> {
  value?: string;
  onChange?: (value: string) => void;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        ref={ref}
        {...props}
      />
    );
  }
);

TimeInput.displayName = 'TimeInput';

export { TimeInput };
