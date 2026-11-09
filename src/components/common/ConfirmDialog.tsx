import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Check } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  referenceId?: string;
  /**
   * If provided, the operator must type this exact confirmation phrase
   * (e.g. "CONFIRM" or "AUTHORIZE") before the confirm button enables.
   */
  requiredPhrase?: string;
  phraseLabel?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
  referenceId,
  requiredPhrase,
  phraseLabel = 'Type phrase to confirm',
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTypedPhrase('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const isPhraseMatched = !requiredPhrase || typedPhrase.trim() === requiredPhrase.trim();
  const effectiveLoading = isLoading || isSubmitting;

  const handleConfirm = async () => {
    if (!isPhraseMatched || effectiveLoading) return;
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const variantIcons = {
    danger: <AlertCircle className="w-5 h-5 text-[#B42318] dark:text-[#EF4444] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#B7791F] dark:text-[#F59E0B] shrink-0" />,
    primary: <Info className="w-5 h-5 text-[#168C83] dark:text-[#2dd4bf] shrink-0" />,
  };

  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      referenceId={referenceId}
      size="sm"
      footerActions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={effectiveLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={!isPhraseMatched || effectiveLoading}
            isLoading={effectiveLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {variantIcons[variant]}
          <div className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] leading-relaxed">
            {description}
          </div>
        </div>

        {requiredPhrase && (
          <div className="mt-3 p-2.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xs space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#273444] dark:text-[#E8EEF5]">
              {phraseLabel}: <span className="font-mono text-[#168C83] dark:text-[#2dd4bf] select-all">{requiredPhrase}</span>
            </label>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={`Enter "${requiredPhrase}"`}
              className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xs text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              disabled={effectiveLoading}
              autoFocus
            />
          </div>
        )}
      </div>
    </Dialog>
  );
};

