// components/ui/dialog.tsx
import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }: DialogContentProps) => {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg w-full max-w-lg mx-4 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = "" }: DialogTitleProps) => {
  return (
    <div className={`px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 ${className}`}>
      <h2 className="text-lg font-semibold">{children}</h2>
    </div>
  );
};

export { Dialog, DialogContent, DialogTitle };