"use client";

import { CSSProperties, useEffect, useState } from "react";

/**
 * Splits text into characters and reveals them left-to-right.
 * Multi-line via "\n"; spaces preserved as non-breaking spaces.
 * Per-character delay: lineIndex * line.length * charDelay + charIndex * charDelay.
 */
export function AnimatedHeading({
  text,
  className,
  style,
  delay = 200,
  charDelay = 30,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  charDelay?: number;
}) {
  const [go, setGo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <h1 className={className} style={style}>
      {text.split("\n").map((line, li) => (
        <span className="ah-line" key={li}>
          {line.split("").map((ch, ci) => (
            <span
              key={ci}
              className="ah-char"
              style={{
                transitionDelay: `${li * line.length * charDelay + ci * charDelay}ms`,
                opacity: go ? 1 : 0,
                transform: go ? "translateX(0)" : "translateX(-18px)",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
