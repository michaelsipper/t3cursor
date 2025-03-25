//time-progress-bar.tsx

'use client';
import { useState, useEffect } from 'react';

interface TimeProgressBarProps {
  startTime: number;
  duration: number;
}

export function TimeProgressBar({ startTime, duration }: TimeProgressBarProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = startTime + (duration * 60 * 60 * 1000);
      const remaining = Math.max(0, endTime - now);
      const percent = (remaining / (duration * 60 * 60 * 1000)) * 100;

      setTimeLeft(remaining);
      setPercentage(Math.max(0, Math.min(100, percent)));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime, duration]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="w-full mb-3">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {timeLeft > 0 ? (
          `${hours}h ${minutes}m remaining`
        ) : (
          "Expired"
        )}
      </div>
    </div>
  );
}