// components/ui/alert.tsx
import React from 'react';

interface AlertProps {
  message: string;
}

export function Alert({ message }: AlertProps) {
  return (
    <div className="bg-red-100 text-red-800 px-4 py-3 rounded mb-4">
      {message}
    </div>
  );
}
