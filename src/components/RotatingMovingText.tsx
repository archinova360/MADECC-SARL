import React, { useState, useEffect } from 'react';

interface RotatingMovingTextProps {
  words: string[];
  interval?: number;
  className?: string;
  highlightClassName?: string;
  prefix?: string;
  suffix?: string;
}

export function RotatingMovingText({
  words,
  interval = 3200,
  className = '',
  highlightClassName = 'text-amber-400 underline decoration-amber-500/60 decoration-wavy decoration-2 underline-offset-8',
  prefix,
  suffix
}: RotatingMovingTextProps) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (words.length <= 1) return;
    let swapTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setInterval(() => {
      setFading(true);
      swapTimer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setFading(false);
      }, 180);
    }, interval);
    return () => {
      clearInterval(timer);
      if (swapTimer) clearTimeout(swapTimer);
    };
  }, [words.length, interval]);

  return (
    <span className={`inline-flex items-center flex-wrap gap-x-2 ${className}`}>
      {prefix && <span>{prefix}</span>}
      <span className="relative inline-block overflow-hidden py-1">
        <span
          className={`inline-block font-extrabold transition-[opacity,transform] duration-200 ease-out ${
            fading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
          } ${highlightClassName}`}
        >
          {words[index]}
        </span>
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

export default RotatingMovingText;
