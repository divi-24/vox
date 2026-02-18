"use client";

import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/70 px-4 py-3 text-[11px] text-muted-foreground backdrop-blur md:px-6">
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <p className="text-[11px]">
          <span className="font-semibold text-foreground">VoxNote 2.0</span> · Decision
          intelligence demo. All data in this sandbox is simulated.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View dashboard
          </Link>
          <span className="hidden text-[11px] text-muted-foreground/80 sm:inline">
            Built with Next.js, Tailwind, shadcn/ui, Framer Motion, React Flow & Recharts
          </span>
        </div>
      </div>
    </footer>
  );
}

