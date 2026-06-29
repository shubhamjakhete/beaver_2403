"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9h14v-9" />
      </svg>
    ),
  },
  {
    href: "/trends",
    label: "Trends",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M3 19h18" />
      </svg>
    ),
  },
  {
    href: "/controls",
    label: "Controls",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.6-1.3-2-3.3-1.9.6a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-1.9-.6-2 3.3L4.6 10.5a7.6 7.6 0 0 0 0 3L3 14.8l2 3.3 1.9-.6c.8.7 1.6 1.2 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l1.9.6 2-3.3-1.6-1.3Z" />
      </svg>
    ),
  },
  {
    href: "/alarms",
    label: "Alarms",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M12 4a6 6 0 0 0-6 6c0 4-2 5-2 7h16c0-2-2-3-2-7a6 6 0 0 0-6-6Z" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-[10px]">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={
              active
                ? {
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                    background: "var(--bg-panel)",
                    boxShadow: "inset 0 0 0 1px var(--accent)",
                  }
                : {
                    borderColor: "var(--line)",
                    color: "var(--text-mid)",
                    background: "var(--bg-panel)",
                  }
            }
            className="flex-1 flex flex-col items-center gap-[5px] border rounded-[9px] py-[9px] text-[.66rem] tracking-[.06em] uppercase transition-colors hover:border-[var(--accent-dim)] hover:text-[var(--text-hi)]"
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
