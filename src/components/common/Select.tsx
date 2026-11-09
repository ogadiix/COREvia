import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { focusRingClass } from './tokens';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      leftIcon,
      size = 'md',
      id: customId,
      children,
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
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold text-[#273444] dark:text-[#E8EEF5] tracking-tight uppercase"
          >
            {label}
            {required && <span className="text-[#B42318] dark:text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-[#5D6B7B] dark:text-[#A9BACB] [&>svg]:w-3.5 [&>svg]:h-3.5">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={`w-full appearance-none rounded-sm border bg-white dark:bg-[#101C2A] px-2.5 pr-8 transition-colors duration-150 text-[#273444] dark:text-[#E8EEF5] disabled:bg-[#EDF1F5] dark:disabled:bg-[#162638] disabled:text-[#8793A1] dark:disabled:text-[#8194A8] disabled:cursor-not-allowed ${
              leftIcon ? 'pl-8' : ''
            } ${sizeClasses[size]} ${
              hasError
                ? 'border-[#B42318] dark:border-[#EF4444] focus:border-[#B42318] focus-visible:ring-1 focus-visible:ring-[#B42318]'
                : `border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] dark:hover:border-[#168C83] focus:border-[#168C83] ${focusRingClass}`
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-white dark:bg-[#162638] text-[#273444] dark:text-[#E8EEF5]">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-2.5 flex items-center pointer-events-none text-[#5D6B7B] dark:text-[#A9BACB]">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
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

Select.displayName = 'Select';
