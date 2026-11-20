import React, { useEffect, useRef, useState } from 'react';

interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, []);
  return reduced;
}

function useInViewOnce(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '-40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, visible]);
  return visible;
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
  duration = 0.45,
  direction = 'up',
  style,
  ...props
}: MotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInViewOnce(ref);

  if (reduced) {
    return (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    );
  }

  const hiddenTransform =
    direction === 'left'
      ? 'translate3d(24px, 0, 0)'
      : direction === 'right'
        ? 'translate3d(-24px, 0, 0)'
        : direction === 'down'
          ? 'translate3d(0, -20px, 0)'
          : 'translate3d(0, 20px, 0)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate3d(0, 0, 0)' : hiddenTransform,
        transition: `opacity ${duration}s cubic-bezier(0.21, 0.47, 0.32, 0.98) ${delay}s, transform ${duration}s cubic-bezier(0.21, 0.47, 0.32, 0.98) ${delay}s`,
        willChange: inView ? 'auto' : 'transform, opacity',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function FadeInDirection({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.5,
  style,
  ...props
}: MotionProps & { direction?: 'up' | 'down' | 'left' | 'right' }) {
  return (
    <FadeIn
      className={className}
      direction={direction}
      delay={delay}
      duration={duration}
      style={style}
      {...props}
    >
      {children}
    </FadeIn>
  );
}

export function ScaleIn({
  children,
  className = '',
  delay = 0,
  duration = 0.4,
  style,
  ...props
}: MotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInViewOnce(ref);

  if (reduced) {
    return (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'scale3d(1, 1, 1)' : 'scale3d(0.94, 0.94, 1)',
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: inView ? 'auto' : 'transform, opacity',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay: _staggerDelay,
  delayChildren: _delayChildren,
  style,
  ...props
}: MotionProps & { staggerDelay?: number; delayChildren?: number }) {
  return (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className = '',
  delay = 0,
  duration = 0.45,
  style,
  ...props
}: MotionProps) {
  return (
    <FadeIn className={className} delay={delay} duration={duration} style={style} {...props}>
      {children}
    </FadeIn>
  );
}

export function InteractiveCard({
  children,
  className = '',
  hoverScale: _hoverScale = 1.02,
  style,
  ...props
}: MotionProps & { hoverScale?: number }) {
  return (
    <div
      className={`transition-transform duration-200 ease-out hover:-translate-y-1 active:scale-[0.98] ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageTransition({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function FloatElement({
  children,
  className = '',
  offset: _offset = 8,
  duration: _duration = 3.5,
  style,
  ...props
}: MotionProps & { offset?: number; duration?: number }) {
  return (
    <div className={`animate-float-gentle ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

export function PulseBeacon({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
      <span className="relative inline-flex rounded-full bg-amber-500" />
      {children}
    </span>
  );
}
