import React, { useId } from 'react';
import { focusRingClass } from './tokens';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: 'sm' | 'md';
  isMono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      rightElement,
      size = 'md',
      isMono = false,
      id: customId,
      className = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const sizeClasses = {
      sm: 'h-7 py-1 text-xs',
      md: 'h-8 py-1.5 text-xs',
    };

    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={id}
              className="block text-[11px] font-semibold text-[#172033] tracking-tight uppercase"
            >
              {label}
              {required && <span className="text-[#B42318] ml-0.5">*</span>}
            </label>
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-[#64748B] [&>svg]:w-3.5 [&>svg]:h-3.5">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={`w-full rounded-sm border bg-white px-2.5 transition-colors duration-150 text-[#172033] placeholder:text-[#94A3B8] disabled:bg-[#F1F5F9] disabled:text-[#64748B] disabled:cursor-not-allowed ${
              leftIcon ? 'pl-8' : ''
            } ${rightIcon || rightElement ? 'pr-8' : ''} ${sizeClasses[size]} ${
              isMono ? 'font-mono tabular-nums' : 'font-sans'
            } ${
              hasError
                ? 'border-[#B42318] focus:border-[#B42318] focus-visible:ring-1 focus-visible:ring-[#B42318]'
                : `border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#087F8C] ${focusRingClass}`
            } ${className}`}
            {...props}
          />

          {rightIcon && !rightElement && (
            <div className="absolute right-2.5 flex items-center pointer-events-none text-[#64748B] [&>svg]:w-3.5 [&>svg]:h-3.5">
              {rightIcon}
            </div>
          )}

          {rightElement && (
            <div className="absolute right-2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {hasError && (
          <p id={errorId} className="text-[11px] text-[#B42318] font-medium mt-0.5 flex items-center gap-1 motion-fade-in">
            <span>{error}</span>
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-[11px] text-[#64748B] mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

