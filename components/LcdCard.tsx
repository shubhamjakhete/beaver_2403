"use client";

interface LcdCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  variant?: "good" | "accent";
  color?: string;
  labelColor?: string;
}

export default function LcdCard({
  label,
  value,
  unit,
  variant = "good",
  color,
  labelColor,
}: LcdCardProps) {
  const isAccent = variant === "accent";
  const valueColor = color ?? "var(--text-hi)";
  const valueShadow = isAccent
    ? "0 0 9px rgba(53,197,240,.2)"
    : "0 0 9px rgba(47,226,160,.2)";

  const display = value == null ? "—" : String(value);

  return (
    <div
      className={`rounded-[7px] p-[9px_11px] flex flex-col justify-center ${isAccent ? "lcd-accent" : "lcd-good"}`}
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
}
