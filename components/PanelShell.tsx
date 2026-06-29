interface PanelShellProps {
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}

export default function PanelShell({ title, note, children, className = "" }: PanelShellProps) {
  return (
    <div
      className={`rounded-[10px] p-[14px_16px] flex flex-col min-h-0 ${className}`}
      style={{ background: "var(--bg-panel)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-baseline justify-between mb-[10px]">
        <div
          className="font-grotesk text-[.74rem] font-semibold tracking-[.12em] uppercase"
          style={{ color: "var(--text-mid)" }}
        >
          <span
            className="inline-block w-[3px] h-[11px] mr-2 rounded-[1px] align-[-1px]"
            style={{ background: "var(--accent)" }}
          />
          {title}
        </div>
        {note && (
          <div className="text-[.65rem]" style={{ color: "var(--text-low)" }}>
            {note}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
