"use client";

import { useState } from "react";

export const CONTRACT_ADDRESS = "J6DkrhKaVWTJTHqjucQcpUgFoYNQy3W6YzevbVMQpump";

function short(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ContractBar({ variant = "hero" }: { variant?: "hero" | "nav" | "footer" }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(CONTRACT_ADDRESS);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  if (variant === "nav") {
    return (
      <button
        className={`ca-nav ${copied ? "copied" : ""}`}
        onClick={onCopy}
        title={`Contract address: ${CONTRACT_ADDRESS} (click to copy)`}
      >
        <span className="ca-nav-label">CA</span>
        <span className="ca-nav-addr">{copied ? "Copied!" : short(CONTRACT_ADDRESS)}</span>
        <span aria-hidden>{copied ? "✓" : "⧉"}</span>
      </button>
    );
  }

  if (variant === "footer") {
    return (
      <button className={`ca-foot ${copied ? "copied" : ""}`} onClick={onCopy} title="Click to copy">
        <span className="ca-label">CA</span>
        <code>{CONTRACT_ADDRESS}</code>
        <span aria-hidden>{copied ? "✓ copied" : "⧉ copy"}</span>
      </button>
    );
  }

  return (
    <button
      className={`ca-hero liquid-glass ${copied ? "copied" : ""}`}
      onClick={onCopy}
      title="Click to copy the contract address"
    >
      <span className="ca-label">CA</span>
      <code className="ca-addr">{CONTRACT_ADDRESS}</code>
      <span className="ca-copy">{copied ? "✓ Copied" : "⧉ Copy"}</span>
    </button>
  );
}
