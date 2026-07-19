"use client";

import { forwardRef, type KeyboardEvent } from "react";

interface LcdCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  variant?: "good" | "accent";
  color?: string;
  labelColor?: string;
  /**
   * When set, the card becomes a focusable button that opens a detail dialog
   * (Enter / Space / click). Used by Overview Water Quality tiles.
   */
  onActivate?: () => void;
  "aria-haspopup"?: "dialog";
  "aria-label"?: string;
}

const LcdCard = forwardRef<HTMLDivElement, LcdCardProps>(function LcdCard(
  {
    label,
    value,
    unit,
    variant = "good",
    color,
    labelColor,
    onActivate,
    "aria-haspopup": ariaHaspopup,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const isAccent = variant === "accent";
  const valueColor = color ?? "var(--text-hi)";
  const valueShadow = isAccent
    ? "0 0 9px rgba(53,197,240,.2)"
    : "0 0 9px rgba(47,226,160,.2)";
  const interactive = typeof onActivate === "function";

  const display = value == null ? "—" : String(value);

  return (
    <div
      ref={ref}
      className={`rounded-[7px] p-[9px_11px] flex flex-col justify-center ${isAccent ? "lcd-accent" : "lcd-good"}${
        interactive
          ? " cursor-pointer transition-[border-color,transform] duration-150 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
          : ""
      }`}
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-haspopup": ariaHaspopup ?? "dialog",
            "aria-label": ariaLabel ?? `Open detailed ${label} trend`,
            onClick: onActivate,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate();
              }
            },
          }
        : {})}
    >
      <div
        className="text-[.62rem] tracking-[.07em] uppercase mb-[3px]"
        style={{ color: labelColor ?? "#ffffff" }}
      >
        {label}
      </div>
      <div
        className="font-mono text-[1.2rem] font-semibold"
        style={{ color: valueColor, textShadow: valueShadow }}
      >
        {display}
        {unit && (
          <span
            className="text-[.62rem] ml-[3px]"
            style={{ color: "var(--text-mid)", textShadow: "none" }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
});

export default LcdCard;
