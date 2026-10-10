import * as React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  side = 'left',
  children,
  className,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = {
    left: 'inset-y-0 left-0 h-full w-[85vw] max-w-sm border-r animate-in slide-in-from-left duration-200',
    right: 'inset-y-0 right-0 h-full w-[90vw] max-w-md border-l animate-in slide-in-from-right duration-200',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full border-t rounded-t-xl animate-in slide-in-from-bottom duration-200',
  }[side];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />
      {/* Drawer content */}
      <div
        className={cn(
          'fixed z-50 bg-background border-border text-foreground shadow-xl flex flex-col',
          sideClasses,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-between p-3.5 border-b border-border text-foreground',
      className
    )}
    {...props}
  />
);

export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={cn('text-xs font-semibold tracking-tight text-foreground', className)}
    {...props}
  />
);
