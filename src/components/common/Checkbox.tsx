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
                ? 'bg-[#F1F5F9] border-[#CBD5E1] cursor-not-allowed opacity-60'
                : isChecked
                ? 'bg-[#087F8C] border-[#087F8C] text-white'
                : error
                ? 'bg-white border-[#B42318] hover:border-[#911d13]'
                : 'bg-white border-[#CBD5E1] hover:border-[#087F8C]'
            } peer-focus-visible:ring-2 peer-focus-visible:ring-[#087F8C] peer-focus-visible:ring-offset-1`}
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
                  disabled ? 'text-[#94A3B8] cursor-not-allowed' : 'text-[#172033]'
                }`}
              >
                {label}
              </label>
            )}
            {helperText && (
              <p className="text-[11px] text-[#64748B] mt-0.5">{helperText}</p>
            )}
            {error && (
              <p className="text-[11px] text-[#B42318] font-medium mt-0.5">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

