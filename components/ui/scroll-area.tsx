// components/ui/scroll-area.tsx
import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea = ({ children, className = "" }: ScrollAreaProps) => {
  return (
    <div className={`overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

export { ScrollArea };