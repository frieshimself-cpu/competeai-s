"use client";

import { useEffect, useState } from "react";

export function FadeIn({
  children,
  delay = 0,
  duration = 800,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={className}
      style={{ opacity: on ? 1 : 0, transition: `opacity ${duration}ms ease` }}
    >
      {children}
    </div>
  );
}
