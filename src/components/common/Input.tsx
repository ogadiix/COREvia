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
      sm: 'h-8 sm:h-7 py-1 text-xs',
      md: 'h-9 sm:h-8 py-1.5 text-xs',
    };

    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={id}
              className="block text-[11px] font-semibold text-[#273444] dark:text-[#E8EEF5] tracking-tight uppercase"
            >
              {label}
              {required && <span className="text-[#B42318] dark:text-[#EF4444] ml-0.5">*</span>}
            </label>
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-[#5D6B7B] dark:text-[#A9BACB] [&>svg]:w-3.5 [&>svg]:h-3.5">
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
            className={`w-full rounded-sm border bg-white dark:bg-[#101C2A] px-2.5 transition-colors duration-150 text-[#273444] dark:text-[#E8EEF5] placeholder:text-[#8793A1] dark:placeholder:text-[#8194A8] disabled:bg-[#EDF1F5] dark:disabled:bg-[#162638] disabled:text-[#8793A1] dark:disabled:text-[#8194A8] disabled:cursor-not-allowed ${
              leftIcon ? 'pl-8' : ''
            } ${rightIcon || rightElement ? 'pr-8' : ''} ${sizeClasses[size]} ${
              isMono ? 'font-mono tabular-nums' : 'font-sans'
            } ${
              hasError
                ? 'border-[#B42318] dark:border-[#EF4444] focus:border-[#B42318] focus-visible:ring-1 focus-visible:ring-[#B42318]'
                : `border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] dark:hover:border-[#168C83] focus:border-[#168C83] ${focusRingClass}`
            } ${className}`}
            {...props}
          />

          {rightIcon && !rightElement && (
            <div className="absolute right-2.5 flex items-center pointer-events-none text-[#5D6B7B] dark:text-[#A9BACB] [&>svg]:w-3.5 [&>svg]:h-3.5">
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
          <p
            id={errorId}
            role="alert"
            className="text-[11px] font-medium text-[#B42318] dark:text-[#EF4444] flex items-center gap-1"
          >
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={helperId}
            className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isMono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      isMono = false,
      id: customId,
      className = '',
      disabled,
      required,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold text-[#273444] dark:text-[#E8EEF5] tracking-tight uppercase"
          >
            {label}
            {required && <span className="text-[#B42318] dark:text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-sm border bg-white dark:bg-[#101C2A] px-2.5 py-1.5 transition-colors duration-150 text-xs text-[#273444] dark:text-[#E8EEF5] placeholder:text-[#8793A1] dark:placeholder:text-[#8194A8] disabled:bg-[#EDF1F5] dark:disabled:bg-[#162638] disabled:text-[#8793A1] dark:disabled:text-[#8194A8] disabled:cursor-not-allowed resize-y ${
            isMono ? 'font-mono' : 'font-sans'
          } ${
            hasError
              ? 'border-[#B42318] dark:border-[#EF4444] focus:border-[#B42318] focus-visible:ring-1 focus-visible:ring-[#B42318]'
              : `border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] dark:hover:border-[#168C83] focus:border-[#168C83] ${focusRingClass}`
          } ${className}`}
          {...props}
        />

        {hasError && (
          <p id={errorId} role="alert" className="text-[11px] font-medium text-[#B42318] dark:text-[#EF4444]">
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
