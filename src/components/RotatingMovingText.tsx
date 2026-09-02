import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`inline-flex items-center flex-wrap gap-x-2 ${className}`}>
      {prefix && <span>{prefix}</span>}
      <span className="relative inline-block overflow-hidden py-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 28, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -28, filter: 'blur(4px)' }}
            transition={{ 
              duration: 0.45, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className={`inline-block font-extrabold ${highlightClassName}`}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

export default RotatingMovingText;
