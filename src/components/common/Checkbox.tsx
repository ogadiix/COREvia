import React, { useId, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { focusRingClass } from './tokens';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  helperText?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      indeterminate = false,
      id: customId,
      checked = false,
      className = '',
      disabled,
      ...props
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const el = (forwardedRef && 'current' in forwardedRef ? forwardedRef.current : internalRef.current);
      if (el) {
        el.indeterminate = indeterminate;
      }
    }, [indeterminate, forwardedRef]);

    const isChecked = Boolean(checked) || indeterminate;

    return (
      <div className={`flex items-start gap-2 select-none ${className}`}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={(node) => {
              internalRef.current = node;
              if (typeof forwardedRef === 'function') {
                forwardedRef(node);
              } else if (forwardedRef) {
                (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`w-4 h-4 rounded-xs border transition-colors flex items-center justify-center cursor-pointer ${
              disabled
                ? 'bg-[#EDF1F5] dark:bg-[#162638] border-[#DCE3EA] dark:border-[#33485D] cursor-not-allowed opacity-60'
                : isChecked
                ? 'bg-[#168C83] border-[#168C83] text-white'
                : error
                ? 'bg-white dark:bg-[#101C2A] border-[#B42318] dark:border-[#EF4444] hover:border-[#911d13]'
                : 'bg-white dark:bg-[#101C2A] border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] dark:hover:border-[#168C83]'
            } peer-focus-visible:ring-2 peer-focus-visible:ring-[#168C83] peer-focus-visible:ring-offset-1`}
          >
            {indeterminate ? (
              <Minus className="w-3 h-3 text-white stroke-[3]" />
            ) : checked ? (
              <Check className="w-3 h-3 text-white stroke-[3]" />
            ) : null}
          </div>
        </div>

        {(label || helperText) && (
          <div className="text-left leading-snug">
            {label && (
              <label
                htmlFor={id}
                className={`text-xs font-medium cursor-pointer ${
                  disabled
                    ? 'text-[#8793A1] dark:text-[#8194A8] cursor-not-allowed'
                    : 'text-[#273444] dark:text-[#E8EEF5]'
                }`}
              >
                {label}
              </label>
            )}
            {helperText && (
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">{helperText}</p>
            )}
            {error && (
              <p className="text-[11px] text-[#B42318] dark:text-[#EF4444] font-medium mt-0.5">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
